import { TransactionService } from './transaction.service.js';
import { Account, User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { NotificationService, NotificationType } from './notification.service.js';

export interface SplitMember {
    userId: string;
    amount: number;
}

export class SplitService {
    /**
     * Splits a bill among multiple users.
     * The payer pays the whole amount, and requests are sent to others (Simulation).
     * For now, we'll just implement the logic of performing multiple transfers.
     */
    static async performSplit(
        payerAccountId: string,
        members: SplitMember[],
        totalAmount: number,
        description: string
    ) {
        const results = [];
        const payerAccount = await Account.findByPk(payerAccountId);
        if (!payerAccount) throw new AppError('Payer account not found', 404);

        for (const member of members) {
            try {
                // In a real app, this would be a "Request Money" flow.
                // For this demo, we simulate it as a transfer from the member to the payer.
                const memberAccount = await Account.findOne({ where: { userId: member.userId } });
                if (!memberAccount) continue;

                const tx = await TransactionService.createTransfer(
                    memberAccount.id,
                    payerAccountId,
                    member.amount,
                    `Split: ${description}`,
                    member.userId
                );
                results.push({ userId: member.userId, success: true, transactionId: tx.id });
            } catch (error: any) {
                results.push({ userId: member.userId, success: false, error: error.message });
            }
        }

        return {
            totalAmount,
            description,
            results
        };
    }
}
