import mongoose from 'mongoose';

/**
 * Responsible gaming limits and flags. Enforced before spin (middleware).
 * Never affects RNG — only allows/blocks the bet.
 */
const userResponsibleGamingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    /** Deposit limits (currency units) */
    depositLimitDaily: { type: Number, min: 0 },
    depositLimitWeekly: { type: Number, min: 0 },
    depositLimitMonthly: { type: Number, min: 0 },
    /** Loss limit (total loss in period) */
    lossLimitDaily: { type: Number, min: 0 },
    lossLimitWeekly: { type: Number, min: 0 },
    lossLimitMonthly: { type: Number, min: 0 },
    /** Session duration limit (minutes) */
    sessionDurationLimitMinutes: { type: Number, min: 0 },
    /** Cool-off: no play until this date */
    coolOffUntil: { type: Date },
    /** Self-exclusion: no play until this date */
    selfExcludedUntil: { type: Date },
    /** Forced logout after this many minutes of inactivity */
    sessionTimeoutMinutes: { type: Number, min: 0 },
    /** Rolling deposit/loss counters (reset by period); updated by wallet/spin */
    depositUsedToday: { type: Number, default: 0 },
    depositUsedWeekStart: { type: Date },
    depositUsedWeek: { type: Number, default: 0 },
    depositUsedMonthStart: { type: Date },
    depositUsedMonth: { type: Number, default: 0 },
    lossUsedToday: { type: Number, default: 0 },
    lossUsedWeekStart: { type: Date },
    lossUsedWeek: { type: Number, default: 0 },
    lossUsedMonthStart: { type: Date },
    lossUsedMonth: { type: Number, default: 0 },
    sessionStartedAt: { type: Date },
}, { timestamps: true });

const UserResponsibleGaming = mongoose.model('UserResponsibleGaming', userResponsibleGamingSchema);
export default UserResponsibleGaming;
