# Billing & Subscription Readiness MVP

Date: 2026-06-06

Scope: Commercial readiness for Tian OS paid pilots and subscriptions. This is not payment collection and not accounting.

## Current Billing / Payment Audit

Existing:

- `models/Payment.js` stores booking payment records.
- `routes/payments.js` integrates Stripe Payment Intents for tutor bookings.
- `frontend/src/pages/PaymentPage.jsx` and `frontend/src/services/stripe.js` support booking payments.
- Static feature flags exist in `frontend/src/config/featureFlags.js`.
- Backend feature gating exists in `middleware/featureGate.js`.
- Partner / centre management exists through `PartnerOrganisation`, `PartnerMembership`, and `PartnerStudent`.

Missing before this sprint:

- No plan model.
- No subscription model.
- No commercial feature-access service.
- No usage-limit summary for diagnostics, paper uploads, worksheets, Recovery Packs, reports, students, or staff.
- No admin billing view.
- No partner billing panel.
- No pilot override mechanism.

## New Models

### `models/BillingPlan.js`

Plans:

- `free`
- `parent_basic`
- `parent_plus`
- `tutor_pro`
- `student_care_pilot`
- `centre_pro`
- `school_pilot`
- `internal_admin`

Stores prices, limits, features, and status.

### `models/Subscription.js`

Stores owner subscriptions for:

- users
- partners

Supports:

- trial / active / paused / cancelled / expired
- trial dates
- current period dates
- student and staff limits
- feature flag overrides
- pilot overrides: internal pilot, free pilot, paid pilot, extended trial

### `models/BillingUsageEvent.js`

Stores explicit usage counters for events not always represented by domain records, such as generated/viewed reports.

## New Services

### `services/billing/featureAccessService.js`

Provides feature checks:

- diagnostics
- paper analysis
- Recovery Packs
- worksheet generator
- tutor lesson prep
- student care dashboard
- teacher mode
- impact reports
- add student
- add staff

Safe unavailable response:

> This feature is not included in the current plan.

### `services/billing/usageTrackingService.js`

Aggregates:

- number of students
- number of staff
- completed diagnostics
- uploaded papers
- worksheets generated
- Recovery Packs assigned
- reports generated
- reports viewed

Uses existing domain records where available plus explicit billing usage events.

### `services/billing/billingAdminService.js`

Builds the admin billing overview and partner billing summary.

## New Admin Routes

- `GET /api/admin/billing`
- `GET /api/admin/billing/partner/:partnerId`
- `POST /api/admin/billing/subscriptions`

These are admin-only and do not collect payment.

## New UI

- `/admin/billing`
- Partner detail billing readiness card

Admin can see:

- owner
- current plan
- trial/subscription status
- pilot override
- usage
- limits
- placeholder upgrade/downgrade actions through plan selection

Partner detail shows:

- current plan
- student limit
- staff limit
- monthly usage
- trial end date

## Pilot Safety

No existing core student learning flow was gated or blocked in this sprint.

Current pilot users are protected because:

- backend feature gates were not tightened
- student learning routes were not paywalled
- feature-access checks are service-level readiness functions
- pilot overrides can unlock features for internal/free/paid pilot accounts

## What Remains Placeholder

- No Stripe subscriptions.
- No checkout.
- No invoices.
- No receipts.
- No proration.
- No cancellation billing workflow.
- Upgrade/downgrade actions update internal subscription records only.
- Usage events need to be recorded by future paid-flow integrations at key product actions.

## Recommended Next Sprint

Add Stripe subscription checkout and webhook reconciliation:

1. Map `BillingPlan.planType` to Stripe product/price ids.
2. Create hosted checkout session endpoint.
3. Add subscription webhook handling.
4. Reconcile Stripe subscription status into `Subscription`.
5. Add non-blocking paywall components to adult-only premium features.
6. Keep student pilot learning routes accessible during rollout.

