# Tian OS Technical Debt Register

**Date:** 2026-06-14
**Last updated:** 2026-06-15

---

## Critical (Fix before scale)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-01 | QA_DISABLE_RATE_LIMIT bypasses all security | Security | Critical | 9 locations disable auth, workspace isolation, rate limiting, feature gates when env var set | Add `NODE_ENV !== 'production'` guard; ideally remove and use test-specific middleware | `middleware/workspace.js`, `middleware/rateLimiter.js`, `middleware/featureGate.js`, `routes/tutor.js`, `routes/recordings.js`, `routes/mathpathWorking.js` |
| TD-02 | studentId type inconsistency (ObjectId vs String) | Data Integrity | Critical | MathPath models store studentId as String, core models use ObjectId; cross-model queries may silently return empty | Standardize on ObjectId across all models; add migration for existing String records | `models/mathpath/MathPathDiagnosticSession.js`, `models/mathpath/MathPathAttempt.js`, `services/mathpath/workingLinkageService.js` |
| TD-03 | ~~JWT only stores single role~~ | Auth | ✅ Fixed | ~~Users with multiple roles may lose access~~ | JWT now includes `roles[]`; `authorize()` checks multi-role; 10 duplicated `roleSet()` helpers replaced with shared `resolveRoles()` | `middleware/auth.js`, `routes/auth.js` |
| TD-04 | ~~questionTemplates.js is 79,265 lines~~ | Maintainability | ⚠️ Mis-sized | File is 1,281 lines (not 79K); it's a runtime generator with randomized parameters, not a static data store — DB migration not applicable | N/A | `utils/questionTemplates.js` |

## High (Fix within next 2 sprints)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-05 | Monolithic route files | Maintainability | High | ~~mastery.js (2,824 lines)~~ split into `routes/mastery/` (6 modules, 26% reduction); admin.js, teacher.js, spelling.js, worksheets.js remain | Decompose remaining files into service layer + thin route handlers | `routes/admin.js`, `routes/teacher.js`, `routes/spelling.js`, `routes/worksheets.js` |
| TD-06 | 78% of API routes have no tests | Quality | High | Unknown failure modes; regressions undetectable | Add integration tests using MongoMemoryServer pattern (see `workspace.test.js`) | 59 route files without `.test.js` counterparts |
| TD-07 | Middleware barely tested (1/11) | Quality | High | Auth, rate limiting, guardian access, entitlements all untested | Add middleware unit tests | `middleware/auth.js`, `middleware/guardianAccess.js`, `middleware/entitlements.js`, `middleware/rateLimiter.js` |
| TD-08 | ~~No centralized error logging~~ | Observability | ✅ Fixed | Sentry integrated (backend `@sentry/node` + frontend `@sentry/react`); auto-captures 500s with user context; no-op when DSN absent | N/A | `services/errorMonitoring.js`, `middleware/errorHandler.js`, `server.js`, `frontend/src/main.jsx` |
| TD-09 | No caching for workspace membership lookups | Performance | High | `requireWorkspace` makes DB query every request; O(N) on concurrent users | Add Redis/in-memory cache with TTL | `middleware/workspace.js` |

## Medium (Fix within next quarter)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-10 | Dual database (MongoDB + PostgreSQL) | Architecture | Medium | Maintenance burden; inconsistency risk between databases | Complete PostgreSQL migration for core models; deprecate MongoDB | `config/db.js`, `prisma/schema.prisma`, all models |
| TD-11 | ~~Legacy single-role / multi-role transition~~ | Auth | ✅ Fixed | `authorize()` now checks `roles[]` via `resolveRoles()`; JWT includes `roles[]`; registration populates both fields; remaining: make `roles[]` mandatory in schema | Remaining: schema migration to make `roles[]` required | `models/User.js` |
| TD-12 | Inconsistent field naming | Maintainability | Medium | `userId` vs `user`, `studentId` vs `child`, `tutorUserId` vs `tutor` | Standardize naming conventions; create shared constants | All models |
| TD-13 | Magic strings for status enums | Maintainability | Medium | Status values hardcoded throughout routes; no centralized enum definitions | Create `utils/constants/statusEnums.js` | All routes with status checks |
| TD-14 | ~~Missing database indexes~~ | Performance | ✅ Fixed | `User.linkedTo` index added; `Class.teacherUserId`, `ClassStudent.classId`, `TutorProfile.userId` already had indexes | N/A | `models/User.js` |
| TD-15 | No E2E test suite | Quality | Medium | No end-to-end behavioral tests for real user journeys | Add Playwright tests for critical flows | New test directory |
| TD-16 | Populate chains without limits | Performance | Medium | Multiple `.populate()` calls without field selection or result limits | Add `.select()` and `.limit()` to populate chains | Various routes |
| TD-17 | No centralized validation schema | Quality | Medium | Fragmented validation; custom error messages vary by route | Adopt Joi or Zod; create shared schemas | Various routes |

## Low (Backlog)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-18 | ~~Stale prototype directories~~ | Hygiene | ✅ Fixed | `tian-os/`, `mathpath/`, `mathpath-mvp/` already removed in prior cleanup | N/A | — |
| TD-19 | ~~Unrelated code in repo~~ | Hygiene | ✅ Fixed | `Tuition agency/` (40 files, 424KB WhatsApp chatbot + research) removed | N/A | — |
| TD-20 | Test file in routes directory | Hygiene | Low | `routes/tutorLessonPrepRoute.test.js` is a test file among route files | Move to appropriate test directory | `routes/tutorLessonPrepRoute.test.js` |
| TD-21 | ~~Duplicate frontend route directories~~ | Hygiene | ⚠️ False positive | `/pages/mathpath/` is teacher-facing (assessments, paper analysis); `/pages/student/mathpath/` is student-facing (learning paths, practice) — not duplicates | N/A | — |
| TD-22 | Frontend StudentDashboard.jsx at 73K | Maintainability | Low | Should be split by role/feature | Decompose into sub-components | `frontend/src/pages/StudentDashboardPage.jsx` |
| TD-23 | Legacy User.parentProfile fallback | Data | Low | `family.js` falls back to `User.parentProfile.studentName` which could bypass guardian links | Remove legacy fallback | `routes/family.js` |
