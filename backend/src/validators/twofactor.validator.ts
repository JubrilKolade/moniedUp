import { z } from 'zod';

export const validateTwoFactorTokenSchema = z.object({
    body: z.object({
        token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must contain only digits'),
    }),
});

