import express from 'express';
import {
    spinRoulette,
    getRouletteStats,
    getRouletteHistory,
    getRouletteConfig,
    updateRouletteConfig,
    getRouletteGlobalStats,
    runMonteCarloSimulation,
    getRouletteAnalytics,
    getRouletteProof,
    getRouletteExposureStatus,
    getRouletteSystemHealth,
    exportRouletteAuditLog,
    runLiquidityStress,
} from '../../controllers/rouletteController.js';
import { verifyAdmin, verifySuperAdmin } from '../../middleware/adminAuth.js';
import { validateSpinInput } from '../../middleware/validateRouletteSpin.js';
import { checkResponsibleGaming } from '../../middleware/responsibleGaming.js';

const router = express.Router();

router.post('/spin', validateSpinInput, checkResponsibleGaming, spinRoulette);
router.get('/stats', getRouletteStats);
router.get('/history', getRouletteHistory);
router.get('/proof/:spinId', getRouletteProof);

router.get('/config', verifyAdmin, getRouletteConfig);
router.patch('/config', verifySuperAdmin, updateRouletteConfig);
router.get('/global-stats', verifyAdmin, getRouletteGlobalStats);
router.get('/analytics', verifyAdmin, getRouletteAnalytics);
router.get('/exposure-status', verifyAdmin, getRouletteExposureStatus);
router.get('/system-health', verifyAdmin, getRouletteSystemHealth);
router.get('/audit-export', verifyAdmin, exportRouletteAuditLog);
router.post('/monte-carlo', verifyAdmin, runMonteCarloSimulation);
router.post('/simulate', verifyAdmin, runMonteCarloSimulation);
router.post('/liquidity-stress', verifyAdmin, runLiquidityStress);

export default router;
