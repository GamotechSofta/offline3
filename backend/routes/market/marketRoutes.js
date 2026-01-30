import express from 'express';
import {
    createMarket,
    getMarkets,
    getMarketById,
    updateMarket,
    setOpeningNumber,
    setClosingNumber,
    setWinNumber,
    deleteMarket,
} from '../../controllers/marketController.js';
import { verifyAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/get-markets', getMarkets);
router.get('/get-market/:id', getMarketById);

// Protected admin routes
router.post('/create-market', verifyAdmin, createMarket);
router.patch('/update-market/:id', verifyAdmin, updateMarket);
router.patch('/set-opening-number/:id', verifyAdmin, setOpeningNumber);
router.patch('/set-closing-number/:id', verifyAdmin, setClosingNumber);
router.patch('/set-win-number/:id', verifyAdmin, setWinNumber);
router.delete('/delete-market/:id', verifyAdmin, deleteMarket);

export default router;
