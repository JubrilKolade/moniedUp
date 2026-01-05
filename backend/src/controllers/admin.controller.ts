import type { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';

export const getAllUsers = async (req: Request, res: Response, next: any) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};