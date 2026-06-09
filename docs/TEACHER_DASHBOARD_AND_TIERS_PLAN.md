# Teacher Dashboard, School Onboarding & Account Tiers — Prioritised Plan

_Drafted 9 Jun 2026. Scope: prioritise the teacher dashboard, make school/level onboarding easy, add an email-invited parent dashboard, and split the product into three account tiers (School, Premium Home, Trial)._

---

## 1. What already exists (so we build, not rebuild)

| Area | Status today | File(s) |
|---|---|---|
| Teacher dashboard | Built, but driven by **synthetic data** (mastery → fake skill statuses) | `frontend/src/pages/teacher/TeacherMathPathDashboardPage.jsx`, `frontend/src/mathpath/dashboard/teacherMathPathDashboardEngine.js` |
| Class / roster model | Solid | `models/Class.js`, `models/ClassStudent.js`, `models/Student.js` |
| Workspaces & isolation | Solid (school vs tutor vs parent data boundaries) | `models/Workspace.js`, `models/WorkspaceMember.js`, `middleware/workspace.js` |
| Parent ↔ student link | Exists | `models/StudentGuardian.js`, `routes/family.js` |
| Parent dashboards | Built | `frontend/src/pages/parent/*` |
| Real mastery data | Exists for the teacher routes | `routes/teacher.js`, `models/MasteryRecord.js`, `models/FluencyRecord.js` |
| Billing tiers | Models exist (`trial`, `school_pilot`, `parent_basic`, `parent_plus`…) but **not enforced** in UI/data | `models/Subscription.js`, `models/BillingPlan.js` |
| Email sending | Ready (nodemailer) | `utils/emailService.js` |

**The four real gaps:**

1. **No school-administrator role.** There's only the internal platform `admin`. A HOD/IT-support person needs a scoped "school admin" who can create accounts for *their* school but nothing else.
2. **No bulk onboarding.** No CSV roster import and no class join codes. Today students are created one-by-one by a parent/tutor (`routes/students.js`).
3. **No parent email-invite flow.** Parents can't be invited by email to a view-only school dashboard.
4. **The teacher dashboard's flags aren't trustworthy** because they run on `buildSynthetic*` placeholders instead of real per-skill records.

---

## 2. The three tiers (decision: gate by **features + parent access + reports**, not just seats)

| Capability | Trial | Premium Home | School |
|---|---|---|---|
| Who buys | Anyone, self-serve | A parent | A school (HOD/IT) |
| Student seats | 1–2, time-limited (14 days) | 1–5 children | Whole level/school |
| Admin console | — | — | ✅ School admin (HOD/IT) |
| Bulk CSV + join codes | — | — | ✅ |
| Teacher class dashboard | — | — | ✅ |
| Parent dashboard | Preview only (summary cards, no per-skill drill-down) | **Full** — drill-down + assign practice | **View-only** — invited free to see their child's progress; no assign |
| Per-skill remediation flags | Summary band only | ✅ Full | ✅ Full (teacher + parent view) |
| Printable / exportable reports | — | ✅ | ✅ |
| Upgrade path | → Premium Home or School | → (already paid) | (school-level contract) |

Implementation: a `planType` already lives on `BillingPlan`; we add a small **feature-flag resolver** (`services/billing/entitlements.js`) that maps a user's active `Subscription` → a capability set, and a `requireEntitlement('parent.assignPractice')` middleware + a `useEntitlements()` React hook. One source of truth, checked on both server and client. Premium Home is the upsell surfaced inside Trial and inside the School parent view ("want to do this at home too?").

---

## 3. Prioritised build order

Ordered by *unblocks-the-most* and *trust*. Each phase is shippable on its own.

### Phase 0 — Foundations (entitlements + school-admin role) — _build first, everything leans on it_
- Add `school_admin` to `User.roles`, `Workspace.role` and `WorkspaceMember.role`. Distinct from platform `admin`; scoped to one `school` workspace via `Workspace.orgId`.
- `services/billing/entitlements.js` — resolve subscription → capability map; seed the three plans (`trial`, `parent_plus` = Premium Home, `school_pilot` = School).
- `requireEntitlement()` middleware + `useEntitlements()` hook.
- **Why first:** the dashboard, parent invites and tiers all gate on this.

### Phase 1 — Wire the teacher dashboard to real data (trust) + glance-ability — _parallel workstream A_
- Replace `buildSyntheticStudentProgressStates / Assessment / MistakePlans / WorkingSummaries` with a real server aggregation: new `GET /api/teacher/classes/:id/dashboard` in `routes/teacher.js` that rolls up `MasteryRecord` + `FluencyRecord` + `Mistake` per student per skill/domain.
- The flagging rule that drives "needs in-person remediation": a student is **flagged** when (a) overall domain mastery < threshold, OR (b) a core skill sits in `needsReview` after ≥N attempts, OR (c) fast-but-inaccurate fluency. Surfaced as a sorted **"Needs you this week"** list at the very top — names, the exact skill, and the reason.
- Glance-able redesign of the top of the page: one-line class health, the flag list, then the existing detail cards (heatmap, fluency, retention) kept under "details". Per-domain tabs so a teacher sees each domain at a glance.
- Per-student → per-skill drill-down (`TeacherStudentDetail.jsx`) showing exact grasp of every skill in the domain.

### Phase 2 — School admin console + easy account creation — _parallel workstream B_
- `routes/schoolAdmin.js` (gated to `school_admin`): create classes, create student accounts, assign to classes, invite teachers.
- **Bulk CSV upload**: admin uploads `name, level, class, [parent_email]`; server validates, creates `Student` (+ optional `User` login), enrols via `ClassStudent`, dedupes, returns a per-row result report. Reuse multer (already a dep).
- **Join codes**: per-class code/link; a student or teacher self-enrols. Covers ad-hoc additions after the bulk import.
- Admin UI under `frontend/src/pages/admin/school/*` (roster table, "Import roster", "Invite parents", seat usage vs plan).

### Phase 3 — Parent email invitations + school parent dashboard
- `POST /api/school/students/:id/invite-parent` → creates a pending `StudentGuardian` + emails a tokenised accept link (via `emailService`). Accept → parent account (or links existing) → **view-only** school parent dashboard.
- Reuse existing parent dashboard components, gated by entitlements: School parents get read-only progress; the "assign practice / full control" actions show an **upgrade-to-Premium-Home** prompt.

### Phase 4 — Tier polish, upgrade flows, reports
- Trial signup + 14-day expiry + conversion prompts.
- Premium Home self-serve checkout (Stripe is already a dependency).
- Printable/exportable per-skill reports for paid tiers.

---

## 4. Data-model changes (small, additive)

- `User.roles` / `Workspace.role` / `WorkspaceMember.role`: add `school_admin`.
- New `models/ClassJoinCode.js` (classId, code, expiresAt, maxUses).
- New `models/ParentInvite.js` (studentId, email, token, status, expiresAt) — or extend `StudentGuardian` with `status: invited|active` + `inviteToken`.
- New `models/RosterImport.js` (optional) to store import batches + row results for audit.
- No breaking changes to existing collections.

---

## 5. Open questions before/around build

1. **Student logins for school students** — do school students log in themselves (need email + password each), or does the teacher drive everything (no student login)? This changes the CSV columns and seat-counting.
2. **Trial length & seat caps** — confirm 14 days / 2 students, or your numbers.
3. **Premium Home price point** and whether it's monthly/annual (affects the Stripe plan seed).
4. **SSO** — any schools needing Google/Microsoft sign-in for students, or email+password only for the pilot?

---

## 6. Suggested first sprint (if you approve)

Phase 0 + the **real-data teacher dashboard aggregation** (Phase 1 server side) + the flag list. That makes the single most-used screen trustworthy and unblocks both onboarding and parent invites. Phases 2 and 3 then proceed in parallel.
