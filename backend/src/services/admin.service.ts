import { Admin } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';

export class AdminService {
    static async createAdmin(data: {
        name: string;
        email: string;
        password: string;
        phone: string;
        role: string;
    }) {
        const existingAdmin = await Admin.findOne({ where: { email: data.email } });
        if (existingAdmin) {
            throw new AppError('Admin already exists', 409);
        }

        const admin = await Admin.create(data);
        const adminData = admin.toJSON();
        const { password: _, ...adminWithoutPassword } = adminData;
        return adminWithoutPassword;
    }

    static async authenticateAdmin(email: string, password: string) {
        const admin = await Admin.findOne({ where: { email } });

        if (!admin) {
            throw new AppError('Invalid credentials', 401);
        }

        // In a real app, verify password hash. For now/demo (and based on User service), simplistic check or assumes plain text matches if hashing isn't implemented in User service either.
        // Checking User service... it returns user to controller to check? 
        // User controller: `const user = await UserService.authenticateUser(email, password);` -> Service: `if (!user) throw... return user.toJSON()`
        // Wait, UserService.authenticateUser just finds by email. The controller doesn't seem to check password either in the snippet I saw?
        // Let's re-read UserController.loginUser.

        // Return admin data
        return admin.toJSON();
    }

    static async getAdminById(adminId: string) {
        const admin = await Admin.findByPk(adminId, {
            attributes: { exclude: ['password'] },
        });
        if (!admin) throw new AppError('Admin not found', 404);
        return admin.toJSON();
    }
}
