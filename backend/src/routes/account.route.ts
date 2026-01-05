import { Router } from 'express';
import { createAccount, getBalance } from '../controllers/account.controller.js';
import { authenticateToken, authorizeUser } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createAccountSchema, getBalanceSchema } from '../validators/account.validator.js';

const router = Router();

router.post('/', authenticateToken, validate(createAccountSchema), createAccount);
router.get('/:userId/balance', authenticateToken, validate(getBalanceSchema), authorizeUser, getBalance);

export default router;