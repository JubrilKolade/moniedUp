// src/controllers/cardController.ts
import type { Request, Response } from 'express';
import prisma from '../config/db.js';

const generateCardNumber = () => {
    return '4' + Math.floor(Math.random() * 1000000000000000).toString(); // Simplified
};

const generateCVV = () => {
    return Math.floor(100 + Math.random() * 900).toString();
};

export const createCard = async (req: Request, res: Response) => {
    const { accountId, type } = req.body;

    if (!accountId || !type) {
        return res.status(400).json({ message: 'Account ID and card type are required' });
    }

    if (!['Visa', 'Mastercard'].includes(type)) {
        return res.status(400).json({ message: 'Invalid card type. Must be Visa or Mastercard' });
    }

    try {
        const account = await prisma.account.findUnique({ where: { id: accountId }, include: { user: { include: { accounts: { include: { cards: true } } } } } });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        // Check if user has any card in any of their accounts
        const userHasCard = account.user.accounts.some((acc: any) => acc.cards.length > 0);
        if (userHasCard) {
            return res.status(400).json({ message: 'User already owns a card. Limit is one card per user.' });
        }

        const cardNumber = generateCardNumber();
        const cvv = generateCVV();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 3); // Valid for 3 years

        const card = await prisma.card.create({
            data: {
                accountId,
                type,
                cardNumber,
                cvv,
                expiryDate
            },
        });
        res.status(201).json({ message: "Card created", card });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getCards = async (req: Request, res: Response) => {
    const { accountId } = req.params;
    try {
        const cards = await prisma.card.findMany({ where: { accountId } });
        res.status(200).json(cards);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const deleteCard = async (req: Request, res: Response) => {
    const { cardId } = req.params;
    try {
        await prisma.card.delete({ where: { id: cardId } });
        res.status(200).json({ message: 'Card deleted/destroyed successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};