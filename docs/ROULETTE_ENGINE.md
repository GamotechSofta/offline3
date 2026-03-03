# Roulette Engine — Production Architecture

## Why this architecture is statistically correct

1. **No win-first logic** — The wheel outcome is never decided by “should the player win?”. The flow is always: **Spin → Get number (pure RNG) → Calculate payout**. European roulette is a uniform distribution over 0–36; RTP is fixed by mathematics (house edge 1/37 on even-money, 2/37 on straight-up), not by runtime correction.

2. **Risk at the boundary** — All control is in **bet validation and exposure**: reject or cap bets that exceed house limits. Probability is never adjusted based on streaks, RTP, or bet size.

3. **Audit and replay** — Each spin stores a SHA256 hash of canonical spin data and a pre-spin bankroll snapshot. Outcomes are deterministic given the same RNG; the hash allows verification that the result matches the recorded inputs.

4. **Atomic updates** — Spin uses a single MongoDB transaction: debit, credit, stats increment, and game record write commit together. No race conditions on concurrent spins per user (rate limit) and no partial state.

---

## Folder structure

```
backend/
  engine/           # Math & RNG only
    wheel.js        # Pure RNG: spin() → 0–36
    payout.js       # calculatePayout, validateBets, maxPayoutForBets
    exposure.js     # Exposure checks (max payout, table liability, Kelly, per-number)
    simulator.js    # Monte Carlo: runSpins, aggregateStats, runMonteCarlo
  models/
    rouletteGame/
      rouletteGame.js   # Round record + spinDataHash, preSpinBankrollSnapshot, idempotencyKey
      RouletteStats.js  # Global: totalWagered, totalPaid, spinCount (atomic increment)
      rouletteConfig.js # Exposure config only: houseReserve, riskFactor, etc.
  services/
    spinService.js  # Orchestration: validate → exposure → spin → payout → persist (transaction)
  controllers/
    rouletteController.js  # Thin: spin, stats, history, config, global-stats, monte-carlo, analytics
  routes/
    roulette/rouletteRoutes.js
```

---

## Outcome flow (no win-first)

```
1. Validate bets (types, amounts).
2. Load user, wallet; check balance ≥ totalBet.
3. (Optional) Idempotency: if idempotencyKey and existing game → return existing result.
4. Load config and global stats; run exposure checks (max payout, table liability, per-number, per-type, Kelly).
5. If any check fails → reject bet.
6. winningNumber = spin()   // pure RNG, 0–36 uniform
7. payout = calculatePayout(bets, winningNumber)
8. In transaction: debit wallet, credit payout, update user stats, RouletteStats.incrementSpin, RouletteGame.create (with hash, snapshot).
9. Return { winningNumber, payout, balance, profit }.
```

---

## Engine modules

### wheel.js

- `secureInt(min, max)` — crypto.randomBytes(4), rejection sampling, no modulo bias.
- `spin()` — returns `secureInt(0, 36)`. No other logic.

### payout.js

- `calculatePayout(bets, winningNumber)` — European paytable (straight 36x, even-money 2x).
- `validateBets(bets)` — types and amounts.
- `maxPayoutForBets(bets)` — for exposure.

### exposure.js

- `checkMaxPayoutPerSpin(bets, houseBankroll, riskFactor)` — max payout ≤ houseBankroll × riskFactor.
- `checkTableLiability(maxPayout, currentLiability, cap)`.
- `checkStraightUpPerNumber(bets, maxPerNumber)`.
- `checkPerBetTypeLimits(bets, limits)`.
- `checkKellyExposure(maxPayout, totalStake, houseBankroll, kellyFraction)`.
- `runExposureChecks(bets, context)` — runs all and returns `{ allowed, errors }`.

### simulator.js

- `runSpins(n, getBetsForSpin)` — n × (spin, payout), plus number histogram.
- `aggregateStats(results, numberCounts, totalSpins)` — RTP, house edge, std dev, max drawdown, number distribution, even-money win rate.
- `runMonteCarlo(n, betPerSpin, betType)` — 1M default; returns full stats for admin.

---

## Global stats (RouletteStats)

- Single document: `totalWagered`, `totalPaid`, `spinCount`.
- Updated atomically in same transaction as spin: `incrementSpin(totalBet, payout, session)`.
- Rolling RTP = totalPaid / totalWagered. House profit = totalWagered - totalPaid.

---

## Audit integrity

- **spinDataHash** — SHA256 of canonical JSON: userId, bets, totalBet, preSpinBalance, timestamp.
- **preSpinBankrollSnapshot** — User wallet balance before the spin.
- **betStructure** — Stored copy of bets for replay.
- Spin is replayable: same inputs + same RNG would yield same number; hash verifies inputs.

---

## Security

- **Rate limiting** — Cooldown per userId (e.g. 2s) to reduce burst concurrency.
- **Atomic bankroll** — All updates in one MongoDB transaction.
- **Idempotent spin** — Optional `idempotencyKey`; duplicate request returns same result without double debit.
- **Input validation** — validateBets; exposure rejects over-limit bets.

---

## Monte Carlo output

- **RTP %** — totalPaid / totalWagered.
- **House edge %** — 1 - RTP (expect ~2.7% for European).
- **Std deviation** — of per-spin profit.
- **Max drawdown** — worst cumulative loss from a peak.
- **Number frequency** — histogram 0–36; should be uniform (1/37).
- **Even-money win rate** — fraction of spins that won on even-money; theoretical 18/37 ≈ 48.65%.

---

## API summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /roulette/spin | — | body: userId, bets, idempotencyKey? |
| GET | /roulette/stats | — | query: userId |
| GET | /roulette/history | — | query: userId, limit? |
| GET | /roulette/config | Admin | Exposure config |
| PATCH | /roulette/config | Super Admin | Update exposure config |
| GET | /roulette/global-stats | Admin | totalWagered, totalPaid, houseProfit, spinCount, rtp |
| GET | /roulette/analytics | Admin | Optional date range; number frequency |
| POST | /roulette/monte-carlo | Admin | body: spins?, betPerSpin?, betType? |
| POST | /roulette/simulate | Admin | Alias for monte-carlo |
