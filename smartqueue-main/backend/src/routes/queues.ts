// backend/src/routes/queues.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// HELPER: Penambah Menit untuk Algoritma
const addMinutesToTime = (timeStr: string, minsToAdd: number): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minsToAdd, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// HELPER: Pembobotan Waktu Berdasarkan Laporan Capstone Tabel 3.1
const getServiceDuration = (complaint: string): number => {
  const match = complaint.match(/^\[(.*?)\]/);
  const type = match ? match[1] : '';
  switch (type) {
    case 'Service Ringan': return 60; // 1 Jam
    case 'Servis Umum': return 120; // 2 Jam
    case 'Remap ECU': return 90; // 1.5 Jam
    case 'Porting Polish': return 240; // 4 Jam
    case 'Bore Up Harian': return 480; // 1 Hari Kerja (8 Jam)
    case 'Bore Up Kompetisi': return 1440; // 3 Hari Kerja
    case 'Restorasi Mesin': return 2880; // 6 Hari Kerja
    default: return 120;
  }
};

const generateQueueNumber = async (): Promise<string> => {
  const connection = await pool.getConnection();
  const [result] = await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE DATE(created_at) = CURDATE()');
  connection.release();
  const count = ((result as any[])[0].count || 0) + 1;
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `Q-${date}-${String(count).padStart(4, '0')}`;
};

// GET GLOBAL ACTIVE QUEUES
router.get('/global', authMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT sq.id, sq.queue_number, sq.complaint, sq.service_date, sq.estimated_time, 
             sq.duration_minutes, sq.delay_minutes, sq.created_at, sq.status,
             v.merk, v.tipe, u.phone as user_phone,
             CONCAT(LEFT(u.name, 2), REPEAT('*', GREATEST(0, CHAR_LENGTH(u.name) - 2))) as user_name,
             CASE WHEN CHAR_LENGTH(v.plat_nomor) > 4 Then CONCAT(LEFT(v.plat_nomor, CHAR_LENGTH(v.plat_nomor) - 3), '***') ELSE '***' END as plat_nomor
      FROM service_queues sq
      LEFT JOIN vehicles v ON sq.vehicle_id = v.id
      LEFT JOIN users u ON sq.user_id = u.id
      WHERE sq.status IN ('Menunggu', 'Diproses', 'Kendala')
      ORDER BY CASE sq.status WHEN 'Diproses' THEN 1 WHEN 'Kendala' THEN 2 WHEN 'Menunggu' THEN 3 ELSE 4 END, sq.created_at ASC
    `;
    const [queues] = await connection.query(query);
    connection.release();
    res.json({ success: true, code: 200, data: queues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve global paddock monitor data' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const connection = await pool.getConnection();
    let query = `
      SELECT sq.*, v.merk, v.tipe, v.tahun, v.plat_nomor, u.name as user_name, u.phone as user_phone
      FROM service_queues sq
      LEFT JOIN vehicles v ON sq.vehicle_id = v.id
      LEFT JOIN users u ON sq.user_id = u.id
    `;
    let params: any[] = [];
    if (authReq.user!.role !== 'admin') {
      query += ' WHERE sq.user_id = ?';
      params = [authReq.user!.id];
    }
    query += ' ORDER BY sq.created_at DESC';
    const [queues] = await connection.query(query, params);
    connection.release();
    res.json({ success: true, code: 200, data: queues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve queues' });
  }
});

// CREATE QUEUE
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  let connection;
  try {
    const authReq = req as AuthenticatedRequest;
    const { vehicle_id, complaint, service_date, estimated_time, is_new_vehicle, merk, tipe, tahun, plat_nomor } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    let finalVehicleId = vehicle_id;
    let vehicleInfo: any = null;

    if (is_new_vehicle) {
      const [newVehicleResult] = await connection.query(
        'INSERT INTO vehicles (user_id, merk, tipe, tahun, plat_nomor) VALUES (?, ?, ?, ?, ?)', [authReq.user!.id, merk, tipe, tahun, plat_nomor]
      );
      finalVehicleId = (newVehicleResult as any).insertId;
      vehicleInfo = { merk, tipe, plat_nomor }; 
    } else {
      const [vehicles] = await connection.query('SELECT user_id, merk, tipe, plat_nomor FROM vehicles WHERE id = ?', [finalVehicleId]);
      vehicleInfo = (vehicles as any[])[0];
    }

    const duration = getServiceDuration(complaint);
    let final_estimated_time = estimated_time || '09:00';

    const [lastQueues] = await connection.query(
      `SELECT estimated_time, duration_minutes, delay_minutes FROM service_queues 
       WHERE DATE(service_date) = DATE(?) AND status IN ('Menunggu', 'Diproses', 'Kendala') 
       ORDER BY id DESC LIMIT 1`,
      [service_date]
    );

    let isTimeAdjusted = false;
    if ((lastQueues as any[]).length > 0) {
      const lastQ = (lastQueues as any[])[0];
      if (lastQ.estimated_time) {
        const totalDurationLastQueue = (lastQ.duration_minutes || 0) + (lastQ.delay_minutes || 0);
        const lastCompletionTime = addMinutesToTime(lastQ.estimated_time, totalDurationLastQueue);
        if (final_estimated_time < lastCompletionTime) {
          final_estimated_time = lastCompletionTime;
          isTimeAdjusted = true;
        }
      }
    }

    const queueNumber = await generateQueueNumber();
    const [result] = await connection.query(
      'INSERT INTO service_queues (queue_number, user_id, vehicle_id, complaint, service_date, estimated_time, duration_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [queueNumber, authReq.user!.id, finalVehicleId, complaint, service_date, final_estimated_time, duration, 'Menunggu']
    );

    const newQueueId = (result as any).insertId;

    const notifTitle = "Booking Berhasil! 🏍️";
    let notifMessage = `Antrean ${queueNumber} berhasil dibuat. `;
    if (isTimeAdjusted) {
      notifMessage += `Sistem menyesuaikan Est. Pengerjaan Anda menjadi jam ${final_estimated_time} karena antrean penuh (Analisis Waktu Dinamis).`;
    } else {
      notifMessage += `Harap datang jam ${final_estimated_time} untuk mulai pengerjaan.`;
    }
    
    // Notifikasi untuk User
    await connection.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [authReq.user!.id, notifTitle, notifMessage]);

    // ================================================================
    // NOTIFIKASI UNTUK SEMUA ADMIN 🔔
    // ================================================================
    const adminNotifTitle = "Antrean Baru Masuk! 🔔";
    const adminNotifMessage = `Pelanggan dengan kendaraan ${vehicleInfo.merk} ${vehicleInfo.tipe} (${vehicleInfo.plat_nomor}) membuat antrean jam kedatangan ${final_estimated_time}. Keluhan: ${complaint}`;

    const [adminUsers] = await connection.query('SELECT id FROM users WHERE role = "admin"');
    for (const admin of (adminUsers as any[])) {
      await connection.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', 
        [admin.id, adminNotifTitle, adminNotifMessage]
      );
    }
    // ================================================================

    await connection.commit();
    connection.release();

    res.status(201).json({ success: true, message: 'Queue created', code: 201 });
  } catch (error) {
    if (connection) { await connection.rollback(); connection.release(); }
    res.status(500).json({ success: false, message: 'Failed to create queue', code: 500 });
  }
});

// UPDATE QUEUE STATUS
router.put('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const queueId = parseInt(req.params.id);
      const { status, service_notes, delay_minutes } = req.body;

      const connection = await pool.getConnection();
      const [queues] = await connection.query('SELECT * FROM service_queues WHERE id = ?', [queueId]);
      const queueData = (queues as any[])[0];
      const oldStatus = queueData.status;

      await connection.query(
        'UPDATE service_queues SET status = ?, delay_minutes = COALESCE(delay_minutes, 0) + ? WHERE id = ?', 
        [status, delay_minutes || 0, queueId]
      );

      if (status === 'Selesai' && oldStatus !== 'Selesai') {
        await connection.query('INSERT INTO service_history (queue_id, service_notes, completed_at) VALUES (?, ?, NOW())', [queueId, service_notes || null]);
      }

      await connection.query('INSERT INTO queue_logs (queue_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)', [queueId, oldStatus, status, authReq.user!.id]);

      if (status === 'Kendala' && delay_minutes && delay_minutes > 0) {
        const [pendingQueues] = await connection.query(
          `SELECT id, user_id, queue_number, estimated_time FROM service_queues WHERE status = 'Menunggu' AND DATE(service_date) = DATE(?) AND id > ?`, [queueData.service_date, queueId]
        );

        for (const pq of (pendingQueues as any[])) {
          if (pq.estimated_time) {
            const newTime = addMinutesToTime(pq.estimated_time, delay_minutes);
            await connection.query('UPDATE service_queues SET estimated_time = ? WHERE id = ?', [newTime, pq.id]);
            await connection.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [pq.user_id, "Update Waktu Servis ⏱️", `Estimasi pengerjaan motor Anda (Antrean ${pq.queue_number}) disesuaikan ke jam ${newTime} karena ada kendala di antrean depan.`]);
          }
        }
      }

      if (oldStatus !== status) {
        let notifTitle = "", notifMessage = "";
        
        if (status === 'Diproses') { 
            notifTitle = "Motor Masuk Paddock! 🔧"; 
            notifMessage = `Motor (Antrean ${queueData.queue_number}) sedang dikerjakan mekanik.`; 
        } 
        else if (status === 'Kendala') { 
            notifTitle = "Pengerjaan Tertunda ⚠️"; 
            notifMessage = `Terdapat kendala teknis pada motor Anda. Catatan mekanik: "${service_notes || 'Menunggu konfirmasi sparepart.'}"`; 
            if (delay_minutes > 0) {
                notifMessage += ` Waktu pengerjaan mundur +${delay_minutes} menit.`;
            }
        } 
        else if (status === 'Selesai') { 
            notifTitle = "Setup Selesai! 🏁"; 
            notifMessage = `Pengerjaan motor (Antrean ${queueData.queue_number}) selesai. Silakan ambil motor ke bengkel!`; 
        }
        else if (status === 'Dibatalkan') {
            notifTitle = "Antrean Dibatalkan ❌"; 
            notifMessage = `Mohon maaf, antrean ${queueData.queue_number} dibatalkan.`;
        }

        if (notifTitle) {
            await connection.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [queueData.user_id, notifTitle, notifMessage]);
        }
      }

      connection.release();
      res.json({ success: true, code: 200 });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update status', code: 500 });
    }
});

router.put('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const queueId = parseInt(req.params.id);
    const connection = await pool.getConnection();
    await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', ['Dibatalkan', queueId]);
    connection.release();
    res.json({ success: true, message: 'Queue cancelled', code: 200 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel', code: 500 });
  }
});

export default router;