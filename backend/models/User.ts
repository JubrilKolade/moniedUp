import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

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
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'tier' | 'kycStatus' | 'twoFactorSecret' | 'createdAt' | 'updatedAt'> {}

// Define the User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public name!: string;
    public email!: string;
    public password!: string;
    public phone!: string;
    public address!: string;
    public tier!: string;
    public kycStatus!: string;
    public twoFactorSecret?: string | null;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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

export default User;

