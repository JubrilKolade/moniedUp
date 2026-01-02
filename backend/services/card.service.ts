import pool from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class CardService {
    static generateCardNumber(): string {
        const prefix = Math.random() > 0.5 ? '4' : '5';
        const randomDigits = Math.floor(Math.random() * 1000000000000000)
            .toString()
            .padStart(15, '0');
        return prefix + randomDigits;
    }

    static generateCVV(): string {
        return Math.floor(100 + Math.random() * 900).toString();
    }

    static async checkUserCardLimit(userId: string): Promise<boolean> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT COUNT(*) as count FROM cards c
                 JOIN accounts a ON c."accountId" = a.id
                 WHERE a."userId" = $1`,
                [userId]
            );
            return parseInt(result.rows[0].count) > 0;
        } finally {
            client.release();
        }
    }

    static async createCard(accountId: string, type: 'Visa' | 'Mastercard') {
        const client = await pool.connect();
        try {
            // Get account with user info
            const accountResult = await client.query(
                `SELECT a.*, a."userId" FROM accounts a WHERE a.id = $1`,
                [accountId]
            );

            if (accountResult.rows.length === 0) {
                throw new AppError('Account not found', 404);
            }

            const account = accountResult.rows[0];

            // Check if user already has a card
            const userHasCard = await this.checkUserCardLimit(account.userId);
            if (userHasCard) {
                throw new AppError('User already owns a card. Limit is one card per user.', 400);
            }

            // Generate unique card number
            let cardNumber: string;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                cardNumber = this.generateCardNumber();
                const existing = await client.query('SELECT id FROM cards WHERE "cardNumber" = $1', [cardNumber]);
                if (existing.rows.length === 0) {
                    isUnique = true;
                    break;
                }
                attempts++;
            }

            if (!isUnique) {
                throw new AppError('Failed to generate unique card number', 500);
            }

            const cvv = this.generateCVV();
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 3);

            const result = await client.query(
                `INSERT INTO cards ("accountId", type, "cardNumber", cvv, "expiryDate", status, "issuedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING *`,
                [accountId, type, cardNumber!, cvv, expiryDate, 'active']
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async getCardsByAccount(accountId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM cards WHERE "accountId" = $1', [accountId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    static async deleteCard(cardId: string) {
        const client = await pool.connect();
        try {
            await client.query('DELETE FROM cards WHERE id = $1', [cardId]);
        } finally {
            client.release();
        }
    }
}
