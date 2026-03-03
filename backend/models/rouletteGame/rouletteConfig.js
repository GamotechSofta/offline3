import mongoose from 'mongoose';

/**
 * Roulette config — exposure and risk limits only. No probability steering.
 * RTP is determined by European wheel math (house edge 1/37).
 */
const rouletteConfigSchema = new mongoose.Schema({
    gameId: { type: String, default: 'roulette', unique: true },
    /** House reserve (bankroll) for max payout per spin check */
    houseReserve: { type: Number, default: 1e9, min: 0 },
    /** Max payout per spin = houseReserve * riskFactor (e.g. 0.1 = 10%) */
    riskFactor: { type: Number, default: 0.1, min: 0.01, max: 1 },
    /** Max total table liability (optional) */
    tableLiabilityCap: { type: Number, min: 0 },
    /** Max payout per straight-up number (optional) */
    maxStraightUpPerNumber: { type: Number, min: 0 },
    /** Per-bet-type max stake e.g. { number: 1000, red: 5000 } */
    perBetTypeLimits: { type: mongoose.Schema.Types.Mixed },
    /** Kelly-style cap: max total stake per spin = houseReserve * kellyFraction */
    kellyFraction: { type: Number, default: 0.05, min: 0, max: 1 },
    /** Enable provably fair: clientSeed + nonce, serverSeed from active cycle */
    provablyFairEnabled: { type: Boolean, default: false },
    /** --- Operational risk automation --- */
    /** If house reserve balance < this, table is halted (no new spins). */
    reserveHaltTable: { type: Number, min: 0 },
    /** If house reserve balance < this, high-risk bet types (e.g. straight-up) are frozen. */
    reserveFreezeHighRisk: { type: Number, min: 0 },
    /** If exposure ratio (maxPayoutThisSpin / reserve) > this, reduce max straight-up by maxStraightUpReductionFactor. */
    exposureRatioReductionThreshold: { type: Number, default: 0.6, min: 0, max: 1 },
    /** When exposure ratio exceeds threshold, effective maxStraightUpPerNumber = base * (1 - this). E.g. 0.2 = 20% reduction. */
    maxStraightUpReductionFactor: { type: Number, default: 0.2, min: 0, max: 1 },
    /** Minimum reserve formula (documentation): e.g. "totalWagered * 0.02" or capital multiplier. Used for alerts/min recommended. */
    minReserveFormula: { type: String },
}, { timestamps: true });

const CONFIG_ID = 'roulette';

rouletteConfigSchema.statics.getConfig = async function () {
    let doc = await this.findOne({ gameId: CONFIG_ID }).lean();
    if (!doc) {
        await this.create({ gameId: CONFIG_ID });
        doc = await this.findOne({ gameId: CONFIG_ID }).lean();
    }
    return doc;
};

rouletteConfigSchema.statics.updateConfig = async function (updates) {
    const allowed = [
        'houseReserve', 'riskFactor', 'tableLiabilityCap',
        'maxStraightUpPerNumber', 'perBetTypeLimits', 'kellyFraction', 'provablyFairEnabled',
        'reserveHaltTable', 'reserveFreezeHighRisk', 'exposureRatioReductionThreshold',
        'maxStraightUpReductionFactor', 'minReserveFormula',
    ];
    const toSet = {};
    for (const k of allowed) {
        if (updates[k] !== undefined) toSet[k] = updates[k];
    }
    const doc = await this.findOneAndUpdate(
        { gameId: CONFIG_ID },
        { $set: toSet },
        { new: true, upsert: true, runValidators: true }
    ).lean();
    return doc;
};

const RouletteConfig = mongoose.model('RouletteConfig', rouletteConfigSchema);
export default RouletteConfig;
