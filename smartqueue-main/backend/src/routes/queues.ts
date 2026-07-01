// backend/src/routes/queues.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, CreateQueueRequest, UpdateQueueStatusRequest } from '../types';

const router = Router();

// Generate queue number
const generateQueueNumber = async (): Promise<string> => {
  const connection = await pool.getConnection();
  const [result] = await connection.query(
    'SELECT COUNT(*) as count FROM service_queues WHERE DATE(created_at) = CURDATE()'
  );
  connection.release();

  const count = ((result as any[])[0].count || 0) + 1;
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `Q-${date}-${String(count).padStart(4, '0')}`;
};

// ==========================================
// NEW: GET GLOBAL ACTIVE QUEUES (LIVE MONITOR)
// Semua pelanggan yang sudah login bisa melihat proyek aktif di bengkel dengan data tersensor
// ==========================================
router.get('/global', authMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    
    // Query dengan proteksi privasi menggunakan MySQL string manipulation
    // Nama pelanggan: Diambil 2 huruf depan + '**' (Febry -> Fe**)
    // Plat Nomor: Menyembunyikan 3 karakter terakhir (H 1234 ABC -> H 1234 ***)
    const query = `
      SELECT 
        sq.id,
        sq.queue_number,
        sq.complaint,
        sq.service_date,
        sq.status,
        v.merk,
        v.tipe,
        CONCAT(LEFT(u.name, 2), REPEAT('*', GREATEST(0, CHAR_LENGTH(u.name) - 2))) as user_name,
        CASE 
          WHEN CHAR_LENGTH(v.plat_nomor) > 4 
          THEN CONCAT(LEFT(v.plat_nomor, CHAR_LENGTH(v.plat_nomor) - 3), '***')
          ELSE '***'
        END as plat_nomor
      FROM service_queues sq
      LEFT JOIN vehicles v ON sq.vehicle_id = v.id
      LEFT JOIN users u ON sq.user_id = u.id
      WHERE sq.status IN ('Menunggu', 'Diproses')
      ORDER BY 
        CASE sq.status 
          WHEN 'Diproses' THEN 1 
          WHEN 'Menunggu' THEN 2 
          ELSE 3 
        END,
        sq.created_at ASC
    `;

    const [queues] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      message: 'Global active queues retrieved',
      code: 200,
      data: queues,
    });
  } catch (error) {
    console.error('Get global queues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve global paddock monitor data',
      code: 500,
    });
  }
});

// Get queues (user sees only own, admin sees all)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const connection = await pool.getConnection();
    let query = `
      SELECT sq.*, v.merk, v.tipe, v.tahun, v.plat_nomor, u.name as user_name
      FROM service_queues sq
      LEFT JOIN vehicles v ON sq.vehicle_id = v.id
      LEFT JOIN users u ON sq.user_id = u.id
    `;
    let params: any[] = [];

    // Only show own queues if not admin
    if (authReq.user!.role !== 'admin') {
      query += ' WHERE sq.user_id = ?';
      params = [authReq.user!.id];
    }

    query += ' ORDER BY sq.created_at DESC';

    const [queues] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      message: 'Queues retrieved',
      code: 200,
      data: queues,
    });
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queues',
      code: 500,
    });
  }
});

// Get queue detail
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const queueId = parseInt(req.params.id);

    const connection = await pool.getConnection();
    const [queues] = await connection.query(
      `SELECT sq.*, v.merk, v.tipe, v.tahun, v.plat_nomor
       FROM service_queues sq
       LEFT JOIN vehicles v ON sq.vehicle_id = v.id
       WHERE sq.id = ?`,
      [queueId]
    );

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
        code: 404,
      });
    }

    const queue = (queues as any[])[0];

    // Check authorization (user or admin)
    if (authReq.user!.role !== 'admin' && queue.user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        code: 403,
      });
    }

    connection.release();

    res.json({
      success: true,
      message: 'Queue retrieved',
      code: 200,
      data: queue,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue',
      code: 500,
    });
  }
});

// Create queue
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const { vehicle_id, complaint, service_date }: CreateQueueRequest = req.body;

    if (!vehicle_id || !complaint || !service_date) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    // Check vehicle ownership
    const [vehicles] = await connection.query(
      'SELECT user_id FROM vehicles WHERE id = ?',
      [vehicle_id]
    );

    if ((vehicles as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 404,
      });
    }

    if ((vehicles as any[])[0].user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden - vehicle does not belong to you',
        code: 403,
      });
    }

    const queueNumber = await generateQueueNumber();

    const [result] = await connection.query(
      'INSERT INTO service_queues (queue_number, user_id, vehicle_id, complaint, service_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [queueNumber, authReq.user!.id, vehicle_id, complaint, service_date, 'Menunggu']
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      code: 201,
      data: {
        id: (result as any).insertId,
        queue_number: queueNumber,
        user_id: authReq.user!.id,
        vehicle_id,
        complaint,
        service_date,
        status: 'Menunggu',
      },
    });
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create queue',
      code: 500,
    });
  }
});

// Update queue status (admin only)
router.put(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          code: 401,
        });
      }

      const queueId = parseInt(req.params.id);
      const { status }: UpdateQueueStatusRequest = req.body;

      const validStatuses = ['Menunggu', 'Diproses', 'Selesai', 'Dibatalkan'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          code: 400,
          });
      }

      const connection = await pool.getConnection();

      // Get old status
      const [queues] = await connection.query(
        'SELECT status FROM service_queues WHERE id = ?',
        [queueId]
      );

      if ((queues as any[]).length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Queue not found',
          code: 404,
        });
      }

      const oldStatus = (queues as any[])[0].status;

      // Update queue status
      await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', [
        status,
        queueId,
      ]);

      // If service has been completed, insert a service history record
      if (status === 'Selesai' && oldStatus !== 'Selesai') {
        await connection.query(
          'INSERT INTO service_history (queue_id, service_notes, completed_at) VALUES (?, ?, NOW())',
          [queueId, null]
        );
      }

      // Log the change
      await connection.query(
        'INSERT INTO queue_logs (queue_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [queueId, oldStatus, status, authReq.user!.id]
      );

      connection.release();

      res.json({
        success: true,
        message: 'Queue status updated',
        code: 200,
        data: {
          id: queueId,
          old_status: oldStatus,
          new_status: status,
        },
      });
    } catch (error) {
      console.error('Update queue status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update queue status',
        code: 500,
      });
    }
  }
);

// Cancel queue
router.put('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const queueId = parseInt(req.params.id);

    const connection = await pool.getConnection();

    const [queues] = await connection.query(
      'SELECT user_id, status FROM service_queues WHERE id = ?',
      [queueId]
    );

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
        code: 404,
      });
    }

    const queue = (queues as any[])[0];

    // Check authorization
    if (authReq.user!.role !== 'admin' && queue.user_id !== authReq.user!.id) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        code: 403,
      });
    }

    const oldStatus = queue.status;

    await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', [
      'Dibatalkan',
      queueId,
    ]);

    await connection.query(
      'INSERT INTO queue_logs (queue_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
      [queueId, oldStatus, 'Dibatalkan', authReq.user!.id]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Queue cancelled',
      code: 200,
    });
  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel queue',
      code: 500,
    });
  }
});

export default router;