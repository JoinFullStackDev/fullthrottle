# Sales

**Status:** 🟢 Complete  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] Disqualification criteria — what makes a pharmacy a pass? (Still being discovered)
- [ ] CRM selection — HubSpot vs. Salesforce (budget/scale dependent)
- [ ] SDR/AE team hiring timeline — when does first sales hire happen post-launch?
- [ ] Commission tracking dashboard — flagged for Axel, build before first sales rep is hired (not needed for founder-led phase)
- [ ] Revisit comp structure after first deals close — adjust if closing is too easy or reps are over/under-compensated
- [ ] Third beta pharmacy — Hillcrest and Mountainview confirmed, third TBD

---

## 1. Sales Motion

**Demo-led → Pilot → Full rollout**

1. Live product demonstration (Spencer-led at launch)
2. Invite a subset of the pharmacy's providers to participate
3. Validate workflow, gather feedback
4. Scale to all providers
5. Full go-live

This is a **sales-assisted motion** — not self-serve. HIPAA requirements, BAA execution, and workflow complexity make a consultative approach the right call.

---

## 2. Sales Team Structure

### Phase 1: Founder-Led (Launch → ~90 days post first clients)
- Spencer runs all sales
- Goal: close first 2–3 paying customers, learn the sales cycle firsthand
- Key output: document what works, build the playbook for future reps

### Phase 2: First Sales Hire (~90 days post-launch)
- Bring on first Account Executive
- Spencer transitions to player-coach, then full coach

### Phase 3: SDR + AE Team (Scale)
- **SDRs** — source and qualify leads, set demos
- **Account Executives** — run demos, manage pipeline, close deals
- SDRs feed AEs; AEs own the full cycle from demo to close
- Handoff to Onboarding on signed deal

---

## 3. Ideal Customer Profile (ICP)

| Attribute | Definition |
|-----------|-----------|
| Pharmacy type | Compounding pharmacy (503A) |
| Size | Independent / mom-and-pop — NOT enterprise at launch |
| Volume | Any tier (Low/Mid/High) — no volume floor initially |
| Geography | US only (HIPAA jurisdiction) |
| Tech maturity | Currently on manual workflow (phone/fax/spreadsheet) — most motivated to switch |
| Provider network | Has active prescribing providers, wants to grow relationships |

### Disqualification Criteria
> 🔴 Still being discovered — update as patterns emerge from early sales

Known disqualifiers:
- Enterprise / multi-chain pharmacy groups (not the initial target)
- Non-compounding retail pharmacy
- Outside the US

---

## 4. Sales Process

| Stage | Description | Target Duration |
|-------|-------------|----------------|
| **Prospect** | Identify pharmacy owner / decision maker | — |
| **Outreach** | Warm intro (via referral/association) or cold LinkedIn/email | — |
| **Discovery** | Understand current workflow, pain points, volume, provider count | Call 1 |
| **Demo** | Live product walkthrough tailored to their workflow | Call 2 |
| **Pilot** | Invite subset of providers to participate, validate workflow | 1–2 weeks |
| **Proposal** | Pricing + agreement sent, tier determined by volume | — |
| **Close** | Contract + BAA signed, payment method collected | — |
| **Handoff** | Warm handoff to Onboarding team, kickoff scheduled | Day of close |

**Estimated sales cycle:** ~30 days (hypothesis — validate with early deals)

---

## 5. Sales Rep Compensation Model

> ✅ **Approved — subject to revision after first deals close**

### Revenue Model Context
FullStackRx revenue has two components:
- **Platform fee:** $299 / $499 / $750 per location/month (based on Rx volume tier)
- **Transaction fee:** $0.75–$2.00 per prescription processed (negotiated by rep — provider or patient pays)

### Volume Tiers
| Tier | Rx/mo Volume | Platform Fee |
|------|-------------|-------------|
| Low | < 4,000 Rx/mo | $299 |
| Mid | 4,000 – 8,000 Rx/mo | $499 |
| High | > 8,000 Rx/mo | $750 |

### Compensation Structure (Approved)

| Component | Rate | Timing | Notes |
|-----------|------|--------|-------|
| **Close bonus** | 10% of platform ARR | Paid at close | Immediate cash — rep gets paid day of close |
| **Trailing commission** | 10% of transaction revenue | Monthly, for first 6 months | Incentivizes negotiating higher per-Rx fee and closing high-volume accounts |

### Close Bonus by Tier
| Tier | Platform Fee | ARR | Close Bonus |
|------|-------------|-----|------------|
| Low | $299/mo | $3,588 | **$359** |
| Mid | $499/mo | $5,988 | **$599** |
| High | $750/mo | $9,000 | **$900** |

### Example Payouts By Tier

**Low-tier pharmacy — ~2,000 Rx/mo, $299 platform fee:**

| Trans. Fee | Monthly Trans. Rev. | Close Bonus (10% ARR) | Trailing (10% x 6mo) | Total Rep Comp |
|-----------|--------------------|-----------------------|----------------------|---------------|
| $1.50/Rx | $3,000 | $359 | $1,800 | **$2,159** |
| $2.00/Rx | $4,000 | $359 | $2,400 | **$2,759** |

**Mid-tier pharmacy — ~6,000 Rx/mo, $499 platform fee:**

| Trans. Fee | Monthly Trans. Rev. | Close Bonus (10% ARR) | Trailing (10% x 6mo) | Total Rep Comp |
|-----------|--------------------|-----------------------|----------------------|---------------|
| $1.25/Rx | $7,500 | $599 | $4,500 | **$5,099** |
| $1.50/Rx | $9,000 | $599 | $5,400 | **$5,999** |

**High-tier pharmacy — ~10,000 Rx/mo, $750 platform fee:**

| Trans. Fee | Monthly Trans. Rev. | Close Bonus (10% ARR) | Trailing (10% x 6mo) | Total Rep Comp |
|-----------|--------------------|-----------------------|----------------------|---------------|
| $0.75/Rx | $7,500 | $900 | $4,500 | **$5,400** |
| $1.00/Rx | $10,000 | $900 | $6,000 | **$6,900** |

### Guardrails
- Comp structure to be reviewed after first 5–10 deals close
- If closing rate is high and deal complexity is low, consider reducing close bonus % or capping payout
- If reps are underperforming, revisit trailing period or rate
- Commission tracking: requires product-side dashboard (flagged as engineering requirement)

---

## 6. Beta / Design Partners

> These pharmacies have agreed to be early adopters — critical for product validation and first case studies

| Pharmacy | Status | Notes |
|----------|--------|-------|
| Hillcrest | ✅ Confirmed | Beta partner |
| Mountainview | ✅ Confirmed | Beta partner |
| TBD | 🟡 Maybe | Third potential beta pharmacy |

> Beta partners should be onboarded before launch (May 28) to validate the full workflow end-to-end.

---

## 7. Sales Collateral Needed

> Build before launch

- [ ] 1-page product overview / leave-behind
- [ ] Demo script / talk track (tailored to compounding pharmacy pain points)
- [ ] ROI one-pager (time saved on Rx intake, error reduction, provider network growth)
- [ ] Objection handling guide
- [ ] Competitive battle card (vs. AutopilotRX, vs. status quo)
- [ ] Case studies (post-launch — start with Hillcrest and Mountainview)

---

## 8. CRM & Pipeline Management

- **Current:** Homegrown system
- **Future:** HubSpot or Salesforce (decision based on budget and scale velocity)
- **Minimum viable pipeline tracking:** Lead → Discovery → Demo → Pilot → Proposal → Close → Handoff

---

## 9. Sales Targets

| Period | Goal | Notes |
|--------|------|-------|
| Pre-launch (now → May 28) | 2–3 beta pharmacies live | Hillcrest + Mountainview + TBD |
| Months 1–3 post-launch (June–August) | 3 pharmacies running and stable | Validate workflow, build case studies |
| End of Year 1 (December 2026) | 5–10 total paying pharmacies | 2–7 new adds on top of the 3 betas |
| ~90 days post first clients | First sales hire | Transition from founder-led |

---

## 10. Sales Collateral Action Items

> Build before or shortly after launch

| Item | Description | Priority | Status |
|------|-------------|----------|--------|
| **1-page product overview** | Leave-behind for pharmacy owners — what FullStackRx does, key benefits, pricing tiers | 🔴 High | Not started |
| **Demo script / talk track** | Step-by-step guide for running the demo, tailored to compounding pharmacy pain points (Rx intake, provider workflow, patient tracking, payments) | 🔴 High | Not started |
| **Objection handling guide** | Responses to top objections: "We already use PioneerRx", "We're happy with our current process", "We can't afford it", "What about HIPAA?" | 🔴 High | Not started |
| **Competitive battle card** | Quick-reference vs. AutopilotRX and status quo (phone/fax/spreadsheet) | 🟡 Medium | Not started |
| **ROI one-pager** | Time saved on Rx intake, reduced errors, provider network growth — make the value tangible | 🟡 Medium | Not started |
| **Case studies** | Hillcrest and Mountainview stories post-launch | 🟡 Medium | Post-launch |

> 💡 **Note:** Demo script is the most critical pre-launch asset. Spencer is running all early sales — a tight, repeatable demo script is the difference between a consistent pitch and reinventing it every call.

---

## Notes
