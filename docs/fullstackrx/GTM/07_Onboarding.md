# Onboarding

**Status:** 🟡 Draft  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] What is the target time-to-value? (from signed → first prescription submitted)
- [ ] Is there a dedicated onboarding specialist, or is it self-serve with documentation?
- [ ] How are pharmacy products/formulary migrated from their current system?
- [ ] How are existing providers onboarded / invited to the platform?
- [ ] Is there a sandbox/training environment for new customers?
- [ ] What does the pharmacy setup checklist look like end-to-end?

---

## 1. Onboarding Phases

### Phase 1: Pre-Onboarding (Pre-Sale)
- Agreement execution (MSA + BAA signed)
- Payment method collected
- Kickoff call scheduled
- Dedicated onboarding resource assigned (if applicable)

### Phase 2: Pharmacy Setup
> Informed by pharmacy registration flow in codebase

| Step | Description | Owner | Automated? |
|------|-------------|-------|-----------|
| Account creation | Pharmacy registers, email verified via Cognito | Pharmacy | Yes |
| Pharmacy profile setup | Name, address, license info, contact details | Pharmacy | Self-serve |
| Formulary / products setup | Add compounding products and pricing | Pharmacy | Self-serve |
| Team invitations | Invite pharmacy staff users | Pharmacy | Yes (invite flow) |
| BAA execution | Auto-generated or manually signed | Platform | 🔴 TBD |
| Stripe / payment setup | Configure patient payment collection | Pharmacy | 🔴 TBD |

### Phase 3: Provider Network Onboarding
> Informed by provider onboarding flow in codebase

| Step | Description | Owner | Automated? |
|------|-------------|-------|-----------|
| Provider invitations | Pharmacy invites prescribing providers | Pharmacy | Yes (invite flow) |
| Provider profile setup | Name, NPI, specialty, license | Provider | Self-serve |
| Provider-pharmacy linking | Provider connected to pharmacy | Platform | Automatic |
| Provider training | Platform walkthrough / documentation | FullStackRx | 🔴 TBD |

### Phase 4: Patient Onboarding
> Informed by patient invitation flow in codebase

| Step | Description | Owner | Automated? |
|------|-------------|-------|-----------|
| Patient invitation | Provider creates patient (phone + DOB) | Provider | Yes |
| Invitation email | Patient receives setup link via email | Platform | Yes (SES) |
| Patient account creation | Patient completes profile via invite link | Patient | Yes |
| Phone verification | Cognito phone auth (E.164 format) | Platform | Yes |
| First prescription | Provider prescribes, patient notified | Provider | Yes |

### Phase 5: Go-Live
- First live prescription submitted and processed
- Pharmacy confirms workflow is running smoothly
- Handoff to Account Management / Client Success

---

## 2. Onboarding Timeline

> 🔴 TBD — Target timeline from signed → live

| Milestone | Target Days | Status |
|-----------|-------------|--------|
| Agreements signed | Day 0 | — |
| Kickoff call | Day 1–2 | — |
| Pharmacy setup complete | Day 3–5 | — |
| First provider onboarded | Day 5–7 | — |
| First patient onboarded | Day 7–10 | — |
| First live Rx processed | Day 10–14 | — |

---

## 3. Onboarding Resources

> 🔴 TBD — Build these before launch

- [ ] Onboarding checklist (pharmacy)
- [ ] Onboarding checklist (provider)
- [ ] Video walkthrough / product tour
- [ ] Knowledge base / help center articles
- [ ] Quick start guide (PDF)
- [ ] FAQs (HIPAA, data security, data migration)

---

## 4. Data Migration

> 🔴 TBD

Many pharmacies have existing patient and prescription data. Define:
- What data can/will be migrated?
- Format requirements (CSV import? Manual entry?)
- Who is responsible for migration (pharmacy, FullStackRx, both?)
- How long does migration take?

---

## 5. Technical Notes (From Codebase)

The platform already supports:
- **Pharmacy registration flow** with multi-step setup
- **Provider invitation flow** — provider invited by pharmacy, completes profile
- **Patient invitation flow** — phone-number based Cognito auth, email invite with setup link
- **Prescription lifecycle** — browse products → prescribe → submit → approve → fill
- **Role-based access control** — Admin / Pharmacy / Provider / Patient
- **Email via AWS SES** (Mailpit for local dev)
- **HIPAA-compliant infrastructure** — encrypted columns, JWT auth, audit-ready

---

## Notes
