import type { Request, Response } from 'express';
import { CardService } from '../services/card.service.js';

export const createCard = async (req: Request, res: Response, next: any) => {
    try {
        const { accountId, type } = req.body;
        const card = await CardService.createCard(accountId, type);
        res.status(201).json({ success: true, message: 'Card created', data: card });
    } catch (error) {
        next(error);
    }
};

export const getCards = async (req: Request, res: Response, next: any) => {
    try {
        const { accountId } = req.params;
        const cards = await CardService.getCardsByAccount(accountId);
        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        next(error);
    }
};

export const deleteCard = async (req: Request, res: Response, next: any) => {
    try {
        const { cardId } = req.params;
        await CardService.deleteCard(cardId);
        res.status(200).json({ success: true, message: 'Card deleted successfully' });
    } catch (error) {
        next(error);
    }
};