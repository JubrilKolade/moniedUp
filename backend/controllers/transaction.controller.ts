import type { Request, Response } from 'express';
import prisma from '../config/db.js';

export const createTransaction = async (req: Request, res: Response) => {
    const { fromAccountId, toAccountId, amount, type, description, performedByUserId } = req.body;

    if (!amount || !type) {
        return res.status(400).json({ message: 'Amount and type are required' });
    }

    try {
        if (type === 'transfer') {
            if (!fromAccountId || !toAccountId) return res.status(400).json({ message: "Transfer requires from and to accounts" });

            const fromAccount = await prisma.account.findUnique({ where: { id: fromAccountId }, include: { user: true } });
            const toAccount = await prisma.account.findUnique({ where: { id: toAccountId } });

            if (!fromAccount || !toAccount) return res.status(404).json({ message: 'One or both accounts not found' });

            // Limits Logic
            const { tier, kycStatus } = fromAccount.user;
            let limit = 0;
            if (kycStatus === 'unverified') limit = 1000;
            else if (tier === 'Tier1') limit = 50000;
            else if (tier === 'Tier2') limit = 100000;
            else if (tier === 'Tier3') limit = 5000000;

            if (Number(amount) > limit) {
                return res.status(400).json({ message: `Transaction limit exceeded for ${tier} (${kycStatus}). Limit: ${limit}` });
            }

            if (fromAccount.balance < Number(amount)) return res.status(400).json({ message: 'Insufficient funds' });

            await prisma.$transaction([
                prisma.account.update({ where: { id: fromAccountId }, data: { balance: { decrement: Number(amount) } } }),
                prisma.account.update({ where: { id: toAccountId }, data: { balance: { increment: Number(amount) } } }),
                prisma.transaction.create({
                    data: {
                        amount: Number(amount),
                        type,
                        description,
                        fromAccountId,
                        toAccountId,
                        performedByUserId
                    }
                })
            ]);
            return res.status(201).json({ message: 'Transfer successful' });
        }

        // Handle deposit/withdrawal (assuming simplified logic for now where only one account is involved relative to an external source)
        // For strict ERD compliance, standard deposits/withdrawals might still need a 'cash' account or similar representation, 
        // but for now let's assume direct balance modification on 'to' (deposit) or 'from' (withdrawal).

        let targetAccountId = type === 'deposit' ? toAccountId : fromAccountId;
        if (!targetAccountId) return res.status(400).json({ message: 'Target account ID required' });

        const account = await prisma.account.findUnique({ where: { id: targetAccountId } });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        if (type === 'withdrawal' && account.balance < Number(amount)) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        const updatedAccount = await prisma.account.update({
            where: { id: targetAccountId },
            data: {
                balance: type === 'deposit' ? { increment: Number(amount) } : { decrement: Number(amount) }
            }
        });

        const transaction = await prisma.transaction.create({
            data: {
                amount: Number(amount),
                type,
                description,
                [type === 'deposit' ? 'toAccountId' : 'fromAccountId']: targetAccountId,
                performedByUserId
            }
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
    const { accountId } = req.params;

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { fromAccountId: accountId },
                    { toAccountId: accountId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};