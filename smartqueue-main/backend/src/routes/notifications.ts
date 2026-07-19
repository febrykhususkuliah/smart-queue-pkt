// backend/src/routes/notifications.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// 1. Ambil semua notifikasi milik user yang sedang login
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  let connection; // Pindahkan deklarasi ke sini
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 401 });
    }

    const userId = authReq.user.id;
    connection = await pool.getConnection();
    
    const [notifications] = await connection.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      code: 200,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', code: 500 });
  } finally {
    // INI KUNCI UTAMANYA: Selalu lepaskan koneksi baik saat sukses maupun error!
    if (connection) connection.release();
  }
});

// 2. Tandai satu notifikasi sebagai "Sudah Dibaca"
router.put('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  let connection;
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const notifId = parseInt(req.params.id);

    connection = await pool.getConnection();
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    res.json({ success: true, message: 'Notification marked as read', code: 200 });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification', code: 500 });
  } finally {
    if (connection) connection.release();
  }
});

// 3. Tandai SEMUA notifikasi sebagai "Sudah Dibaca" sekaligus
router.put('/read-all', authMiddleware, async (req: Request, res: Response) => {
  let connection;
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    connection = await pool.getConnection();
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read', code: 200 });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications', code: 500 });
  } finally {
    if (connection) connection.release();
  }
});

export default router;