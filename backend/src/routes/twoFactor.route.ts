import { Router } from 'express';
import { generateTwoFactorSecret, validateTwoFactorToken } from '../controllers/twofactor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { validateTwoFactorTokenSchema } from '../validators/twofactor.validator.js';

const router = Router();

router.post('/generate', authenticateToken, generateTwoFactorSecret);
router.post('/validate', authenticateToken, validate(validateTwoFactorTokenSchema), validateTwoFactorToken);

export default router;