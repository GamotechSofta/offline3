import mongoose from 'mongoose';

/**
 * Global roulette stats — single document for atomic updates.
 * totalWagered, totalPaid, spinCount updated in same transaction as spin.
 * houseProfit = totalWagered - totalPaid; rolling RTP = totalPaid / totalWagered.
 */
const rouletteStatsSchema = new mongoose.Schema({
    gameId: { type: String, default: 'roulette', unique: true },
    totalWagered: { type: Number, default: 0, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    spinCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

rouletteStatsSchema.virtual('houseProfit').get(function () {
    return this.totalWagered - this.totalPaid;
});

rouletteStatsSchema.virtual('rtp').get(function () {
    return this.totalWagered > 0 ? this.totalPaid / this.totalWagered : 0;
});

const STATS_ID = 'roulette';

rouletteStatsSchema.statics.getStats = async function (session) {
    const opts = session ? { session } : {};
    let q = this.findOne({ gameId: STATS_ID });
    if (session) q = q.session(session);
    let doc = await q.lean();
    if (!doc) {
        await this.create([{ gameId: STATS_ID }], opts);
        let q2 = this.findOne({ gameId: STATS_ID });
        if (session) q2 = q2.session(session);
        doc = await q2.lean();
    }
    const houseProfit = (doc.totalWagered || 0) - (doc.totalPaid || 0);
    const rtp = (doc.totalWagered || 0) > 0 ? (doc.totalPaid || 0) / doc.totalWagered : 0;
    return { ...doc, houseProfit, rtp };
};

rouletteStatsSchema.statics.incrementSpin = async function (totalBet, payout, session) {
    const opts = { upsert: true, new: true };
    if (session) opts.session = session;
    await this.findOneAndUpdate(
        { gameId: STATS_ID },
        { $inc: { totalWagered: totalBet, totalPaid: payout, spinCount: 1 } },
        opts
    );
};

const RouletteStats = mongoose.model('RouletteStats', rouletteStatsSchema);
export default RouletteStats;
