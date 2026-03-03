import mongoose from 'mongoose';

/**
 * Server seed cycle for provably fair. One active cycle at a time.
 * Pre-commit serverSeedHash before use; reveal serverSeed after rotation.
 */
const rouletteSeedCycleSchema = new mongoose.Schema({
    gameId: { type: String, default: 'roulette', required: true },
    /** Hash shown to players before gameplay (pre-commit) */
    serverSeedHash: { type: String, required: true },
    /** Revealed after cycle ends; used to verify past spins */
    serverSeed: { type: String },
    /** Cycle active from this time */
    activeFrom: { type: Date, default: Date.now },
    /** Cycle ended / seed revealed at this time */
    revealedAt: { type: Date },
    /** Optional: next cycle's hash (for chaining) */
    nextCycleHash: { type: String },
}, { timestamps: true });

rouletteSeedCycleSchema.index({ gameId: 1, activeFrom: -1 });
rouletteSeedCycleSchema.index({ gameId: 1, revealedAt: 1 });

rouletteSeedCycleSchema.statics.getActiveCycle = async function (session) {
    const q = this.findOne({ gameId: 'roulette', revealedAt: null }).sort({ activeFrom: -1 });
    if (session) q.session(session);
    return q.lean();
};

const RouletteSeedCycle = mongoose.model('RouletteSeedCycle', rouletteSeedCycleSchema);
export default RouletteSeedCycle;
