// backend/src/routes/vehicles.ts

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest, CreateVehicleRequest, UpdateVehicleRequest } from '../types';

const router = Router();

// Get user's vehicles
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
    const [vehicles] = await connection.query(
      `SELECT id, user_id, merk, tipe, tahun, plat_nomor, created_at
       FROM vehicles WHERE user_id = ? ORDER BY created_at DESC`,
      [authReq.user!.id]
    );
    connection.release();

    res.json({
      success: true,
      message: 'Vehicles retrieved',
      code: 200,
      data: vehicles,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles',
      code: 500,
    });
  }
});

// Create vehicle
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

    const { merk, tipe, tahun, plat_nomor }: CreateVehicleRequest = req.body;

    if (!merk || !tipe || !tahun || !plat_nomor) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    // Check if plat_nomor already exists
    const [existing] = await connection.query(
      'SELECT id FROM vehicles WHERE plat_nomor = ?',
      [plat_nomor]
    );

    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Plat nomor already registered',
        code: 400,
      });
    }

    const [result] = await connection.query(
      'INSERT INTO vehicles (user_id, merk, tipe, tahun, plat_nomor) VALUES (?, ?, ?, ?, ?)',
      [authReq.user!.id, merk, tipe, tahun, plat_nomor]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      code: 201,
      data: {
        id: (result as any).insertId,
        user_id: authReq.user!.id,
        merk,
        tipe,
        tahun,
        plat_nomor,
      },
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      code: 500,
    });
  }
});

// Update vehicle
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const vehicleId = parseInt(req.params.id);
    const { merk, tipe, tahun, plat_nomor }: UpdateVehicleRequest = req.body;

    if (!merk || !tipe || !tahun || !plat_nomor) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    // Check ownership
    const [vehicles] = await connection.query(
      'SELECT user_id FROM vehicles WHERE id = ?',
      [vehicleId]
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
        message: 'Forbidden',
        code: 403,
      });
    }

    await connection.query(
      'UPDATE vehicles SET merk = ?, tipe = ?, tahun = ?, plat_nomor = ? WHERE id = ?',
      [merk, tipe, tahun, plat_nomor, vehicleId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      code: 200,
      data: {
        id: vehicleId,
        user_id: authReq.user!.id,
        merk,
        tipe,
        tahun,
        plat_nomor,
      },
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      code: 500,
    });
  }
});

// Delete vehicle
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 401,
      });
    }

    const vehicleId = parseInt(req.params.id);

    const connection = await pool.getConnection();

    // Check ownership
    const [vehicles] = await connection.query(
      'SELECT user_id FROM vehicles WHERE id = ?',
      [vehicleId]
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
        message: 'Forbidden',
        code: 403,
      });
    }

    await connection.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);

    connection.release();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      code: 200,
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      code: 500,
    });
  }
});

export default router;
