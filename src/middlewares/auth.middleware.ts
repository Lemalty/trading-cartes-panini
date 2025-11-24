import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
    interface SessionData {
        isAdmin: boolean;
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.session.isAdmin === true) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}