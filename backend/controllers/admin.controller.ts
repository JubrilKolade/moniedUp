import type { Request, Response } from 'express';
import prisma from '../config/db.js';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany(); // Prisma query
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};