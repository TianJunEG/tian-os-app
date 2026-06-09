# Tutor Dashboard — Architecture & Design Spec

**Status:** Draft for review · **Date:** 2026-06-09 · **Author:** Design pass (Claude) for Jasmine

This document maps the current state of the tutor dashboard against the product vision, then specifies the design for the three genuinely new capabilities. It is written to build *on top of* the existing data model rather than replace it, and to preserve the workspace-isolation guarantees the platform already enforces.

The vision being designed for:

1. Tutors invite students and parents to follow progress.
2. Tutors record what was covered in each lesson.
3. On a tablet + stylus, tutors capture written explanations **and audio** during the lesson, which parents can replay.
4. Tuition agencies get an admin account to see the tutors they have onboarded.
5. Agencies can offer trials to tutors and earn a **profit share** when those tutors subscribe. Tuition centres work the same way.
6. If a student already has a school account, that account must **link** to the tutor's account.

---

## 1. Current state — what already exists

A surprising amount of the vision is already scaffolded. The table below is the ground truth from the codebase, not aspiration.

| Capability | Status | Where it lives |
|---|---|---|
| Tutor invites student/parent via token link | **Built** | `models/TutorInvite.js`, `routes/tutorInvites.js` (`POST /api/tutor/invites`, `GET/POST /api/tutor/invites/:token[/accept]`), share URL `/connect/tutor/:token` |
| Student ↔ tutor link | **Built** | `models/TutorStudentLink.js`, guard `requireLinkedStudent()` in `routes/tutor.js` |
| Parent ↔ student (guardian) link | **Built** | `models/StudentGuardian.js`, `routes/family.js` (`GET /api/family/children`) |
| Parent progress views | **Built** | `pages/parent/ParentMathPathDashboardPage.jsx`, `ChildProgress.jsx` |
| Lesson notes (text) | **Built** | `models/LessonNote.js` (`covered/didWell/struggledWith/misconceptions/homeworkAssigned/parentSummary`), `pages/tutor/LessonNotes.jsx`, endpoints in `routes/tutor.js` |
| Stylus / ink capture | **Built (for students)** | `components/learning/WorkingCanvas.jsx`, `FullScreenWorkingMode.jsx`, `QuestionAnnotationOverlay.jsx`, `components/spelling/HandwritingPad.jsx` — pointer events, stroke arrays `{tool, colour, size, points:[{x,y}]}` |
| Agency / centre as an organisation | **Built** | `models/PartnerOrganisation.js` (type `tuition_centre`), `PartnerMembership.js` (roles incl. `owner/manager/tutor`), `PartnerStudent.js` |
| Agency admin API + UI | **Built** | `routes/adminPartners.js`, `pages/admin/PartnersPage.jsx`, `PartnerDetailPage.jsx` |
| Subscriptions, plans, trials | **Built** | `models/Subscription.js` (`status: trial/active/...`, `trialStart/trialEnd`, `pilotOverride`), `models/BillingPlan.js`, `services/billing/*` |
| Payments + platform fee split | **Built (booking-based)** | `models/Payment.js` (`amount`, `platformFee` ~10%, `tutorPayout`), `routes/payments.js` |
| Multi-role accounts | **Built** | `models/User.js` `roles[]` is source of truth; `role` legacy; `linkedTo`, `defaultWorkspace` |
| Workspace isolation | **Built** | `models/Workspace.js` (`type: parent/tutor/teacher/school/admin`), `WorkspaceMember.js`, `middleware/workspace.js` requires `X-Workspace-Id` |

### The three real gaps

Everything the vision describes maps onto existing primitives except three things, which are the subject of the rest of this document:

- **Gap A — Synced ink + audio lesson recording and parent replay.** The canvas captures strokes as a batch JSON blob on submit; there is no time dimension, no audio, and no replay surface for parents.
- **Gap B — Agency trials + profit share.** Subscriptions and trials exist, and payments compute a platform fee, but there is no concept of an agency *granting* a trial to its tutors, nor any *revenue/profit-share* ledger that pays an agency a cut of a tutor's subscription.
- **Gap C — School-account ↔ tutor-account linking.** Workspace isolation is deliberately strict: a tutor only ever sees students they have a `TutorStudentLink` to, never school data. There is no controlled bridge that lets a student's existing school-context account be connected to a tutor while keeping the two data domains separate.

---

## 2. Guiding principles

These constraints shape every design below.

**Reuse, don't fork.** The platform already has `Subscription`, `PartnerMembership`, `TutorStudentLink`, `LessonNote`, and a working ink stack. New features attach to these rather than introducing parallel concepts.

**Workspace isolation is sacred.** A tutor's view is scoped by `X-Workspace-Id` plus `TutorStudentLink`. School data lives in a separate workspace and must never leak into a tutor workspace by default. Any cross-context linking (Gap C) must be an *explicit, consented, scoped* bridge — never an implicit merge.

**Multi-role is the unit of identity.** A person can be a parent, a private tutor, and a school teacher at once. Linking is between *contexts/workspaces*, not between whole identities. `User.roles[]` already supports this.

**Consent and least privilege.** A school student linking to a tutor shares *only* what is explicitly granted (e.g. progress in one subject), revocable at any time, with parent/guardian consent for minors.

**Media is heavy; treat it as such.** Audio + ink replay implies object storage, lifecycle/retention, and access control distinct from ordinary documents.

---

## 3. Gap A — Stylus + audio lesson recording & parent replay

### 3.1 Concept

During a lesson on a tablet, the tutor writes explanations on a canvas while talking. We capture the ink **as a timed stream** and the **audio** together, so a parent can later press play and watch the explanation reconstruct itself in sync with the tutor's voice — like a screen recording, but vector-based and lightweight.

### 3.2 Why not just screen-record?

Vector ink + audio is an order of magnitude smaller than video, is replayable at any resolution, can be scrubbed by stroke, and lets us later add features like "jump to the moment fractions were introduced." The existing `WorkingCanvas`/`FullScreenWorkingMode` stroke format (`{tool, colour, size, points:[{x,y}]}`) is already most of the way there — we add a time dimension.

### 3.3 Data model

Two new models, plus a small extension to `LessonNote`.

**`LessonRecording`** (new)
```
workspaceId      ObjectId ref Workspace   (tutor workspace)
tutorUserId      ObjectId ref User
studentId        ObjectId ref Student
lessonNoteId     ObjectId ref LessonNote   (optional link to the written note)
subjectId        String
domainId         String
status           enum [recording, processing, ready, failed]   default recording
durationMs       Number
audioStorageKey  String        (object-store key, not a public URL)
audioMimeType    String        (e.g. audio/webm;codecs=opus)
canvasWidth      Number        (authoring surface size, for replay scaling)
canvasHeight     Number
pageCount        Number        default 1
visibility       enum [private, shared_parent]   default private
createdAt, updatedAt
```

**`LessonInkEvent`** (new — the timed ink stream; one doc per stroke keeps writes append-only and cheap)
```
recordingId      ObjectId ref LessonRecording   (indexed)
page             Number        default 0
tStartMs         Number        (ms from recording start)
tEndMs           Number
stroke           Mixed         { tool, colour, size, points:[{x,y,t?}] }   (existing format + optional per-point time)
seq              Number        (ordering within recording)
```
Index: `{recordingId:1, seq:1}`.

Storing per-point timestamps (`t`) is optional but enables true "draws as you watch" playback; without it, we replay stroke-by-stroke at `tStartMs`.

**`LessonNote` extension** — add `recordingIds: [ObjectId ref LessonRecording]` so the written note and its recordings are linked.

### 3.4 Capture pipeline (client)

The tutor capture surface extends `FullScreenWorkingMode.jsx`:

1. On **Start**, request mic permission and begin a `MediaRecorder` on the audio stream (Opus/WebM). Record `t0 = performance.now()`.
2. Reuse the existing pointer-event handlers. On each completed stroke, push a `LessonInkEvent` with `tStartMs = strokeStart - t0`. Buffer events and flush in batches (every ~5s or N strokes) to the backend.
3. Audio uploads in **chunks** as it records (resumable) so a crash doesn't lose the lesson; final chunk on Stop.
4. On **Stop**, finalise: flush remaining ink, upload final audio chunk, set `status = processing` → server stitches/validates → `ready`.

This degrades gracefully: if the device denies mic access, we still capture timed ink (a silent replay), and if the network drops, buffered events and audio chunks resume.

### 3.5 Storage & access control

Audio blobs go to **Cloudflare R2** (resolved 2026-06-09): S3-compatible and **no egress fees**, which suits a download-heavy feature. **Never** store a public URL on the model; store an opaque `audioStorageKey` and serve via short-lived **signed URLs** minted per request after authorization. Ink events are small and stay in MongoDB.

**Volume is not a constraint.** Recordings are vector ink + compressed speech audio, *not* video: a 1-hour lesson is ~10–15 MB of Opus audio plus a few hundred KB of strokes. Twice-weekly tuition ≈ ~100 lessons/year ≈ **~1.5 GB per student per year**; 1,000 students ≈ ~1.5 TB ≈ ~US$25–35/month on R2.

**Retention policy (resolved 2026-06-09):** native recordings are kept **1 month** in-app (scrubbable replay), then auto-expire. Before expiry a parent can **Download as video (MP4)** — the server renders the ink playback synced with audio into an MP4 on demand (heavier, runs only on click) so the parent keeps a permanent copy. **Deletion:** auto-expire after the 1-month window; the tutor may delete their own recording earlier; parents download rather than delete.

### 3.6 API

```
POST   /api/tutor/students/:id/recordings                 → create (status recording), returns recordingId + upload target
POST   /api/tutor/recordings/:rid/ink         (batch)     → append LessonInkEvent[]
PUT    /api/tutor/recordings/:rid/audio-chunk  (n)        → resumable audio chunk
POST   /api/tutor/recordings/:rid/finalise                → mark processing→ready, set durationMs
PATCH  /api/tutor/recordings/:rid             {visibility}→ share with parent / unshare
DELETE /api/tutor/recordings/:rid                          → soft-delete

GET    /api/tutor/recordings/:rid                          → manifest (meta + signed audio URL + ink stream)
GET    /api/family/children/:studentId/recordings          → parent: list shared recordings
GET    /api/family/recordings/:rid                         → parent: manifest, only if visibility=shared_parent AND guardian link valid
POST   /api/family/recordings/:rid/export                  → parent: render ink+audio → MP4 (on demand), returns signed download URL
```

`LessonRecording` carries an `expiresAt` (createdAt + 1 month); a scheduled job purges expired native recordings + their R2 objects. The MP4 export renders only when a parent requests it.

All tutor routes pass through `requireWorkspace` + `requireLinkedStudent`. All parent routes verify a valid `StudentGuardian` link and `visibility = shared_parent`.

### 3.7 Replay surface (parent)

A new `pages/parent/LessonReplay.jsx`: a canvas the same size as `canvasWidth/Height`, an audio element, and a transport bar. On play, schedule ink events against `audio.currentTime`; scrubbing the audio seeks the ink to the matching `tStartMs`. Reuse `drawStroke()`/`drawMathObject()` from the existing canvas components for pixel-identical rendering.

### 3.8 Phasing

- **A1 (MVP):** timed ink + audio capture to R2, finalise, parent replay with play/pause. Single page, no scrubbing-to-stroke. 1-month auto-expiry.
- **A2:** scrubbing, multi-page, "share to parent" wired to notifications (§6), MP4 export-and-download.
- **A3:** chapter markers (auto from skill tags), thumbnails.

---

## 4. Gap B — Agency seat licence + tutor billing

### 4.1 Concept (revised per product direction, 2026-06-09)

This is **not** a per-subscription revenue share. The model is **wholesale seat licensing**:

1. The platform sells an agency a **lump-sum licence** for a number of tutor **seats**. The rate is **negotiated by volume** (more seats → lower per-seat rate). The platform collects this lump sum from the agency — that is the platform's only revenue from the agency.
2. The agency then **resells to its own tutors through the platform**: it sets what it charges each tutor, can grant **trials freely** (the seat is already prepaid), and keeps the margin between what it charges tutors and the wholesale licence cost.
3. **No refunds** anywhere — neither platform→agency nor agency→tutor. This removes all clawback/reversal accounting.

So there are two clean money flows, not a share split:

- **Platform ← Agency:** one lump-sum licence invoice (per period or one-time). Platform revenue.
- **Agency ← Tutors:** recurring charges the agency levies on its tutors, run **through** the platform's billing rails but settling to the **agency** (the platform does not take a cut of these by default — its margin was already captured in the wholesale licence).

The existing booking-based `Payment` split (platform vs. tutor, for parent bookings) is a separate axis and is untouched.

### 4.2 What already exists vs. what's new

Already there: `Subscription` (`status=trial`, `trialStart/trialEnd`, `pilotOverride`, `ownerType=user|partner`); `BillingPlan` (`tutor_pro`, `centre_pro`); `PartnerMembership` (tutor↔org); `Payment` + Stripe integration. **New:** the wholesale **licence** record and seat accounting, the agency's **tutor pricing**, agency-granted trials that consume a prepaid seat, and a tutor-billing flow that settles to the agency rather than the platform.

### 4.3 Data model

**`PartnerLicence`** (new — the platform↔agency wholesale deal; platform-admin set only). Seats are bought in **blocks**; an agency may hold multiple active licence blocks whose `seatCount`s sum to its total entitlement.
```
organisationId       ObjectId ref PartnerOrganisation   (indexed)
seatCount            Number        (tutor seats in this block)
lumpSumAmount        Number        (what the agency pays the platform for this block)
currency             String        default 'SGD'
period               enum [monthly, annual]
ratePerSeatSnapshot  Number        (volume-negotiated; reference/audit)
status               enum [draft, active, paused, ended]
effectiveFrom        Date
effectiveTo          Date (nullable)
paymentStatus        enum [invoiced, paid, overdue]
setByUserId          ObjectId ref User   (platform admin)
notes                String
createdAt, updatedAt
```

**Seat accounting (hard block).** `seatsTotal` = sum of `seatCount` across the org's active `PartnerLicence` blocks. `seatsUsed` = count of `PartnerMembership(organisationId, role='tutor', status='active')` plus active agency-granted trials (a trial occupies a seat). When `seatsUsed ≥ seatsTotal`, onboarding a further tutor is **blocked** — the agency must purchase **another licence block** (a new `PartnerLicence`) before adding tutors. No auto true-up.

**`PartnerOrganisation` extension** — Stripe Connect linkage so tutor payments settle to the agency:
```
stripeConnectAccountId   String   (nullable; 'acct_…', Express connected account)
connectStatus            enum [not_started, onboarding, active, restricted]   default not_started
connectOnboardedAt       Date (nullable)
```

**`AgencyTutorPlan`** (new — what the agency charges ITS tutors)
```
organisationId   ObjectId ref PartnerOrganisation
name             String
priceToTutor     Number        (what each tutor pays the agency)
currency         String
period           enum [monthly, annual]
trialDays        Number        (agency-granted; default trial length)
status           enum [active, archived]
createdAt, updatedAt
```

**`Subscription` extension** — provenance so we know the seat & plan a tutor sits on:
```
originOrganisationId   ObjectId ref PartnerOrganisation (nullable)
agencyTutorPlanId      ObjectId ref AgencyTutorPlan (nullable)
```
An agency tutor's `Subscription` is `ownerType=user`, `status=trial` during the granted trial (reusing `pilotOverride.type=extended_trial`), then `active` once the agency starts charging them.

**`AgencyTutorCharge`** (new — recurring charge **paid by the tutor**, settling to the agency; no refunds)
```
organisationId   ObjectId ref PartnerOrganisation
tutorUserId      ObjectId ref User           (the payer)
subscriptionId   ObjectId ref Subscription
amount           Number
currency         String
periodStart, periodEnd   Date
stripePaymentIntentId    String (unique)
connectAccountId String                      (agency's acct_… — charge created on this account)
applicationFee   Number   default 0          (platform takes nothing here)
status           enum [pending, succeeded, failed]
createdAt
```
The **tutor pays**; the charge is created as a **direct charge on the agency's connected account** (`Stripe-Account: acct_…`), so funds settle to the agency. `applicationFee = 0` — the platform's margin was captured in the wholesale licence. No `refunded` state by design.

### 4.4 Flow

1. **Licence (platform admin):** admin creates a `PartnerLicence` block for the org — seats, lump sum, monthly/annual — and invoices the agency. Platform collects the lump sum (`paymentStatus → paid`).
2. **Connect onboarding (agency):** agency completes Stripe Express onboarding via a hosted link; platform stores `stripeConnectAccountId`, `connectStatus → active`. Required before any tutor can be charged.
3. **Agency pricing:** agency owner/manager creates one or more `AgencyTutorPlan`s (price to tutor, trial length).
4. **Onboard tutor:** agency adds a tutor (`PartnerMembership role=tutor`) — consumes a seat. **Blocked** if `seatsUsed ≥ seatsTotal`; agency must buy another `PartnerLicence` block first.
5. **Grant trial:** agency puts the tutor on a plan in trial. Costs nothing extra (seat prepaid). Tutor `Subscription` = `trial`.
6. **Trial-ending reminders:** a scheduled job emails the tutor as their trial nears expiry (e.g. T-7, T-3, T-1 days) prompting them to start paying.
7. **Convert (tutor pays):** the tutor pays via the platform → `AgencyTutorCharge` (direct charge to the agency's connected account) → `Subscription → active`. Recurring charges continue each period. If the trial lapses unpaid, access is gated by `featureAccessService` until the tutor pays.

### 4.5 Where the logic lives

Extend `services/billing/billingAdminService.js` for `PartnerLicence` blocks and seat accounting. Add `services/billing/agencyBillingService.js` for `AgencyTutorPlan` + `AgencyTutorCharge` and the Stripe **Connect** integration (create Express account, generate onboarding link, create direct charges on the connected account with `applicationFee = 0`). `featureAccessService.js` is unchanged — a tutor's feature access derives from their plan; agency trials set that plan via the override the service already understands, and a lapsed unpaid trial gates access until the tutor pays. A scheduled job (`scripts/` cron) sends **trial-ending reminder emails** to tutors at T-7/T-3/T-1 days. Stripe **Connect is net-new** — the repo today has only basic PaymentIntents + webhook keys.

### 4.6 API

```
# Platform admin
POST       /api/admin/partners/:pid/licence                 → add a licence block (seats, lump sum, monthly/annual)
GET        /api/admin/partners/:pid/licence                 → blocks + seatsUsed/seatsTotal, payment status

# Agency admin (owner/manager of the org)
GET        /api/agency/overview                             → seats used/remaining, tutor roster, billing summary
POST       /api/agency/connect/onboard                      → create/resume Stripe Express onboarding link
GET        /api/agency/connect/status                       → connectStatus (gates charging)
GET/POST   /api/agency/tutor-plans                          → manage what the agency charges tutors
POST       /api/agency/tutors/:tutorUserId/grant-trial      → put a tutor on a plan in trial (blocked if no free seat)

# Tutor
GET        /api/tutor/membership                            → my agency, plan, trial status + days left, price
POST       /api/tutor/membership/pay                        → pay → AgencyTutorCharge on agency account → Subscription active
```

Platform-admin routes require the `admin` role. Agency routes require `PartnerMembership` role `owner`/`manager` in that org. The **tutor is the payer**: the agency grants the trial and sets the price, but the tutor self-pays to convert (no agency-initiated charge), so no separate tutor "accept" step is needed — paying *is* the consent.

### 4.7 Agency admin UI

The vision's "admin account where they can see tutors onboarded" extends `pages/admin/PartnerDetailPage.jsx` into a partner-facing `pages/agency/` area:

- **Overview:** seats used / remaining against the licence, plus billing summary.
- **Tutors:** roster from `PartnerMembership (role=tutor)`, each with plan, trial/active status, trial expiry, last activity.
- **Plans:** create/edit `AgencyTutorPlan`s (price to tutor, trial length).
- **Connect:** Stripe Express onboarding status + link (must be `active` before charging).
- **Billing:** `AgencyTutorCharge` history (money the agency collects from its tutors).

### 4.8 Resolved decisions (per 2026-06-09 direction)

- **Settlement →** Tutor payments settle to the **agency's own Stripe (Express) connected account** via direct charges; platform application fee = **0**. Platform revenue = the wholesale licence only.
- **Licence period →** **Monthly or annual** (recurring), bought in seat **blocks**.
- **Seat overage →** **Hard block**. Agency must buy another `PartnerLicence` block before onboarding beyond `seatsTotal`. No auto true-up.
- **Tutor billing →** **Tutor pays** to convert from trial to a paid plan; paying is the consent. Plus **automated trial-ending reminder emails** (T-7/T-3/T-1).
- **Share base / percentage →** N/A — replaced by the wholesale lump-sum licence (rate negotiated by volume, snapshot in `PartnerLicence`).
- **Refunds →** None, anywhere. No clawback/reversal logic.
- **Who sets agreements →** Platform admin only (`PartnerLicence`). Agencies self-serve only their own tutor pricing (`AgencyTutorPlan`).

### 4.9 Phasing

- **B1:** `PartnerLicence` blocks + seat accounting (hard block) + agency Overview/Tutors tabs (no money movement).
- **B2:** `AgencyTutorPlan` + agency-granted trials (Subscription in trial) + trial-ending reminder emails, Plans tab.
- **B3:** Stripe **Connect** Express onboarding + tutor self-pay (`AgencyTutorCharge`, direct charge to agency), Connect + Billing tabs.

---

## 5. Gap C — School-account ↔ tutor-account linking

### 5.1 The problem

A student already has an account in a **school** context (workspace `type=school/teacher`, `PartnerStudent relationshipType=enrolled`). A private tutor wants that same learner on their dashboard. Today the only path is a `TutorStudentLink` created via invite — but that presumes the tutor "owns" the student in their workspace. We must connect the *existing* school-context student to the tutor **without merging the two data domains** and **without the tutor seeing school data** (or the school seeing tutoring data) unless explicitly shared.

### 5.2 Design: a consented account link, not a merge

The student is **one `User`** (and one `Student` learner profile) that participates in **multiple contexts** via separate links: `PartnerStudent` (school) and `TutorStudentLink` (tutor). The identity is shared; the *visibility* is per-context. We add an explicit **link request + grant** so the tutor link can be created against an existing student, with consent and a defined sharing scope.

**`StudentAccountLink`** (new — governs a cross-context connection + its sharing scope)
```
studentId          ObjectId ref Student
studentUserId      ObjectId ref User
fromContext        enum [school, tutor, parent]
toContext          enum [school, tutor, parent]
tutorUserId        ObjectId ref User (nullable; for tutor links)
organisationId     ObjectId ref PartnerOrganisation (nullable; for school links)
workspaceId        ObjectId ref Workspace            (the tutor workspace gaining access)
status             enum [requested, consent_pending, active, revoked, expired]
sharedScopes       [String]   default ['progress:math:read', 'mastery:math:read']
requestedByUserId  ObjectId ref User
consentByUserId    ObjectId ref User   (must be a guardian — see 5.3)
consentAt          Date
expiresAt          Date (nullable)
createdAt, updatedAt
```

**Scope decision (math-only phase):** the default `sharedScopes` give the tutor **read access to the student's full math progress and mastery**. They do **not** include the school teacher's private notes about the student — that is school-internal and out of scope for the tutor. Tutor-shared files/resources (a Google-Classroom-style upload feature) are a **separate future feature**, not part of linking (logged in §7).

**Parent is the cross-context hub.** Visibility is asymmetric: the **parent/guardian** can read **both** the tutor's lesson notes **and** the school teacher's notes about their child, because the guardian is connected to both contexts. The **tutor** sees neither the teacher's notes nor anything school-internal — only the student's math progress/mastery. So `sharedScopes` constrains the *tutor*; the parent's broader view comes from being a `StudentGuardian` across contexts, not from the tutor link.

The existing `TutorStudentLink` remains the *operational* object the tutor routes already check; `StudentAccountLink` is the *governance/consent* record that authorizes creating it against a pre-existing student and bounds what is visible.

### 5.3 Flow

1. **Discovery / claim.** Tutor invites as today (`/connect/tutor/:token`). When the accepting user already has a `Student` profile in another context (school), the accept handler in `routes/tutorInvites.js` detects it (the student `User` already exists) and, instead of provisioning a new learner, creates a `StudentAccountLink` in `consent_pending`.
2. **Consent (always guardian).** Because the platform serves **primary math** (all students are minors), a linked parent/guardian (`StudentGuardian`) must **always** approve. There is no student self-consent path in this phase. Approval sets `status=active`, records `consentByUserId/consentAt`, and **then** creates the `TutorStudentLink`.
3. **Scoped visibility.** The tutor sees only `sharedScopes` — by default the student's full math progress + mastery. School-only data (school assignments, teacher notes) is filtered out at the route layer by checking the active `StudentAccountLink.sharedScopes` in addition to the existing workspace guard.
4. **Revocation.** Parent/student can revoke; this sets `StudentAccountLink.status=revoked` and `TutorStudentLink.status=ended`. Tutor immediately loses access.

### 5.4 Isolation guarantees (unchanged + reinforced)

- The tutor still operates inside their own `tutorWorkspaceId`; school data lives in the school workspace and is never copied.
- Cross-context reads are mediated by `sharedScopes` — default-deny. Adding a scope is an explicit consent action.
- The school sees nothing about the tutoring relationship; tutoring data is not written into the school workspace.
- `routes/family.js` self-healing (guardian backfill) must be made link-aware so it never auto-creates a cross-context link without consent.

### 5.5 API

```
POST  /api/tutor/students/link-requests        → tutor requests link to an existing student (or auto-created on invite accept)
GET   /api/family/link-requests                 → guardian: pending consent requests
POST  /api/family/link-requests/:id/consent     → approve (sets scopes) → creates TutorStudentLink
POST  /api/family/link-requests/:id/decline
PATCH /api/family/student-links/:id/scopes       → adjust what's shared
POST  /api/family/student-links/:id/revoke
```

### 5.6 Edge cases

- **Same person, two emails.** If the school account and the tutor-invited account are different `User` records for the same child, we need an account-claim step to verify they are the same learner before linking. **Primary mitigation: avoid the duplicate** — when a guardian accepts a tutor invite, the accept handler checks for an existing `Student` for that child and links to it rather than provisioning a new account. **When two separate accounts already exist** the chosen proof is a **school-issued claim code** (resolved 2026-06-09): the school generates a short-lived code bound to the school account; the guardian enters it to claim and link the accounts. Mechanically this needs a `SchoolClaimCode` record (`{ studentId, schoolUserId, code, expiresAt, status }`) issued from the school/admin side and redeemed by a verified `StudentGuardian`. **Fallback** where a school can't issue codes: guardian-mediated match with platform-admin approval. Dual-email verification is rejected (school email may not be guardian-controlled).
- **Multiple tutors.** A student can have several `TutorStudentLink`s in different tutor workspaces; each is governed by its own `StudentAccountLink`. The unique index on `TutorStudentLink {workspaceId, studentId}` already allows this across workspaces.
- **Tutor who is also the teacher.** Multi-role: the same `User` may hold both links; visibility is still per-workspace, so being a teacher does not grant tutor-workspace access and vice versa.

### 5.7 Phasing

- **C1:** link-request + guardian consent + scoped tutor read (default: full math progress + mastery).
- **C2:** scope management UI + revocation. (No adult self-consent — primary-only phase.)
- **C3:** account-claim for the two-email case via **school-issued claim code** (`SchoolClaimCode` issue + redeem).

---

## 6. Cross-cutting — Notifications & parent delivery

Both "share lesson summary to parent" (Gap A / `LessonNote.parentSummary`, currently *stored but not sent*) and "new recording available" (Gap A) need a delivery channel. This is shared infrastructure, so it is specified once here and consumed by the other features.

### 6.1 Channel tiering (resolved 2026-06-09)

| Channel | Tier | Behaviour |
|---|---|---|
| **In-app notifications** | Baseline (all parents) | A notifications inbox + unread badge the parent sees on login. Every parent-facing event lands here. |
| **Weekly email digest** | Baseline (all parents) | One scheduled weekly email per parent summarising the week's lesson notes / new recordings across their children. Reuses the existing email sender. |
| **WhatsApp push** | **Premium** (home/premium plan) | Near-real-time "new update from your tutor" message via the repo's `Tuition agency/WhatsApp_Chatbot_Code`. Gated by plan via `featureAccessService`. |

In-app and weekly email are always on; WhatsApp is a paid upgrade and a strong differentiator for the premium home version.

### 6.2 Data model

**`Notification`** (new — the in-app feed + channel fan-out record)
```
recipientUserId  ObjectId ref User    (the parent/guardian)   (indexed)
type             enum [lesson_summary, recording_ready, trial_ending, link_request, generic]
title            String
body             String
linkPath         String        (deep link, e.g. /parent/recordings/:rid)
sourceType       String        (LessonNote | LessonRecording | StudentAccountLink | …)
sourceId         ObjectId
channels         [String]      (delivered via: in_app, email, whatsapp)
readAt           Date (nullable)
createdAt
```
The weekly email and WhatsApp are *delivery channels* over the same notification records, not separate stores. A `NotificationPreference` (per user/child, per channel) can follow later; baseline behaviour needs no prefs.

### 6.3 Where the logic lives

A small `services/notifications/notificationService.js`: `notify({recipientUserId, type, …})` writes the `Notification` and fans out to enabled channels — always in-app; queue for the weekly digest; and if the recipient's plan includes WhatsApp, push immediately via the existing WhatsApp chatbot service. A scheduled job assembles and sends the **weekly digest**. This unblocks Gap A's "share to parent" and Gap C's consent-request notifications.

### 6.4 API

```
GET   /api/notifications                 → parent's in-app feed (paginated)
POST  /api/notifications/:id/read        → mark read
GET   /api/notifications/unread-count    → badge count
```

### 6.5 Phasing

- **N1:** `Notification` model + in-app feed/badge + `notify()` writing in-app only. Wire tutor "send summary" and "recording ready".
- **N2:** weekly email digest job.
- **N3:** WhatsApp push for premium plans (via existing chatbot), plan-gated.

---

## 7. Decisions log

All product decisions are now resolved (2026-06-09) except the future feature in #11.

**Gap B (payment flow) — all resolved 2026-06-09:**
1. **Settlement →** tutor pays; funds settle to the **agency's Stripe Express connected account** (direct charge, platform fee 0). *Net-new Connect integration required.*
2. **Licence period →** monthly or annual, bought in seat **blocks**. **Overage → hard block** (buy another block).
3. **Tutor billing →** tutor self-pays to convert; **trial-ending reminder emails** at T-7/T-3/T-1.

**Gap C (linking) — resolved 2026-06-09:**
4. **Consent age →** primary-math phase, **always guardian consent**, no student self-consent.
5. **Tutor scope →** read access to **full math progress + mastery**; **not** the school teacher's notes.
6. **Parent scope →** the parent/guardian can read **both** the tutor's lesson notes **and** the school teacher's notes (parent is the cross-context hub).
7. **Account-claim method →** Resolved: **school-issued claim code** (option 1). The school issues a code tied to the school account; the guardian enters it to claim/link. (Guardian-mediated + admin approval remains the fallback where a school can't issue codes.)

**Gap A (recording) — resolved 2026-06-09:**
8. **Storage →** Cloudflare **R2** (S3-compatible, no egress fees); signed URLs per request.
9. **Retention →** native recording kept **1 month** then auto-expire; **parent can Download as MP4** before expiry; tutor may delete own earlier.

**Cross-cutting (notifications) — resolved 2026-06-09 (see §6):**
10. **Delivery channels →** in-app feed + weekly email digest as **baseline**; **WhatsApp push as a premium** upgrade (via the repo's WhatsApp chatbot). Unblocks Gap A "share to parent" and Gap C consent notifications.

**Future feature (logged, out of current scope):**
11. **Tutor file/resource sharing** — a Google-Classroom-style surface for tutors to upload files and share resources/assignments with students and parents. Distinct from lesson notes and from linking; spec separately when prioritized.

---

## 8. Suggested build order

The features have a natural dependency order. Notifications (§6) are a shared prerequisite for parent-facing delivery.

1. **Notifications N1** (in-app feed) — small; unblocks parent delivery of summaries and recordings. (N2 weekly email, N3 premium WhatsApp follow.)
2. **Gap A1** — timed ink + audio capture to R2 and basic parent replay. Highest "wow", builds on existing canvas, mostly self-contained.
3. **Gap C1** — consented school↔tutor link with scoped read. Unlocks the school-student audience.
4. **Gap B1→B3** — seat licence + roster, then agency tutor plans + trials, then Stripe Connect tutor self-pay. Commercially important but can trail the learning features.

---

*All file paths reference the `edu-os-app` repository. This spec intentionally specifies models and endpoints but no implementation; it is meant to be reviewed and amended before any code is written.*
