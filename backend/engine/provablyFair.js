/**
 * Provably Fair — deterministic outcome from seeds + nonce.
 * winningNumber = derived from HMAC_SHA256(serverSeed, clientSeed + nonce).
 * No win-first logic: number is uniquely determined by inputs; uniform distribution over 0–36.
 */

import crypto from 'crypto';

const NUM_OUTCOMES = 37; // 0–36

/**
 * Generate a cryptographically secure server seed (hex).
 */
export function generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash of server seed (pre-commit before gameplay). SHA256.
 */
export function hashServerSeed(serverSeed) {
    return crypto.createHash('sha256').update(serverSeed, 'utf8').digest('hex');
}

/**
 * Derive winning number 0–36 from HMAC_SHA256(serverSeed, clientSeed + nonce).
 * Uses rejection sampling on HMAC output for uniform distribution (no modulo bias).
 */
export function getWinningNumberFromSeeds(serverSeed, clientSeed, nonce) {
    const message = `${String(clientSeed)}:${String(nonce)}`;
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(message, 'utf8');
    const digest = hmac.digest();
    const maxVal32 = 2 ** 32;
    const limit = maxVal32 - (maxVal32 % NUM_OUTCOMES);
    let n = digest.readUInt32BE(0);
    while (n >= limit) {
        const extra = crypto.createHmac('sha256', serverSeed).update(message + ':' + n).digest();
        n = extra.readUInt32BE(0);
    }
    return n % NUM_OUTCOMES;
}

/**
 * Verify a spin: recompute number from seeds and compare.
 */
export function verifySpin(serverSeed, clientSeed, nonce, expectedWinningNumber) {
    const computed = getWinningNumberFromSeeds(serverSeed, clientSeed, nonce);
    return computed === expectedWinningNumber;
}
