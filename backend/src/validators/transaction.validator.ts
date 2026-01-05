import { z } from 'zod';

export const createTransactionSchema = z.object({
    body: z.object({
        fromAccountId: z.string().uuid('Invalid account ID format').optional(),
        toAccountId: z.string().uuid('Invalid account ID format').optional(),
        amount: z.number().positive('Amount must be positive').or(z.string().transform((val) => {
            const num = parseFloat(val);
            if (isNaN(num) || num <= 0) throw new Error('Amount must be a positive number');
            return num;
        })),
        type: z.enum(['deposit', 'withdrawal', 'transfer'], {
            errorMap: () => ({ message: 'Transaction type must be deposit, withdrawal, or transfer' }),
        }),
        description: z.string().optional(),
    }),
});

export const getTransactionHistorySchema = z.object({
    params: z.object({
        accountId: z.string().uuid('Invalid account ID format'),
    }),
});

