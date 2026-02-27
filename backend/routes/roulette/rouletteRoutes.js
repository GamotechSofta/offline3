import express from 'express';
import { spinRoulette, getRouletteStats, getRouletteHistory } from '../../controllers/rouletteController.js';

const router = express.Router();

router.post('/spin', spinRoulette);
router.get('/stats', getRouletteStats);
router.get('/history', getRouletteHistory);

export default router;
