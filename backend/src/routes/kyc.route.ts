import { Router } from 'express';
import { KYCService } from '../services/kyc.service.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// KYC Submission Schema
const kycSubmitSchema = z.object({
    body: z.object({
        documentUrl: z.string().url('Invalid document URL'),
    }),
});

// Admin Review Schema
const kycReviewSchema = z.object({
    body: z.object({
        status: z.enum(['verified', 'rejected']),
        notes: z.string().optional(),
    }),
});

/**
 * @route POST /api/kyc/submit
 * @desc Submit KYC documents
 */
router.post(
    '/submit',
    authenticateToken,
    validate(kycSubmitSchema),
    async (req, res, next) => {
        try {
            const userId = (req as AuthenticatedRequest).userId!;
            const { documentUrl } = req.body;
            const user = await KYCService.submitKYC(userId, documentUrl);
            res.json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PATCH /api/admin/kyc/:userId
 * @desc (Admin Only) Review and approve/reject KYC
 */
router.patch(
    '/admin/review/:userId',
    authenticateToken,
    requireAdmin,
    validate(kycReviewSchema),
    async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { status, notes } = req.body;
            const user = await KYCService.reviewKYC(userId, status, notes || undefined);
            res.json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
