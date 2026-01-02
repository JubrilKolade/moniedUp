import pool from '../config/db.js';
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
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get from account with user info
            const fromResult = await client.query(
                `SELECT a.*, u.tier, u."kycStatus" FROM accounts a 
                 JOIN users u ON a."userId" = u.id WHERE a.id = $1`,
                [fromAccountId]
            );
            const fromAccount = fromResult.rows[0];

            // Get to account
            const toResult = await client.query('SELECT * FROM accounts WHERE id = $1', [toAccountId]);
            const toAccount = toResult.rows[0];

            if (!fromAccount || !toAccount) {
                await client.query('ROLLBACK');
                throw new AppError('One or both accounts not found', 404);
            }

            // Check transaction limits
            const limit = this.getTransactionLimit(fromAccount.tier, fromAccount.kycStatus);
            if (amount > limit) {
                await client.query('ROLLBACK');
                throw new AppError(
                    `Transaction limit exceeded for ${fromAccount.tier} (${fromAccount.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (fromAccount.balance < amount) {
                await client.query('ROLLBACK');
                throw new AppError('Insufficient funds', 400);
            }

            // Update balances
            await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromAccountId]);
            await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toAccountId]);

            // Create transaction record
            const transResult = await client.query(
                `INSERT INTO transactions (amount, type, status, description, "fromAccountId", "toAccountId", "performedByUserId")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [amount, 'transfer', 'completed', description, fromAccountId, toAccountId, performedByUserId]
            );

            await client.query('COMMIT');
            return transResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async createDeposit(
        toAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const accountResult = await client.query('SELECT * FROM accounts WHERE id = $1', [toAccountId]);
            if (accountResult.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new AppError('Account not found', 404);
            }

            await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toAccountId]);

            const transResult = await client.query(
                `INSERT INTO transactions (amount, type, status, description, "toAccountId", "performedByUserId")
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [amount, 'deposit', 'completed', description, toAccountId, performedByUserId]
            );

            await client.query('COMMIT');
            return transResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async createWithdrawal(
        fromAccountId: string,
        amount: number,
        description: string | undefined,
        performedByUserId: string
    ) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const accountResult = await client.query(
                `SELECT a.*, u.tier, u."kycStatus" FROM accounts a 
                 JOIN users u ON a."userId" = u.id WHERE a.id = $1`,
                [fromAccountId]
            );
            const account = accountResult.rows[0];

            if (!account) {
                await client.query('ROLLBACK');
                throw new AppError('Account not found', 404);
            }

            // Check transaction limits
            const limit = this.getTransactionLimit(account.tier, account.kycStatus);
            if (amount > limit) {
                await client.query('ROLLBACK');
                throw new AppError(
                    `Transaction limit exceeded for ${account.tier} (${account.kycStatus}). Limit: ${limit}`,
                    400
                );
            }

            // Check sufficient funds
            if (account.balance < amount) {
                await client.query('ROLLBACK');
                throw new AppError('Insufficient funds', 400);
            }

            await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromAccountId]);

            const transResult = await client.query(
                `INSERT INTO transactions (amount, type, status, description, "fromAccountId", "performedByUserId")
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [amount, 'withdrawal', 'completed', description, fromAccountId, performedByUserId]
            );

            await client.query('COMMIT');
            return transResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getTransactionHistory(accountId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT t.*, 
                 fa."accountNumber" as "fromAccountNumber",
                 ta."accountNumber" as "toAccountNumber"
                 FROM transactions t
                 LEFT JOIN accounts fa ON t."fromAccountId" = fa.id
                 LEFT JOIN accounts ta ON t."toAccountId" = ta.id
                 WHERE t."fromAccountId" = $1 OR t."toAccountId" = $1
                 ORDER BY t."createdAt" DESC`,
                [accountId]
            );
            return result.rows;
        } finally {
            client.release();
        }
    }
}
