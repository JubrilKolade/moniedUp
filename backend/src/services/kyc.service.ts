import { User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { NotificationService, NotificationType } from './notification.service.js';

export class KYCService {
    static async submitKYC(userId: string, documentUrl: string) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.kycStatus === 'pending') {
            throw new AppError('KYC already submitted and pending review', 400);
        }

        await user.update({
            kycStatus: 'pending',
            kycDocumentUrl: documentUrl,
            kycSubmittedAt: new Date(),
        });

        await NotificationService.sendNotification(
            userId,
            'Your KYC documents have been submitted and are pending review.',
            NotificationType.SYSTEM
        );

        return user.toJSON();
    }

    static async reviewKYC(userId: string, status: 'verified' | 'rejected', notes?: string) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const oldStatus = user.kycStatus;
        await user.update({
            kycStatus: status,
            // If verified, maybe upgrade tier automatically?
            tier: status === 'verified' ? 'Tier2' : user.tier,
        });

        const message = status === 'verified'
            ? 'Congratulations! Your KYC has been verified. You have been upgraded to Tier 2.'
            : `Your KYC was rejected. Reason: ${notes || 'Information provided was insufficient.'}`;

        await NotificationService.sendNotification(userId, message, NotificationType.SYSTEM);

        return user.toJSON();
    }
}
