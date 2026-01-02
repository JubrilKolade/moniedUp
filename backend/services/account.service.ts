import pool from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class AccountService {
    static async generateUniqueAccountNumber(): Promise<string> {
        let accountNumber: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        const client = await pool.connect();
        try {
            while (!isUnique && attempts < maxAttempts) {
                accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                const result = await client.query('SELECT id FROM accounts WHERE "accountNumber" = $1', [accountNumber]);

                if (result.rows.length === 0) {
                    isUnique = true;
                    return accountNumber;
                }
                attempts++;
            }
        } finally {
            client.release();
        }

        throw new AppError('Failed to generate unique account number', 500);
    }

    static async createAccount(userId: string, type: string) {
        const client = await pool.connect();
        try {
            // Verify user exists
            const userResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                throw new AppError('User not found', 404);
            }

            const accountNumber = await this.generateUniqueAccountNumber();

            const result = await client.query(
                `INSERT INTO accounts ("userId", type, "accountNumber", balance, status)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, type, accountNumber, 0, 'active']
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async getAccountByUserId(userId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM accounts WHERE "userId" = $1 LIMIT 1',
                [userId]
            );

            if (result.rows.length === 0) {
                throw new AppError('Account not found', 404);
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async getAccountById(accountId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT a.*, u.id as "userId", u.tier, u."kycStatus" FROM accounts a JOIN users u ON a."userId" = u.id WHERE a.id = $1',
                [accountId]
            );

            if (result.rows.length === 0) {
                throw new AppError('Account not found', 404);
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async getBalance(userId: string) {
        const account = await this.getAccountByUserId(userId);
        return account.balance;
    }
}
