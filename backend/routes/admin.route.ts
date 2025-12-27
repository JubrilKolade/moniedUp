// src/routes/admin.ts
import { Router } from 'express';
import { getAllUsers } from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', getAllUsers);

export default router;