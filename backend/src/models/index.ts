import sequelize from '../config/db.js';
import User from './User.js';
import Account from './Account.js';
import Transaction from './Transaction.js';
import Card from './Card.js';
import Admin from './Admin.js';
import AuditLog from './AuditLog.js';

// Define relationships (similar to Mongoose populate)
// User has many Accounts
User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has many Transactions (as performer)
User.hasMany(Transaction, { foreignKey: 'performedByUserId', as: 'sentTransactions' });
Transaction.belongsTo(User, { foreignKey: 'performedByUserId', as: 'performedBy' });

// Account has many Transactions (as sender)
Account.hasMany(Transaction, { foreignKey: 'fromAccountId', as: 'sentTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'fromAccountId', as: 'fromAccount' });

// Account has many Transactions (as receiver)
Account.hasMany(Transaction, { foreignKey: 'toAccountId', as: 'receivedTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'toAccountId', as: 'toAccount' });

// Account has many Cards
Account.hasMany(Card, { foreignKey: 'accountId', as: 'cards' });
Card.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });

export {
    sequelize,
    User,
    Account,
    Transaction,
    Card,
    Admin,
    AuditLog
};

