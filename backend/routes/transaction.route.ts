// src/routes/transaction.ts
import { Router } from 'express';
import { createTransaction, getTransactionHistory } from '../controllers/transaction.controller.js';

const router = Router();

router.post('/', createTransaction);
router.get('/:accountId/history', getTransactionHistory);

export default router;