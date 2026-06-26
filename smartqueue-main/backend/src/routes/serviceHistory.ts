import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, CreateServiceHistoryRequest } from '../types';

const router = Router();

// Get service history records
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const connection = await pool.getConnection();
    let query = `
      SELECT sh.*, sq.queue_number, sq.user_id, u.name AS user_name, v.merk, v.tipe, v.tahun, v.plat_nomor
      FROM service_history sh
      JOIN service_queues sq ON sh.queue_id = sq.id
      LEFT JOIN users u ON sq.user_id = u.id
      LEFT JOIN vehicles v ON sq.vehicle_id = v.id
    `;
    const params: any[] = [];

    if (authReq.user.role !== 'admin') {
      query += ' WHERE sq.user_id = ?';
      params.push(authReq.user.id);
    }

    query += ' ORDER BY sh.completed_at DESC';

    const [history] = await connection.query(query, params);
    connection.release();

    res.json({ success: true, message: 'Service history retrieved', code: 200, data: history });
  } catch (error) {
    console.error('Get service history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve service history', code: 500 });
  }
});

// Get history for a specific queue
router.get('/queue/:queueId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const queueId = parseInt(req.params.queueId, 10);

    const connection = await pool.getConnection();
    const [queues] = await connection.query('SELECT user_id FROM service_queues WHERE id = ?', [queueId]);

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Queue not found', code: 404 });
    }

    const queue = (queues as any[])[0];
    if (authReq.user.role !== 'admin' && queue.user_id !== authReq.user.id) {
      connection.release();
      return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
    }

    const [history] = await connection.query(
      'SELECT * FROM service_history WHERE queue_id = ? ORDER BY completed_at DESC',
      [queueId]
    );

    connection.release();

    res.json({ success: true, message: 'Queue history retrieved', code: 200, data: history });
  } catch (error) {
    console.error('Get queue history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve queue history', code: 500 });
  }
});

// Add service history and mark queue completed
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { queue_id, service_notes }: CreateServiceHistoryRequest = req.body;

    if (!queue_id) {
      return res.status(400).json({ success: false, message: 'Queue ID is required', code: 400 });
    }

    const connection = await pool.getConnection();
    const [queues] = await connection.query('SELECT status FROM service_queues WHERE id = ?', [queue_id]);

    if ((queues as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Queue not found', code: 404 });
    }

    const oldStatus = (queues as any[])[0].status;
    await connection.query(
      'INSERT INTO service_history (queue_id, service_notes, completed_at) VALUES (?, ?, NOW())',
      [queue_id, service_notes || null]
    );

    if (oldStatus !== 'Selesai') {
      await connection.query('UPDATE service_queues SET status = ? WHERE id = ?', ['Selesai', queue_id]);
      await connection.query(
        'INSERT INTO queue_logs (queue_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [queue_id, oldStatus, 'Selesai', authReq.user!.id]
      );
    }

    connection.release();

    res.status(201).json({ success: true, message: 'Service history created', code: 201 });
  } catch (error) {
    console.error('Create service history error:', error);
    res.status(500).json({ success: false, message: 'Failed to create service history', code: 500 });
  }
});

export default router;
