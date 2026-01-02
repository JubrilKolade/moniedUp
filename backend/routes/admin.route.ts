import { Router } from 'express';
import { getAllUsers } from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/users', authenticateToken, requireAdmin, getAllUsers);

export default router;