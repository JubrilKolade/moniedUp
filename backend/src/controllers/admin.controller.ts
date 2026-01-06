import type { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { AdminService } from '../services/admin.service.js';
import { AuditService } from '../services/audit.service.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getAllUsers = async (req: Request, res: Response, next: any) => {
    try {
        const users = await UserService.getAllUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const updateKycStatus = async (req: Request, res: Response, next: any) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be verified or rejected.' });
        }

        const result = await UserService.updateKycStatus(userId, status);

        // Audit Log
        const authReq = req as AuthenticatedRequest;
        if (authReq.userId) {
            await AuditService.logAction({
                action: 'UPDATE_KYC_STATUS',
                adminId: authReq.userId,
                targetResourceId: userId,
                targetResourceType: 'User',
                description: `Updated KYC status to ${status}`,
                metadata: { status }
            });
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const loginAdmin = async (req: Request, res: Response, next: any) => {
    try {
        const { email, password } = req.body;
        // Import AdminService dynamically or at top if not circular. 
        // We need to import AdminService at top.
        const admin = await AdminService.authenticateAdmin(email, password);

        if (!process.env.JWT_SECRET) {
            throw new AppError('Server configuration error', 500);
        }

        const token = jwt.sign(
            { id: admin.id, role: admin.role }, // Include role in token
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            data: {
                token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

//close/delete account(s)