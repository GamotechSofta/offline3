import mongoose from 'mongoose';

/**
 * AML / risk alerts. For monitoring only — never affects RNG or outcome.
 */
const riskAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['ABNORMAL_BET_SPIKE', 'RAPID_DEPOSIT_WITHDRAW', 'STRAIGHT_UP_CLUSTERING', 'VELOCITY_BETTING', 'LARGE_SINGLE_BET', 'OTHER'],
        required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    payload: { type: mongoose.Schema.Types.Mixed },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

riskAlertSchema.index({ userId: 1, createdAt: -1 });
riskAlertSchema.index({ type: 1, severity: 1, acknowledged: 1 });

const RiskAlert = mongoose.model('RiskAlert', riskAlertSchema);
export default RiskAlert;
