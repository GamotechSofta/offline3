# Responsible Gaming — Enforcement, Counters, and Audit

This document specifies how deposit, loss, and session limits are enforced: atomic counters, time windows, timezone, rolling vs calendar, multi-device, and data retention for regulator audit.

---

## 1. Limits (Conceptual Model)

- **depositLimit:** Max amount the user can deposit in a given time window.
- **lossLimit:** Max net loss (deposits − withdrawals − winnings) in a given time window.
- **sessionLimit:** Max duration or max stake per session; session can be defined by time or by “session id.”

Enforcement must be **deterministic** and **auditable**: same inputs (user, window, counters) must yield the same allow/deny result.

---

## 2. Atomic Counters per Time Window

- **Requirement:** For each limit type and each time window, the system must use **atomic counters** (e.g. MongoDB `$inc` or a dedicated aggregate document) so that concurrent deposits, bets, and withdrawals do not undercount.
- **Implementation direction:** 
  - One document per (userId, windowKey) for each limit type, e.g. `UserLimitCounters`: `{ userId, windowKey, depositSum, withdrawalSum, wageredSum, winSum, sessionStart, sessionStake }`. Updates via `findOneAndUpdate` with `$inc` inside the same transaction as the financial operation (deposit, spin, withdrawal).
  - Or integrate counters into the same transaction that performs the wallet debit/credit so that “deposit this amount” and “add to deposit counter for current window” are atomic.

---

## 3. Time Window: Rolling vs Calendar

- **Calendar window:** e.g. “current day” (00:00–23:59 in a defined timezone), “current week” (Monday–Sunday), “current month.” Counters reset at window boundary; simple to explain and audit.
- **Rolling window:** e.g. “last 24 hours,” “last 7 days.” Requires storing timestamps per event or maintaining sliding aggregates; harder to implement and audit but closer to “real-time” behavior.
- **Recommendation:** Document which limits use calendar vs rolling. For regulator audit, calendar is easier to verify (e.g. “show me all deposits in January 2025 in UTC”).

---

## 4. Timezone Handling

- **Storage:** Store all timestamps in **UTC** in the database. Window keys (e.g. “2025-01”) should be derived from UTC or from a single “operator timezone” configured per environment.
- **Display:** Convert to user’s or jurisdiction’s timezone only for display. Enforcement and counters must use the same definition (UTC or operator timezone) consistently so that audits are reproducible.
- **Document in runbook:** “All limit windows are computed in [UTC | operator timezone].”

---

## 5. Multi-Device and Session Identity

- **Multi-device:** Limits are per **user**, not per device. Atomic counters are keyed by `userId` (and window). So deposit/loss limits apply across all devices and sessions.
- **Session limit:** “Session” can be defined as (a) a time-bounded period (e.g. 24h from first activity) or (b) a logical session id (e.g. login session). For (a), use a rolling or calendar window and a counter (e.g. sessionStake, sessionDuration). For (b), store sessionId with each bet and aggregate by (userId, sessionId). Enforcement: before accepting a spin, check that adding this bet does not exceed the session limit for the current session.

---

## 6. Data Retention for Regulator Audit

- **Requirement:** Retain all data needed to recompute and verify limit enforcement for the audit period (e.g. 5–7 years): deposits, withdrawals, wagers, wins, and the counter snapshots or raw events used to evaluate limits.
- **Implementation:** 
  - Keep WalletTransaction and RouletteGame (and any limit-counter documents or event log) for the retention period.
  - Optionally export “limit evaluation log” (userId, window, limit type, value, threshold, allow/deny, timestamp) for each check. This allows regulators to replay and verify that limits were applied correctly.

---

## 7. Current Codebase

- **UserResponsibleGaming** and **checkResponsibleGaming** middleware implement the conceptual checks (self-exclusion, cool-off, deposit/loss/session limits). 
- **Gap to close for production:** Implement atomic counters per time window, define rolling vs calendar per limit, fix timezone to UTC (or documented operator timezone), and ensure retention and auditability of limit-related data as above.
