// src/routes/account.ts
import { Router } from 'express';
import { createAccount, getBalance } from '../controllers/account.controller.js';

const router = Router();

router.post('/', createAccount);
router.get('/:userId/balance', getBalance);

export default router;