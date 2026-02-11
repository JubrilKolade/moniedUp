import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcryptjs';

// Define the User attributes interface (like a TypeScript type)
export interface UserAttributes {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    tier: string;
    kycStatus: string;
    twoFactorSecret?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define what fields are optional when creating a user
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'tier' | 'kycStatus' | 'twoFactorSecret' | 'createdAt' | 'updatedAt'> { }

// Define the User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare public id: string;
    declare public name: string;
    declare public email: string;
    declare public password: string;
    declare public phone: string;
    declare public address: string;
    declare public tier: string;
    declare public kycStatus: string;
    declare public twoFactorSecret: string | null;

    // Timestamps
    declare public readonly createdAt: Date;
    declare public readonly updatedAt: Date;

    // Instance methods
    public async validatePassword(password: string): Promise<boolean> {
        // console.log('Validating password. stored:', this.password, 'provided:', password);
        if (!this.password) {
            // If password is not loaded, we can't validate. 
            // This might happen if using a scope that excludes password.
            // console.warn('User.validatePassword called but this.password is undefined');
            return false;
        }
        return await bcrypt.compare(password, this.password);
    }
}

// Initialize the model (similar to mongoose.Schema)
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tier: {
            type: DataTypes.STRING,
            defaultValue: 'Tier1',
            allowNull: false,
        },
        kycStatus: {
            type: DataTypes.STRING,
            defaultValue: 'unverified',
            allowNull: false,
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: false, // Use camelCase for createdAt/updatedAt
    }
);

User.beforeCreate(async (user: User) => {
    if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

User.beforeUpdate(async (user: User) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

export default User;

