import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface TransactionAttributes {
    id: string;
    amount: number;
    type: string;
    status: string;
    description?: string | null;
    fromAccountId?: string | null;
    toAccountId?: string | null;
    performedByUserId?: string | null;
    idempotencyKey?: string | null;
    referenceTransactionId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'status' | 'description' | 'fromAccountId' | 'toAccountId' | 'performedByUserId' | 'idempotencyKey' | 'referenceTransactionId' | 'createdAt' | 'updatedAt'> { }

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
    declare public id: string;
    declare public amount: number;
    declare public type: string;
    declare public status: string;
    declare public description?: string | null;
    declare public fromAccountId?: string | null;
    declare public toAccountId?: string | null;
    declare public performedByUserId?: string | null;
    declare public idempotencyKey?: string | null;
    declare public referenceTransactionId?: string | null;

    declare public readonly createdAt: Date;
    declare public readonly updatedAt: Date;
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
        idempotencyKey: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true, // Idempotency: Ensure key is unique
        },
        referenceTransactionId: {
            type: DataTypes.UUID,
            allowNull: true, // For chargebacks, this links to the original transaction
            references: {
                model: 'transactions',
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

