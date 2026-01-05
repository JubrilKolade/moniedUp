import { Account, User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

export class AccountService {
    static async generateUniqueAccountNumber(): Promise<string> {
        let accountNumber: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existing = await Account.findOne({ where: { accountNumber } });

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
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const accountNumber = await this.generateUniqueAccountNumber();

        // Create account
        const account = await Account.create({
            userId,
            type,
            accountNumber,
            balance: 0,
            status: 'active',
        });

        return account.toJSON();
    }

    static async getAccountByUserId(userId: string) {
        const account = await Account.findOne({
            where: { userId },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        return account.toJSON();
    }

    static async getAccountById(accountId: string) {
        // Include user data (similar to populate in Mongoose)
        const account = await Account.findByPk(accountId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'tier', 'kycStatus'],
            }],
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        return account.toJSON();
    }

    static async getBalance(userId: string) {
        const account = await this.getAccountByUserId(userId);
        return parseFloat(account.balance);
    }
}
