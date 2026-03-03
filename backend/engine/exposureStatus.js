/**
 * Real-time exposure status for admin dashboard.
 * liabilityByNumber[0–36], liabilityByBetType, exposure ratio, dynamic max bet.
 * Does not affect RNG — read-only aggregation.
 */

import { maxPayoutForBet } from './payout.js';
import { straightUpLiabilityByNumber } from './exposure.js';

/**
 * Build liability by number 0–36 for a set of bets (e.g. current spin or aggregated).
 */
export function liabilityByNumberFromBets(bets) {
    const byNumber = straightUpLiabilityByNumber(bets || []);
    const out = {};
    for (let i = 0; i <= 36; i++) {
        const stake = byNumber[i] ?? 0;
        out[i] = { stake, maxPayout: stake * 36 };
    }
    return out;
}

/**
 * Build liability by bet type for a set of bets.
 */
export function liabilityByBetTypeFromBets(bets) {
    const byType = {};
    for (const bet of bets || []) {
        const type = String(bet?.type || '').toLowerCase();
        if (!type) continue;
        const amount = Number(bet.amount) || 0;
        byType[type] = (byType[type] || 0) + amount;
    }
    const out = {};
    for (const [type, stake] of Object.entries(byType)) {
        const mult = type === 'number' ? 36 : 2;
        out[type] = { stake, maxPayout: stake * mult };
    }
    return out;
}

/**
 * Exposure ratio: currentMaxLiability / houseReserve. Healthy if < 1.
 */
export function exposureRatio(houseReserve, currentMaxLiability) {
    if (!houseReserve || houseReserve <= 0) return { ratio: 0, healthy: true };
    const ratio = currentMaxLiability / houseReserve;
    return { ratio, healthy: ratio <= 1 };
}

/**
 * Dynamic max bet scaling based on volatility (e.g. recent variance).
 * Returns multiplier for base riskFactor (e.g. 0.8 in high volatility).
 */
export function volatilityMaxBetMultiplier(recentVariance, threshold) {
    if (!recentVariance || !threshold) return 1;
    if (recentVariance > threshold) return Math.max(0.5, 1 - (recentVariance - threshold) / (threshold * 2));
    return 1;
}
