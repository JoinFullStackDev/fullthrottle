# Pricing

**Status:** 🔴 TBD  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] What is the pricing model? (flat monthly SaaS, per-seat, per-prescription volume, tiered, hybrid?)
- [ ] What is the target price range / ACV?
- [ ] Will there be a free trial or freemium tier?
- [ ] How will pricing scale? (number of providers, patients, locations, prescriptions/month?)
- [ ] Are there implementation / setup fees?
- [ ] What does the competitor pricing landscape look like?
- [ ] Will there be annual vs. monthly billing options? (incentivize annual with a discount?)

---

## 1. Pricing Philosophy

> 🔴 TBD

Considerations:
- Compounding pharmacies are typically small businesses — price sensitivity is real
- Must reflect the complexity and compliance requirements of the product (HIPAA, BAA)
- Should align with value delivered (time saved, errors reduced, provider network growth)
- Goal: land-and-expand — start with core, upsell as they grow

---

## 2. Pricing Models Under Consideration

| Model | Description | Pros | Cons |
|-------|-------------|------|------|
| Flat monthly SaaS | One price per pharmacy | Simple, predictable | Doesn't capture value from larger pharmacies |
| Per-seat (pharmacy staff) | Priced per active user | Scales with team size | Low seat counts at small pharmacies |
| Per-provider | Priced per connected prescriber | Scales with network growth — core value driver | May limit adoption early |
| Volume-based (Rx/month) | Priced per prescription processed | Directly tied to usage | Unpredictable for pharmacy |
| Tiered (Starter / Growth / Enterprise) | Feature/usage tiers | Flexible, familiar | Needs clear tier differentiation |

**Hypothesis:** Tiered model with a base platform fee + per-provider or per-location scaling.

---

## 3. Proposed Tier Structure (Draft)

> 🔴 TBD — Numbers and features need validation

| Tier | Price | Includes | Ideal For |
|------|-------|----------|-----------|
| Starter | $X/mo | Core prescription workflow, up to X providers, X patients | Single-location, early-stage compounding pharmacy |
| Growth | $X/mo | Everything in Starter + advanced reporting, more providers/patients, priority support | Growing pharmacy with active provider network |
| Enterprise | Custom | Everything in Growth + multi-location, dedicated CSM, custom integrations, SLA | Multi-location or high-volume pharmacies |

---

## 4. Add-Ons / Upsells

> 🔴 TBD

- Additional provider seats above tier limit
- Additional patient volume
- e-Prescribing / EHR integration
- Custom reporting / data exports
- Priority / dedicated support

---

## 5. Launch Pricing Strategy

> 🔴 TBD

Options:
- **Founder pricing:** Early adopters lock in discounted rate permanently
- **Beta pricing:** Reduced rate during pilot period, transitions at launch
- **Standard pricing from day one:** No special treatment, clean pricing table

---

## 6. Billing & Payments

- Annual vs. monthly: TBD (recommend incentivize annual — e.g., 2 months free)
- Payment processor: TBD (Stripe likely based on tech stack)
- Invoicing: TBD (Stripe Billing, manual invoicing, etc.)

---

## Notes
