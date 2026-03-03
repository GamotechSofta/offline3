/**
 * RNG statistical sanity check for certification support.
 * Chi-square goodness-of-fit for uniform distribution over 0–36.
 * NOT a substitute for full lab battery (Dieharder / NIST SP 800-22).
 * Run: node backend/scripts/rngStatisticalCheck.js [sampleSize]
 */

import { spin } from '../engine/wheel.js';

const SAMPLE_SIZE = parseInt(process.argv[2], 10) || 370_000; // 10k per bin expected
const NUM_BINS = 37;
const ALPHA = 0.01; // Reject uniformity if p-value < 0.01

function chiSquareUniform(counts, expected) {
    let chi2 = 0;
    for (let i = 0; i < counts.length; i++) {
        const d = counts[i] - expected;
        chi2 += (d * d) / expected;
    }
    return chi2;
}

// Approximate critical value for 36 df at alpha=0.01 (one-sided) ~ 58.6
function criticalValue(df, alpha) {
    const table = { 36: 58.6, 35: 57.3 };
    return table[df] ?? 55;
}

function run() {
    const counts = new Array(NUM_BINS).fill(0);
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const n = spin();
        counts[n]++;
    }
    const expected = SAMPLE_SIZE / NUM_BINS;
    const chi2 = chiSquareUniform(counts, expected);
    const df = NUM_BINS - 1;
    const critical = criticalValue(df, ALPHA);
    const pass = chi2 <= critical;

    console.log('=== RNG Statistical Check (uniform 0–36) ===');
    console.log('Sample size:', SAMPLE_SIZE);
    console.log('Expected per bin:', expected);
    console.log('Chi-square:', chi2.toFixed(4));
    console.log('Critical value (df=36, alpha=0.01):', critical);
    console.log('Result:', pass ? 'PASS' : 'FAIL');
    if (!pass) {
        console.log('Recommendation: Run full battery (e.g. Dieharder/NIST) on RNG output stream.');
    }
    process.exit(pass ? 0 : 1);
}

run();
