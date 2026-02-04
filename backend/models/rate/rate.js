import mongoose from 'mongoose';

const DEFAULT_RATES = {
    single: 10,
    jodi: 100,
    singlePatti: 150,
    doublePatti: 300,
    triplePatti: 1000,
    halfSangam: 5000,
    fullSangam: 10000,
};

const rateSchema = new mongoose.Schema({
    gameType: {
        type: String,
        required: true,
        unique: true,
        enum: ['single', 'jodi', 'singlePatti', 'doublePatti', 'triplePatti', 'halfSangam', 'fullSangam'],
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

const Rate = mongoose.model('Rate', rateSchema);

/**
 * Get all rates as a map { single: 10, jodi: 100, ... }. Seeds defaults if empty.
 * Every key from DEFAULT_RATES is guaranteed to be a finite number (default used if missing/invalid).
 */
export async function getRatesMap() {
    let docs = await Rate.find().lean();
    if (docs.length === 0) {
        for (const [gameType, rate] of Object.entries(DEFAULT_RATES)) {
            await Rate.create({ gameType, rate });
        }
        docs = await Rate.find().lean();
    }
    const map = { ...DEFAULT_RATES };
    for (const d of docs) {
        const key = d.gameType;
        const val = d.rate;
        if (key && key in DEFAULT_RATES && val != null && Number.isFinite(Number(val)) && Number(val) >= 0) {
            map[key] = Number(val);
        }
    }
    return map;
}

export default Rate;
export { DEFAULT_RATES };
