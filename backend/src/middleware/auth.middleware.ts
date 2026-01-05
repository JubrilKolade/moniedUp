import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }

        if (!process.env.JWT_SECRET) {
            res.status(500).json({ message: 'Server configuration error' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; role?: string };
        (req as AuthenticatedRequest).userId = decoded.id;
        if (decoded.role) {
            (req as AuthenticatedRequest).userRole = decoded.role;
        }

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({ message: 'Invalid or expired token' });
            return;
        }
        res.status(500).json({ message: 'Authentication error' });
    }
};

export const authorizeUser = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const { userId: paramUserId } = req.params;

    if (!authReq.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    // Allow if user is accessing their own resource or is admin
    if (authReq.userId === paramUserId || authReq.userRole === 'admin') {
        next();
        return;
    }

    res.status(403).json({ message: 'Forbidden: You can only access your own resources' });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    if (authReq.userRole !== 'admin') {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
        return;
    }

    next();
};

