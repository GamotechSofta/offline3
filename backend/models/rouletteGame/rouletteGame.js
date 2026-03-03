import mongoose from 'mongoose';

const rouletteGameSchema = new mongoose.Schema({
    spinId: { type: String, unique: true, sparse: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bets: [{
        type: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed },
        amount: { type: Number, required: true, min: 0 },
    }],
    winningNumber: { type: Number, required: true, min: 0, max: 36 },
    totalBet: { type: Number, required: true, min: 0 },
    payout: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    /** Provably fair: client seed + nonce (server seed from cycle) */
    clientSeed: { type: String },
    nonce: { type: Number },
    serverSeedHash: { type: String },
    /** Audit: SHA256 of canonical spin data for replay verification */
    spinDataHash: { type: String },
    preSpinBankrollSnapshot: { type: Number },
    betStructure: { type: mongoose.Schema.Types.Mixed },
    idempotencyKey: { type: String, sparse: true },
}, {
    timestamps: true,
});

// Strict unique indexes for concurrency and idempotency (multi-instance safe).
rouletteGameSchema.index({ spinId: 1 }, { unique: true });
rouletteGameSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $ne: '' } } });

const RouletteGame = mongoose.model('RouletteGame', rouletteGameSchema);
export default RouletteGame;
