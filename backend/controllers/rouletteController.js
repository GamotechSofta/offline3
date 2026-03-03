/**
 * Roulette controller — thin layer. Spin delegated to spinService.
 * No probability steering. Proof, exposure, system-health, audit export.
 */

import User from '../models/user/user.js';
import RouletteGame from '../models/rouletteGame/rouletteGame.js';
import RouletteStats from '../models/rouletteGame/RouletteStats.js';
import RouletteConfig from '../models/rouletteGame/rouletteConfig.js';
import RouletteSeedCycle from '../models/rouletteGame/RouletteSeedCycle.js';
import HouseReserve from '../models/rouletteGame/HouseReserve.js';
import RouletteAuditLog from '../models/rouletteGame/RouletteAuditLog.js';
import { executeSpin } from '../services/spinService.js';
import { runMonteCarlo } from '../engine/simulator.js';
import { exposureRatio } from '../engine/exposureStatus.js';
import { runLiquidityStressTest } from '../services/liquiditySimulator.js';
import { verifySpin } from '../engine/provablyFair.js';

/**
 * POST /api/v1/roulette/spin
 * Body: { userId, bets: [{ type, value?, amount }], idempotencyKey? }
 */
export const spinRoulette = async (req, res) => {
    try {
        const result = await executeSpin(req.body);
        if (!result.success) {
            const status = result.code === 'RATE_LIMIT' ? 429 : 400;
            return res.status(status).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Spin failed' });
    }
};

/**
 * GET /api/v1/roulette/stats?userId=...
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
        return res.status(200).json({
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
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/roulette/history?userId=...&limit=10
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
            .select('winningNumber totalBet payout profit createdAt spinDataHash')
            .lean();
        return res.status(200).json({ success: true, data: games });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/roulette/config (admin)
 */
export const getRouletteConfig = async (req, res) => {
    try {
        const config = await RouletteConfig.getConfig();
        return res.status(200).json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PATCH /api/v1/roulette/config (super admin)
 * Body: { houseReserve?, riskFactor?, tableLiabilityCap?, maxStraightUpPerNumber?, perBetTypeLimits?, kellyFraction? }
 */
export const updateRouletteConfig = async (req, res) => {
    try {
        const config = await RouletteConfig.updateConfig(req.body || {});
        return res.status(200).json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/roulette/global-stats (admin)
 * From RouletteStats; fallback to RouletteGame aggregate if stats empty.
 */
export const getRouletteGlobalStats = async (req, res) => {
    try {
        let stats = await RouletteStats.getStats();
        if ((stats.spinCount ?? 0) === 0) {
            const [agg] = await RouletteGame.aggregate([
                { $group: { _id: null, totalWagered: { $sum: '$totalBet' }, totalPaid: { $sum: '$payout' }, spinCount: { $sum: 1 } } },
            ]);
            if (agg) {
                stats = {
                    totalWagered: agg.totalWagered,
                    totalPaid: agg.totalPaid,
                    spinCount: agg.spinCount,
                    houseProfit: agg.totalWagered - agg.totalPaid,
                    rtp: agg.totalWagered > 0 ? agg.totalPaid / agg.totalWagered : 0,
                };
            }
        }
        return res.status(200).json({
            success: true,
            data: {
                totalWagered: stats.totalWagered ?? 0,
                totalPaid: stats.totalPaid ?? 0,
                houseProfit: (stats.totalWagered ?? 0) - (stats.totalPaid ?? 0),
                spinCount: stats.spinCount ?? 0,
                rtp: stats.rtp != null ? Math.round(stats.rtp * 10000) / 10000 : 0,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/v1/roulette/monte-carlo (admin)
 * Body: { spins?: 1000000 } — default 1M. Pure European wheel. No steering.
 * Output: RTP %, house edge %, std dev, max drawdown, number distribution, even-money win rate.
 */
export const runMonteCarloSimulation = async (req, res) => {
    try {
        const spins = Math.min(Math.max(Number(req.body?.spins) || 1000000, 10000), 2000000);
        const betPerSpin = Number(req.body?.betPerSpin) || 100;
        const betType = req.body?.betType || 'red';
        const result = runMonteCarlo(spins, betPerSpin, betType);
        return res.status(200).json({
            success: true,
            data: {
                spins: result.totalSpins,
                totalWagered: result.totalWagered,
                totalPaid: result.totalPaid,
                houseProfit: result.houseProfit,
                rtpPct: result.rtpPct,
                houseEdgePct: result.houseEdgePct,
                stdDev: result.stdDev,
                maxDrawdown: result.maxDrawdown,
                numberDistribution: result.numberDistribution,
                evenMoneyWinRate: result.evenMoneyWinRate,
                theoreticalEvenMoneyWinRate: result.theoreticalEvenMoneyWinRate,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/roulette/analytics (admin)
 * Aggregation pipeline: optional date range, number frequency, RTP over time buckets.
 */
export const getRouletteAnalytics = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;
        const match = {};
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = from;
            if (to) match.createdAt.$lte = to;
        }
        const pipeline = [
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            {
                $group: {
                    _id: null,
                    totalWagered: { $sum: '$totalBet' },
                    totalPaid: { $sum: '$payout' },
                    spinCount: { $sum: 1 },
                },
            },
        ];
        const [agg] = await RouletteGame.aggregate(pipeline);
        const totalWagered = agg?.totalWagered ?? 0;
        const totalPaid = agg?.totalPaid ?? 0;
        const spinCount = agg?.spinCount ?? 0;
        const rtp = totalWagered > 0 ? totalPaid / totalWagered : 0;

        const numberPipeline = [
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            { $group: { _id: '$winningNumber', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ];
        const numberFreq = await RouletteGame.aggregate(numberPipeline);

        return res.status(200).json({
            success: true,
            data: {
                totalWagered,
                totalPaid,
                spinCount,
                houseProfit: totalWagered - totalPaid,
                rtp: Math.round(rtp * 10000) / 10000,
                numberFrequency: numberFreq,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /roulette/proof/:spinId — Provably fair verification data.
 */
export const getRouletteProof = async (req, res) => {
    try {
        const { spinId } = req.params;
        const game = await RouletteGame.findOne({ spinId }).lean();
        if (!game) {
            return res.status(404).json({ success: false, message: 'Spin not found' });
        }
        let serverSeed = null;
        if (game.serverSeedHash) {
            const cycle = await RouletteSeedCycle.findOne({
                gameId: 'roulette',
                serverSeedHash: game.serverSeedHash,
                revealedAt: { $ne: null },
            }).lean();
            if (cycle) serverSeed = cycle.serverSeed;
        }
        const verified = serverSeed && game.clientSeed != null && game.nonce != null
            ? verifySpin(serverSeed, game.clientSeed, game.nonce, game.winningNumber)
            : null;
        return res.status(200).json({
            success: true,
            data: {
                spinId: game.spinId,
                winningNumber: game.winningNumber,
                clientSeed: game.clientSeed,
                nonce: game.nonce,
                serverSeedHash: game.serverSeedHash,
                serverSeedRevealed: serverSeed,
                verified,
                totalBet: game.totalBet,
                payout: game.payout,
                spinDataHash: game.spinDataHash,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /roulette/exposure-status (admin) — Real-time exposure dashboard.
 */
export const getRouletteExposureStatus = async (req, res) => {
    try {
        const config = await RouletteConfig.getConfig();
        const reserve = await HouseReserve.getReserve();
        const stats = await RouletteStats.getStats();
        const houseReserve = reserve?.balance ?? config?.houseReserve ?? 0;
        const maxSingleSpinPayout = houseReserve * (config?.riskFactor ?? 0.1);
        const liabilityByNumber = {};
        for (let i = 0; i <= 36; i++) {
            liabilityByNumber[i] = { maxAllowed: Math.floor(maxSingleSpinPayout / 36) };
        }
        const liabilityByBetType = {
            number: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 36) },
            red: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
            black: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
            odd: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
            even: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
            low: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
            high: { maxStakeRecommended: Math.floor(maxSingleSpinPayout / 2) },
        };
        const { ratio, healthy } = exposureRatio(houseReserve, maxSingleSpinPayout);
        return res.status(200).json({
            success: true,
            data: {
                houseReserve,
                totalWagered: stats?.totalWagered ?? 0,
                totalPaid: stats?.totalPaid ?? 0,
                exposureRatio: Math.round(ratio * 10000) / 10000,
                exposureHealthy: healthy,
                liabilityByNumber,
                liabilityByBetType,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /roulette/system-health (admin) — Operational monitoring.
 */
export const getRouletteSystemHealth = async (req, res) => {
    try {
        const [reserve, stats, config] = await Promise.all([
            HouseReserve.getReserve(),
            RouletteStats.getStats(),
            RouletteConfig.getConfig(),
        ]);
        const houseReserve = reserve?.balance ?? 0;
        const totalWagered = stats?.totalWagered ?? 0;
        const totalPaid = stats?.totalPaid ?? 0;
        const rtp = totalWagered > 0 ? totalPaid / totalWagered : 0;
        const theoreticalRtp = 36 / 37;
        const rtpDeviation = Math.abs(rtp - theoreticalRtp);
        const spinCount = stats?.spinCount ?? 0;
        return res.status(200).json({
            success: true,
            data: {
                houseReserve,
                exposureRatio: houseReserve > 0 ? (totalWagered * 0.1) / houseReserve : 0,
                rtp: Math.round(rtp * 10000) / 10000,
                theoreticalRtp: Math.round(theoreticalRtp * 10000) / 10000,
                rtpDeviation: Math.round(rtpDeviation * 10000) / 10000,
                spinCount,
                activeUsers: null,
                spinRate: null,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /roulette/audit-export?from=ISO&to=ISO (admin) — CSV for regulator.
 */
export const exportRouletteAuditLog = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : new Date(0);
        const to = req.query.to ? new Date(req.query.to) : new Date();
        const logs = await RouletteAuditLog.find({
            timestamp: { $gte: from, $lte: to },
        }).sort({ sequenceId: 1 }).lean();
        const headers = 'sequenceId,spinId,previousRecordHash,recordHash,timestamp,payloadHash,userId,totalBet,payout,winningNumber';
        const rows = logs.map((l) => [
            l.sequenceId,
            l.spinId,
            l.previousRecordHash,
            l.recordHash,
            l.timestamp?.toISOString?.() ?? '',
            l.payloadHash,
            l.payload?.userId ?? '',
            l.payload?.totalBet ?? '',
            l.payload?.payout ?? '',
            l.payload?.winningNumber ?? '',
        ].join(','));
        const csv = [headers, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=roulette_audit_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`);
        return res.send(csv);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /roulette/liquidity-stress (admin) — Monte Carlo stress test.
 */
export const runLiquidityStress = async (req, res) => {
    try {
        const result = runLiquidityStressTest({
            days: Number(req.body?.days) || 30,
            spinsPerDay: Number(req.body?.spinsPerDay) || 10000,
            houseReserveStart: Number(req.body?.houseReserveStart) || 10_000_000,
        });
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
