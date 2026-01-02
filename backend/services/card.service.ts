import prisma from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class CardService {
    static generateCardNumber(): string {
        // Generate a 16-digit card number starting with 4 (Visa) or 5 (Mastercard)
        // This is a simplified version - in production, use proper Luhn algorithm
        const prefix = Math.random() > 0.5 ? '4' : '5';
        const randomDigits = Math.floor(Math.random() * 1000000000000000)
            .toString()
            .padStart(15, '0');
        return prefix + randomDigits;
    }

    static generateCVV(): string {
        return Math.floor(100 + Math.random() * 900).toString();
    }

    static async checkUserCardLimit(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                accounts: {
                    include: {
                        cards: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if user has any card in any of their accounts
        const userHasCard = user.accounts.some((account) => account.cards.length > 0);
        return userHasCard;
    }

    static async createCard(accountId: string, type: 'Visa' | 'Mastercard') {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: { user: true },
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        // Check if user already has a card
        const userHasCard = await this.checkUserCardLimit(account.userId);
        if (userHasCard) {
            throw new AppError('User already owns a card. Limit is one card per user.', 400);
        }

        // Generate unique card number
        let cardNumber: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            cardNumber = this.generateCardNumber();
            const existing = await prisma.card.findUnique({
                where: { cardNumber },
            });

            if (!existing) {
                isUnique = true;
                break;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new AppError('Failed to generate unique card number', 500);
        }

        const cvv = this.generateCVV();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 3); // Valid for 3 years

        const card = await prisma.card.create({
            data: {
                accountId,
                type,
                cardNumber: cardNumber!,
                cvv,
                expiryDate,
            },
        });

        return card;
    }

    static async getCardsByAccount(accountId: string) {
        const cards = await prisma.card.findMany({
            where: { accountId },
        });

        return cards;
    }

    static async deleteCard(cardId: string) {
        await prisma.card.delete({ where: { id: cardId } });
    }
}

