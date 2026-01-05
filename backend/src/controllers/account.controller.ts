import type { Request, Response } from 'express';
import { AccountService } from '../services/account.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const createAccount = async (req: Request, res: Response, next: any) => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const { userId, type } = req.body;
        
        // Use authenticated user's ID if not provided, or validate ownership if provided
        const targetUserId = userId || authReq.userId;
        
        // If userId is provided and different from authenticated user, check if admin
        if (userId && userId !== authReq.userId && authReq.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: You can only create accounts for yourself' });
        }
        
        const account = await AccountService.createAccount(targetUserId, type);
        res.status(201).json({ success: true, data: account });
    } catch (error) {
        next(error);
    }
};

export const getBalance = async (req: Request, res: Response, next: any) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const balance = await AccountService.getBalance(userId);
        res.status(200).json({ success: true, data: { balance } });
    } catch (error) {
        next(error);
    }
};