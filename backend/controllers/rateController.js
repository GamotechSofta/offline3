import Rate, { getRatesMap } from '../models/rate/rate.js';

/**
 * GET /rates – list all game rates (admin). Public GET for settlement use.
 */
export const getRates = async (req, res) => {
    try {
        const map = await getRatesMap();
        const list = [
            { gameType: 'single', label: 'Single Digit', rate: map.single },
            { gameType: 'jodi', label: 'Jodi', rate: map.jodi },
            { gameType: 'singlePatti', label: 'Single Patti', rate: map.singlePatti },
            { gameType: 'doublePatti', label: 'Double Patti', rate: map.doublePatti },
            { gameType: 'triplePatti', label: 'Triple Patti', rate: map.triplePatti },
            { gameType: 'halfSangam', label: 'Half Sangam', rate: map.halfSangam },
            { gameType: 'fullSangam', label: 'Full Sangam', rate: map.fullSangam },
        ];
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /rates/:gameType – update one rate. Body: { rate: number }
 */
export const updateRate = async (req, res) => {
    try {
        const { gameType } = req.params;
        const { rate } = req.body;
        const validTypes = ['single', 'jodi', 'singlePatti', 'doublePatti', 'triplePatti', 'halfSangam', 'fullSangam'];
        if (!validTypes.includes(gameType)) {
            return res.status(400).json({ success: false, message: 'Invalid game type' });
        }
        const rateNum = Number(rate);
        if (!Number.isFinite(rateNum) || rateNum < 0) {
            return res.status(400).json({ success: false, message: 'Rate must be a non-negative number' });
        }
        const doc = await Rate.findOneAndUpdate(
            { gameType },
            { rate: rateNum },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
