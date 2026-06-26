// backend/src/routes/admin.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [[usersCount]] = (await connection.query('SELECT COUNT(*) as count FROM users')) as any;
    const [[vehiclesCount]] = (await connection.query('SELECT COUNT(*) as count FROM vehicles')) as any;
    const [[queuesTodayCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE DATE(service_date) = CURDATE()')) as any;
    const [[completedCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_history WHERE completed_at IS NOT NULL')) as any;
    const [[pendingCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = \'Menunggu\'')) as any;
    const [[processingCount]] = (await connection.query('SELECT COUNT(*) as count FROM service_queues WHERE status = \'Diproses\'')) as any;

    // Monthly data for the last 6 months
    const [queuesByMonthRows] = (await connection.query(
      `SELECT DATE_FORMAT(service_date, '%b %Y') as month, COUNT(*) as queues
       FROM service_queues
       WHERE service_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(service_date), MONTH(service_date)
       ORDER BY YEAR(service_date), MONTH(service_date)`
    )) as any;

    const [completedByMonthRows] = (await connection.query(
      `SELECT DATE_FORMAT(completed_at, '%b %Y') as month, COUNT(*) as completed
       FROM service_history
       WHERE completed_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY YEAR(completed_at), MONTH(completed_at)
       ORDER BY YEAR(completed_at), MONTH(completed_at)`
    )) as any;

    connection.release();

    // Merge monthly data into an array of { month, queues, completed }
    const monthsMap: Record<string, any> = {};
    (queuesByMonthRows as any[]).forEach((r) => {
      monthsMap[r.month] = { month: r.month, queues: r.queues || 0, completed: 0 };
    });
    (completedByMonthRows as any[]).forEach((r) => {
      monthsMap[r.month] = monthsMap[r.month] || { month: r.month, queues: 0, completed: 0 };
      monthsMap[r.month].completed = r.completed || 0;
    });

    const monthlyData = Object.values(monthsMap);

    res.json({
      success: true,
      data: {
        totalUsers: (usersCount as any).count || 0,
        totalVehicles: (vehiclesCount as any).count || 0,
        totalQueuestoday: (queuesTodayCount as any).count || 0,
        totalCompletedServices: (completedCount as any).count || 0,
        totalPendingQueues: (pendingCount as any).count || 0,
        totalProcessingQueues: (processingCount as any).count || 0,
        monthlyData,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
});

// GET /api/admin/users - list all users (admin)
router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, role, address, created_at FROM users ORDER BY created_at DESC'
    );
    connection.release();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

// GET /api/admin/vehicles - list all vehicles (admin)
router.get('/vehicles', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [vehicles] = await connection.query(
      `SELECT v.id, v.user_id, v.merk, v.tipe, v.tahun, v.plat_nomor, v.created_at, u.name as user_name
       FROM vehicles v
       LEFT JOIN users u ON v.user_id = u.id
       ORDER BY v.created_at DESC`
    );
    connection.release();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Admin vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve vehicles' });
  }
});

export default router;

