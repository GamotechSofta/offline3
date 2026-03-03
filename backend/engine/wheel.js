/**
 * Pure RNG layer — European roulette wheel (0–36).
 * No win/loss logic. No Math.random. Statistically correct uniform distribution.
 */

import crypto from 'crypto';

/**
 * Cryptographically secure integer in [min, max] inclusive.
 * Uses rejection sampling for uniform distribution (no modulo bias).
 */
export function secureInt(min, max) {
    const range = max - min + 1;
    const buf = crypto.randomBytes(4);
    const maxVal = 2 ** 32;
    const limit = maxVal - (maxVal % range);
    let n = buf.readUInt32BE(0);
    while (n >= limit) {
        const b = crypto.randomBytes(4);
        n = b.readUInt32BE(0);
    }
    return min + (n % range);
}

/**
 * Spin the wheel — returns winning number 0–36 with uniform probability 1/37.
 * Flow: Spin → number is determined by RNG only → no outcome steering.
 */
export function spin() {
    return secureInt(0, 36);
}
