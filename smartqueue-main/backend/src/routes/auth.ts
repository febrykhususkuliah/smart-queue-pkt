// backend/src/routes/auth.ts

import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../config/database';
import {
  LoginRequest,
  RegisterRequest,
  AuthenticatedRequest,
  ApiResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ensurePasswordResetTable = async (connection: any) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      token varchar(128) NOT NULL,
      expires_at datetime NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY token (token),
      KEY user_id (user_id),
      CONSTRAINT password_reset_tokens_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
};

const sendResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Reset Password Smart Queue',
    text: `Silakan klik tautan berikut untuk mereset password Anda:\n\n${resetUrl}\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
    html: `
      <p>Silakan klik tautan berikut untuk mereset password Anda:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    `,
  });
};

// Register
router.post('/register', async (req: any, res: Response) => {
  try {
    const { name, email, password, confirmPassword }: RegisterRequest = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 400,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        code: 400,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    // Check if email already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingUser as any[]).length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        code: 400,
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      code: 201,
      data: {
        id: (result as any).insertId,
        name,
        email,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      code: 500,
    });
  }
});

// Login
router.post('/login', async (req: any, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if ((users as any[]).length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 401,
      });
    }

    const user = (users as any[])[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 401,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 500,
    });
  }
});

// Forgot password
router.post('/forgot-password', async (req: any, res: Response) => {
  try {
    const { email }: ForgotPasswordRequest = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 400,
      });
    }

    const connection = await pool.getConnection();
    await ensurePasswordResetTable(connection);

    const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((users as any[]).length === 0) {
      connection.release();
      return res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent',
        code: 200,
      });
    }

    const user = (users as any[])[0];
    const token = crypto.randomBytes(24).toString('hex');

    await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
    await connection.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [user.id, token]
    );

    await sendResetEmail(email, token);
    connection.release();

    res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent',
      code: 200,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email',
      code: 500,
    });
  }
});

// Reset password
router.post('/reset-password', async (req: any, res: Response) => {
  try {
    const { token, password, confirmPassword }: ResetPasswordRequest = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required',
        code: 400,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        code: 400,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        code: 400,
      });
    }

    const connection = await pool.getConnection();
    await ensurePasswordResetTable(connection);

    const [tokens] = await connection.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if ((tokens as any[]).length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
        code: 400,
      });
    }

    const userId = (tokens as any[])[0].user_id;
    const hashedPassword = await bcryptjs.hash(password, 10);

    await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await connection.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    connection.release();

    res.json({
      success: true,
      message: 'Password has been reset successfully',
      code: 200,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      code: 500,
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [authReq.user!.id]
    );
    connection.release();

    if ((users as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 404,
      });
    }

    res.json({
      success: true,
      message: 'User retrieved',
      code: 200,
      data: (users as any[])[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      code: 500,
    });
  }
});

export default router;
