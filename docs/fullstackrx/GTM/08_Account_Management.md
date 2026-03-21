# Account Management

**Status:** 🟡 Draft  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] What features are planned as paid upsells / upgrades? (upsell motion tied to product roadmap)
- [ ] At-risk dashboard — flagged as product/engineering requirement (see Section 5)
- [ ] AM compensation structure — define when first AM hire is made
- [ ] What is the target book of business size per AM?

---

## 1. Role Definition

Account Management owns **expansion and retention** of the pharmacy customer base after full onboarding.

| Responsibility | AM | CS |
|---------------|----|----|
| Grow accounts (upsells, new features) | ✅ Primary | — |
| Proactive outreach and relationship management | ✅ Primary | — |
| Training and "how do I do X" questions | ✅ Yes | — |
| Technical issues / bugs / errors | — | ✅ Primary |
| Cancellation save / retention | ✅ Lead | ✅ Support |
| Measured on | Book of business retention QoQ | Support resolution |

> **The distinction:** If a pharmacy can't log in → CS. If they don't know how to add a new employee → AM. If they want to cancel because of a technical issue → AM and CS work it together. AM leads the save, CS solves the technical problem.

---

## 2. Account Lifecycle

```
Deal Closed → Onboarding (Drake) → Fully Onboarded → AM Book of Business → Renewal / Expansion / Cancellation
```

- Accounts enter AM's book of business when **fully onboarded** (all providers live, Day 30–60)
- AM owns the account from that point forward
- CS is available to AM as a resource — they work together on complex issues

---

## 3. AM Team Structure

### Launch Phase (Drake)
- Drake handles Sales, Onboarding, AM, and CS simultaneously
- As volume grows, these functions split out

### Scaling Path
| Phase | Structure |
|-------|-----------|
| Launch | Drake covers all |
| First hire | One person covering AM + CS combined |
| Scale | AM and CS split into separate departments |
| Mature | AM team with defined books of business per rep |

---

## 4. Expansion Motion

Growth for FullStackRx accounts comes primarily from **new features and product upgrades** — not more seats or locations (though those are secondary).

| Expansion Type | Description | Who Drives |
|---------------|-------------|-----------|
| New feature upsells | As FullStackRx releases new paid features, AM presents to existing customers | AM |
| Tier upgrades | Pharmacy grows Rx volume and crosses into a higher tier | Automatic at renewal based on volume |
| Additional locations | Same pharmacy group adds a new location | AM identifies and pitches |
| Provider network growth | More providers → more Rx volume → more transaction revenue (not billed separately, but increases AM's book value) | AM tracks and encourages |

> 🔴 **Note:** Specific paid upsell features TBD — tied to product roadmap. AM team needs a clear upsell menu to work from. Add to product planning.

---

## 5. Retention & Health Scoring

### At-Risk Signals
An account is flagged as at-risk when any of the following are true:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Rx volume drop | >25% decline week-over-week for 2+ weeks | AM proactive outreach |
| Provider count stagnant or declining | No new providers in 30 days AND existing providers reducing Rx | AM check-in |
| Login frequency drop | Pharmacy admin not logging in for 14+ days | AM outreach |
| Support ticket spike | 3+ CS tickets in a 7-day window | AM + CS sync |
| Cancellation flag raised | Any cancellation request | AM immediate response |

### Health Score Framework (Draft)

| Score | Definition | AM Action |
|-------|-----------|-----------|
| 🟢 Healthy | Growing Rx volume, active providers, regular logins | Quarterly check-in, look for expansion |
| 🟡 Neutral | Flat volume, no growth signals, occasional logins | Monthly check-in, understand blockers |
| 🔴 At-Risk | Declining volume, low engagement, support issues | Immediate proactive outreach |

### At-Risk Dashboard (Engineering Requirement)
> 🔴 Flag for Axel — AM needs a dashboard view showing:
> - Per-pharmacy Rx volume trend (week-over-week)
> - Active provider count trend
> - Last login date (pharmacy admin)
> - Open CS tickets count
> - Health score (auto-calculated from above signals)
> - Accounts sorted by health score so AM sees at-risk accounts first

---

## 6. Cancellation & Save Process

- Contracts auto-renew monthly
- **30 days written notice** required to cancel (not 90 — corrected from Agreements doc)
- When a cancellation request comes in:
  1. AM is immediately notified
  2. AM schedules a save call within 24 hours
  3. If technical issue is the reason → CS engaged to resolve, AM holds the relationship
  4. AM documents the reason and outcome regardless of result
  5. If saved: document what resolved it, flag for product/CS follow-up
  6. If lost: exit interview — why did they leave? Feed into product and CS improvements

---

## 7. AM Metrics & Measurement

AMs are measured **quarterly** on their book of business:

| Metric | Definition | Target |
|--------|-----------|--------|
| **Book Retention Rate** | % of MRR retained from book QoQ | > 90% |
| **Net Revenue Retention (NRR)** | MRR retained + expansion / starting MRR | > 110% |
| **Saves** | % of cancellation requests successfully retained | TBD |
| **Upsell Revenue** | New MRR added from existing accounts | TBD once upsell menu defined |
| **At-Risk Resolution** | % of at-risk accounts moved back to healthy within 30 days | > 70% |

---

## 8. Cadence by Account Health

| Health | Check-in Frequency | Format |
|--------|--------------------|--------|
| 🟢 Healthy | Quarterly | Email or brief call |
| 🟡 Neutral | Monthly | Call — understand blockers, look for growth |
| 🔴 At-Risk | Immediate + weekly until resolved | Call — AM + CS together if technical |

---

## Notes
