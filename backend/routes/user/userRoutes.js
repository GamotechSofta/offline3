import express from 'express';
import { createUser, userLogin, userSignup, getUsers } from '../../controllers/userController.js';
import { verifyAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/login', userLogin);
router.post('/signup', userSignup);

// Admin/Bookie routes
router.get('/', verifyAdmin, getUsers);
router.post('/create', verifyAdmin, createUser);

export default router;
