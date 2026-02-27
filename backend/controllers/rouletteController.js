import mongoose from 'mongoose';
import User from '../models/user/user.js';
import { Wallet, WalletTransaction } from '../models/wallet/wallet.js';
import RouletteGame from '../models/rouletteGame/rouletteGame.js';
import { generateSecureRandom, calculatePayout, validateBets } from '../utils/roulette.js';

const SPIN_COOLDOWN_MS = 2000;
const lastSpinByUser = new Map();

/**
 * POST /api/v1/roulette/spin
 * Body: { userId, bets: [{ type, value?, amount }] }
 * - Validates user (exists, isActive), bets, balance.
 * - Deducts totalBet from wallet, generates winning number, adds payout, updates user stats, saves game.
 */
export const spinRoulette = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, bets } = req.body || {};
        if (!userId) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const now = Date.now();
        const last = lastSpinByUser.get(userId);
        if (last != null && now - last < SPIN_COOLDOWN_MS) {
            await session.abortTransaction();
            return res.status(429).json({ success: false, message: 'Please wait a moment before spinning again' });
        }
        lastSpinByUser.set(userId, now);

        const validation = validateBets(bets);
        if (!validation.valid) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: validation.error });
        }

        const totalBet = bets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        if (totalBet <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Total bet must be greater than 0' });
        }

        const user = await User.findById(userId).session(session).select('isActive gamesPlayed gamesWon totalWagered totalWon biggestWin');
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.isActive === false) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Account is blocked' });
        }

        let wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0 });
        }
        if (wallet.balance < totalBet) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        wallet.balance -= totalBet;
        await wallet.save({ session });

        await WalletTransaction.create([{
            userId,
            type: 'debit',
            amount: totalBet,
            description: 'Roulette bet',
        }], { session });

        const winningNumber = generateSecureRandom();
        const payout = calculatePayout(bets, winningNumber);

        wallet.balance += payout;
        await wallet.save({ session });

        if (payout > 0) {
            await WalletTransaction.create([{
                userId,
                type: 'credit',
                amount: payout,
                description: 'Roulette win',
            }], { session });
        }

        user.gamesPlayed = (user.gamesPlayed || 0) + 1;
        user.totalWagered = (user.totalWagered || 0) + totalBet;
        if (payout > 0) {
            user.gamesWon = (user.gamesWon || 0) + 1;
            user.totalWon = (user.totalWon || 0) + payout;
            user.biggestWin = Math.max(user.biggestWin || 0, payout);
        }
        await user.save({ session });

        const profit = payout - totalBet;
        await RouletteGame.create([{
            user: userId,
            bets,
            winningNumber,
            totalBet,
            payout,
            profit,
        }], { session });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {
                winningNumber,
                payout,
                balance: wallet.balance,
                profit,
            },
        });
    } catch (err) {
        await session.abortTransaction().catch(() => {});
        res.status(500).json({ success: false, message: err.message || 'Spin failed' });
    } finally {
        session.endSession();
    }
};

/**
 * GET /api/v1/roulette/stats?userId=...
 * Returns roulette stats for the user.
 */
export const getRouletteStats = async (req, res) => {
    try {
        const userId = req.query.userId || req.body?.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const user = await User.findById(userId).select('gamesPlayed gamesWon totalWagered totalWon biggestWin').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const gamesPlayed = user.gamesPlayed || 0;
        const winRate = gamesPlayed > 0 ? ((user.gamesWon || 0) / gamesPlayed) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                gamesPlayed,
                gamesWon: user.gamesWon || 0,
                totalWagered: user.totalWagered || 0,
                totalWon: user.totalWon || 0,
                biggestWin: user.biggestWin || 0,
                winRate: Math.round(winRate * 100) / 100,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/roulette/history?userId=...&limit=10
 * Returns recent roulette games for the user.
 */
export const getRouletteHistory = async (req, res) => {
    try {
        const userId = req.query.userId || req.body?.userId;
        const limit = Math.min(Number(req.query.limit) || 10, 50);

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const games = await RouletteGame.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('winningNumber totalBet payout profit createdAt')
            .lean();

        res.status(200).json({ success: true, data: games });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
