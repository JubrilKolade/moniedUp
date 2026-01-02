import { z } from 'zod';

export const registerUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phone: z.string().min(10, 'Phone number must be at least 10 characters'),
        address: z.string().min(5, 'Address must be at least 5 characters'),
    }),
});

export const loginUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID format'),
    }),
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
        address: z.string().min(5, 'Address must be at least 5 characters').optional(),
    }),
});

export const deleteUserSchema = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID format'),
    }),
});

