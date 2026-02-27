import mongoose from 'mongoose';

const rouletteGameSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bets: [{
        type: { type: String, required: true }, // 'number' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'
        value: { type: mongoose.Schema.Types.Mixed }, // for 'number': 0-36
        amount: { type: Number, required: true, min: 0 },
    }],
    winningNumber: { type: Number, required: true, min: 0, max: 36 },
    totalBet: { type: Number, required: true, min: 0 },
    payout: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true }, // payout - totalBet (can be negative)
}, {
    timestamps: true,
});

const RouletteGame = mongoose.model('RouletteGame', rouletteGameSchema);
export default RouletteGame;
