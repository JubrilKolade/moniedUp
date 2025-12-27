// src/server.ts
import dotenv from 'dotenv';
import express from 'express';
import prisma from './config/db.js';
import userRoutes from './routes/user.route.js';
import accountRoutes from './routes/account.route.js';
import transactionRoutes from './routes/transaction.route.js';
import twoFactorRoutes from './routes/twoFactor.route.js';
import adminRoutes from './routes/admin.route.js';

import cardRoutes from './routes/card.route.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/two-factor', twoFactorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cards', cardRoutes);

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        await prisma.$connect();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});