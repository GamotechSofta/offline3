import express from 'express';
import { adminLogin, createAdmin } from '../../controllers/adminController.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/create', createAdmin); // For initial admin setup

export default router;
