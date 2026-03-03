import mongoose from 'mongoose';

/**
 * Dedicated house reserve for roulette. Updated atomically with each spin.
 * Daily P&L tracked for liquidity reporting.
 */
const houseReserveSchema = new mongoose.Schema({
    gameId: { type: String, default: 'roulette', unique: true },
    balance: { type: Number, default: 0 },
    /** Daily snapshots: { date (YYYY-MM-DD), openingBalance, closingBalance, profitLoss } */
    dailySnapshots: [{
        date: { type: String, required: true },
        openingBalance: { type: Number, required: true },
        closingBalance: { type: Number, required: true },
        profitLoss: { type: Number, required: true },
    }],
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

houseReserveSchema.statics.getReserve = async function (session) {
    const opts = session ? { session } : {};
    let doc = await this.findOne({ gameId: 'roulette' }).session(session).lean();
    if (!doc) {
        await this.create([{ gameId: 'roulette', balance: 0 }], opts);
        let q = this.findOne({ gameId: 'roulette' });
        if (session) q = q.session(session);
        doc = await q.lean();
    }
    return doc;
};

houseReserveSchema.statics.addHouseProfit = async function (amount, session) {
    const opts = { new: true, upsert: true };
    if (session) opts.session = session;
    const doc = await this.findOneAndUpdate(
        { gameId: 'roulette' },
        { $inc: { balance: amount }, $set: { lastUpdated: new Date() }, $setOnInsert: { gameId: 'roulette' } },
        opts
    );
    if (!doc) return null;
    return typeof doc.toObject === 'function' ? doc.toObject() : doc;
};

const HouseReserve = mongoose.model('HouseReserve', houseReserveSchema);
export default HouseReserve;
