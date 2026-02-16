import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
    interface SessionData {
        isAdmin: boolean;
        memberId: number;
        memberName: string;
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.session.isAdmin === true) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session.memberId) {
        next();
    } else {
        res.redirect('/login');
    }
}
