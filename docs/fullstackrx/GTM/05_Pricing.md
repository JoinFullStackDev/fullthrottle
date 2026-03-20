# Pricing

**Status:** 🟢 Complete  
**Last Updated:** 2026-03-20

---

## Open Questions

- [x] Volume thresholds set: Low <4,000 / Mid 4,000–8,000 / High >8,000 Rx/mo
- [x] Pricing model: platform fee (per location/mo) + transaction fee (per Rx)
- [x] Annual billing: 10% discount, only when no other major discounts applied
- [x] Setup fee: equal to first month's platform fee — waivable by sales rep
- [x] Beta pricing: ask beta pharmacies to pay, but waive if needed to get them on platform; majority of revenue comes from Rx transaction fees anyway
- [x] Billing platform: Stripe Billing for automated platform fee collection (separate from high-risk Rx transaction processor)
- [ ] Will there be a free trial or demo sandbox environment?
- [ ] Competitor pricing research — AutopilotRX, NimbleRx (research task)

---

## 1. Revenue Model (Approved)

FullStackRx generates revenue through two streams:

### Stream 1: Platform Fee
- **Per location, per month**
- 3 tiers based on monthly Rx volume:

| Tier | Volume | Monthly Fee |
|------|--------|------------|
| Low | < 4,000 Rx/mo | $299 |
| Mid | 4,000 – 8,000 Rx/mo | $499 |
| High | > 8,000 Rx/mo | $750 |

### Stream 2: Transaction Fee
- **Per prescription processed through the platform**
- Range: **$0.75 – $2.00 per Rx**
- Charged to provider or patient (pharmacy's choice)
- Rate negotiated by sales rep at close — smaller pharmacies pay more per Rx, larger get volume discount
- Floor: $0.75 | Ceiling: $2.00

---

## 2. Combined Revenue Model

| Tier | Avg Rx/mo | Platform Fee | Trans. Fee (avg) | Trans. Revenue | Monthly Total | Annual Total |
|------|-----------|-------------|-----------------|----------------|--------------|-------------|
| Low | 2,000 | $299 | $2.00 | $4,000 | **$4,299** | **$51,588** |
| Mid | 6,000 | $499 | $1.50 | $9,000 | **$9,499** | **$113,988** |
| High | 10,000 | $750 | $0.75 | $7,500 | **$8,250** | **$99,000** |

> 💡 **Key insight:** Transaction fees dwarf the platform fee at every tier. A Low-tier pharmacy at 2,000 Rx/mo generates $4,299/mo — the platform fee is only 7% of that. Mid-tier is the revenue sweet spot: high volume at a higher per-Rx rate than High-tier. The platform fee is a commitment signal — transaction revenue is the real business.

---

## 3. Billing & Payments

| Item | Decision | Status |
|------|----------|--------|
| Platform fee billing | Monthly, per location | ✅ Confirmed |
| Transaction fee billing | Per Rx processed, charged to provider or patient | ✅ Confirmed |
| Annual billing option | Yes — 10% discount for annual commitment (only if no other major discounts applied to the deal) | ✅ Approved |
| Payment processor (platform fees) | **Stripe Billing** — automated recurring invoicing | ✅ Approved |
| High-risk payment processor (Rx transactions) | Confirmed partner — referral relationship in place (separate from Stripe) | ✅ In progress |
| Invoicing method | Stripe Billing — automated, handles retries and reporting | ✅ Approved |

---

## 4. Launch Pricing Strategy

> 🔴 TBD — Decision needed

Options:

**✅ Approved:** Beta pharmacies (Hillcrest, Mountainview) are asked to pay standard pricing but platform fee can be waived if needed. Transaction fees apply regardless — that's where the revenue is. Post-beta, standard pricing from day one for all new customers.

---

## 5. Setup / Implementation Fees

**✅ Approved model:** Setup fee = first month's platform fee (one-time, per location)

| Tier | Setup Fee |
|------|-----------|
| Low ($299/mo) | $299 |
| Mid ($499/mo) | $499 |
| High ($750/mo) | $750 |

- Sales rep has discretion to waive the setup fee to close a deal
- Beta pharmacies (Hillcrest, Mountainview): ask them to pay, waive if needed — transaction fee revenue is the priority anyway

---

## 6. Add-Ons / Upsells (Future)

> Post-launch roadmap items

- Additional locations (same account, new location = new tier fee)
- e-Prescribing / EHR integration
- Custom reporting / data exports
- Priority / dedicated support upgrade
- API access for enterprise integrations

---

## Notes
