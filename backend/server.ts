// Load environment variables FIRST before any other imports
import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import './models/index.js'; // Import models to register them
import userRoutes from './routes/user.route.js';
import accountRoutes from './routes/account.route.js';
import transactionRoutes from './routes/transaction.route.js';
import twoFactorRoutes from './routes/twoFactor.route.js';
import adminRoutes from './routes/admin.route.js';
import cardRoutes from './routes/card.route.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET environment variable is not set');
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/two-factor', twoFactorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cards', cardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        await connectDB();
        // Sync models with database (creates tables if they don't exist)
        // In production, use migrations instead of sync
        if (process.env.NODE_ENV !== 'production') {
            const { sequelize } = await import('./models/index.js');
            await sequelize.sync({ alter: false }); // Set to true to update existing tables
            console.log('✅ Database models synced.');
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        const { sequelize } = await import('./models/index.js');
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        const { sequelize } = await import('./models/index.js');
        await sequelize.close();
        console.log('Database connection closed');
        process.exit(0);
    });
});