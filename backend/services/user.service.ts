import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/error.middleware.js';

export class UserService {
    static async createUser(data: {
        name: string;
        email: string;
        password: string;
        phone: string;
        address: string;
    }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError('User already exists', 409);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                address: data.address,
            },
        });

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async authenticateUser(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Invalid credentials', 401);
        }

        return user;
    }

    static async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                tier: true,
                kycStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    static async updateUser(userId: string, data: { name?: string; phone?: string; address?: string }) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                tier: true,
                kycStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    static async deleteUser(userId: string) {
        await prisma.user.delete({ where: { id: userId } });
    }

    static async getAllUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                tier: true,
                kycStatus: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return users;
    }
}

