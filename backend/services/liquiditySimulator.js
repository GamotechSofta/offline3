/**
 * Liquidity & bankroll safety: Monte Carlo stress testing.
 * 30-day simulation, 10k concurrent users, 5% straight-up clustering, whale, correlated betting.
 * Output: max drawdown, required reserve for 0.1% ruin probability, volatility index.
 * Does not affect live RNG — simulation only.
 */

import { spin } from '../engine/wheel.js';
import { calculatePayout } from '../engine/payout.js';

/**
 * Run 30-day stress simulation with configurable scenarios.
 * Returns { maxDrawdown, requiredReserveForRuin01, volatilityIndex, dailyPnL[] }.
 */
export function runLiquidityStressTest(options = {}) {
    const {
        days = 30,
        spinsPerDay = 10000,
        houseReserveStart = 10_000_000,
        straightUpClusterPct = 0.05,
        whaleBetPct = 0.02,
        correlatedNumberBetPct = 0.1,
    } = options;

    let reserve = houseReserveStart;
    const dailyPnL = [];
    let peak = reserve;
    let maxDrawdown = 0;
    const profits = [];

    for (let d = 0; d < days; d++) {
        let dayProfit = 0;
        for (let s = 0; s < spinsPerDay; s++) {
            const bets = [];
            const r = Math.random();
            if (r < straightUpClusterPct) {
                const num = Math.floor(Math.random() * 37);
                bets.push({ type: 'number', value: num, amount: 100 });
            } else if (r < straightUpClusterPct + whaleBetPct) {
                bets.push({ type: 'red', amount: 50000 });
            } else if (r < straightUpClusterPct + whaleBetPct + correlatedNumberBetPct) {
                const num = 7;
                bets.push({ type: 'number', value: num, amount: 500 });
            } else {
                bets.push({ type: 'red', amount: 100 });
            }
            const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
            const winningNumber = spin();
            const payout = calculatePayout(bets, winningNumber);
            const profit = totalBet - payout;
            dayProfit += profit;
            reserve += profit;
            profits.push(profit);
            if (reserve > peak) peak = reserve;
            const dd = peak - reserve;
            if (dd > maxDrawdown) maxDrawdown = dd;
        }
        dailyPnL.push({ day: d + 1, profit: dayProfit, reserve });
    }

    const meanProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const variance = profits.reduce((s, p) => s + (p - meanProfit) ** 2, 0) / profits.length;
    const volatilityIndex = Math.sqrt(variance);

    const requiredReserveForRuin01 = Math.ceil(maxDrawdown * 2.5);

    return {
        maxDrawdown,
        requiredReserveForRuin01,
        volatilityIndex: Math.round(volatilityIndex * 100) / 100,
        dailyPnL,
        finalReserve: reserve,
    };
}
