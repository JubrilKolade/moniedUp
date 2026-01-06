import { User } from '../models/index.js';
import { AppError } from '../middleware/error.middleware.js';

export class UserService {
    static async createUser(data: {
        name: string;
        email: string;
        password: string;
        phone: string;
        address: string;
    }) {
        // Check if user exists (similar to User.findOne in Mongoose)
        const existingUser = await User.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError('User already exists', 409);
        }

        // Create user (similar to new User().save() in Mongoose)
        const user = await User.create({
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            address: data.address,
        });

        // Return user without password (convert to plain object)
        const userData = user.toJSON();
        const { password: _, ...userWithoutPassword } = userData;
        return userWithoutPassword;
    }

    static async authenticateUser(email: string, password: string) {
        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Return user data (password will be checked in controller with bcrypt)
        return user.toJSON();
    }

    static async getUserById(userId: string) {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }, // Exclude password from result
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user.toJSON();
    }

    static async updateUser(userId: string, data: { name?: string; phone?: string; address?: string }) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Update user (similar to user.save() in Mongoose)
        await user.update(data);

        // Return updated user without password
        const userData = user.toJSON();
        const { password: _, ...userWithoutPassword } = userData;
        return userWithoutPassword;
    }

    static async deleteUser(userId: string) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        await user.destroy(); // Similar to user.remove() in Mongoose
    }

    static async getAllUsers() {
        // Find all users (similar to User.find() in Mongoose)
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
        });

        return users.map(user => user.toJSON());
    }

    static async requestKyc(userId: string) {
        const user = await User.findByPk(userId);
        if (!user) throw new AppError('User not found', 404);
        if (user.kycStatus === 'verified') throw new AppError('User already verified', 400);
        if (user.kycStatus === 'pending') throw new AppError('KYC already pending', 400);

        await user.update({ kycStatus: 'pending' });
        return { message: 'KYC requested successfully' };
    }

    static async updateKycStatus(userId: string, status: 'verified' | 'rejected') {
        const user = await User.findByPk(userId);
        if (!user) throw new AppError('User not found', 404);

        await user.update({ kycStatus: status });
        return { message: `KYC status updated to ${status}` };
    }
}
