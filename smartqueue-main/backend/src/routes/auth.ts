import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara_pkt'; // Pastikan sama dengan .env kamu

// ==========================================
// 1. ROUTE REGISTER (Sudah Fix)
// ==========================================
router.post('/register', async (req: any, res: Response) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required', code: 400 });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match', code: 400 });
    }

    const connection = await pool.getConnection();
    const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if ((existingUser as any[]).length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Email already registered', code: 400 });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await connection.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone, 'user']
    );

    connection.release();
    res.status(201).json({ success: true, message: 'User registered successfully', code: 201 });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', code: 500 });
  }
});


// ==========================================
// 2. ROUTE LOGIN (Ini yang tadi terhapus!)
// ==========================================
router.post('/login', async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', code: 400 });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();

    const userRecord = (users as any[])[0];

    // Cek apakah user ada
    if (!userRecord) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', code: 401 });
    }

    // Cek kecocokan password
    const isMatch = await bcryptjs.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', code: 401 });
    }

    // Buat Token JWT
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, role: userRecord.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Filter data yang akan dikirim ke Frontend (Tanpa Password)
    const userToReturn = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role
    };

    // Sukses
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userToReturn, token },
      code: 200
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', code: 500 });
  }
});

export default router;