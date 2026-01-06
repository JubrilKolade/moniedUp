import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '../config/db.js';

export interface AuditLogAttributes {
    id: string;
    action: string;
    description?: string;
    adminId: string;
    targetResourceId?: string;
    targetResourceType?: string;
    metadata?: object;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'metadata' | 'description' | 'targetResourceId' | 'targetResourceType' | 'createdAt' | 'updatedAt'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: string;
    public action!: string;
    public description?: string;
    public adminId!: string;
    public targetResourceId?: string;
    public targetResourceType?: string;
    public metadata?: object;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
            // referencing admins table logic here if strict, or just storing ID
        },
        targetResourceId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        targetResourceType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
    }
);

export default AuditLog;
