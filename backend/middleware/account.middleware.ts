import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

export const authorizeAccountAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        // Check params first, then body for accountId
        const accountId = req.params.accountId || req.body.accountId;

        if (!accountId) {
            res.status(400).json({ success: false, message: 'Account ID required' });
            return;
        }

        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const account = await prisma.account.findUnique({
            where: { id: accountId },
            select: { userId: true },
        });

        if (!account) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        // Allow if user owns the account or is admin
        if (account.userId === authReq.userId || authReq.userRole === 'admin') {
            next();
            return;
        }

        res.status(403).json({ success: false, message: 'Forbidden: You can only access your own accounts' });
    } catch (error) {
        next(error);
    }
};

// For transactions that involve multiple accounts (transfers)
export const authorizeTransactionAccounts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { fromAccountId, toAccountId } = req.body;

        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        // For transfers, check both accounts
        if (fromAccountId && toAccountId) {
            const [fromAccount, toAccount] = await Promise.all([
                prisma.account.findUnique({ where: { id: fromAccountId }, select: { userId: true } }),
                prisma.account.findUnique({ where: { id: toAccountId }, select: { userId: true } }),
            ]);

            if (!fromAccount || !toAccount) {
                res.status(404).json({ success: false, message: 'One or both accounts not found' });
                return;
            }

            // User must own the fromAccount (or be admin)
            if (fromAccount.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only transfer from your own accounts' });
                return;
            }
        } else if (fromAccountId) {
            // For withdrawals
            const account = await prisma.account.findUnique({
                where: { id: fromAccountId },
                select: { userId: true },
            });

            if (!account) {
                res.status(404).json({ success: false, message: 'Account not found' });
                return;
            }

            if (account.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only withdraw from your own accounts' });
                return;
            }
        } else if (toAccountId) {
            // For deposits
            const account = await prisma.account.findUnique({
                where: { id: toAccountId },
                select: { userId: true },
            });

            if (!account) {
                res.status(404).json({ success: false, message: 'Account not found' });
                return;
            }

            if (account.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only deposit to your own accounts' });
                return;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

