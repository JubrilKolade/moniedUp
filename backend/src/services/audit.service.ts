import { AuditLog } from '../models/index.js';

export class AuditService {
    static async logAction(data: {
        action: string;
        adminId: string;
        description?: string;
        targetResourceId?: string;
        targetResourceType?: string;
        metadata?: object;
    }) {
        try {
            await AuditLog.create(data);
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Non-blocking: don't crash the request if logging fails, but log to console
        }
    }
}
