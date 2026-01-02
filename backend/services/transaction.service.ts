import prisma from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class TransactionService {
    static getTransactionLimit(tier: string, kycStatus: string): number {
        if (kycStatus === 'unverified') return 1000;
        if (tier === 'Tier1') return 50000;
        if (tier === 'Tier2') return 100000;
        if (tier === 'Tier3') return 5000000;
        return 0;
    }

    static async createTransfer(
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const fromAccount = await prisma.account.findUnique({
            where: { id: fromAccountId },
            include: { user: true },
        });

        const toAccount = await prisma.account.findUnique({
            where: { id: toAccountId },
        });

        if (!fromAccount || !toAccount) {
            throw new AppError('One or both accounts not found', 404);
        }

        // Check transaction limits
        const limit = this.getTransactionLimit(fromAccount.user.tier, fromAccount.user.kycStatus);
        if (amount > limit) {
            throw new AppError(
                `Transaction limit exceeded for ${fromAccount.user.tier} (${fromAccount.user.kycStatus}). Limit: ${limit}`,
                400
            );
        }

        // Check sufficient funds
        if (fromAccount.balance < amount) {
            throw new AppError('Insufficient funds', 400);
        }

        // Execute transaction
        const result = await prisma.$transaction([
            prisma.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } },
            }),
            prisma.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } },
            }),
            prisma.transaction.create({
                data: {
                    amount,
                    type: 'transfer',
                    status: 'completed',
                    description,
                    fromAccountId,
                    toAccountId,
                    performedByUserId,
                },
            }),
        ]);

        return result[2]; // Return the transaction
    }

    static async createDeposit(
        toAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const account = await prisma.account.findUnique({
            where: { id: toAccountId },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        const result = await prisma.$transaction([
            prisma.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } },
            }),
            prisma.transaction.create({
                data: {
                    amount,
                    type: 'deposit',
                    status: 'completed',
                    description,
                    toAccountId,
                    performedByUserId,
                },
            }),
        ]);

        return result[1]; // Return the transaction
    }

    static async createWithdrawal(
        fromAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const account = await prisma.account.findUnique({
            where: { id: fromAccountId },
            include: { user: true },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        // Check transaction limits
        const limit = this.getTransactionLimit(account.user.tier, account.user.kycStatus);
        if (amount > limit) {
            throw new AppError(
                `Transaction limit exceeded for ${account.user.tier} (${account.user.kycStatus}). Limit: ${limit}`,
                400
            );
        }

        // Check sufficient funds
        if (account.balance < amount) {
            throw new AppError('Insufficient funds', 400);
        }

        const result = await prisma.$transaction([
            prisma.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } },
            }),
            prisma.transaction.create({
                data: {
                    amount,
                    type: 'withdrawal',
                    status: 'completed',
                    description,
                    fromAccountId,
                    performedByUserId,
                },
            }),
        ]);

        return result[1]; // Return the transaction
    }

    static async getTransactionHistory(accountId: string) {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                fromAccount: {
                    select: {
                        accountNumber: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                toAccount: {
                    select: {
                        accountNumber: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return transactions;
    }
}

