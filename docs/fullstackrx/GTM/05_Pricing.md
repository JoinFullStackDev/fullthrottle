# Pricing

**Status:** 🔴 TBD  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] What are the exact volume thresholds that determine the $299 vs. $750 platform fee? (e.g., <100 Rx/mo = $299, 100–300 = $499, 300+ = $750?)
- [ ] Will there be annual vs. monthly billing options? (incentivize annual with a discount?)
- [ ] Are there implementation / setup fees?
- [ ] Will there be a free trial or demo sandbox?
- [ ] What does competitor pricing look like? (AutopilotRX, NimbleRx — research needed)

---

## 1. Revenue Model (Approved)

FullStackRx generates revenue through two streams:

### Stream 1: Platform Fee
- **Per location, per month**
- **3 tiers:** $299 / $499 / $750 per location/month
- Scaled by transaction volume (higher volume = higher tier)
- Volume thresholds TBD — see Open Questions

### Stream 2: Transaction Fee
- **Per prescription processed through the platform**
- Range: **$0.75 – $2.00 per Rx**
- Charged to provider or patient (pharmacy's choice)
- Rate is negotiated by the sales rep at close — rep has incentive to negotiate up
- Floor: $0.75 | Ceiling: $2.00

### Combined Revenue Example

| Pharmacy Size | Rx/mo | Platform Fee | Trans. Fee | Monthly Revenue | Annual Revenue |
|--------------|-------|-------------|------------|----------------|---------------|
| Small | 75 | $299 | $0.75 = $56 | **$355** | **$4,260** |
| Medium | 200 | $499 | $1.50 = $300 | **$799** | **$9,588** |
| Large | 400 | $750 | $2.00 = $800 | **$1,550** | **$18,600** |

> 💡 **Key insight:** At volume, transaction fees generate more revenue than the platform fee. A large pharmacy ($750 tier, 400 Rx/mo at $2.00) generates $1,550/mo — the platform fee is only 48% of total revenue. Transaction revenue is the real growth engine. Closing high-volume pharmacies at higher per-Rx rates is disproportionately valuable, which is why sales comp is structured to reward exactly that.

> Note: Transaction fee volume heavily outweighs platform fee at scale — transaction revenue is the real growth engine.

---

## 2. Pricing Philosophy

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
