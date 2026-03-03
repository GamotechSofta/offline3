# Casino-Ready Roulette Platform — Architecture & Compliance

## How This System Stays Statistically Fair and Regulator-Ready

- **No win-first logic** — The outcome is never “decided” by house or player. It is either:
  - **Standard mode**: `winningNumber = spin()` (crypto RNG, uniform 0–36).
  - **Provably fair mode**: `winningNumber = HMAC_SHA256(serverSeed, clientSeed + nonce) mod 37` (deterministic, verifiable, uniform).
- **No probability manipulation** — No RTP correction, no risk modifiers, no streak-based changes. RTP is fixed by the European paytable.
- **Risk only at the boundary** — Limits (exposure, liability, Kelly, per-number) only allow or reject a bet before the spin. They never change the wheel result.
- **Audit and proof** — Every spin has a unique `spinId`, optional provably-fair seeds, and an append-only audit chain with a hash link to the previous record. Exportable for regulators.

---

## Security Architecture Diagram (Markdown)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (User / Admin)                          │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    │  JWT / Session │ idempotencyKey │ clientSeed, nonce
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API GATEWAY / ROUTES                                                     │
│  • Rate limiting (IP, spin frequency)                                    │
│  • RBAC (User, Admin, SuperAdmin)                                         │
│  • validateSpinInput (idempotencyKey, bets schema)                        │
│  • checkResponsibleGaming (limits, self-exclusion, cool-off)              │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SPIN SERVICE (stateless)                                                 │
│  1. Validate bets                                                          │
│  2. Load user, wallet; check balance                                       │
│  3. Idempotency: return existing result if key seen                        │
│  4. Exposure checks (max payout, table liability, Kelly, per-number)      │
│  5. Resolve outcome: ProvablyFair(serverSeed, clientSeed, nonce) OR spin() │
│  6. calculatePayout(bets, winningNumber)                                   │
│  7. MongoDB transaction: debit → credit → stats → HouseReserve → AuditLog  │
│     → RouletteGame (spinId, seeds, hash chain)                             │
└─────────────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   ENGINE      │ │   MODELS     │ │   AUDIT      │
│ wheel.js      │ │ RouletteGame │ │ RouletteAuditLog
│ payout.js     │ │ RouletteStats│ │ (sequenceId, prevHash,
│ exposure.js   │ │ HouseReserve │ │  recordHash, payload)
│ provablyFair  │ │ SeedCycle    │ │ Append-only, chain
└──────────────┘ │ Config       │ └──────────────┘
                 └──────────────┘
```

---

## Folder Structure (Production)

```
backend/
  engine/
    wheel.js           # Pure RNG: spin() → 0–36
    payout.js          # Payout math, validateBets, maxPayoutForBets
    exposure.js        # Exposure checks (no probability change)
    exposureStatus.js  # liabilityByNumber, liabilityByBetType, exposureRatio
    provablyFair.js    # serverSeed, clientSeed, nonce → HMAC → 0–36
    simulator.js       # Monte Carlo (fair wheel only)
  models/
    rouletteGame/
      rouletteGame.js    # spinId, user, bets, winningNumber, payout, profit,
                         # clientSeed, nonce, serverSeedHash, spinDataHash, idempotencyKey
      RouletteStats.js   # totalWagered, totalPaid, spinCount (atomic)
      RouletteSeedCycle.js # serverSeedHash (pre-commit), serverSeed (revealed), activeFrom, revealedAt
      rouletteConfig.js   # houseReserve, riskFactor, provablyFairEnabled, ...
      HouseReserve.js    # balance, dailySnapshots (liquidity)
      RouletteAuditLog.js # sequenceId, spinId, previousRecordHash, recordHash, payload
      RiskAlert.js       # AML/risk flags (alerts only, no RNG impact)
    user/
      UserResponsibleGaming.js # deposit/loss/session limits, cool-off, self-exclusion
  services/
    spinService.js        # Orchestration: validate → exposure → resolve number → persist
    liquiditySimulator.js # Stress test: max drawdown, reserve for 0.1% ruin, volatility
  middleware/
    validateRouletteSpin.js # idempotencyKey, bets schema
    responsibleGaming.js   # Enforce limits before spin (no RNG change)
    adminAuth.js           # verifyAdmin, verifySuperAdmin
  controllers/
    rouletteController.js # spin, stats, history, config, global-stats, analytics,
                          # proof, exposure-status, system-health, audit-export, liquidity-stress
  routes/
    roulette/rouletteRoutes.js
```

---

## New / Updated Database Schemas

| Model | Purpose |
|-------|--------|
| **RouletteGame** | spinId (UUID), user, bets, winningNumber, totalBet, payout, profit, clientSeed, nonce, serverSeedHash, spinDataHash, preSpinBankrollSnapshot, betStructure, idempotencyKey |
| **RouletteStats** | totalWagered, totalPaid, spinCount (single doc, atomic increment) |
| **RouletteSeedCycle** | gameId, serverSeedHash, serverSeed, activeFrom, revealedAt (provably fair) |
| **HouseReserve** | gameId, balance (updated with house profit per spin) |
| **RouletteAuditLog** | sequenceId, spinId, previousRecordHash, recordHash, timestamp, payloadHash, payload (append-only chain) |
| **UserResponsibleGaming** | userId, depositLimitDaily/Weekly/Monthly, lossLimit*, sessionDurationLimitMinutes, coolOffUntil, selfExcludedUntil, sessionTimeoutMinutes |
| **RiskAlert** | userId, type (ABNORMAL_BET_SPIKE, RAPID_DEPOSIT_WITHDRAW, STRAIGHT_UP_CLUSTERING, VELOCITY_BETTING, ...), severity, payload, acknowledged |

---

## Provably Fair Implementation

1. **Pre-commit** — Before a cycle, house generates `serverSeed`, stores `serverSeedHash = SHA256(serverSeed)`. Hash is shown to players; seed is secret.
2. **Spin** — Player sends `clientSeed` (or auto) and `nonce` (increment). Server uses active cycle’s `serverSeed` and computes `winningNumber = HMAC_SHA256(serverSeed, clientSeed + nonce)` then maps to 0–36 (rejection for uniformity). Outcome is deterministic and reproducible.
3. **Reveal** — After cycle ends, house sets `revealedAt` and stores `serverSeed`. Players can verify past spins with GET `/roulette/proof/:spinId`.
4. **Verification** — Client recomputes HMAC with revealed serverSeed, clientSeed, nonce and checks result equals stored winningNumber.

---

## Liquidity Simulation Engine

- **HouseReserve** — Single document updated atomically with house profit per spin.
- **Stress test** — `runLiquidityStressTest({ days, spinsPerDay, houseReserveStart })`: simulates 30 days with configurable straight-up clustering, whale bets, correlated number betting. Returns **maxDrawdown**, **requiredReserveForRuin01**, **volatilityIndex**, **dailyPnL**.
- **Endpoint** — POST `/roulette/liquidity-stress` (admin) with body `{ days, spinsPerDay, houseReserveStart }`.

---

## Audit Chain Implementation

- **RouletteAuditLog** — Each record: `sequenceId` (monotonic), `spinId`, `previousRecordHash`, `recordHash`, `timestamp`, `payloadHash`, minimal `payload`.
- **Chain** — `recordHash = SHA256(sequenceId | spinId | previousRecordHash | timestamp | payloadHash)`. First record uses `previousRecordHash = '0'`.
- **Tamper detection** — Regulator or script can walk the chain and recompute each recordHash; any change breaks the chain.
- **Export** — GET `/roulette/audit-export?from=ISO&to=ISO` returns CSV (sequenceId, spinId, hashes, timestamp, payload fields) for inspection.

---

## Responsible Gaming Layer

- **UserResponsibleGaming** — Per-user limits and flags (deposit/loss/session limits, cool-off, self-exclusion, session timeout).
- **Middleware** — `checkResponsibleGaming` runs before spin: if self-excluded or cool-off or session limit exceeded, responds 403 and does not call spin. **Never affects RNG** — only allows or blocks the request.
- **Enforcement** — Deposit/loss counters can be updated by wallet and spin services; session start/end tracked for duration and timeout.

---

## AML & Risk Monitoring (Non-Manipulative)

- **RiskAlert** — Stores alerts (ABNORMAL_BET_SPIKE, RAPID_DEPOSIT_WITHDRAW, STRAIGHT_UP_CLUSTERING, VELOCITY_BETTING, etc.). For monitoring and reporting only.
- **Detection** — Implemented in separate services (e.g. post-spin or on deposit/withdraw). **Never affects RNG or spin outcome** — only creates alerts.

---

## Exposure Dashboard Logic

- **GET /roulette/exposure-status** — Returns houseReserve, totalWagered, totalPaid, exposureRatio, exposureHealthy, liabilityByNumber (0–36 max allowed), liabilityByBetType (recommended max stake). All derived from config and current reserve; no impact on outcomes.

---

## API Summary (New / Updated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /roulette/spin | — | body: userId, bets, idempotencyKey, [clientSeed, nonce]. Middleware: validateSpinInput, checkResponsibleGaming. |
| GET | /roulette/proof/:spinId | — | Provably fair verification data (seeds, verified flag when revealed). |
| GET | /roulette/exposure-status | Admin | Real-time exposure dashboard. |
| GET | /roulette/system-health | Admin | houseReserve, exposureRatio, RTP, deviation, spinCount. |
| GET | /roulette/audit-export | Admin | CSV audit log for date range. |
| POST | /roulette/liquidity-stress | Admin | Monte Carlo stress test; max drawdown, reserve for 0.1% ruin, volatility. |

---

## High-Integrity Transactions

- **MongoDB transaction** — Single session for: wallet debit/credit, user stats, RouletteStats.incrementSpin, HouseReserve.addHouseProfit, RouletteAuditLog.create, RouletteGame.create.
- **Idempotency** — Client sends idempotencyKey; if a spin with same user+key exists, return that result without debiting again. Server may generate a key if client omits it (backward compat).
- **spinId** — UUID per spin; stored and returned.
- **Nonce** — In provably fair mode, client sends nonce (e.g. increment per spin); stored for proof.

---

## Scalability Notes

- **Stateless spin service** — No in-process state; all state in DB and config.
- **Redis idempotency** — Optional: cache (userId, idempotencyKey) → spinId to avoid DB lookup on duplicate request; TTL e.g. 24h.
- **RouletteGame** — Shardable by `user` or by `createdAt`; spinId unique across shards.
- **Read replica** — Analytics and GET endpoints (stats, analytics, audit-export) can use read preference secondary.

---

## Certification-Friendly Properties

- **GLI / eCOGRA style** — Pure RNG or provably fair derivation; no outcome steering; exposure and limits only at bet acceptance; full audit chain and export; responsible gaming and AML as separate, non-RNG layers.
- **Statistical fairness** — European wheel 0–36 uniform; RTP fixed by mathematics; no runtime RTP or probability correction.
- **Replay and proof** — spinDataHash, preSpinBankrollSnapshot, betStructure, and (when enabled) serverSeed + clientSeed + nonce allow replay and verification of any spin.

---

## Related Documentation (Gaps Addressed)

| Doc | Purpose |
|-----|--------|
| **RNG_CERTIFICATION.md** | RNG process, entropy validation, statistical test battery (e.g. Dieharder/NIST), code review checklist, seed lifecycle, pen-test reference. |
| **CONCURRENCY_AND_IDEMPOTENCY.md** | Strict indexes (spinId, user+idempotencyKey, sequenceId), transaction retry, Redis desync, idempotency across cluster. |
| **PROVABLY_FAIR_LIFECYCLE.md** | Seed rotation frequency, secure storage (HSM/Vault), leak response, permanent verifiability. |
| **RESPONSIBLE_GAMING_ENFORCEMENT.md** | Atomic counters per time window, timezone, rolling vs calendar limits, multi-device, data retention for audit. |
| **INFRASTRUCTURE_CHECKLIST.md** | WAF, DDoS, log centralization, secrets (Vault/KMS), backup, DR RTO/RPO, encrypted DB and backups, SIEM. |
