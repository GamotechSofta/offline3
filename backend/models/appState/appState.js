import mongoose from 'mongoose';

/**
 * Simple key-value store for app-level state that must survive server restarts.
 * Used to persist things like lastResultResetDate so midnight reset doesn't
 * accidentally re-run after a server restart on the same day.
 */
const appStateSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: String,
        default: null,
    },
}, { timestamps: true });

const AppState = mongoose.model('AppState', appStateSchema);
export default AppState;
