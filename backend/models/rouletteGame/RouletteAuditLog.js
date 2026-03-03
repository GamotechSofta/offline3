import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Immutable audit log with tamper-detection chain.
 * recordHash = SHA256(sequenceId + spinId + previousRecordHash + timestamp + payloadHash).
 */
const rouletteAuditLogSchema = new mongoose.Schema({
    sequenceId: { type: Number, required: true, unique: true },
    spinId: { type: String, required: true, index: true },
    previousRecordHash: { type: String, default: '0' },
    recordHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    payloadHash: { type: String, required: true },
    /** Minimal payload for verification (no PII in log) */
    payload: {
        userId: String,
        totalBet: Number,
        payout: Number,
        winningNumber: Number,
    },
}, { timestamps: false });

rouletteAuditLogSchema.index({ timestamp: 1 });

export async function getNextSequenceId(session) {
    const coll = mongoose.connection.db.collection('roulette_audit_seq');
    const opts = session ? { session } : {};
    const r = await coll.findOneAndUpdate(
        { _id: 'roulette_audit_seq' },
        { $inc: { value: 1 } },
        { upsert: true, returnDocument: 'after', ...opts }
    );
    return r?.value ?? 1;
}

export function hashRecord(sequenceId, spinId, previousRecordHash, timestamp, payloadHash) {
    const str = `${sequenceId}|${spinId}|${previousRecordHash}|${timestamp.toISOString()}|${payloadHash}`;
    return crypto.createHash('sha256').update(str).digest('hex');
}

const RouletteAuditLog = mongoose.model('RouletteAuditLog', rouletteAuditLogSchema);
export default RouletteAuditLog;
