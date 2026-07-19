// backend/src/routes/admin.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// ==========================================
// 1. ENDPOINT STATISTIK (DASHBOARD GRAFIK)
// ==========================================
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [[users]] = await connection.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [[vehicles]] = await connection.query('SELECT COUNT(*) as count FROM vehicles');
    const [[queuesToday]] = await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE DATE(created_at) = CURDATE()');
    const [[completed]] = await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = "Selesai"');
    const [[pending]] = await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = "Menunggu" OR status = "Kendala"');
    const [[processing]] = await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = "Diproses"');

    const [monthlyResult] = await connection.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') as month,
        COUNT(*) as queues,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as completed
      FROM service_queues
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at), month
      ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
    `);

    const [topVehicles] = await connection.query(`
      SELECT 
        v.merk, 
        v.tipe, 
        COUNT(sq.id) as total_service
      FROM service_queues sq
      JOIN vehicles v ON sq.vehicle_id = v.id
      GROUP BY v.merk, v.tipe
      ORDER BY total_service DESC
      LIMIT 5
    `);

    connection.release();

    res.json({
      success: true,
      data: {
        totalUsers: (users as any).count,
        totalVehicles: (vehicles as any).count,
        totalQueuestoday: (queuesToday as any).count,
        totalCompletedServices: (completed as any).count,
        totalPendingQueues: (pending as any).count,
        totalProcessingQueues: (processing as any).count,
        monthlyData: monthlyResult,
        topVehicles: topVehicles
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
});

// ==========================================
// 2. ENDPOINT DATA USERS 
// ==========================================
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY created_at DESC'
    );
    connection.release();
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ==========================================
// 3. ENDPOINT DATA VEHICLES (YANG TADI HILANG)
// ==========================================
router.get('/vehicles', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    // Mengambil data kendaraan sekaligus JOIN dengan tabel users untuk mendapat nama pemilik
    const [vehicles] = await connection.query(`
      SELECT 
        v.id, 
        v.user_id, 
        v.plat_nomor, 
        v.merk, 
        v.tipe, 
        v.tahun, 
        v.created_at, 
        u.name as owner_name 
      FROM vehicles v 
      LEFT JOIN users u ON v.user_id = u.id 
      ORDER BY v.created_at DESC
    `);
    connection.release();
    
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Fetch admin vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
  }
});

export default router;