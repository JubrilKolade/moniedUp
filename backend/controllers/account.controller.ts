import type { Request, Response } from 'express';
import prisma from '../config/db.js';

const generateAccountNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

export const createAccount = async (req: Request, res: Response) => {
    const { userId, type } = req.body;

    if (!userId || !type) {
        return res.status(400).json({ message: 'User ID and account type are required' });
    }

    try {
        const accountNumber = generateAccountNumber();
        const account = await prisma.account.create({
            data: {
                userId,
                type,
                accountNumber
            },
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const account = await prisma.account.findFirst({ where: { userId } });
        if (!account) return res.status(404).json({ message: 'Account not found' });
        res.status(200).json({ balance: account.balance });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};