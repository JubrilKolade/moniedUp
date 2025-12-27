import express from 'express';
import { registerUser, loginUser, logoutUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

export default router;