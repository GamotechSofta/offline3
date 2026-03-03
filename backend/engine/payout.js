/**
 * Payout math layer — European roulette paytable.
 * Pure functions: number in, payout out. No RNG, no state.
 */

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const BET_TYPES = ['number', 'red', 'black', 'odd', 'even', 'low', 'high'];

/** Even-money multiplier (1:1 = 2x including stake) */
const EVEN_MONEY_MULT = 2;
/** Straight-up multiplier (35:1 + stake = 36x) */
const STRAIGHT_UP_MULT = 36;

export function isRed(n) {
    return n >= 1 && n <= 36 && RED_NUMBERS.includes(n);
}

/**
 * Calculate total payout for given bets and winning number.
 * Bets: [{ type, value?, amount }]
 */
export function calculatePayout(bets, winningNumber) {
    if (!Array.isArray(bets) || bets.length === 0) return 0;
    let total = 0;
    for (const bet of bets) {
        const amount = Number(bet.amount) || 0;
        if (amount <= 0) continue;
        const type = String(bet.type || '').toLowerCase();
        if (type === 'number') {
            const num = Number(bet.value);
            if (num === winningNumber) total += amount * STRAIGHT_UP_MULT;
            continue;
        }
        if (type === 'red') {
            if (isRed(winningNumber)) total += amount * EVEN_MONEY_MULT;
            continue;
        }
        if (type === 'black') {
            if (winningNumber >= 1 && winningNumber <= 36 && !isRed(winningNumber)) total += amount * EVEN_MONEY_MULT;
            continue;
        }
        if (type === 'odd') {
            if (winningNumber >= 1 && winningNumber % 2 === 1) total += amount * EVEN_MONEY_MULT;
            continue;
        }
        if (type === 'even') {
            if (winningNumber >= 1 && winningNumber % 2 === 0) total += amount * EVEN_MONEY_MULT;
            continue;
        }
        if (type === 'low') {
            if (winningNumber >= 1 && winningNumber <= 18) total += amount * EVEN_MONEY_MULT;
            continue;
        }
        if (type === 'high') {
            if (winningNumber >= 19 && winningNumber <= 36) total += amount * EVEN_MONEY_MULT;
            continue;
        }
    }
    return total;
}

/**
 * Maximum possible payout for a bet (for exposure). Straight-up = 36x, even-money = 2x.
 */
export function maxPayoutForBet(bet) {
    const amount = Number(bet.amount) || 0;
    if (amount <= 0) return 0;
    const type = String(bet.type || '').toLowerCase();
    if (type === 'number') return amount * STRAIGHT_UP_MULT;
    if (BET_TYPES.slice(1).includes(type)) return amount * EVEN_MONEY_MULT;
    return 0;
}

/**
 * Total max payout for all bets (sum of individual max payouts).
 */
export function maxPayoutForBets(bets) {
    if (!Array.isArray(bets)) return 0;
    return bets.reduce((sum, b) => sum + maxPayoutForBet(b), 0);
}

/**
 * Validate bets: types and amounts. Returns { valid: boolean, error?: string }.
 */
export function validateBets(bets) {
    if (!Array.isArray(bets) || bets.length === 0) {
        return { valid: false, error: 'At least one bet is required' };
    }
    for (let i = 0; i < bets.length; i++) {
        const b = bets[i];
        const type = String(b?.type || '').toLowerCase();
        if (!BET_TYPES.includes(type)) {
            return { valid: false, error: `Invalid bet type "${b?.type}" at index ${i}` };
        }
        if (type === 'number') {
            const v = Number(b?.value);
            if (!Number.isInteger(v) || v < 0 || v > 36) {
                return { valid: false, error: `Invalid number bet value (0-36) at index ${i}` };
            }
        }
        const amount = Number(b?.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return { valid: false, error: `Invalid or zero amount at index ${i}` };
        }
    }
    return { valid: true };
}
