# Agreements

**Status:** 🔴 TBD  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] Has legal counsel been engaged for agreement drafting?
- [ ] Will there be a standard click-through MSA, or negotiated enterprise agreements?
- [ ] What SLA commitments are planned? (uptime %, support response times?)
- [ ] Is a BAA template drafted and reviewed?
- [ ] Are there any state-specific pharmacy regulations that affect the agreement terms?
- [ ] Will there be a reseller/referral agreement template?

---

## 1. Required Agreements

### A. Business Associate Agreement (BAA) — CRITICAL
> HIPAA-required before any PHI is exchanged. Must be signed before pharmacy goes live.

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| BAA template drafted | 🔴 TBD | Legal | Must comply with 45 CFR §164.504(e) |
| BAA review by HIPAA counsel | 🔴 TBD | Legal | — |
| BAA e-signature workflow | 🔴 TBD | Engineering | Integrated into signup/onboarding? |
| Sub-processor BAAs (AWS, etc.) | 🔴 TBD | Legal | AWS BAA already available via AWS console |

### B. Master Subscription Agreement (MSA) / Terms of Service
> Governs the customer relationship, usage rights, limitations of liability, etc.

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| MSA / ToS drafted | 🔴 TBD | Legal | — |
| Acceptable Use Policy | 🔴 TBD | Legal | — |
| Privacy Policy | 🔴 TBD | Legal | Must address PHI handling |

### C. Service Level Agreement (SLA)
> Defines uptime commitments, support tiers, and remedies for downtime.

| Item | Target | Status |
|------|--------|--------|
| Uptime SLA | 🔴 TBD (99.9%?) | TBD |
| Support response time (Starter) | 🔴 TBD | TBD |
| Support response time (Growth) | 🔴 TBD | TBD |
| Support response time (Enterprise) | 🔴 TBD (e.g., 4-hour) | TBD |
| Incident communication protocol | 🔴 TBD | TBD |

### D. Partnership / Referral Agreements
> For channel partners, integration partners, and resellers.

| Item | Status | Notes |
|------|--------|-------|
| Referral agreement template | 🔴 TBD | Define rev share terms |
| Technology partner agreement | 🔴 TBD | For EHR/integration partners |
| Reseller agreement | 🔴 TBD | If applicable |

---

## 2. Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| HIPAA Security Rule compliance | 🟡 In progress | JWT auth, encrypted columns, audit logging in codebase |
| HIPAA Privacy Rule compliance | 🔴 TBD | Policies and procedures needed |
| SOC 2 Type II (future) | 🔴 TBD | Not required at launch, roadmap item |
| State pharmacy regulations | 🔴 TBD | Research needed — varies by state |
| EPCS (Electronic Prescribing for Controlled Substances) | 🔴 TBD | Required if handling controlled substances |

---

## 3. Agreement Execution Process

> 🔴 TBD — Define how agreements are signed and stored

- e-Signature platform: TBD (DocuSign, HelloSign/Dropbox Sign, PandaDoc?)
- Agreement storage: TBD (integrated into platform? external?)
- Auto-BAA on signup vs. manual: TBD

---

## Notes
