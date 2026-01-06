import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface AccountAttributes {
    id: string;
    accountNumber: string;
    type: string;
    balance: number;
    status: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'balance' | 'status' | 'createdAt' | 'updatedAt'> { }

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
    public id!: string;
    public accountNumber!: string;
    public type!: string;
    public balance!: number;
    public status!: string;
    public userId!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Account.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        accountNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        balance: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'accounts',
        timestamps: true,
    }
);

export default Account;

