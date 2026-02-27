import crypto from 'crypto';

/** European roulette: 0-36. 0 is green; 1-36 alternate red/black (odd=red, even=black in standard layout). */
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

/**
 * Generate cryptographically secure random number 0-36 (inclusive).
 */
export function generateSecureRandom() {
    const buf = crypto.randomBytes(4);
    const n = buf.readUInt32BE(0);
    return n % 37;
}

/**
 * Check if a number 0-36 is red (0 is not red).
 */
export function isRed(n) {
    return n >= 1 && n <= 36 && RED_NUMBERS.includes(n);
}

/**
 * Calculate total payout for given bets and winning number.
 * Bets: [{ type, value?, amount }]
 * - type 'number', value 0-36: pays 35:1
 * - type 'red' | 'black': pays 1:1
 * - type 'odd' | 'even': 1-36 only, pays 1:1; 0 wins nothing
 * - type 'low' (1-18) | 'high' (19-36): pays 1:1; 0 wins nothing
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
            if (num === winningNumber) total += amount * 36; // 35:1 + stake
            continue;
        }
        if (type === 'red') {
            if (isRed(winningNumber)) total += amount * 2;
            continue;
        }
        if (type === 'black') {
            if (winningNumber >= 1 && winningNumber <= 36 && !isRed(winningNumber)) total += amount * 2;
            continue;
        }
        if (type === 'odd') {
            if (winningNumber >= 1 && winningNumber % 2 === 1) total += amount * 2;
            continue;
        }
        if (type === 'even') {
            if (winningNumber >= 1 && winningNumber % 2 === 0) total += amount * 2;
            continue;
        }
        if (type === 'low') {
            if (winningNumber >= 1 && winningNumber <= 18) total += amount * 2;
            continue;
        }
        if (type === 'high') {
            if (winningNumber >= 19 && winningNumber <= 36) total += amount * 2;
            continue;
        }
    }
    return total;
}

/**
 * Validate bets array: types and amounts. Returns { valid: boolean, error?: string }.
 */
export function validateBets(bets) {
    if (!Array.isArray(bets) || bets.length === 0) {
        return { valid: false, error: 'At least one bet is required' };
    }
    const allowedTypes = ['number', 'red', 'black', 'odd', 'even', 'low', 'high'];
    for (let i = 0; i < bets.length; i++) {
        const b = bets[i];
        const type = String(b?.type || '').toLowerCase();
        if (!allowedTypes.includes(type)) {
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
