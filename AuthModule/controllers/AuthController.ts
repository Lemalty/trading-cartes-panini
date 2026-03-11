import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { RegisterDto } from '../dto/auth/RegisterDto.js';
import { LoginDto } from '../dto/auth/LoginDto.js';

const authService = new AuthService();

export class AuthController {
  static showRegister(req: Request, res: Response): void {
    res.render('auth/register', {
      error: null,
      success: null,
      currentPage: 'register',
    });
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { clubName, sport, division, email, password, passwordConfirm } = req.body;

      if (password !== passwordConfirm) {
        res.render('auth/register', {
          error: 'Passwords do not match.',
          success: null,
          currentPage: 'register',
        });
        return;
      }

      const dto: RegisterDto = { clubName, sport, division, email, password };
      await authService.register(dto);

      res.redirect('/login?registered=true');
    } catch (error: any) {
      res.render('auth/register', {
        error: error.message || 'An error occurred during registration.',
        success: null,
        currentPage: 'register',
      });
    }
  }

  static showLogin(req: Request, res: Response): void {
    const success = req.query.registered === 'true'
      ? 'Account created! Please check your email to verify your account.'
      : null;

    res.render('auth/login', {
      error: null,
      success,
      currentPage: 'login',
    });
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const dto: LoginDto = {
        email: req.body.email,
        password: req.body.password,
      };

      const token = await authService.login(dto);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect('/dashboard');
    } catch (error: any) {
      res.render('auth/login', {
        error: error.message || 'An error occurred during login.',
        success: null,
        currentPage: 'login',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.token;
      if (token && req.user) {
        await authService.logout(token, req.user.userId);
      }
    } catch {
      // Silently fail — clear cookie regardless
    }

    res.clearCookie('token');
    res.redirect('/login');
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.redirect('/login');
        return;
      }

      await authService.verifyEmail(token);

      res.render('auth/login', {
        error: null,
        success: 'Email verified successfully! You can now log in.',
        currentPage: 'login',
      });
    } catch (error: any) {
      res.render('auth/login', {
        error: error.message || 'Invalid or expired verification link.',
        success: null,
        currentPage: 'login',
      });
    }
  }

  static showForgotPassword(req: Request, res: Response): void {
    res.render('auth/forgot-password', {
      error: null,
      success: null,
      currentPage: 'forgot-password',
    });
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      res.render('auth/forgot-password', {
        error: null,
        success: 'If an account with this email exists, a reset link has been sent.',
        currentPage: 'forgot-password',
      });
    } catch {
      res.render('auth/forgot-password', {
        error: null,
        success: 'If an account with this email exists, a reset link has been sent.',
        currentPage: 'forgot-password',
      });
    }
  }

  static showResetPassword(req: Request, res: Response): void {
    const token = req.query.token as string;
    if (!token) {
      res.redirect('/forgot-password');
      return;
    }

    res.render('auth/reset-password', {
      error: null,
      success: null,
      token,
      currentPage: 'reset-password',
    });
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password, passwordConfirm } = req.body;

      if (password !== passwordConfirm) {
        res.render('auth/reset-password', {
          error: 'Passwords do not match.',
          success: null,
          token,
          currentPage: 'reset-password',
        });
        return;
      }

      await authService.resetPassword(token, password);

      res.render('auth/login', {
        error: null,
        success: 'Password reset successfully! You can now log in.',
        currentPage: 'login',
      });
    } catch (error: any) {
      res.render('auth/reset-password', {
        error: error.message || 'An error occurred.',
        success: null,
        token: req.body.token,
        currentPage: 'reset-password',
      });
    }
  }
}
