import { Transaction, Account, User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

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
        // Use Sequelize transaction (similar to MongoDB sessions)
        const transaction = await Transaction.sequelize!.transaction();

        try {
            // Get from account with user info (using include like populate)
            const fromAccount = await Account.findByPk(fromAccountId, {
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['tier', 'kycStatus'],
                }],
                transaction,
            });

            const toAccount = await Account.findByPk(toAccountId, { transaction });

            if (!fromAccount || !toAccount) {
                await transaction.rollback();
                throw new AppError('One or both accounts not found', 404);
            }

            const accountData = fromAccount.toJSON() as any;

            // Check transaction limits
            const limit = this.getTransactionLimit(accountData.user.tier, accountData.user.kycStatus);
            if (amount > limit) {
                await transaction.rollback();
                throw new AppError(
                    `Transaction limit exceeded for ${accountData.user.tier} (${accountData.user.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (parseFloat(fromAccount.balance.toString()) < amount) {
                await transaction.rollback();
                throw new AppError('Insufficient funds', 400);
            }

            // Update balances using Sequelize increment/decrement
            await fromAccount.decrement('balance', { by: amount, transaction });
            await toAccount.increment('balance', { by: amount, transaction });

            // Create transaction record
            const transRecord = await Transaction.create({
                amount,
                type: 'transfer',
                status: 'completed',
                description: description || null,
                fromAccountId,
                toAccountId,
                performedByUserId,
            }, { transaction });

            await transaction.commit();
            return transRecord.toJSON();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async createDeposit(
        toAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const transaction = await Transaction.sequelize!.transaction();

        try {
            const account = await Account.findByPk(toAccountId, { transaction });
            if (!account) {
                await transaction.rollback();
                throw new AppError('Account not found', 404);
            }

            await account.increment('balance', { by: amount, transaction });

            const transRecord = await Transaction.create({
                amount,
                type: 'deposit',
                status: 'completed',
                description: description || null,
                toAccountId,
                performedByUserId,
            }, { transaction });

            await transaction.commit();
            return transRecord.toJSON();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async createWithdrawal(
        fromAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const transaction = await Transaction.sequelize!.transaction();

        try {
            const account = await Account.findByPk(fromAccountId, {
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['tier', 'kycStatus'],
                }],
                transaction,
            });

            if (!account) {
                await transaction.rollback();
                throw new AppError('Account not found', 404);
            }

            const accountData = account.toJSON() as any;

            // Check transaction limits
            const limit = this.getTransactionLimit(accountData.user.tier, accountData.user.kycStatus);
            if (amount > limit) {
                await transaction.rollback();
                throw new AppError(
                    `Transaction limit exceeded for ${accountData.user.tier} (${accountData.user.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (parseFloat(account.balance.toString()) < amount) {
                await transaction.rollback();
                throw new AppError('Insufficient funds', 400);
            }

            await account.decrement('balance', { by: amount, transaction });

            const transRecord = await Transaction.create({
                amount,
                type: 'withdrawal',
                status: 'completed',
                description: description || null,
                fromAccountId,
                performedByUserId,
            }, { transaction });

            await transaction.commit();
            return transRecord.toJSON();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getTransactionHistory(accountId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;
        const { count, rows } = await Transaction.findAndCountAll({
            where: {
                [Op.or]: [
                    { fromAccountId: accountId },
                    { toAccountId: accountId }
                ]
            },
            limit,
            offset,
            include: [
                {
                    model: Account,
                    as: 'fromAccount',
                    attributes: ['accountNumber'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['name', 'email'],
                    }],
                },
                {
                    model: Account,
                    as: 'toAccount',
                    attributes: ['accountNumber'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['name', 'email'],
                    }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        return {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            transactions: rows.map(t => t.toJSON()),
        };
    }
}
