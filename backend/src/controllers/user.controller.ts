import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

export const registerUser = async (req: Request, res: Response, next: any) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const user = await UserService.createUser({ name, email, password, phone, address });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: Request, res: Response, next: any) => {
    try {
        const { email, password } = req.body;
        const user = await UserService.authenticateUser(email, password);

        if (!process.env.JWT_SECRET) {
            throw new AppError('Server configuration error', 500);
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    tier: user.tier,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    // For JWT, logout is client-side (discard token)
    res.status(200).json({ success: true, message: 'Logout successful' });
};

export const updateUser = async (req: Request, res: Response, next: any) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const { name, phone, address } = req.body;
        const user = await UserService.updateUser(userId, { name, phone, address });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: any) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        await UserService.deleteUser(userId);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req: Request, res: Response, next: any) => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = await UserService.getUserById(authReq.userId);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const requestKyc = async (req: Request, res: Response, next: any) => {
    try {
        const authReq = req as AuthenticatedRequest;
        if (!authReq.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const result = await UserService.requestKyc(authReq.userId);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};
