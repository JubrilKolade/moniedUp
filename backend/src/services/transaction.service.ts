import { Transaction, Account, User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';
import { NotificationService } from './notification.service.js';

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
        performedByUserId: string,
        idempotencyKey?: string
    ) {
        // Idempotency Check
        if (idempotencyKey) {
            const existingTransaction = await Transaction.findOne({ where: { idempotencyKey } });
            if (existingTransaction) {
                return existingTransaction.toJSON();
            }
        }

        // Resolve username if needed (Social Transfer)
        let resolvedToAccountId = toAccountId;
        if (toAccountId.startsWith('@')) {
            const username = toAccountId.substring(1);
            const recipientAccount = await Account.findOne({
                include: [{
                    model: User,
                    as: 'user',
                    where: { username }
                }]
            });
            if (!recipientAccount) {
                throw new AppError(`User with username ${toAccountId} not found`, 404);
            }
            resolvedToAccountId = recipientAccount.id;
        }

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

            const toAccount = await Account.findByPk(resolvedToAccountId, { transaction });

            if (!fromAccount || !toAccount) {
                throw new AppError('One or both accounts not found', 404);
            }

            const accountData = fromAccount.toJSON() as any;

            // Check transaction limits
            const limit = this.getTransactionLimit(accountData.user.tier, accountData.user.kycStatus);
            if (amount > limit) {
                throw new AppError(
                    `Transaction limit exceeded for ${accountData.user.tier} (${accountData.user.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (parseFloat(fromAccount.balance.toString()) < amount) {
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
                toAccountId: resolvedToAccountId,
                performedByUserId,
                idempotencyKey: idempotencyKey || null,
            }, { transaction });

            await transaction.commit();

            // Notify asynchronously
            NotificationService.notifyTransaction(performedByUserId, amount, 'transfer', 'completed', description);
            Account.findByPk(resolvedToAccountId).then(acc => {
                if (acc) NotificationService.notifyTransaction(acc.userId, amount, 'credit transfer', 'completed', description);
            });

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
        performedByUserId: string,
        idempotencyKey?: string
    ) {
        // Idempotency Check
        if (idempotencyKey) {
            const existingTransaction = await Transaction.findOne({ where: { idempotencyKey } });
            if (existingTransaction) {
                return existingTransaction.toJSON();
            }
        }

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
                idempotencyKey: idempotencyKey || null,
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
        performedByUserId: string,
        idempotencyKey?: string
    ) {
        // Idempotency Check
        if (idempotencyKey) {
            const existingTransaction = await Transaction.findOne({ where: { idempotencyKey } });
            if (existingTransaction) {
                return existingTransaction.toJSON();
            }
        }

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
                throw new AppError('Account not found', 404);
            }

            const accountData = account.toJSON() as any;

            // Check transaction limits
            const limit = this.getTransactionLimit(accountData.user.tier, accountData.user.kycStatus);
            if (amount > limit) {
                throw new AppError(
                    `Transaction limit exceeded for ${accountData.user.tier} (${accountData.user.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (parseFloat(account.balance.toString()) < amount) {
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
                idempotencyKey: idempotencyKey || null,
            }, { transaction });

            await transaction.commit();
            return transRecord.toJSON();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async createChargeback(
        originalTransactionId: string,
        reason: string,
        performedByUserId: string
    ) {
        const transaction = await Transaction.sequelize!.transaction();

        try {
            // 1. Find the original transaction
            const originalTx = await Transaction.findByPk(originalTransactionId, { transaction });
            if (!originalTx) {
                throw new AppError('Original transaction not found', 404);
            }

            // 2. Validate it can be reversed
            if (originalTx.type === 'chargeback') {
                throw new AppError('Cannot chargeback a chargeback', 400);
            }

            // Check if already charged back
            const existingChargeback = await Transaction.findOne({
                where: { referenceTransactionId: originalTransactionId, type: 'chargeback' },
                transaction
            });

            if (existingChargeback) {
                throw new AppError('Transaction already charged back', 400);
            }

            // 3. Reverse the money (Double Entry)
            // Logic depends on the type of original transaction
            if (originalTx.type === 'transfer') {
                // Reverse transfer: Add back to sender, remove from receiver
                if (!originalTx.fromAccountId || !originalTx.toAccountId) {
                    throw new AppError('Invalid transfer record data', 500);
                }

                const fromAccount = await Account.findByPk(originalTx.fromAccountId, { transaction });
                const toAccount = await Account.findByPk(originalTx.toAccountId, { transaction });

                if (!fromAccount || !toAccount) {
                    throw new AppError('One or both accounts associated with original transaction not found', 404);
                }

                // Check if receiver has enough funds to rollback? 
                // Typically chargebacks force negative balance if necessary, but here let's enforce funds
                if (parseFloat(toAccount.balance.toString()) < originalTx.amount) {
                    throw new AppError('Receiver has insufficient funds for chargeback', 400);
                }

                await fromAccount.increment('balance', { by: originalTx.amount, transaction });
                await toAccount.decrement('balance', { by: originalTx.amount, transaction });

            } else if (originalTx.type === 'deposit') {
                // Reverse deposit: Remove from receiver
                if (!originalTx.toAccountId) {
                    throw new AppError('Invalid deposit record data', 500);
                }
                const toAccount = await Account.findByPk(originalTx.toAccountId, { transaction });
                if (!toAccount) {
                    throw new AppError('Account not found', 404);
                }

                if (parseFloat(toAccount.balance.toString()) < originalTx.amount) {
                    throw new AppError('Account has insufficient funds for chargeback', 400);
                }

                await toAccount.decrement('balance', { by: originalTx.amount, transaction });

            } else if (originalTx.type === 'withdrawal') {
                // Reverse withdrawal: Add back to sender
                if (!originalTx.fromAccountId) {
                    throw new AppError('Invalid withdrawal record data', 500);
                }
                const fromAccount = await Account.findByPk(originalTx.fromAccountId, { transaction });
                if (!fromAccount) {
                    throw new AppError('Account not found', 404);
                }
                await fromAccount.increment('balance', { by: originalTx.amount, transaction });
            }

            // 4. Create Chargeback Transaction Record
            const chargebackTx = await Transaction.create({
                amount: originalTx.amount,
                type: 'chargeback',
                status: 'completed',
                description: `Chargeback for ${originalTx.id}: ${reason}`,
                fromAccountId: originalTx.toAccountId ?? null, // Explicitly handle undefined/null
                toAccountId: originalTx.fromAccountId ?? null,
                performedByUserId,
                referenceTransactionId: originalTx.id,
            }, { transaction });

            await transaction.commit();
            return chargebackTx.toJSON();

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
