import { User } from '../models/index.js';

export enum NotificationType {
    TRANSACTION = 'TRANSACTION',
    SECURITY = 'SECURITY',
    SYSTEM = 'SYSTEM',
}

export class NotificationService {
    /**
     * Sends a notification to a specific user.
     * Currently logs to console, but can be extended to Email/SMS providers.
     */
    static async sendNotification(
        userId: string,
        message: string,
        type: NotificationType = NotificationType.SYSTEM
    ): Promise<void> {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                console.error(`[NotificationService] User ${userId} not found. Skipping notification.`);
                return;
            }

            const timestamp = new Date().toISOString();
            console.log(`
--- [NOTIFICATION SENT] ---
To: ${user.name} (${user.email})
Time: ${timestamp}
Type: ${type}
Message: ${message}
---------------------------
            `);

            // Future: Integrate with SendGrid, Twilio, or Push Notification Provider here.
        } catch (error) {
            console.error('[NotificationService] Error sending notification:', error);
        }
    }

    /**
     * Specifically for transaction alerts.
     */
    static async notifyTransaction(
        userId: string,
        amount: number,
        txType: string,
        status: string,
        description?: string
    ) {
        const message = `Your ${txType} of ${amount} is ${status}.${description ? ` Description: ${description}` : ''}`;
        await this.sendNotification(userId, message, NotificationType.TRANSACTION);
    }
}
