import type { Request, Response, NextFunction } from 'express';
import pool from '../config/db.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

export const authorizeAccountAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const accountId = req.params.accountId || req.body.accountId;

        if (!accountId) {
            res.status(400).json({ success: false, message: 'Account ID required' });
            return;
        }

        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const client = await pool.connect();
        try {
            const result = await client.query('SELECT "userId" FROM accounts WHERE id = $1', [accountId]);

            if (result.rows.length === 0) {
                res.status(404).json({ success: false, message: 'Account not found' });
                return;
            }

            const account = result.rows[0];
            if (account.userId === authReq.userId || authReq.userRole === 'admin') {
                next();
                return;
            }

            res.status(403).json({ success: false, message: 'Forbidden: You can only access your own accounts' });
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};

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

        const client = await pool.connect();
        try {
            if (fromAccountId && toAccountId) {
                const fromResult = await client.query('SELECT "userId" FROM accounts WHERE id = $1', [fromAccountId]);
                const toResult = await client.query('SELECT "userId" FROM accounts WHERE id = $1', [toAccountId]);

                if (fromResult.rows.length === 0 || toResult.rows.length === 0) {
                    res.status(404).json({ success: false, message: 'One or both accounts not found' });
                    return;
                }

                if (fromResult.rows[0].userId !== authReq.userId && authReq.userRole !== 'admin') {
                    res.status(403).json({ success: false, message: 'Forbidden: You can only transfer from your own accounts' });
                    return;
                }
            } else if (fromAccountId) {
                const result = await client.query('SELECT "userId" FROM accounts WHERE id = $1', [fromAccountId]);
                if (result.rows.length === 0) {
                    res.status(404).json({ success: false, message: 'Account not found' });
                    return;
                }
                if (result.rows[0].userId !== authReq.userId && authReq.userRole !== 'admin') {
                    res.status(403).json({ success: false, message: 'Forbidden: You can only withdraw from your own accounts' });
                    return;
                }
            } else if (toAccountId) {
                const result = await client.query('SELECT "userId" FROM accounts WHERE id = $1', [toAccountId]);
                if (result.rows.length === 0) {
                    res.status(404).json({ success: false, message: 'Account not found' });
                    return;
                }
                if (result.rows[0].userId !== authReq.userId && authReq.userRole !== 'admin') {
                    res.status(403).json({ success: false, message: 'Forbidden: You can only deposit to your own accounts' });
                    return;
                }
            }

            next();
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
};
