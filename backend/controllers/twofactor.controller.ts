import type { Request, Response } from 'express';
import QRCode from 'qrcode'
import speakeasy from 'speakeasy'
import prisma from '../config/db.js';

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const generateTwoFactorSecret = async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const secret = speakeasy.generateSecret({ length: 20 });

    // Check if secret.base32 is defined
    if (!secret.base32) {
        return res.status(500).json({ message: 'Failed to generate secret' });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 },
    });

    if (secret.otpauth_url) {
        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ message: (err as Error).message });
            res.json({ secret: secret.base32, qrCode: data_url });
        });
    } else {
        res.status(500).json({ message: 'Failed to generate OTP URL' });
    }
};

export const validateTwoFactorToken = async (req: Request, res: Response) => {
    const { token } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ message: '2FA not set up or user not found.' });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
    });

    if (verified) {
        res.status(200).json({ message: '2FA token is valid.' });
    } else {
        res.status(400).json({ message: 'Invalid 2FA token.' });
    }
};