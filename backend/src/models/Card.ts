import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface CardAttributes {
    id: string;
    cardNumber: string;
    type: string;
    status: string;
    expiryDate: Date;
    cvv: string;
    accountId: string;
    issuedAt?: Date;
}

interface CardCreationAttributes extends Optional<CardAttributes, 'id' | 'status' | 'issuedAt'> { }

class Card extends Model<CardAttributes, CardCreationAttributes> implements CardAttributes {
    public id!: string;
    public cardNumber!: string;
    public type!: string;
    public status!: string;
    public expiryDate!: Date;
    public cvv!: string;
    public accountId!: string;
    public issuedAt!: Date;
}

Card.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        cardNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'active',
            allowNull: false,
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        cvv: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        accountId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        issuedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'cards',
        timestamps: false, // Cards don't have updatedAt
    }
);

export default Card;

