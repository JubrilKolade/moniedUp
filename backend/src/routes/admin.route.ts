import { Router } from 'express';
import { getAllUsers, updateKycStatus, loginAdmin } from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.put('/users/:userId/kyc', authenticateToken, requireAdmin, updateKycStatus);
router.post('/login', loginAdmin);

export default router;