import { z } from 'zod';

export const createAccountSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID format'),
        type: z.enum(['checking', 'savings', 'business'], {
            errorMap: () => ({ message: 'Account type must be checking, savings, or business' }),
        }),
    }),
});

export const getBalanceSchema = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID format'),
    }),
});

