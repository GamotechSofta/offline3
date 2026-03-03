# Provably Fair — Seed Lifecycle, Storage, and Verifiability

This document defines seed rotation frequency, secure storage, leak response, and permanent verifiability for production deployment.

---

## 1. Seed Rotation Frequency

- **Config-driven:** Rotation can be time-based (e.g. every N hours) or event-based (e.g. after M spins). The codebase uses **RouletteSeedCycle**: one active cycle at a time, with `activeFrom` and optional `revealedAt`.
- **Recommendation for production:** Define in config or admin:
  - **Time-based:** e.g. rotate every 24 hours or every 7 days.
  - **Event-based:** e.g. rotate after every 100,000 spins.
- **Implementation note:** Rotation is performed by creating a new cycle (new server seed, new hash, new `activeFrom`) and marking the previous cycle as revealed (`revealedAt` set, server seed stored). The exact scheduler (cron vs. background job) is deployment-specific.

---

## 2. Secure Storage Method

- **Options (in order of strength):**
  - **HSM (Hardware Security Module):** Server seed generated or stored inside HSM; not present in application memory except during use. Best for high-compliance jurisdictions.
  - **Vault / KMS (e.g. HashiCorp Vault, AWS KMS):** Secrets stored in a dedicated secrets manager; app retrieves per cycle. Prefer over env for production.
  - **Environment / encrypted env:** Server seed or a seed-encryption key in process environment. Minimum for small deployments; ensure env is not logged or dumped.
- **Current code:** Server seed is stored in **RouletteSeedCycle** (MongoDB). For production, consider:
  - Storing only a **reference** (e.g. Vault path) in the DB and resolving the actual seed at runtime, or
  - Encrypting the seed at rest in DB using a key from Vault/KMS.
- **Recommendation:** Document the chosen method (HSM / Vault / encrypted DB / env) in the security runbook and for lab certification.

---

## 3. If Server Seed Leaks

- **Impact:** A leaked server seed for an active or past cycle allows anyone to verify or precompute outcomes for that cycle. It does not by itself allow changing past results (outcomes are already committed and hashed in the audit chain). Trust impact is high; regulatory impact depends on jurisdiction.
- **Actions:**
  1. **Immediately rotate** to a new cycle; stop using the leaked seed for any new spin.
  2. **Reveal the leaked cycle** officially (set `revealedAt`, publish seed) so that verification remains transparent and no further “leak” narrative.
  3. **Incident response:** Log the event, notify compliance/security, and prepare a short statement for players (e.g. “Cycle X was compromised; it has been revealed and retired; all spins remain verifiable.”).
  4. **Review access control and storage** (who/what could read the seed, fix storage/access).

---

## 4. Old Seeds Remain Verifiable Permanently

- **Design:** Once a cycle is revealed, `serverSeed`, `clientSeed`, and `nonce` are stored with each RouletteGame (or in the cycle document). Verification uses `verifySpin(serverSeed, clientSeed, nonce, expectedWinningNumber)` and does not depend on the seed being “current.”
- **Retention:** Old seeds and cycle metadata should be retained for the period required by regulation (e.g. 5–7 years). Deletion or archival policy should be documented; verification endpoints should support historical spinId lookups for at least the retention period.
- **Permanent verifiability:** No time limit in code; as long as the record exists, anyone with spinId (and cycle reveal) can verify. Operators should retain data per regulatory requirements.

---

## 5. Configuration Checklist (Production)

- [ ] Seed rotation frequency defined (time or spin count) and implemented (cron/job).
- [ ] Secure storage method chosen and documented (HSM / Vault / KMS / encrypted DB / env).
- [ ] Leak response procedure documented (rotate, reveal, notify, review).
- [ ] Retention policy for seeds and cycle metadata aligned with regulator audit requirements.
- [ ] Verification API supports historical spinId (and returns serverSeed only after cycle reveal).
