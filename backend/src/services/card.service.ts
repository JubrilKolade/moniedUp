import { Card, Account, User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';

export class CardService {
    static generateCardNumber(): string {
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
        // Count cards for user's accounts (using include/join)
        const user = await User.findByPk(userId, {
            include: [{
                model: Account,
                as: 'accounts',
                include: [{
                    model: Card,
                    as: 'cards',
                }],
            }],
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const userData = user.toJSON() as any;
        // Check if user has any card in any of their accounts
        const userHasCard = userData.accounts.some((account: any) => account.cards.length > 0);
        return userHasCard;
    }

    static async createCard(accountId: string, type: 'Visa' | 'Mastercard') {
        // Get account with user info
        const account = await Account.findByPk(accountId, {
            include: [{
                model: User,
                as: 'user',
            }],
        });

        if (!account) {
            throw new AppError('Account not found', 404);
        }

        const accountData = account.toJSON() as any;

        // Check if user already has a card
        const userHasCard = await this.checkUserCardLimit(accountData.userId);
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
            const existing = await Card.findOne({ where: { cardNumber } });
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
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);

        const card = await Card.create({
            accountId,
            type,
            cardNumber: cardNumber!,
            cvv,
            expiryDate,
            status: 'active',
        });

        return card.toJSON();
    }

    static async getCardsByAccount(accountId: string) {
        const cards = await Card.findAll({
            where: { accountId },
        });

        return cards.map(card => card.toJSON());
    }

    static async deactivateCard(cardId: string) {
        const card = await Card.findByPk(cardId);
        if (!card) {
            throw new AppError('Card not found', 404);
        }
        await card.update({ status: 'blocked' });
    }
}
