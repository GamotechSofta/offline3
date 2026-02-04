import express from 'express';
import { getRates, updateRate } from '../../controllers/rateController.js';
import { verifyAdmin, verifySuperAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

router.get('/', verifyAdmin, getRates);
router.patch('/:gameType', verifySuperAdmin, updateRate);

export default router;
