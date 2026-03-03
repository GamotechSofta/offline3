# RNG Certification Artifacts (GLI / eCOGRA Readiness)

**Disclaimer:** Using `crypto.randomBytes` and HMAC-SHA256 does **not** by itself grant regulator approval. Labs (e.g. GLI) require documented process, entropy validation, statistical test battery, code review, seed lifecycle documentation, and penetration testing. This document provides the **certification artifacts** and references required to support an audit.

---

## 1. Documented RNG Process

### 1.1 Standard wheel (non–provably fair)

| Step | Description | Code reference |
|------|-------------|----------------|
| 1 | Request 4 bytes from Node.js `crypto.randomBytes(4)` | `engine/wheel.js` → `secureInt(0, 36)` |
| 2 | Read as big-endian unsigned 32-bit integer | `buf.readUInt32BE(0)` |
| 3 | Rejection sampling: if value >= (2^32 - (2^32 mod 37)), discard and re-sample | Ensures uniform 0–36, no modulo bias |
| 4 | Map to outcome: `0 + (value % 37)` | European wheel 0–36 |

**Entropy source:** Node.js `crypto.randomBytes` uses the OS CSPRNG (e.g. OpenSSL's RAND_bytes). Document the OS and Node/OpenSSL version in the deployment environment.

### 1.2 Provably fair (HMAC-based)

| Step | Description | Code reference |
|------|-------------|----------------|
| 1 | Server seed (64 hex chars) from `crypto.randomBytes(32).toString('hex')`; stored securely; only hash shown before reveal | `engine/provablyFair.js` |
| 2 | Message = `clientSeed:nonce` (client-provided or auto) | Same file |
| 3 | HMAC-SHA256(serverSeed, message) -> 32-byte digest | `getWinningNumberFromSeeds` |
| 4 | First 4 bytes as uint32; rejection sampling for range 37; result = value % 37 | Uniform 0–36, deterministic, verifiable |

**Entropy:** Server seed is the only secret entropy; outcome is deterministic given (serverSeed, clientSeed, nonce).

---

## 2. Entropy Source Validation

- **Standard mode:** Node.js `crypto` uses OpenSSL; on Linux, OpenSSL uses `/dev/urandom` (or getrandom). Validation = OS/OpenSSL documentation + lab testing of the build/runtime.
- **Provably fair:** Entropy confined to server seed generation at cycle creation. Seed must be generated via `crypto.randomBytes(32)` and stored per Seed lifecycle (see PROVABLY_FAIR_LIFECYCLE.md).
- **Checklist for lab:** Provide OS version, Node.js version, OpenSSL version, and whether HSM or secure vault is used for server seed storage.

---

## 3. Statistical Test Battery

Labs typically require a battery such as **Dieharder** or **NIST SP 800-22**.

**In-repo sanity check (not a substitute for lab tests):**

- `backend/scripts/rngStatisticalCheck.js` — Generates a large sample from the wheel RNG and runs **chi-square goodness-of-fit** for uniform distribution over 0–36. Pass/fail vs chosen significance level.

**Lab submission:** Run Dieharder/NIST on the **raw output** of the same RNG path. Document the exact command line and seed/parameters so the lab can reproduce.

---

## 4. Code Review Checklist (RNG)

- [ ] No `Math.random()` in outcome path (wheel or provably fair).
- [ ] All outcome paths use either `crypto.randomBytes` or HMAC-SHA256 with rejection sampling for 0–36.
- [ ] Rejection sampling uses fixed formula: `limit = maxVal - (maxVal % 37)` and resample while `value >= limit`.
- [ ] No outcome-dependent logic (no "win first" or probability steering).
- [ ] Provably fair: server seed never logged or returned until cycle reveal; client seed and nonce stored for verification.

---

## 5. Seed Lifecycle Documentation

- **Creation:** Server seed generated at cycle start; hash stored and shown to players; seed stored per Secure storage policy (see PROVABLY_FAIR_LIFECYCLE.md).
- **Rotation:** Defined in Provably Fair Lifecycle doc (frequency, trigger).
- **Reveal:** After rotation, `revealedAt` set and server seed stored; seeds remain verifiable indefinitely.
- **Destruction:** Old seeds may be retained for audit; destruction policy documented in security/retention policy.

---

## 6. Penetration Testing

- Out of scope for this repo; required by labs and operators.
- Ensure: (1) no seed or RNG state in logs, (2) no RNG bypass endpoints, (3) rate limiting and auth on spin/proof endpoints.

---

## 7. File Reference

| File | Purpose |
|------|--------|
| `backend/engine/wheel.js` | Standard RNG: `secureInt`, `spin` |
| `backend/engine/provablyFair.js` | Seed generation, hash, HMAC to number, verify |
| `backend/scripts/rngStatisticalCheck.js` | Chi-square uniformity check (certification support) |
