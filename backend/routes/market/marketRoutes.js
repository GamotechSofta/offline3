import express from 'express';
import {
    createMarket,
    getMarkets,
    getMarketById,
    updateMarket,
    setOpeningNumber,
    setClosingNumber,
    deleteMarket,
} from '../../controllers/marketController.js';

const router = express.Router();

router.post('/create-market', createMarket);
router.get('/get-markets', getMarkets);
router.get('/get-market/:id', getMarketById);
router.patch('/update-market/:id', updateMarket);
router.patch('/set-opening-number/:id', setOpeningNumber);
router.patch('/set-closing-number/:id', setClosingNumber);
router.delete('/delete-market/:id', deleteMarket);

export default router;
