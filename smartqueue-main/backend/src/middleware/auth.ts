// backend/src/middleware/auth.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../types';

export const authMiddleware: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 401,
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JWTPayload;

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 401,
    });
  }
};

export const adminMiddleware: RequestHandler = (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      code: 403,
    });
  }
  next();
};

export const errorHandler = (
  error: any,
  req: any,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    code: statusCode,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};
