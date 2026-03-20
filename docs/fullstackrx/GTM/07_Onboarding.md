# Onboarding

**Status:** 🟡 Draft  
**Last Updated:** 2026-03-20

---

## Open Questions

- [ ] What does the in-app account setup wizard look like? (engineering requirement — step-by-step setup flow)
- [ ] CSV upload format for providers and prescriptions — what fields are required?
- [ ] How does the high-risk payment processor application get triggered? (in-app form, external link, or handled by FullStackRx on their behalf?)
- [ ] What is the onboarding checklist definition of "fully onboarded"? (items to define)
- [ ] Weekly provider webinar — who hosts? Spencer at launch, then who?
- [ ] Training video production — who creates them and when?
- [ ] PioneerRx integration onboarding flow — how does it get initiated for pharmacies on that system?

---

## Philosophy

**Day 1 value, Day 14 live Rx.**

Pharmacies should feel like they're getting value the moment they log in — even before the payment processor is approved. The onboarding experience is designed to keep them actively building their account while the payment approval runs in the background. By the time approval comes through (~2 weeks), they should be ready to process their first prescription immediately.

---

## 1. Onboarding Trigger — Deal Close

When a deal is marked **Closed Won** in the CRM:

1. Setup fee is automatically collected via Stripe
2. Recurring payments are scheduled
3. **Welcome email sent automatically** — invites pharmacy owner to create their FullStackRx account
4. Onboarding kickoff call scheduled (Spencer at launch)
5. Sales rep is notified — deal handoff complete

---

## 2. Phase 1: Pharmacy Account Setup (Day 1–3)

Pharmacy logs in for the first time and is walked through an in-app setup wizard. FullStackRx walks them through each step on an onboarding call.

| Step | Description | Owner | How |
|------|-------------|-------|-----|
| Create username & password | Pharmacy owner creates account via welcome email link | Pharmacy | Automated |
| Pharmacy profile | Name, address, license number, contact info | Pharmacy | Self-serve in wizard |
| **Apply for high-risk payment processor** | Application submitted — approval takes up to 2 weeks | Pharmacy + FullStackRx | In-app or assisted |
| Invite pharmacy staff | Email invitations sent to employees to join the account | Pharmacy | In-app invite flow |
| Formulary / product catalog setup | Upload compounding products and pricing | Pharmacy or FullStackRx | CSV upload or admin-assisted (FullStackRx logs into admin account and inputs data if pharmacy provides it) |
| Upload providers | Existing provider list imported | Pharmacy | CSV upload or PioneerRx integration |
| Upload existing prescriptions | Historical Rx data (if applicable) | Pharmacy | CSV upload from EHR (most start fresh) |

> **Note on formulary:** If the pharmacy can provide their product list, FullStackRx will input it for them via the admin account. If not, the pharmacy does it themselves via self-serve. Either way it should be done in the first 3 days.

---

## 3. Phase 2: Provider Onboarding (Day 2–7)

Providers are onboarded in parallel with pharmacy setup — no need to wait.

### How It Works
- Pharmacy sends provider invitations directly from the platform
- Provider receives an email explaining: *"[Pharmacy Name] has a new process for accepting prescriptions. Download FullStackRx and create your account to get started."*
- Provider creates their own account — mostly self-serve
- Provider completes their profile (name, NPI, specialty, license)
- Provider is automatically linked to the inviting pharmacy

### Provider Training (Self-Serve)
- Training videos available on demand (to be produced before launch)
- **Weekly live webinar** — providers can join to learn the platform, ask questions
  - Hosted by Spencer at launch
  - Frequency: weekly (consolidates provider questions, scales better than 1:1 support)
- No dedicated onboarding calls for providers — self-serve with video + webinar support

---

## 4. Phase 3: Patient Onboarding (Ongoing — Day 7+)

Patients are onboarded by providers as prescriptions are created — not a bulk onboarding event.

### How It Works
- Provider creates a patient record in the platform (phone number + DOB)
- Patient receives an automated email with a setup link
- Patient creates their account via the link (phone-based Cognito auth)
- Patient can immediately view their profile and track their prescriptions

### Patient Training
- Training videos available (simple, non-technical — to be produced before launch)
- No webinars for patients
- No onboarding calls — must be fully self-serve

---

## 5. Phase 4: Go-Live (Day 14~)

Once the high-risk payment processor is approved:

1. Payment processing is activated on the account
2. FullStackRx confirms with pharmacy — go-live call or notification
3. First live prescription is submitted and processed
4. Pharmacy is officially **onboarded**
5. Handoff to Account Management / Client Success

---

## 6. Onboarding Checklist

> The following tasks must be completed before an account is considered **fully onboarded**. Displayed in-app as a progress tracker so the pharmacy can see what's left.

### Pharmacy Checklist
- [ ] Account created and profile complete
- [ ] Payment processor application submitted
- [ ] At least 1 staff member invited
- [ ] Formulary / product catalog uploaded (minimum viable — can add more later)
- [ ] At least 3 providers invited
- [ ] Payment processor approved ← **go-live gate**
- [ ] First prescription processed ← **onboarded ✅**

### Provider Checklist (per provider)
- [ ] Account created
- [ ] Profile complete (NPI, specialty, license)
- [ ] At least 1 patient created
- [ ] First prescription submitted

---

## 7. Onboarding Timeline

| Milestone | Target | Notes |
|-----------|--------|-------|
| Welcome email sent | Day 0 (same day as close) | Automated on deal close |
| Kickoff onboarding call | Day 1 | Spencer-led at launch |
| Pharmacy profile complete | Day 1–2 | Done on first call |
| Payment processor applied | Day 1–2 | Start immediately — clock is ticking |
| Formulary uploaded | Day 2–3 | FullStackRx assists if data provided |
| First providers invited | Day 2–3 | |
| Staff invited | Day 2–3 | |
| Providers creating accounts | Day 3–7 | Self-serve with video/webinar support |
| Payment processor approved | Day 7–14 | External dependency — up to 2 weeks |
| First live Rx processed | Day 14~ | Immediately after payment processor approval |
| **Fully onboarded** | Day 14~ | Handoff to AM/CS |

---

## 8. Onboarding Resources Needed

> Build before launch

| Resource | Audience | Format | Status |
|----------|----------|--------|--------|
| Welcome email template | Pharmacy owner | Email | 🔴 Not started |
| In-app setup wizard | Pharmacy | Product feature | 🔴 Engineering requirement |
| Onboarding call script / checklist | Spencer (internal) | Doc | 🔴 Not started |
| Pharmacy training video | Pharmacy staff | Video | 🔴 Not started |
| Provider training video | Providers | Video | 🔴 Not started |
| Patient training video | Patients | Video | 🔴 Not started |
| Weekly provider webinar deck | Providers | Slides | 🔴 Not started |
| CSV upload templates | Pharmacy | CSV file | 🔴 Engineering requirement |
| In-app onboarding checklist | Pharmacy | Product feature | 🔴 Engineering requirement |
| Knowledge base / help center | All | Articles | 🔴 Not started |

---

## 9. Onboarding Team Structure

| Phase | Owner | Notes |
|-------|-------|-------|
| **Launch** | Spencer | Handles all onboarding, AM, and CS |
| **~6 months post-launch** | First onboarding/AM/CS hire | One person covering all three functions |
| **Scale** | Three separate departments | Onboarding, Account Management, Client Success split as team grows |

---

## 10. Technical Notes (From Codebase)

Already built in the platform:
- Pharmacy registration and multi-step setup flow
- Provider invitation flow (email invite → account creation → pharmacy linking)
- Patient invitation flow (phone-based Cognito auth, email invite with setup link)
- Prescription lifecycle (browse products → prescribe → submit → approve → fill)
- Role-based access (Admin / Pharmacy / Provider / Patient)
- Email delivery via AWS SES
- HIPAA-compliant infrastructure (encrypted columns, JWT auth)

**Engineering requirements flagged from this doc:**
- In-app setup wizard (step-by-step account setup flow)
- In-app onboarding checklist with progress tracker
- CSV upload for providers and prescriptions
- PioneerRx integration onboarding flow

---

## Notes
