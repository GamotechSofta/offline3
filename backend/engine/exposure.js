/**
 * Exposure and risk control layer.
 * All risk is enforced at bet validation / pre-spin. No probability steering.
 * - Max payout per spin vs house reserve
 * - Table liability cap
 * - Kelly-based exposure cap (optional)
 * - Per-number straight-up liability
 * - Per-bet-type max limits
 */

import { maxPayoutForBets } from './payout.js';

/**
 * Check if potential payout for this spin is within house risk tolerance.
 * Reject bet if maxPayout > houseBankroll * riskFactor.
 */
export function checkMaxPayoutPerSpin(bets, houseBankroll, riskFactor) {
    const maxPayout = maxPayoutForBets(bets);
    const limit = (houseBankroll ?? 0) * (riskFactor ?? 0.1);
    if (limit <= 0) return { allowed: true };
    return {
        allowed: maxPayout <= limit,
        maxPayout,
        limit,
        error: maxPayout > limit ? `Max payout ${maxPayout} exceeds spin limit ${limit}` : null,
    };
}

/**
 * Table-level liability: max total payout that could be outstanding (e.g. open spins).
 * Here we only check this spin's max payout; for multi-table you'd sum pending.
 */
export function checkTableLiability(maxPayoutThisSpin, currentTableLiability, tableLiabilityCap) {
    const cap = tableLiabilityCap ?? Number.MAX_SAFE_INTEGER;
    const after = (currentTableLiability ?? 0) + maxPayoutThisSpin;
    return {
        allowed: after <= cap,
        liabilityAfter: after,
        cap,
        error: after > cap ? `Table liability ${after} would exceed cap ${cap}` : null,
    };
}

/**
 * Straight-up number risk: aggregate stake per number for this bet slip.
 * Used to cap exposure on any single number (35:1).
 */
export function straightUpLiabilityByNumber(bets) {
    const byNumber = new Map();
    for (const bet of bets || []) {
        if (String(bet?.type || '').toLowerCase() !== 'number') continue;
        const n = Number(bet.value);
        if (!Number.isInteger(n) || n < 0 || n > 36) continue;
        const amount = Number(bet.amount) || 0;
        byNumber.set(n, (byNumber.get(n) || 0) + amount);
    }
    return Object.fromEntries(byNumber);
}

/**
 * Check per-number straight-up liability does not exceed max per number.
 */
export function checkStraightUpPerNumber(bets, maxPerNumber) {
    if (maxPerNumber == null || maxPerNumber <= 0) return { allowed: true };
    const byNumber = straightUpLiabilityByNumber(bets);
    for (const [num, stake] of Object.entries(byNumber)) {
        const maxPayout = stake * 36;
        if (maxPayout > maxPerNumber) {
            return {
                allowed: false,
                error: `Straight-up liability on number ${num} (${maxPayout}) exceeds max ${maxPerNumber}`,
            };
        }
    }
    return { allowed: true };
}

/**
 * Per-bet-type max stake (e.g. max 1000 on straight-up, 5000 on red/black).
 */
export function checkPerBetTypeLimits(bets, limits) {
    if (!limits || typeof limits !== 'object') return { allowed: true };
    for (let i = 0; i < (bets || []).length; i++) {
        const b = bets[i];
        const type = String(b?.type || '').toLowerCase();
        const amount = Number(b?.amount) || 0;
        const cap = limits[type];
        if (cap != null && amount > cap) {
            return {
                allowed: false,
                error: `Bet amount ${amount} for type "${type}" exceeds limit ${cap}`,
            };
        }
    }
    return { allowed: true };
}

/**
 * Kelly-based exposure cap: max total stake per spin as fraction of house bankroll.
 * Prevents single spin from risking too much of house reserve.
 */
export function checkKellyExposure(maxPayoutThisSpin, totalStakeThisSpin, houseBankroll, kellyFraction) {
    if (kellyFraction == null || kellyFraction <= 0 || houseBankroll <= 0) return { allowed: true };
    const cap = houseBankroll * kellyFraction;
    const allowed = totalStakeThisSpin <= cap;
    return {
        allowed,
        stake: totalStakeThisSpin,
        cap,
        error: allowed ? null : `Total stake ${totalStakeThisSpin} exceeds exposure cap ${cap}`,
    };
}

/**
 * Run all exposure checks. Returns { allowed: boolean, errors: string[] }.
 */
export function runExposureChecks(bets, context) {
    const errors = [];
    const totalStake = (bets || []).reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const maxPayout = maxPayoutForBets(bets);

    const {
        houseBankroll,
        riskFactor = 0.1,
        tableLiabilityCap,
        currentTableLiability = 0,
        maxStraightUpPerNumber,
        perBetTypeLimits,
        kellyFraction,
    } = context || {};

    const r1 = checkMaxPayoutPerSpin(bets, houseBankroll, riskFactor);
    if (!r1.allowed) errors.push(r1.error);

    const r2 = checkTableLiability(maxPayout, currentTableLiability, tableLiabilityCap);
    if (!r2.allowed) errors.push(r2.error);

    const r3 = checkStraightUpPerNumber(bets, maxStraightUpPerNumber);
    if (!r3.allowed) errors.push(r3.error);

    const r4 = checkPerBetTypeLimits(bets, perBetTypeLimits);
    if (!r4.allowed) errors.push(r4.error);

    const r5 = checkKellyExposure(maxPayout, totalStake, houseBankroll, kellyFraction);
    if (!r5.allowed) errors.push(r5.error);

    return {
        allowed: errors.length === 0,
        errors,
    };
}

/**
 * House reserve health: ratio of current reserve to recommended minimum.
 * reserve = houseBankroll (or totalWagered - totalPaid). Recommended min = some fraction of max single-spin exposure.
 */
export function houseReserveHealth(houseBankroll, totalWagered, totalPaid, minReserveRecommended) {
    const reserve = houseBankroll ?? (totalWagered - totalPaid);
    const minRec = minReserveRecommended ?? 0;
    if (minRec <= 0) return { healthy: true, ratio: 1 };
    const ratio = reserve / minRec;
    return { healthy: ratio >= 1, ratio, reserve, minRecommended: minRec };
}
