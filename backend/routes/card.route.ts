import express from 'express';
import { createCard, getCards, deleteCard } from '../controllers/card.controller.js';

const router = express.Router();

router.post('/apply', createCard);
router.get('/:accountId', getCards);
router.delete('/:cardId', deleteCard);

export default router;