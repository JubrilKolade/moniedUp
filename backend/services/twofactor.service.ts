import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import pool from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class TwoFactorService {
    static async generateSecret(userId: string) {
        const secret = speakeasy.generateSecret({
            name: `MoniedUp (${userId})`,
            length: 20,
        });

        if (!secret.base32) {
            throw new AppError('Failed to generate secret', 500);
        }

        const client = await pool.connect();
        try {
            await client.query(
                'UPDATE users SET "twoFactorSecret" = $1 WHERE id = $2',
                [secret.base32, userId]
            );
        } finally {
            client.release();
        }

        if (!secret.otpauth_url) {
            throw new AppError('Failed to generate OTP URL', 500);
        }

        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode,
        };
    }

    static async validateToken(userId: string, token: string): Promise<boolean> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT "twoFactorSecret" FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0 || !result.rows[0].twoFactorSecret) {
                throw new AppError('2FA not set up or user not found', 400);
            }

            const verified = speakeasy.totp.verify({
                secret: result.rows[0].twoFactorSecret,
                encoding: 'base32',
                token,
                window: 2,
            });

            return verified;
        } finally {
            client.release();
        }
    }
}
