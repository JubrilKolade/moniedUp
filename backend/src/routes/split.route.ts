import { Router } from 'express';
import { SplitService } from '../services/split.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Account } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

const splitBillSchema = z.object({
    body: z.object({
        totalAmount: z.number().positive(),
        description: z.string().min(1),
        members: z.array(z.object({
            userId: z.string().uuid(),
            amount: z.number().positive(),
        })).min(1),
    }),
});

/**
 * @route POST /api/split/bill
 * @desc Split a bill among multiple users
 */
router.post(
    '/bill',
    authenticateToken,
    validate(splitBillSchema),
    async (req, res, next) => {
        try {
            const userId = (req as AuthenticatedRequest).userId!;
            const { totalAmount, description, members } = req.body;

            // Find user's primary account
            const account = await Account.findOne({ where: { userId } });
            if (!account) {
                throw new AppError('Main user account not found', 404);
            }

            const result = await SplitService.performSplit(
                account.id,
                members,
                totalAmount,
                description
            );

            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
