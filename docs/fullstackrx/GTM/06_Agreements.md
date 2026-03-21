# Agreements

**Status:** 🟡 Draft  
**Last Updated:** 2026-03-20

---

## Open Questions

- [x] Legal counsel engaged — yes
- [x] e-Signature platform — needs to be customizable + Stripe-compatible (see Section 4)
- [x] SLA — 99.9% uptime standard accepted
- [x] Support response times — standard tiers accepted (see Section 3)
- [ ] BAA draft — to be created and reviewed by legal counsel
- [ ] MSA / Subscription Agreement draft — to be created from scratch by legal counsel
- [ ] Referral agreement template — to be created
- [ ] Reseller agreement template — to be created
- [ ] State-specific pharmacy regulations — research needed (varies by state)

---

## 1. The Sales Agreement (Priority)

The goal is a **single, clean agreement** that a sales rep can present at close, customize within defined parameters, and get signed in one sitting. No back-and-forth redlines. No legal delays.

### Agreement Structure

The pharmacy signs **one master document** that includes:

| Section | Contents | Rep Can Adjust? |
|---------|----------|----------------|
| **Subscription Terms** | Platform fee tier, billing frequency (monthly/annual), start date | ✅ Yes — select tier, monthly vs. annual |
| **Transaction Fee** | Per-Rx rate ($0.75–$2.00), who pays (provider or patient) | ✅ Yes — within approved range |
| **Setup Fee** | Equal to first month's platform fee | ✅ Yes — can waive |
| **Term** | Contract length (month-to-month or annual) | ✅ Yes — offer both |
| **Auto-renewal** | Renews automatically unless cancelled with 30-day notice | ❌ Fixed — not negotiable |
| **Payment Terms** | Net 0 (payment at signing or first of month) | ❌ Fixed |
| **Annual Discount** | 10% if annual contract — only if no other discounts applied | ✅ Yes — rep applies or doesn't |
| **Termination** | 30-day written notice (all contracts) | ❌ Fixed |
| **BAA** | Attached as Exhibit A — must be executed simultaneously | ❌ Fixed — non-negotiable, HIPAA required |
| **Limitation of Liability** | Standard cap at 12 months of fees paid | ❌ Fixed |
| **Governing Law** | Utah (FullStack's state) | ❌ Fixed |

### What Reps Can and Cannot Change

**✅ Rep has discretion to adjust:**
- Platform fee tier (Low/Mid/High based on pharmacy's volume)
- Transaction fee rate (within $0.75–$2.00 floor/ceiling)
- Who pays transaction fee (provider or patient)
- Setup fee (can waive to close a deal)
- Billing frequency (monthly or annual)
- Annual discount (10% — only if no other discounts given)
- Contract start date

**❌ Fixed — requires management approval to change:**
- Auto-renewal terms
- Termination notice periods
- Limitation of liability
- Governing law
- BAA requirement (cannot be removed — HIPAA)
- Any term not listed above

> 🔴 **Note for legal counsel:** The goal is a modular order form / quote sheet that attaches to standard boilerplate terms. Rep fills in the variables (tier, rate, fees, term), sends for e-signature. Legal terms are non-negotiable and pre-approved. This keeps legal out of individual deals.

---

## 2. Agreement Documents Needed

| Document | Purpose | Owner | Status |
|----------|---------|-------|--------|
| **Master Subscription Agreement (MSA)** | Core legal terms governing the relationship — starting from scratch | Legal counsel | 🔴 Not started |
| **Order Form / Quote Sheet** | The rep-facing document with fillable variables (tier, rate, fees) — attaches to MSA | Spencer + Legal | 🔴 Not started |
| **Business Associate Agreement (BAA)** | HIPAA-required — must be signed before any PHI flows. Exhibit A to MSA | Legal counsel | 🔴 Not started |
| **Referral Partner Agreement** | Terms for referral partners — flat fee, attribution, payment timing | Legal counsel | 🔴 Not started |
| **Reseller Agreement** | Terms for reseller/agency partners — 20% margin, BAA requirement | Legal counsel | 🔴 Not started |

### MSA Key Sections (Brief for Legal)
When engaging legal counsel, the MSA needs to cover:
- Subscription and payment terms
- Transaction fee structure and billing
- HIPAA obligations (tied to BAA)
- Data ownership and security
- Acceptable use
- IP and confidentiality
- Limitation of liability (cap at 12 months fees)
- Termination and auto-renewal
- Governing law (Utah)
- Dispute resolution

### BAA Key Requirements
The BAA must comply with **45 CFR §164.504(e)** and cover:
- Permitted uses and disclosures of PHI
- Safeguard obligations
- Subcontractor / sub-processor obligations (AWS, Stripe, etc.)
- Breach notification requirements
- Return or destruction of PHI on termination
- AWS BAA is already available via AWS console — sub-processor coverage handled

> 💡 **Note to Spencer:** I can draft a working BAA template for legal counsel to review and finalize. It won't be the final signed version — your attorney needs to review and approve — but it gives legal a strong starting point and saves time. Just say the word.

---

## 3. SLA Commitments

| Metric | Commitment | Notes |
|--------|-----------|-------|
| **Uptime** | 99.9% monthly | ~8.7 hours downtime/year — industry standard |
| **Planned maintenance** | Notified 48 hours in advance | Off-peak hours only |
| **Incident communication** | Status page + email notification within 1 hour of confirmed outage | 🔴 Status page TBD (statuspage.io recommended) |

### Support Response Times by Tier

| Tier | First Response | Resolution Target | Channel |
|------|---------------|-------------------|---------|
| Low ($299) | 24 business hours | 3 business days | Email / in-app |
| Mid ($499) | 8 business hours | 1 business day | Email / in-app / chat |
| High ($750) | 4 business hours | Same business day | Email / chat / phone |

---

## 4. e-Signature Platform

**Requirements:**
- Customizable templates (order form variables)
- Stripe-compatible (billing integration for payment collection at signing)
- Multi-document signing (MSA + BAA in one signing session)
- Audit trail / signed document storage
- HIPAA-compliant

**Recommended: PandaDoc**
- Native Stripe integration — collect payment at the moment of signing
- Template variables (perfect for the order form model)
- HIPAA-compliant with BAA available
- Multi-document support
- Cleaner UX than DocuSign for sales reps

**Alternative: DocuSign**
- More enterprise-grade, slightly heavier
- Stripe integration exists but less native than PandaDoc
- Also HIPAA-compliant

> ✅ **Decision:** PandaDoc — selected for native Stripe integration and template flexibility.

---

## 5. Agreement Execution Flow

From close to signed in one session:

1. Rep fills out **Order Form** (tier, rate, setup fee, term, billing frequency)
2. System generates **MSA + BAA + Order Form** as one package via PandaDoc
3. Rep sends to pharmacy owner via email link
4. Pharmacy owner reviews, signs all documents in one session
5. Payment method collected via Stripe integration at signing (setup fee + first month if applicable)
6. Signed documents auto-stored in PandaDoc + CRM
7. Onboarding team notified automatically → kickoff scheduled

---

## Notes
