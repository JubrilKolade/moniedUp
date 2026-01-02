import type { Request, Response } from 'express';
import { TwoFactorService } from '../services/twofactor.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const generateTwoFactorSecret = async (req: Request, res: Response, next: any) => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const result = await TwoFactorService.generateSecret(authReq.userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const validateTwoFactorToken = async (req: Request, res: Response, next: any) => {
    try {
        const { token } = req.body;
        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const verified = await TwoFactorService.validateToken(authReq.userId, token);

        if (verified) {
            res.status(200).json({ success: true, message: '2FA token is valid' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid 2FA token' });
        }
    } catch (error) {
        next(error);
    }
};