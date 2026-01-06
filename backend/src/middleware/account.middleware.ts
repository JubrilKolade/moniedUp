import type { Request, Response, NextFunction } from 'express';
import { Account, Card } from '../models/index.js';
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

        // Find account (similar to Account.findById in Mongoose)
        const account = await Account.findByPk(accountId, {
            attributes: ['userId'], // Only select userId
        });

        if (!account) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        const accountData = account.toJSON();
        if (accountData.userId === authReq.userId || authReq.userRole === 'admin') {
            next();
            return;
        }

        res.status(403).json({ success: false, message: 'Forbidden: You can only access your own accounts' });
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

        if (fromAccountId && toAccountId) {
            // Find both accounts (using Promise.all like in Mongoose)
            const [fromAccount, toAccount] = await Promise.all([
                Account.findByPk(fromAccountId, { attributes: ['userId'] }),
                Account.findByPk(toAccountId, { attributes: ['userId'] }),
            ]);

            if (!fromAccount || !toAccount) {
                res.status(404).json({ success: false, message: 'One or both accounts not found' });
                return;
            }

            const fromData = fromAccount.toJSON();
            if (fromData.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only transfer from your own accounts' });
                return;
            }
        } else if (fromAccountId) {
            const account = await Account.findByPk(fromAccountId, { attributes: ['userId'] });
            if (!account) {
                res.status(404).json({ success: false, message: 'Account not found' });
                return;
            }
            const accountData = account.toJSON();
            if (accountData.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only withdraw from your own accounts' });
                return;
            }
        } else if (toAccountId) {
            const account = await Account.findByPk(toAccountId, { attributes: ['userId'] });
            if (!account) {
                res.status(404).json({ success: false, message: 'Account not found' });
                return;
            }
            const accountData = account.toJSON();
            if (accountData.userId !== authReq.userId && authReq.userRole !== 'admin') {
                res.status(403).json({ success: false, message: 'Forbidden: You can only deposit to your own accounts' });
                return;
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const authorizeCardAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { cardId } = req.params;

        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!cardId) {
            res.status(400).json({ success: false, message: 'Card ID required' });
            return;
        }

        const card = await Card.findByPk(cardId, {
            include: [{
                model: Account,
                as: 'account',
                attributes: ['userId'],
            }],
        });

        if (!card) {
            res.status(404).json({ success: false, message: 'Card not found' });
            return;
        }

        const cardData = card.toJSON() as any;
        if (cardData.account.userId === authReq.userId || authReq.userRole === 'admin') {
            next();
            return;
        }

        res.status(403).json({ success: false, message: 'Forbidden: You can only access your own cards' });
    } catch (error) {
        next(error);
    }
};
