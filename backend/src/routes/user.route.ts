import express from 'express';
import { registerUser, loginUser, logoutUser, updateUser, deleteUser, getUserProfile, requestKyc } from '../controllers/user.controller.js';
import { authenticateToken, authorizeUser } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { registerUserSchema, loginUserSchema, updateUserSchema, deleteUserSchema } from '../validators/user.validator.js';

const router = express.Router();

router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.post('/logout', authenticateToken, logoutUser);
router.get('/profile', authenticateToken, getUserProfile);
router.put('/:userId', authenticateToken, validate(updateUserSchema), authorizeUser, updateUser);
router.delete('/:userId', authenticateToken, validate(deleteUserSchema), authorizeUser, deleteUser);
router.post('/kyc-request', authenticateToken, requestKyc);

export default router;