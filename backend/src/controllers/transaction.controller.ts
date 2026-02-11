import type { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const createTransaction = async (req: Request, res: Response, next: any) => {
    try {
        const { fromAccountId, toAccountId, amount, type, description, idempotencyKey: bodyIdempotencyKey } = req.body;
        // Check headers for idempotency key (standard practice) or body
        const idempotencyKey = (req.headers['idempotency-key'] as string) || bodyIdempotencyKey;

        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const performedByUserId = authReq.userId;

        let transaction;

        if (type === 'transfer') {
            if (!fromAccountId || !toAccountId) {
                return res.status(400).json({
                    success: false,
                    message: 'Transfer requires from and to accounts',
                });
            }
            transaction = await TransactionService.createTransfer(
                fromAccountId,
                toAccountId,
                amount,
                description,
                performedByUserId,
                idempotencyKey
            );
        } else if (type === 'deposit') {
            if (!toAccountId) {
                return res.status(400).json({
                    success: false,
                    message: 'Deposit requires to account',
                });
            }
            transaction = await TransactionService.createDeposit(
                toAccountId,
                amount,
                description,
                performedByUserId,
                idempotencyKey
            );
        } else if (type === 'withdrawal') {
            if (!fromAccountId) {
                return res.status(400).json({
                    success: false,
                    message: 'Withdrawal requires from account',
                });
            }
            transaction = await TransactionService.createWithdrawal(
                fromAccountId,
                amount,
                description,
                performedByUserId,
                idempotencyKey
            );
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type',
            });
        }

        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};

export const createChargeback = async (req: Request, res: Response, next: any) => {
    try {
        const { transactionId } = req.params;
        const { reason } = req.body;
        const authReq = req as AuthenticatedRequest;

        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // TODO: Add Admin check here if chargebacks should be restricted

        if (!transactionId) {
            return res.status(400).json({ success: false, message: 'Transaction ID is required' });
        }
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        const transaction = await TransactionService.createChargeback(
            transactionId,
            reason,
            authReq.userId
        );

        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
};

export const getTransactionHistory = async (req: Request, res: Response, next: any) => {
    try {
        const { accountId } = req.params;
        if (!accountId) {
            return res.status(400).json({ success: false, message: 'Account ID is required' });
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await TransactionService.getTransactionHistory(accountId, page, limit);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};