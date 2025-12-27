// src/routes/twoFactor.ts
import { Router } from 'express';
import { generateTwoFactorSecret, validateTwoFactorToken } from '../controllers/twofactor.controller.js';

const router = Router();

router.post('/generate', generateTwoFactorSecret);
router.post('/validate', validateTwoFactorToken);

export default router;