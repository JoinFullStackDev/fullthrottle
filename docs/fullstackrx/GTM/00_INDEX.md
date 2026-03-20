# FullStackRx — Go-To-Market Strategy

**Product:** FullStackRx  
**Market:** Compounding Pharmacies (USA)  
**Target Launch Date:** May 28, 2026  
**Status:** 🟡 Planning & Research Phase  
**Last Updated:** 2026-03-20

---

## Overview

FullStackRx is a compounding pharmacy workflow platform built to connect pharmacies, prescribing providers, and patients in a single HIPAA-compliant system. It streamlines prescription management, patient onboarding, order fulfillment, and provider-pharmacy relationships — replacing the fragmented, manual workflows that define the compounding pharmacy space today.

---

## GTM Categories

| # | Category | File | Status |
|---|----------|------|--------|
| 1 | [Marketing & Demand Gen](./01_Marketing_DemandGen.md) | `01_Marketing_DemandGen.md` | 🔴 TBD |
| 2 | [Competition](./02_Competition.md) | `02_Competition.md` | 🔴 TBD |
| 3 | [Partnerships](./03_Partnerships.md) | `03_Partnerships.md` | 🔴 TBD |
| 4 | [Sales](./04_Sales.md) | `04_Sales.md` | 🔴 TBD |
| 5 | [Pricing](./05_Pricing.md) | `05_Pricing.md` | 🔴 TBD |
| 6 | [Agreements](./06_Agreements.md) | `06_Agreements.md` | 🔴 TBD |
| 7 | [Onboarding](./07_Onboarding.md) | `07_Onboarding.md` | 🟡 Draft |
| 8 | [Account Management](./08_Account_Management.md) | `08_Account_Management.md` | 🔴 TBD |
| 9 | [Client Success](./09_Client_Success.md) | `09_Client_Success.md` | 🔴 TBD |

---

## Status Legend

- 🔴 TBD — Not started / needs input from Spencer
- 🟡 Draft — In progress, has content but incomplete
- 🟢 Complete — Reviewed and approved

---

## Open Questions (Master List)

Track unresolved decisions here. Move to relevant category doc once answered.

1. Who is the **primary buyer persona**? (Pharmacy owner? Operations director? Both?)
2. What is the **headline value proposition** — one sentence?
3. What is the **pricing model**? (SaaS subscription, per-seat, usage-based, hybrid?)
4. What is the **target pharmacy segment**? (size, specialty, geography?)
5. How many compounding pharmacies are in the addressable US market?
6. Are there **design partners or beta pharmacies** already lined up?
7. Will sales be **founder-led** or will there be a dedicated sales hire?
8. Who are the **top 3–5 competitors** or status-quo alternatives?
9. What **partnerships** (GPOs, pharmacy associations, EHR integrations) are priority?
10. What **agreements** are needed? (BAA, MSA, SLA, reseller?)
11. What does the **onboarding timeline** look like from signed → live?
12. What is the **customer success model**? (Self-serve? CSM? Dedicated?)

---

## Platform Summary (From Codebase)

### User Roles
- **Admin** — Platform-level administration
- **Pharmacy** — Pharmacy staff managing orders, providers, products, settings
- **Provider** — Prescribing clinicians managing patients and prescriptions
- **Patient** — End patients managing their compounds, refills, payments

### Core Modules (Built)
- Pharmacy Registration & Setup
- Provider Onboarding & Profile
- Patient Invitation & Onboarding (phone-based Cognito auth)
- Prescription Lifecycle (browse → prescribe → submit → approve → fill)
- Product Catalog (pharmacy-managed compounding formulary)
- Order Management
- Patient Payments & Refills

### Tech Stack
- **Frontend:** Next.js 16, React 19, TypeScript, MUI v7
- **Backend:** Java 21, Spring Boot, PostgreSQL 16, AWS Cognito
- **Infrastructure:** AWS (S3, KMS, SES), Redis, DBOS Transact (durable workflows)
- **Compliance:** HIPAA — JWT auth, encrypted columns, audit-ready architecture

### Sample Compounding Products (Seed Data)
- Progesterone 200mg Capsules
- Testosterone Cypionate 200mg/mL
- LDN (Low Dose Naltrexone) 4.5mg
- BPC-157 500mcg Capsules
- Vitamin D3 50,000 IU
- Thyroid T3/T4 Combination
- Glutathione 200mg Troches
- Custom Hormone Cream Bi-Est/Progesterone

→ Suggests initial focus on **functional medicine / hormone therapy / anti-aging** compounding niche.
