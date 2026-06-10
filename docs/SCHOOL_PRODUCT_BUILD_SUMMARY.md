# School Product Build — Summary & Handoff

_What was built across the teacher-dashboard / school-onboarding / parent-invites / tiers / billing work, the files and endpoints involved, the environment values to set, and how to verify locally._

---

## 1. What this delivered

Starting from "prioritise the teacher dashboard," the work grew into the full school go-to-market surface:

- A **real-data teacher dashboard** that leads with a "Needs you this week" flag list (students needing in-person remediation, the exact skill and reason), plus per-domain grasp, a skill heatmap, search-by-name, status filters, and a class switcher for teachers with more than one class.
- A **school administrator role** (HOD/IT) with a console for **bulk onboarding** — CSV roster import (quote-aware, deduping, per-row results) and per-class **join codes** for student self-enrolment.
- **Parent email invitations** to a free **view-only** school dashboard, with accept-by-link account creation.
- Three **account tiers** — Trial, Premium Home, School — enforced by a single entitlements layer.
- A **14-day trial** with countdown and expiry downgrade.
- **Premium Home as an annual PayNow fee** (no recurring billing): parent requests → pays by PayNow → admin verifies next business day → 12-month activation. Early renewal earns a discount and stacks on remaining time; access hard-locks at expiry.
- **Automated renewal reminder emails** (45/14/3 days before, plus a just-expired notice).

---

## 2. Account tiers

| Capability | Trial | Premium Home | School |
|---|---|---|---|
| Who buys | Anyone (free, 14 days) | A parent (annual PayNow) | A school (HOD/IT) |
| Parent dashboard | Preview only | Full + assign practice | View-only (invited free) |
| Per-skill remediation flags | — | ✅ | ✅ |
| Exportable reports | — | ✅ | ✅ |
| School admin console | — | — | ✅ |
| Teacher dashboards | — | — | ✅ |
| Bulk onboarding (CSV + codes) | — | — | ✅ |

Tiers are resolved in `services/billing/entitlements.js` from the underlying `BillingPlan` (`parent_plus` = Premium Home, `school_pilot` = School, free/none = Trial). The resolver also handles trial expiry and annual-period expiry (both hard-lock to the Trial tier).

---

## 3. New & changed files

**Models** — new: `ClassJoinCode.js`, `ParentInvite.js`, `UpgradeRequest.js`. Edited (additive only): `User.js`, `Workspace.js`, `WorkspaceMember.js` (added `school_admin` role), `StudentGuardian.js` (added `accessLevel` + `source`).

**Services** — `services/billing/entitlements.js`, `services/billing/premiumHomePricing.js`, `services/teacher/classDashboardService.js`, `services/school/schoolAdminService.js`.

**Middleware** — `middleware/entitlements.js` (`loadEntitlements`, `requireEntitlement`).

**Routes** — new: `routes/schoolAdmin.js`, `routes/parentInvites.js`, `routes/join.js`, `routes/billing.js`. Edited: `routes/teacher.js` (dashboard endpoint), `routes/context.js` (entitlements endpoint). All mounted in `server.js`.

**Scripts** — `scripts/sendRenewalReminders.js` (npm: `remind:renewals`).

**Email** — `utils/emailService.js` gained `sendParentInvite` and `sendPremiumHomeRenewalReminder`.

**Frontend** — new pages: `admin/school/SchoolAdminConsole.jsx`, `ParentInviteConnectPage.jsx`, `student/JoinClassPage.jsx`, `BillingSuccessPage.jsx`, `parent/PremiumHomeUpgradePage.jsx`, `admin/PendingUpgradesPage.jsx`; new components: `PremiumHomeUpgrade.jsx`, `context/useEntitlements.js`. Edited: `teacher/TeacherMathPathDashboardPage.jsx`, `teacher/TeacherStudentDetail.jsx`, `parent/ParentHome.jsx`, `services/api.js`, `App.jsx`, `config/nav.js`.

---

## 4. API endpoints added

- `GET /api/context/entitlements` — current account's tier + capabilities.
- `GET /api/teacher/classes/:id/dashboard` — real class overview, flagged students, domains, skill heatmap, roster.
- `GET /api/school-admin/overview`, `POST /classes`, `POST /students`, `POST /students/bulk`, `POST|GET /classes/:id/join-code`.
- `POST /api/parent-invites`, `GET /:token`, `POST /:token/accept`, `GET /children/list`.
- `GET /api/join/:code`, `POST /api/join/:code`.
- Billing: `GET /me`, `POST /start-trial`, `GET /premium-home/offer`, `POST /premium-home/request`, `GET /premium-home/pending`, `POST /premium-home/requests/:id/activate`, `POST /premium-home/requests/:id/reject`. Legacy Stripe (optional): `POST /checkout/premium-home`, `POST /checkout/confirm`, `POST /dev/activate-premium-home`.

**Frontend routes:** `/school-admin`, `/connect/parent/:token`, `/join` & `/join/:code`, `/billing/success`, `/parent/upgrade`, `/admin/pending-upgrades`.

---

## 5. Environment values to set

| Variable | Purpose | Notes |
|---|---|---|
| `PREMIUM_HOME_ANNUAL_SGD` | Standard annual price | **Not yet decided** — placeholder until set; UI warns. |
| `PREMIUM_HOME_EARLY_RENEWAL_SGD` | Discounted early-renewal price | Should be ≤ annual. |
| `PREMIUM_HOME_SCHOOL_BULK_SGD` | Optional whole-school per-parent rate | Optional. |
| `PREMIUM_HOME_EARLY_RENEWAL_WINDOW_DAYS` | How early a renewal counts as "early" | Defaults to 45. |
| `PAYNOW_PAYEE_NAME` | Shown on the upgrade screen | Set before launch. |
| `PAYNOW_UEN` / `PAYNOW_MOBILE` | PayNow target | At least one required for parents to pay. |
| `PAYNOW_INSTRUCTIONS` | Free-text pay instructions | Has a sensible default. |
| `APP_BASE_URL` (or `FRONTEND_URL`) | Builds invite / upgrade / reminder links | Required for correct links in emails. |
| `EMAIL_SERVICE` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` | Transactional email (nodemailer) | Needed for invites + reminders to actually send. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Legacy card path only | Not needed for the PayNow flow. |
| `NODE_ENV` | Gates the dev-only activation shortcut | Set `production` in prod. |

---

## 6. Operational notes

- **Manual reconciliation.** Annual PayNow means a human matches the payment reference in your bank feed to a pending request in `/admin/pending-upgrades`, then clicks Activate. This is by design but is recurring admin work as volume grows.
- **Daily cron.** Schedule `npm run remind:renewals` once per day (Railway scheduled job / crontab). Daily cadence is what makes the 45/14/3/0-day reminders fire exactly once each.
- **School billing.** Schools are expected to pay by invoice / bank transfer (outside Stripe), so the school tier doesn't depend on any payment integration here.

---

## 7. Verification status

Checked as far as the build environment allows: all backend files pass `node --check` and import cleanly; focused logic tests pass for the entitlements/tier rules, the dashboard flag engine, the CSV parser + join-code generator, the trial/annual expiry hard-lock, and the reminder schedule; all touched frontend files parse via `@babel/parser`.

**Not yet done:** nothing has run against the live app, a real database, or the full `vitest` suite (the repo's installed native binaries are built for macOS, not the build sandbox). Before a pilot, run locally:

```
npm run dev          # backend + frontend
npx vitest run       # full backend test suite
```

Set the PayNow env values and a real price first, and do an end-to-end pass of: school admin bulk import → teacher dashboard flags → parent invite accept → student join code → trial → annual PayNow upgrade → admin activate → renewal reminder dry-run (`node scripts/sendRenewalReminders.js --dry-run`).

---

## 8. Still ahead (not built)

- A student-facing entry point/link to the join screen in the student nav (the screen + route exist; only a nav shortcut is missing).
- Automated PayNow reconciliation (a gateway like HitPay) if manual verification becomes too heavy.
- Final price + PayNow details (pending your decision).
