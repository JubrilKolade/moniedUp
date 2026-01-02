import prisma from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class AccountService {
    static async generateUniqueAccountNumber(): Promise<string> {
        let accountNumber: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existing = await prisma.account.findUnique({
                where: { accountNumber },
            });

            if (!existing) {
                isUnique = true;
                return accountNumber;
            }
            attempts++;
        }

        throw new AppError('Failed to generate unique account number', 500);
    }

    static async createAccount(userId: string, type: string) {
        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const accountNumber = await this.generateUniqueAccountNumber();

        const account = await prisma.account.create({
            data: {
                userId,
                type,
                accountNumber,
            },
        });

        return account;
    }

    static async getAccountByUserId(userId: string) {
        const account = await prisma.account.findFirst({
            where: { userId },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        return account;
    }

    static async getAccountById(accountId: string) {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: { user: true },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        return account;
    }

    static async getBalance(userId: string) {
        const account = await this.getAccountByUserId(userId);
        return account.balance;
    }
}

