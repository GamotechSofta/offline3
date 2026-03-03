# Infrastructure Hardening Checklist (Production)

Architecture and application code are not sufficient for production without the following infrastructure and operations elements. Use this as a checklist for deployment and compliance.

---

## 1. WAF (Web Application Firewall)

- [ ] WAF in front of public API (e.g. AWS WAF, Cloudflare, ModSecurity).
- [ ] Rules tuned for gaming API (block common attacks, rate patterns, geo if required).
- [ ] Logging and alerting on WAF blocks.

---

## 2. DDoS Protection

- [ ] DDoS mitigation at network/edge (e.g. cloud provider DDoS protection, CDN).
- [ ] Rate limiting at API gateway or app (per IP, per user, per endpoint).
- [ ] Spin cooldown and per-user limits already in app; ensure gateway limits are aligned.

---

## 3. Log Centralization

- [ ] All application and access logs shipped to a central store (e.g. ELK, Splunk, cloud logging).
- [ ] Logs must not contain secrets (no server seeds, no full tokens, no passwords).
- [ ] Retention policy for logs defined and enforced (e.g. 90 days hot, 7 years archive for audit).

---

## 4. Secrets Management (Vault / KMS)

- [ ] No secrets in code or in repo; use environment or secrets manager.
- [ ] Database credentials, API keys, JWT secrets, and (if used) seed-encryption keys from Vault or KMS.
- [ ] Rotation procedure for secrets documented and tested.

---

## 5. Backup Strategy

- [ ] Automated backups for MongoDB (and any other stateful store).
- [ ] Backups encrypted at rest.
- [ ] Backup restoration tested periodically.

---

## 6. Disaster Recovery — RTO/RPO

- [ ] **RTO (Recovery Time Objective):** Target maximum downtime (e.g. 4 hours). Architecture and runbooks must support it (replica set, failover, etc.).
- [ ] **RPO (Recovery Point Objective):** Maximum acceptable data loss (e.g. 1 hour). Backup and replication frequency must meet RPO.
- [ ] Document RTO/RPO in the operational runbook and review with compliance.

---

## 7. Encrypted at-Rest Database

- [ ] MongoDB (or primary DB) encrypted at rest (e.g. MongoDB Atlas encryption, or disk-level encryption on VM).
- [ ] Same for any DB holding PII or financial data.

---

## 8. Encrypted Backups

- [ ] Backup files/streams encrypted (e.g. encrypted snapshots, or encryption in transit and at rest for backup storage).

---

## 9. SIEM Integration

- [ ] Security-relevant events (auth failures, limit breaches, admin actions, spin anomalies) sent to SIEM or security monitoring.
- [ ] Alerts configured for critical patterns (e.g. bulk failed logins, unusual payout spikes).

---

## 10. Summary

| Area | Status (to be filled per deployment) |
|------|--------------------------------------|
| WAF | ☐ |
| DDoS | ☐ |
| Log centralization | ☐ |
| Secrets (Vault/KMS) | ☐ |
| Backup strategy | ☐ |
| DR (RTO/RPO) | ☐ |
| DB encryption at rest | ☐ |
| Backup encryption | ☐ |
| SIEM | ☐ |

**Architecture ≠ infrastructure readiness.** This checklist should be completed and reviewed before going live.
