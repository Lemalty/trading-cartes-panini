import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService.js';

const JWT_SECRET = process.env.JWT_SECRET || '';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; clubId: string };
    }
  }
}

const authService = new AuthService();

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.redirect('/login');
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; clubId: string };

    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.clearCookie('token');
      res.redirect('/login');
      return;
    }

    req.user = { userId: payload.userId, clubId: payload.clubId };
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
}
