# Admin Dashboard

**Status:** Working documentation
**Last updated:** June 2026
**Access:** `admin` role + `admin` feature flag (hardcoded `true` — always on)
**Entry point:** `/admin`

---

## 1. Overview

The admin dashboard is the internal operations and QA console for Tian OS. It is not a student or parent-facing surface. It is used by founders, developers, and student care operators to monitor educational quality, pilot health, partner accounts, and platform billing.

All admin routes are wrapped in `<FeatureGuard feature="admin">` and require an authenticated user with the `admin` role. The `admin` flag is hardcoded `true` in `config/featureFlags.js` — it cannot be disabled via environment variable.

---

## 2. Route map

| URL | Page | Purpose |
|---|---|---|
| `/admin` | `AdminDashboard` | Top-level console with links to all sections |
| `/admin/pilot-analytics` | `PilotAnalyticsPage` | Aggregate pilot metrics |
| `/admin/pilot/interventions` | `PilotInterventionsPage` | Intervention effectiveness tracking |
| `/admin/question-quality` | `QuestionQualityPage` | Question coverage and quality metrics |
| `/admin/question-visual-quality` | `QuestionVisualQualityPage` | Visual/diagram quality checks |
| `/admin/fractions-skill-integrity` | `FractionsSkillIntegrityPage` | F001–F026 integrity validation |
| `/admin/diagnostic-validation` | `DiagnosticValidationPage` | Diagnostic question risk and accuracy |
| `/admin/remediation-quality` | `RemediationQualityPage` | Recovery pack and remediation content QA |
| `/admin/learning-path-quality` | `LearningPathQualityPage` | Learning path integrity and progression |
| `/admin/recovery-pack-assets` | `RecoveryPackAssetsPage` | Recovery pack question bank inventory |
| `/admin/domain-health` | `DomainHealthPage` | Domain capability status and health |
| `/admin/misconception-coverage` | `MisconceptionCoveragePage` | Misconception coverage across skills |
| `/admin/billing` | `BillingPage` | System-wide subscription and revenue metrics |
| `/admin/partners` | `PartnersPage` | Partner account management |
| `/admin/partners/:partnerId` | `PartnerDetailPage` | Partner detail, staff, and enrolment |
| `/admin/partners/:pid/licence` | `PartnerLicencePage` | Wholesale licence block management |
| `/admin/pending-upgrades` | `PendingUpgradesPage` | PayNow upgrade approval queue |
| `/school-admin` | `SchoolAdminConsole` | School-level admin (separate role: `school_admin`) |

---

## 3. Page descriptions

### Pilot & Analytics

**`PilotAnalyticsPage`** — `/admin/pilot-analytics`
Aggregate pilot programme metrics: active student count, session counts by type (diagnostic, practice, fluency, story), question types attempted, average accuracy by skill, session completion rates. Source: `services/mathpath/pilotDashboardMetricsService.js` and `routes/pilotAnalytics.js`.

**`PilotInterventionsPage`** — `/admin/pilot/interventions`
Tracks intervention effectiveness during the pilot: student engagement per intervention type, strategy adoption rates, misconception correction rates, learning gains before and after each intervention category.

---

### Educational Quality

**`QuestionQualityPage`** — `/admin/question-quality`
Question coverage metrics per domain: total question count, per-skill coverage, difficulty distribution, repeated-template warnings (751 already flagged in fractions), misconception distractor representation. Used before claiming content readiness for a domain.

**`QuestionVisualQualityPage`** — `/admin/question-visual-quality`
Flags visual and diagram quality issues: rendering problems, diagram type availability (bar model, number line, fraction bar, grid), layout quality, missing diagrams for `figureDependent` skills. Geometry and Statistics skills are flagged here.

**`FractionsSkillIntegrityPage`** — `/admin/fractions-skill-integrity`
Fractions-specific integrity checks: validates that all F001–F026 skills have correct slug↔F-code mappings, sufficient question families, correct prerequisite edges, model-drawing coverage for F023–F026, and story mode coverage for F025–F026. Run this before any fractions curriculum change.

**`DiagnosticValidationPage`** — `/admin/diagnostic-validation`
Validates the diagnostic system: question risk scores per skill, adaptive decision accuracy (how often `MOVE_UP`/`STEP_DOWN` decisions align with expected outcomes), item characteristic data, and flags skills with poor diagnostic reliability.

**`RemediationQualityPage`** — `/admin/remediation-quality`
QA for Recovery Pack content: misconception coverage (is every tagged misconception in the skill graph covered by at least one remediation step?), strategy variety per skill, explanation clarity scores, asset completeness.

**`LearningPathQualityPage`** — `/admin/learning-path-quality`
Learning path integrity: validates prerequisite graph has no cycles, that the `pathwayOrder` in each skill graph is consistent with prerequisites, checks for orphaned skills, and monitors remediation trigger rates in live sessions.

**`MisconceptionCoveragePage`** — `/admin/misconception-coverage`
Misconception coverage report: for each skill, what percentage of the tagged `misconceptionTags` (from `domainCatalog.js`) are actually covered by question distractors, feedback messages, and remediation assets. Surfaces coverage gaps by domain.

**`RecoveryPackAssetsPage`** — `/admin/recovery-pack-assets`
Inventory of Recovery Pack question banks: asset count by domain and skill, utilisation rate (how often each asset is served), and gap detection (skills with zero recovery assets).

**`DomainHealthPage`** — `/admin/domain-health`
Monitors all 18 domain capabilities against `domainCatalog.js`: which domains have `available` vs `engine_ready` vs `planned` status per capability (diagnostic, practice, assignment, worksheet, paper analysis, intervention). Primary reference for domain readiness at a glance.

---

### Partner & Billing

**`PartnersPage`** — `/admin/partners`
Lists all partner accounts: student care centres, tuition agencies, schools, pilot partners, internal accounts. Columns: partner type, status (active/trial/paused), enrolled student count, active users, staff count. Includes partner creation form.

**`PartnerDetailPage`** — `/admin/partners/:partnerId`
Single partner view: impact report, billing status, staff roster management (add/remove, role assignment), student enrolment overview.

**`PartnerLicencePage`** — `/admin/partners/:pid/licence`
Wholesale licence management for partner agencies (Gap B model): configure seat count blocks and lump-sum amounts. Used for tuition centres purchasing seats in bulk.

**`BillingPage`** — `/admin/billing`
System-wide billing analytics: subscription plan distribution (free/mid/premium), active/paused/archived counts, monthly recurring revenue, usage breakdown by plan tier.

**`PendingUpgradesPage`** — `/admin/pending-upgrades` (also `/admin/pending-upgrades`)
Approval queue for parents who paid via PayNow (manual bank transfer). Admin verifies the payment reference and approves the 12-month Premium Home upgrade. Linked from the billing flow.

---

### School admin (separate role)

**`SchoolAdminConsole`** — `/school-admin`
School-level administration, separate from the founder admin console. Accessible to users with `school_admin` role (not `admin`). Features: seat usage tracking against licence count, class creation and management, student roster import, teacher role assignment, basic usage analytics for the school's students.

---

## 4. Backend API

Admin pages read from:

| Route file | Mounts at | Used by |
|---|---|---|
| `routes/pilotAnalytics.js` | `/api/pilot-analytics` | PilotAnalyticsPage, PilotInterventionsPage |
| `routes/adminBilling.js` | `/api/admin/billing` | BillingPage |
| `routes/adminPartners.js` | `/api/admin/partners` | PartnersPage, PartnerDetailPage |
| `routes/adminLicences.js` | `/api/admin/licences` | PartnerLicencePage |
| `routes/adminJobs.js` | `/api/admin/jobs` | Background job monitoring |
| `routes/schoolAdmin.js` | `/api/school-admin` | SchoolAdminConsole |
| `services/mathpath/pilotDashboardMetricsService.js` | — | PilotAnalyticsPage data engine |

Quality pages call the existing quality audit services already used by QA scripts:

- `services/mathpath/misconceptionCoverageService.js`
- `services/mathpath/skillVisualRequirementEngine.js`
- `services/mathpath/questionBankSelector.js`

---

## 5. QA scripts that mirror admin pages

Several admin pages have equivalent CLI scripts for headless QA runs:

| Admin page | CLI equivalent |
|---|---|
| FractionsSkillIntegrityPage | `npm run qa:fractions:questions` |
| PilotAnalyticsPage | `npm run qa:pilot:backend` |
| DiagnosticValidationPage | `npm run qa:pilot:preflight` |
| Dashboard contract validation | `scripts/qa-mathpath-dashboard-contract.js` |

Run these in CI or before a pilot deployment; the admin pages are the same data rendered interactively.

---

## 6. Access in development

Log in as any user with `role: 'admin'`. No specific seed script creates an admin user — promote a demo account directly in the database, or add admin creation to `scripts/seedDemo.js` locally.

```js
// MongoDB — promote an existing user
db.users.updateOne({ email: 'demo.parent@tianos.test' }, { $set: { role: 'admin' } })
```

Navigate to `/admin` after login.
