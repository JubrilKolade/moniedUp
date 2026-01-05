import { Router } from 'express';
import { createTransaction, getTransactionHistory } from '../controllers/transaction.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeAccountAccess, authorizeTransactionAccounts } from '../middleware/account.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTransactionSchema, getTransactionHistorySchema } from '../validators/transaction.validator.js';

const router = Router();

router.post('/', authenticateToken, validate(createTransactionSchema), authorizeTransactionAccounts, createTransaction);
router.get('/:accountId/history', authenticateToken, validate(getTransactionHistorySchema), authorizeAccountAccess, getTransactionHistory);

export default router;