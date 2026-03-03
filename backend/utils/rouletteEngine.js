/**
 * Professional Roulette Game Engine
 * - Base win rate configurable (~30% or higher for target RTP 85–92%)
 * - Dynamic risk: reduce prob when bet > 5% bankroll, on win streak; increase after loss streak
 * - Exposure control: keep RTP in band by adjusting probability
 * - Secure PRNG; no hard-forced losses by bet size
 * - Probability clamped between 5% and 60%
 */

import crypto from 'crypto';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const EVEN_MONEY_TYPES = ['red', 'black', 'odd', 'even', 'low', 'high'];

/** Secure random [0, 1) */
function secureRandom() {
    const buf = crypto.randomBytes(8);
    const n = buf.readBigUInt64BE(0);
    return Number(n) / (2 ** 64);
}

/** Secure random integer in [min, max] inclusive */
function secureInt(min, max) {
    const range = max - min + 1;
    const buf = crypto.randomBytes(4);
    const n = buf.readUInt32BE(0);
    return min + (n % range);
}

function isRed(n) {
    return n >= 1 && n <= 36 && RED_NUMBERS.includes(n);
}

/** Check if bets include any even-money type (red/black/odd/even/low/high) */
export function hasEvenMoneyBets(bets) {
    if (!Array.isArray(bets) || bets.length === 0) return false;
    return bets.some((b) => EVEN_MONEY_TYPES.includes(String(b?.type || '').toLowerCase()));
}

/**
 * Risk score model:
 * - When bet > threshold % of bankroll: reduce win probability (no hard force, just slight reduction)
 * - Win streak: reduce probability (avoid runaway wins)
 * - Loss streak: increase probability (soft retention)
 * Returns a modifier to add to base probability (can be negative).
 */
export function getRiskModifier(state, config) {
    const {
        betPctBankrollThreshold = 0.05,
        betSizeReduction = 0.02,
        winStreakReductionPerWin = 0.01,
        lossStreakIncreasePerLoss = 0.008,
        maxWinStreakCounted = 5,
        maxLossStreakCounted = 10,
    } = config || {};

    let mod = 0;

    if (state.bankroll > 0 && state.betAmount > 0) {
        const pct = state.betAmount / state.bankroll;
        if (pct > betPctBankrollThreshold) {
            const excess = Math.min(1, (pct - betPctBankrollThreshold) / betPctBankrollThreshold);
            mod -= betSizeReduction * excess;
        }
    }

    const winStreak = Math.min(state.winStreak ?? 0, maxWinStreakCounted);
    mod -= winStreak * winStreakReductionPerWin;

    const lossStreak = Math.min(state.lossStreak ?? 0, maxLossStreakCounted);
    mod += lossStreak * lossStreakIncreasePerLoss;

    return mod;
}

/**
 * RTP exposure control: adjust probability so RTP stays in [rtpMin, rtpMax].
 * - If current RTP > rtpMax: reduce win probability
 * - If current RTP < rtpMin: increase win probability
 */
export function getRTPModifier(globalStats, config) {
    const {
        rtpMin = 0.85,
        rtpMax = 0.92,
        rtpOverTargetStep = 0.005,
        rtpUnderTargetStep = 0.005,
        minSpinsForRtpControl = 100,
    } = config || {};

    const totalWagered = globalStats.totalWagered ?? 0;
    const totalPaid = globalStats.totalPaid ?? 0;
    const spinCount = globalStats.spinCount ?? 0;

    if (spinCount < minSpinsForRtpControl || totalWagered <= 0) return 0;

    const currentRTP = totalPaid / totalWagered;

    if (currentRTP > rtpMax) return -rtpOverTargetStep;
    if (currentRTP < rtpMin) return rtpUnderTargetStep;
    return 0;
}

/**
 * Compute final win probability for even-money resolution.
 * Formula: P = clamp(baseWinRate + riskMod + rtpMod, probMin, probMax)
 */
export function computeWinProbability(baseWinRate, riskMod, rtpMod, config) {
    const probMin = config?.probMin ?? 0.05;
    const probMax = config?.probMax ?? 0.60;
    let p = (baseWinRate ?? 0.43) + (riskMod ?? 0) + (rtpMod ?? 0);
    return Math.max(probMin, Math.min(probMax, p));
}

/**
 * Decide win/loss for this spin using secure random and target probability.
 * Returns true if player wins (for even-money), false otherwise.
 */
export function decideOutcome(winProbability) {
    return secureRandom() < winProbability;
}

/**
 * Resolve winning number 0–36 given desired outcome for even-money bets.
 * - If playerWins: pick a number that satisfies at least one of the player's even-money bets.
 * - If playerLoses: pick a number that satisfies none (or 0).
 * Bets are [{ type, value?, amount }]. We only consider even-money types here.
 */
export function resolveWinningNumber(bets, playerWins) {
    const types = (bets || [])
        .map((b) => String(b?.type || '').toLowerCase())
        .filter((t) => EVEN_MONEY_TYPES.includes(t));

    if (types.length === 0) {
        return secureInt(0, 36);
    }

    if (playerWins) {
        const set = numbersThatSatisfyAny(types);
        const arr = Array.from(set);
        return arr[secureInt(0, arr.length - 1)];
    }

    const loseSet = numbersThatLoseAll(types);
    const arr = Array.from(loseSet);
    return arr.length ? arr[secureInt(0, arr.length - 1)] : 0;
}

function numbersThatSatisfyAny(types) {
    const set = new Set();
    for (let n = 0; n <= 36; n++) {
        if (types.some((t) => satisfies(n, t))) set.add(n);
    }
    return set;
}

function numbersThatLoseAll(types) {
    const set = new Set();
    for (let n = 0; n <= 36; n++) {
        if (!types.some((t) => satisfies(n, t))) set.add(n);
    }
    return set;
}

function satisfies(n, type) {
    if (type === 'red') return isRed(n);
    if (type === 'black') return n >= 1 && n <= 36 && !isRed(n);
    if (type === 'odd') return n >= 1 && n % 2 === 1;
    if (type === 'even') return n >= 1 && n % 2 === 0;
    if (type === 'low') return n >= 1 && n <= 18;
    if (type === 'high') return n >= 19 && n <= 36;
    return false;
}

/**
 * Get streaks from recent game results (profit > 0 = win, profit < 0 = loss).
 * Returns { winStreak, lossStreak }.
 */
export function getStreaksFromHistory(recentGames) {
    let winStreak = 0;
    let lossStreak = 0;
    for (const g of recentGames || []) {
        const profit = g.profit ?? (g.payout - g.totalBet);
        if (profit > 0) {
            if (lossStreak > 0) break;
            winStreak++;
        } else {
            if (winStreak > 0) break;
            lossStreak++;
        }
    }
    return { winStreak, lossStreak };
}

/**
 * Full engine step: given config, player state, global stats, and bets,
 * returns { winningNumber, payout, winProbability, riskMod, rtpMod, audit }.
 * For even-money-only bets we use controlled probability; for straight number only we use fair 1/37.
 */
export function runEngineStep(config, playerState, globalStats, bets, calculatePayout) {
    const hasEven = hasEvenMoneyBets(bets);
    let winningNumber;
    let winProbability = null;
    let riskMod = null;
    let rtpMod = null;

    if (hasEven) {
        riskMod = getRiskModifier(playerState, config);
        rtpMod = getRTPModifier(globalStats, config);
        winProbability = computeWinProbability(config.baseWinRate, riskMod, rtpMod, config);
        const playerWins = decideOutcome(winProbability);
        winningNumber = resolveWinningNumber(bets, playerWins);
    } else {
        winningNumber = secureInt(0, 36);
    }

    const payout = calculatePayout(bets, winningNumber);

    return {
        winningNumber,
        payout,
        winProbability,
        riskMod,
        rtpMod,
        audit: {
            hasEvenMoneyBets: hasEven,
            bankroll: playerState.bankroll,
            betAmount: playerState.betAmount,
            winStreak: playerState.winStreak,
            lossStreak: playerState.lossStreak,
            totalWagered: globalStats.totalWagered,
            totalPaid: globalStats.totalPaid,
            spinCount: globalStats.spinCount,
        },
    };
}

export { secureRandom, secureInt, isRed };
