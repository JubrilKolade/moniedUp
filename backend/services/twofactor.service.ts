import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import prisma from '../config/db.js';
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

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });

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
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.twoFactorSecret) {
            throw new AppError('2FA not set up or user not found', 400);
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps (60 seconds) of tolerance
        });

        return verified;
    }
}

