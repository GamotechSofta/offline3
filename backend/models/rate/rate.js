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
 */
export async function getRatesMap() {
    let docs = await Rate.find().lean();
    if (docs.length === 0) {
        for (const [gameType, rate] of Object.entries(DEFAULT_RATES)) {
            await Rate.create({ gameType, rate });
        }
        docs = await Rate.find().lean();
    }
    const map = {};
    for (const d of docs) {
        map[d.gameType] = Number(d.rate) || 0;
    }
    for (const k of Object.keys(DEFAULT_RATES)) {
        if (map[k] == null) map[k] = DEFAULT_RATES[k];
    }
    return map;
}

export default Rate;
export { DEFAULT_RATES };
