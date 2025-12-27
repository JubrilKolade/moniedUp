import type { Request, Response } from 'express';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
        return res.status(400).json({ message: 'Name, email, password, phone, and address are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, phone, address },
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, tier: user.tier } });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    // For JWT, logout is client-side (discard token). 
    // We just return success here.
    res.status(200).json({ message: 'Logout successful' });
};

export const updateUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { name, phone, address } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { name, phone, address },
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        // Cascade delete is handled by database if configured, or Prisma relation actions.
        // Assuming simple delete for now.
        await prisma.user.delete({ where: { id: userId } });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete user' });
    }
};