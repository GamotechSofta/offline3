import Market from '../models/market/market.js';

/**
 * Create a new market.
 * Body: { marketName, startingTime, closingTime }
 */
export const createMarket = async (req, res) => {
    try {
        const { marketName, startingTime, closingTime } = req.body;
        if (!marketName || !startingTime || !closingTime) {
            return res.status(400).json({
                success: false,
                message: 'marketName, startingTime and closingTime are required',
            });
        }
        const market = new Market({ marketName, startingTime, closingTime });
        await market.save();
        const response = market.toObject();
        response.displayResult = market.getDisplayResult();
        res.status(201).json({ success: true, data: response });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Market with this name already exists',
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all markets.
 */
export const getMarkets = async (req, res) => {
    try {
        const markets = await Market.find().sort({ startingTime: 1 });
        const data = markets.map((m) => {
            const doc = m.toObject();
            doc.displayResult = m.getDisplayResult();
            return doc;
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get a single market by ID.
 */
export const getMarketById = async (req, res) => {
    try {
        const { id } = req.params;
        const market = await Market.findById(id);
        if (!market) {
            return res.status(404).json({ success: false, message: 'Market not found' });
        }
        const response = market.toObject();
        response.displayResult = market.getDisplayResult();
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid market ID' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update market (name, times). Does not set opening/closing numbers; use setOpeningNumber / setClosingNumber.
 * Body: { marketName?, startingTime?, closingTime? }
 */
export const updateMarket = async (req, res) => {
    try {
        const { id } = req.params;
        const { marketName, startingTime, closingTime } = req.body;
        const updates = {};
        if (marketName !== undefined) updates.marketName = marketName;
        if (startingTime !== undefined) updates.startingTime = startingTime;
        if (closingTime !== undefined) updates.closingTime = closingTime;

        const market = await Market.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );
        if (!market) {
            return res.status(404).json({ success: false, message: 'Market not found' });
        }
        const response = market.toObject();
        response.displayResult = market.getDisplayResult();
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid market ID' });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Market with this name already exists',
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Set opening number (3 digits). Body: { openingNumber: "123" }
 */
export const setOpeningNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { openingNumber } = req.body;
        if (!openingNumber || !/^\d{3}$/.test(openingNumber)) {
            return res.status(400).json({
                success: false,
                message: 'openingNumber must be exactly 3 digits',
            });
        }
        const market = await Market.findByIdAndUpdate(
            id,
            { openingNumber },
            { new: true, runValidators: true }
        );
        if (!market) {
            return res.status(404).json({ success: false, message: 'Market not found' });
        }
        const response = market.toObject();
        response.displayResult = market.getDisplayResult();
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid market ID' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Set closing number (3 digits). Body: { closingNumber: "456" }
 * Result (e.g. 123-65-456) is computed and stored on save.
 */
export const setClosingNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { closingNumber } = req.body;
        if (!closingNumber || !/^\d{3}$/.test(closingNumber)) {
            return res.status(400).json({
                success: false,
                message: 'closingNumber must be exactly 3 digits',
            });
        }
        const market = await Market.findByIdAndUpdate(
            id,
            { closingNumber },
            { new: true, runValidators: true }
        );
        if (!market) {
            return res.status(404).json({ success: false, message: 'Market not found' });
        }
        const response = market.toObject();
        response.displayResult = market.getDisplayResult();
        res.status(200).json({ success: true, data: response });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid market ID' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
                errors: error.errors,
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a market.
 */
export const deleteMarket = async (req, res) => {
    try {
        const { id } = req.params;
        const market = await Market.findByIdAndDelete(id);
        if (!market) {
            return res.status(404).json({ success: false, message: 'Market not found' });
        }
        res.status(200).json({ success: true, message: 'Market deleted', data: { id } });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid market ID' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
