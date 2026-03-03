/**
 * Monte Carlo roulette simulation — pure European wheel (no probability steering).
 * Run: node scripts/rouletteSimulation.js [spins]
 * Output: RTP, house edge, std dev, max drawdown, number distribution.
 */

import { runMonteCarlo } from '../engine/simulator.js';

const SPINS = Math.min(Math.max(parseInt(process.argv[2], 10) || 100000, 1000), 2000000);

function run() {
    const result = runMonteCarlo(SPINS, 100, 'red');
    console.log('=== Roulette Monte Carlo (pure European wheel) ===');
    console.log('Spins:', result.totalSpins.toLocaleString());
    console.log('Total wagered:', result.totalWagered.toLocaleString());
    console.log('Total paid:', result.totalPaid.toLocaleString());
    console.log('RTP %:', result.rtpPct);
    console.log('House edge %:', result.houseEdgePct);
    console.log('House profit:', result.houseProfit.toLocaleString());
    console.log('Std deviation:', result.stdDev);
    console.log('Max drawdown:', result.maxDrawdown);
    console.log('Even-money win rate:', (result.evenMoneyWinRate * 100).toFixed(2) + '% (theoretical 48.65%)');
    console.log('\nNumber frequency (0–36):');
    result.numberDistribution.forEach((d) => {
        console.log(`  ${d.number}: ${(d.frequency * 100).toFixed(2)}% (expected ${(d.expectedFrequency * 100).toFixed(2)}%)`);
    });
}

run();
