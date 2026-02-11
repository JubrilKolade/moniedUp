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
    declare public id: string;
    declare public accountNumber: string;
    declare public type: string;
    declare public balance: number;
    declare public status: string;
    declare public userId: string;

    declare public readonly createdAt: Date;
    declare public readonly updatedAt: Date;
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

