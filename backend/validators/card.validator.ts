import { z } from 'zod';

export const createCardSchema = z.object({
    body: z.object({
        accountId: z.string().uuid('Invalid account ID format'),
        type: z.enum(['Visa', 'Mastercard'], {
            errorMap: () => ({ message: 'Card type must be Visa or Mastercard' }),
        }),
    }),
});

export const getCardsSchema = z.object({
    params: z.object({
        accountId: z.string().uuid('Invalid account ID format'),
    }),
});

export const deleteCardSchema = z.object({
    params: z.object({
        cardId: z.string().uuid('Invalid card ID format'),
    }),
});

