# Tian OS Technical Debt Register

**Date:** 2026-06-14
**Last updated:** 2026-06-14

---

## Critical (Fix before scale)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-01 | QA_DISABLE_RATE_LIMIT bypasses all security | Security | Critical | 9 locations disable auth, workspace isolation, rate limiting, feature gates when env var set | Add `NODE_ENV !== 'production'` guard; ideally remove and use test-specific middleware | `middleware/workspace.js`, `middleware/rateLimiter.js`, `middleware/featureGate.js`, `routes/tutor.js`, `routes/recordings.js`, `routes/mathpathWorking.js` |
| TD-02 | studentId type inconsistency (ObjectId vs String) | Data Integrity | Critical | MathPath models store studentId as String, core models use ObjectId; cross-model queries may silently return empty | Standardize on ObjectId across all models; add migration for existing String records | `models/mathpath/MathPathDiagnosticSession.js`, `models/mathpath/MathPathAttempt.js`, `services/mathpath/workingLinkageService.js` |
| TD-03 | JWT only stores single role | Auth | High | Users with multiple roles (parent+tutor, teacher+tutor) may lose access to features | Update JWT payload to include `roles[]`; update `auth.js` protect middleware | `middleware/auth.js`, `routes/auth.js` |
| TD-04 | questionTemplates.js is 79,265 lines | Maintainability | High | Unmaintainable, slow to load, impossible to review changes | Migrate to database; lazy-load by domain | `utils/questionTemplates.js` |

## High (Fix within next 2 sprints)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-05 | Monolithic route files | Maintainability | High | mastery.js (2,824 lines), admin.js (34K), teacher.js (36K), spelling.js (21K), worksheets.js (27K) — any change risks full regression | Decompose into service layer + thin route handlers | `routes/mastery.js`, `routes/admin.js`, `routes/teacher.js`, `routes/spelling.js`, `routes/worksheets.js` |
| TD-06 | 78% of API routes have no tests | Quality | High | Unknown failure modes; regressions undetectable | Add integration tests using MongoMemoryServer pattern (see `workspace.test.js`) | 59 route files without `.test.js` counterparts |
| TD-07 | Middleware barely tested (1/11) | Quality | High | Auth, rate limiting, guardian access, entitlements all untested | Add middleware unit tests | `middleware/auth.js`, `middleware/guardianAccess.js`, `middleware/entitlements.js`, `middleware/rateLimiter.js` |
| TD-08 | No centralized error logging | Observability | High | Errors only go to console.error; no monitoring in production | Add Sentry or similar; structured logging | `middleware/errorHandler.js`, `server.js` |
| TD-09 | No caching for workspace membership lookups | Performance | High | `requireWorkspace` makes DB query every request; O(N) on concurrent users | Add Redis/in-memory cache with TTL | `middleware/workspace.js` |

## Medium (Fix within next quarter)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-10 | Dual database (MongoDB + PostgreSQL) | Architecture | Medium | Maintenance burden; inconsistency risk between databases | Complete PostgreSQL migration for core models; deprecate MongoDB | `config/db.js`, `prisma/schema.prisma`, all models |
| TD-11 | Legacy single-role / multi-role transition | Auth | Medium | `User.role` (singular) coexists with `User.roles[]`; confusion about source of truth | Make `roles[]` mandatory; derive `role` from `roles[0]` for backward compat | `models/User.js` |
| TD-12 | Inconsistent field naming | Maintainability | Medium | `userId` vs `user`, `studentId` vs `child`, `tutorUserId` vs `tutor` | Standardize naming conventions; create shared constants | All models |
| TD-13 | Magic strings for status enums | Maintainability | Medium | Status values hardcoded throughout routes; no centralized enum definitions | Create `utils/constants/statusEnums.js` | All routes with status checks |
| TD-14 | Missing database indexes | Performance | Medium | `User.linkedTo`, `Class.teacherUserId`, `ClassStudent.classId`, `TutorProfile` need indexes | Add indexes | `models/User.js`, `models/Class.js`, `models/ClassStudent.js`, `models/TutorProfile.js` |
| TD-15 | No E2E test suite | Quality | Medium | No end-to-end behavioral tests for real user journeys | Add Playwright tests for critical flows | New test directory |
| TD-16 | Populate chains without limits | Performance | Medium | Multiple `.populate()` calls without field selection or result limits | Add `.select()` and `.limit()` to populate chains | Various routes |
| TD-17 | No centralized validation schema | Quality | Medium | Fragmented validation; custom error messages vary by route | Adopt Joi or Zod; create shared schemas | Various routes |

## Low (Backlog)

| # | Item | Area | Severity | Why It Matters | Suggested Fix | Files |
|---|------|------|----------|---------------|---------------|-------|
| TD-18 | Stale prototype directories | Hygiene | Low | tian-os/ (164KB), mathpath/ (312KB), mathpath-mvp/ (272KB) clutter repo | Archive or delete | `/tian-os/`, `/mathpath/`, `/mathpath-mvp/` |
| TD-19 | Unrelated code in repo | Hygiene | Low | WhatsApp chatbot code in `/Tuition agency/` | Move to separate repo | `/Tuition agency/` |
| TD-20 | Test file in routes directory | Hygiene | Low | `routes/tutorLessonPrepRoute.test.js` is a test file among route files | Move to appropriate test directory | `routes/tutorLessonPrepRoute.test.js` |
| TD-21 | Duplicate frontend route directories | Hygiene | Low | `/frontend/src/pages/mathpath/` (old) and `/frontend/src/pages/student/mathpath/` (new) both exist | Audit and remove old directory | `/frontend/src/pages/mathpath/` |
| TD-22 | Frontend StudentDashboard.jsx at 73K | Maintainability | Low | Should be split by role/feature | Decompose into sub-components | `frontend/src/pages/StudentDashboardPage.jsx` |
| TD-23 | Legacy User.parentProfile fallback | Data | Low | `family.js` falls back to `User.parentProfile.studentName` which could bypass guardian links | Remove legacy fallback | `routes/family.js` |
