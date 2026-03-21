# Client Success

**Status:** 🟢 Complete  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] Ticketing system — informal now, needs to be addressed as team scales (Intercom, Zendesk, Linear, etc.)
- [ ] Phone support — add when team grows beyond Drake
- [ ] CS compensation structure — define when first CS hire is made
- [ ] Knowledge base platform — where do help articles, training videos, and FAQs live?

---

## 1. Role Definition

CS owns **technical issue resolution** — bugs, errors, login problems, integration failures. They are the technical problem-solvers. AM owns the relationship; CS owns the fix.

| Responsibility | CS | AM |
|---------------|----|----|
| Technical issues, bugs, errors | ✅ Primary | — |
| Login / access issues | ✅ Primary | — |
| Training ("how do I do X") | — | ✅ Primary |
| Relationship management | — | ✅ Primary |
| Cancellation save | ✅ Support | ✅ Lead |
| Knowledge base & help resources | ✅ Shared with AM and Onboarding | |
| Training videos | ✅ Shared with Onboarding | |

> **The rule:** Technical problem → CS. Relationship / training / growth → AM. Cancellation due to technical issue → both, working together.

---

## 2. CS Team Structure

### Launch Phase (Drake)
Drake handles Sales, Onboarding, AM, and CS simultaneously.

### Scaling Path
| Phase | Structure |
|-------|-----------|
| Launch | Drake covers all |
| First hire | One person covering AM + CS combined |
| Scale | AM and CS split into separate departments |
| Mature | Dedicated CS team with defined specialties |

---

## 3. Support Channels

| Channel | Available Now | Notes |
|---------|--------------|-------|
| **In-app support** | Yes (at launch) | Primary channel |
| **Email** | Yes (at launch) | Primary channel |
| **Phone** | No — future | Initially customers reach Drake directly; formal phone support added as team scales |

> At launch, pharmacies will likely contact Drake directly via phone or text for urgent issues. This is fine early on but needs to be formalized into a ticketing/support system as volume grows.

---

## 4. SLA — Support Response Times

**All tiers: 24-hour first response** (business hours)

| Tier | First Response | Resolution Target |
|------|---------------|------------------|
| Low ($299) | 24 business hours | Best effort |
| Mid ($499) | 24 business hours | Best effort |
| High ($750) | 24 business hours | Priority handling |

> SLA updated from tiered (24hr/8hr/4hr) to flat 24hr across all tiers at launch. Revisit as team grows and capacity allows differentiated response times.

---

## 5. Issue Escalation Path

| Severity | Description | Path |
|----------|-------------|------|
| **L1 — Self-serve** | User error, how-to question, training gap | Redirect to knowledge base / training video → AM if persistent |
| **L2 — CS resolvable** | Access issues, configuration errors, non-code bugs | CS resolves directly |
| **L3 — Bug / engineering needed** | Code-level bug, integration failure, data issue | CS submits bug report → assigned directly to engineering team member |
| **L4 — Critical / escalated** | Platform down, data integrity issue, HIPAA concern | Drake escalates immediately → engineering + Spencer |

> Engineering bugs are submitted by CS and assigned directly to the relevant team member — no intermediary required at launch. As team formalizes, this flows through a ticketing system.

---

## 6. Feedback & Bug Tracking

**Current state:** Informal — CS flags issues directly to engineering.

**Future state:** Formal ticketing system needed as volume grows.

| Tool Type | Options to Evaluate | Priority |
|-----------|-------------------|---------|
| Customer support / ticketing | Intercom, Zendesk, HelpScout | Post-launch |
| Internal bug tracking | Linear (already likely in eng workflow), Jira | Post-launch |
| Integration | Support ticket → auto-creates bug in Linear | Future |

> 🔴 **Action item:** Evaluate and select a ticketing system before first CS hire. Drake shouldn't be managing bugs via text/email at scale.

---

## 7. Shared Resources (CS + AM + Onboarding)

| Resource | Owned By | Shared With |
|----------|---------|------------|
| Training videos (pharmacy) | CS + Onboarding | AM |
| Training videos (provider) | CS + Onboarding | AM |
| Training videos (patient) | CS + Onboarding | — |
| Knowledge base / help center | CS | AM, Onboarding |
| FAQ articles | CS | AM, Onboarding |
| Weekly provider webinar | Onboarding (Drake) | CS joins for technical Q&A |

---

## 8. CS Success Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| First Response Time | Time from ticket open to first CS reply | < 24 business hours |
| Resolution Rate | % of tickets resolved without engineering escalation | > 80% |
| CSAT | Post-resolution customer satisfaction score | > 4.0 / 5.0 |
| Escalation Rate | % of tickets escalated to engineering | < 20% |
| Churn from Technical Issues | Accounts lost where technical issue was primary reason | Minimize — track and report |

---

## 9. Voice of the Customer

CS is the closest team to customer pain. Their feedback should feed directly into product:

- **Now:** CS flags recurring issues to Drake informally → Drake prioritizes with engineering
- **Future:** Structured feedback loop — CS tags ticket types, product team reviews weekly, top issues inform roadmap

---

## Notes
