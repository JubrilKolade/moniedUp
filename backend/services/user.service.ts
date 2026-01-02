import pool from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

export class UserService {
    static async createUser(data: {
        name: string;
        email: string;
        password: string;
        phone: string;
        address: string;
    }) {
        const client = await pool.connect();
        try {
            // Check if user exists
            const existing = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
            if (existing.rows.length > 0) {
                throw new AppError('User already exists', 409);
            }

            // Create user
            const result = await client.query(
                `INSERT INTO users (name, email, password, phone, address, tier, "kycStatus")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, name, email, phone, address, tier, "kycStatus", "createdAt", "updatedAt"`,
                [data.name, data.email, data.password, data.phone, data.address, 'Tier1', 'unverified']
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async authenticateUser(email: string, password: string) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, name, email, password, tier, "kycStatus" FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                throw new AppError('Invalid credentials', 401);
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async getUserById(userId: string) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, name, email, phone, address, tier, "kycStatus", "createdAt", "updatedAt"
                 FROM users WHERE id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new AppError('User not found', 404);
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async updateUser(userId: string, data: { name?: string; phone?: string; address?: string }) {
        const client = await pool.connect();
        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(data.name);
            }
            if (data.phone !== undefined) {
                updates.push(`phone = $${paramCount++}`);
                values.push(data.phone);
            }
            if (data.address !== undefined) {
                updates.push(`address = $${paramCount++}`);
                values.push(data.address);
            }

            if (updates.length === 0) {
                return await this.getUserById(userId);
            }

            values.push(userId);
            const result = await client.query(
                `UPDATE users SET ${updates.join(', ')}, "updatedAt" = NOW()
                 WHERE id = $${paramCount}
                 RETURNING id, name, email, phone, address, tier, "kycStatus", "createdAt", "updatedAt"`,
                values
            );

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async deleteUser(userId: string) {
        const client = await pool.connect();
        try {
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
        } finally {
            client.release();
        }
    }

    static async getAllUsers() {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT id, name, email, phone, address, tier, "kycStatus", "createdAt", "updatedAt"
                 FROM users`
            );
            return result.rows;
        } finally {
            client.release();
        }
    }
}
