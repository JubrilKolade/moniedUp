import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

interface TransactionAttributes {
    id: string;
    amount: number;
    type: string;
    status: string;
    description?: string | null;
    fromAccountId?: string | null;
    toAccountId?: string | null;
    performedByUserId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'description' | 'fromAccountId' | 'toAccountId' | 'performedByUserId' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
    public id!: string;
    public amount!: number;
    public type!: string;
    public status!: string;
    public description?: string | null;
    public fromAccountId?: string | null;
    public toAccountId?: string | null;
    public performedByUserId?: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Transaction.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fromAccountId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        toAccountId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        performedByUserId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'transactions',
        timestamps: true,
    }
);

export default Transaction;

