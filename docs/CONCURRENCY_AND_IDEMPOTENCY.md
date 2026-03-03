# Concurrency and Idempotency (Multi-Instance / Horizontal Scaling)

For production under load (e.g. 10,000 concurrent spins, multi-instance backend), the following guarantees and behaviors are in place.

## 1. Strict Unique Indexes

- **RouletteGame** – `spinId` unique: prevents duplicate spin records.
- **RouletteGame** – `(user, idempotencyKey)` unique (partial, when key present): one result per (user, idempotencyKey); duplicate retries return the same spin.
- **RouletteAuditLog** – `sequenceId` unique: strict monotonic audit chain.

**Racing on HouseReserve:** All updates to HouseReserve happen inside the same MongoDB transaction as the spin. Serialization is by the transaction; HouseReserve is updated with `$inc`, so concurrent commits are merged by MongoDB.

## 2. Transaction Retry and Duplicate Audit Entries

- **Retries:** Callers may retry on transient errors. Each attempt uses the same `idempotencyKey`.
- **Duplicate audit:** Audit entries are created only after the spin succeeds. Idempotency ensures that a duplicate request by (user, idempotencyKey) returns the existing spin without running a second transaction, so at most one audit entry per logical request.

## 3. Redis Idempotency Cache (Optional / Desync)

If Redis is used as an idempotency cache: the source of truth is MongoDB. A second request with the same key will find the existing RouletteGame and return the stored result. No duplicate spin even if Redis desyncs.

## 4. Spin Service Idempotency Across Cluster Nodes

Idempotency is keyed by (user, idempotencyKey). Any node that serves a repeat request will find the existing document and return it. The service is idempotent across cluster nodes as long as the client sends the same idempotencyKey for the same logical spin.

## 5. Summary

- Strict unique index on (userId, idempotencyKey) and on spinId; strict monotonic unique sequenceId.
- Single transaction per spin: wallet, stats, HouseReserve, audit log, RouletteGame updated together.
- No duplicate audit entries for the same spin; safe under retries and multi-instance.
