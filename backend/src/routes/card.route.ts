import express from 'express';
import { createCard, getCards, deleteCard } from '../controllers/card.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeAccountAccess } from '../middleware/account.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createCardSchema, getCardsSchema, deleteCardSchema } from '../validators/card.validator.js';

const router = express.Router();

router.post('/apply', authenticateToken, validate(createCardSchema), authorizeAccountAccess, createCard);
router.get('/:accountId', authenticateToken, validate(getCardsSchema), authorizeAccountAccess, getCards);
router.delete('/:cardId', authenticateToken, validate(deleteCardSchema), deleteCard);

export default router;