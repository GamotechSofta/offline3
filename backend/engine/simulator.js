/**
 * Monte Carlo simulator — pure European wheel + payout math.
 * No probability steering. Validates RTP, house edge, uniformity of 0–36.
 */

import { spin } from './wheel.js';
import { calculatePayout } from './payout.js';

/**
 * Run N spins with given bet pattern. Returns raw results for aggregation.
 */
export function runSpins(n, getBetsForSpin) {
    const results = [];
    const numberCounts = new Array(37).fill(0);
    for (let i = 0; i < n; i++) {
        const bets = getBetsForSpin(i);
        const winningNumber = spin();
        numberCounts[winningNumber]++;
        const payout = calculatePayout(bets, winningNumber);
        const totalBet = bets.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        results.push({
            winningNumber,
            totalBet,
            payout,
            profit: payout - totalBet,
        });
    }
    return { results, numberCounts };
}

/**
 * Aggregate stats: RTP, house edge, std dev, max drawdown, number distribution, even-money win rate.
 */
export function aggregateStats(results, numberCounts, totalSpins) {
    const totalWagered = results.reduce((s, r) => s + r.totalBet, 0);
    const totalPaid = results.reduce((s, r) => s + r.payout, 0);
    const rtp = totalWagered > 0 ? totalPaid / totalWagered : 0;
    const houseEdge = 1 - rtp;

    const profits = results.map((r) => r.profit);
    const meanProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const variance = profits.reduce((s, p) => s + (p - meanProfit) ** 2, 0) / profits.length;
    const stdDev = Math.sqrt(variance);

    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;
    for (const p of profits) {
        running += p;
        if (running > peak) peak = running;
        const dd = peak - running;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const expectedFreq = totalSpins / 37;
    const distribution = numberCounts.map((count, num) => ({
        number: num,
        count,
        frequency: count / totalSpins,
        expectedFrequency: 1 / 37,
        deviation: (count - expectedFreq) / (expectedFreq || 1),
    }));

    const evenMoneyWins = results.filter((r) => r.totalBet > 0 && r.payout >= r.totalBet * 2);
    const evenMoneyWinRate = results.length > 0
        ? evenMoneyWins.length / results.length
        : 0;
    const theoreticalEvenMoneyWinRate = 18 / 37;

    return {
        totalSpins,
        totalWagered,
        totalPaid,
        houseProfit: totalWagered - totalPaid,
        rtp: Math.round(rtp * 10000) / 10000,
        rtpPct: Math.round(rtp * 10000) / 100,
        houseEdge: Math.round(houseEdge * 10000) / 10000,
        houseEdgePct: Math.round(houseEdge * 10000) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        numberDistribution: distribution,
        evenMoneyWinRate: Math.round(evenMoneyWinRate * 10000) / 10000,
        theoreticalEvenMoneyWinRate: Math.round(theoreticalEvenMoneyWinRate * 10000) / 10000,
    };
}

/**
 * Full Monte Carlo run: N spins, single bet type (e.g. 100 on red each spin).
 */
export function runMonteCarlo(n, betPerSpin = 100, betType = 'red') {
    const getBetsForSpin = () => [{ type: betType, amount: betPerSpin }];
    const { results, numberCounts } = runSpins(n, getBetsForSpin);
    return aggregateStats(results, numberCounts, n);
}
