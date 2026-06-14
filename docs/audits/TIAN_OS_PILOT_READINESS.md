# Tian OS Pilot Readiness Assessment

**Date:** 2026-06-14
**Target:** 5-student pilot
**Verdict:** Conditional GO — 3 P0 blockers must be fixed first

---

## Readiness Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product readiness | **78/100** | Core learning loop complete; adult dashboards functional |
| Technical stability | **65/100** | QA bypass risk, 78% routes untested, monolithic files |
| Content readiness | **82/100** | All 26 skills pilot-ready; curriculum mapping drift risk |
| Diagnostic reliability | **85/100** | Adaptive engine working; session persistence solid |
| Remediation loop | **80/100** | 5-stage correction flow; recovery packs functional |
| Working evidence | **75/100** | Full canvas + upload pipeline; ID linkage risk |
| Adult dashboard readiness | **80/100** | All 3 dashboards show meaningful insights |
| Mobile/tablet readiness | **60/100** | Mobile-first design but unverified at common breakpoints |
| **Overall pilot readiness** | **72/100** | Conditional GO after P0 fixes |

---

## Pilot Go/No-Go Recommendation

### GO — with conditions:

The platform has a **complete, connected learning loop** that is rare at this stage. The core student experience (diagnostic -> practice -> mistake tracking -> remediation) works. Adult dashboards show meaningful insights, not just scores. This is substantially ahead of most edtech pilots.

**However, 3 issues must be fixed before putting real students on the system:**

1. **Security bypass must be restricted** — the QA flag can disable all access controls
2. **Working evidence linkage must be verified** — mixed ID types could cause lost student work
3. **Curriculum mapping must be verified** — 17/26 skills may route students to wrong level

---

## P0 — Must Fix Before Pilot

These are blockers that will break the learning loop, confuse users, lose data, or create security holes.

| # | Issue | User Impact | Files | Fix | Complexity |
|---|-------|------------|-------|-----|-----------|
| P0-1 | **QA_DISABLE_RATE_LIMIT bypasses all auth** | Any user can access any workspace and data if flag is set in production | `middleware/workspace.js`, `middleware/rateLimiter.js`, `middleware/featureGate.js`, `routes/tutor.js`, `routes/recordings.js`, `routes/mathpathWorking.js` | Add `process.env.NODE_ENV !== 'production'` guard around all 9 bypass locations | S |
| P0-2 | **studentId type mismatch (ObjectId vs String)** | Working evidence may not link to mistakes/sessions for some students | `services/mathpath/workingLinkageService.js`, `models/mathpath/MathPathDiagnosticSession.js`, `models/mathpath/MathPathAttempt.js` | Audit `legacyStudentIdCandidates()` to ensure consistent type conversion in all `$in` queries | S |
| P0-3 | **Curriculum mapping drift on 17/26 skills** | Diagnostic may place students at wrong skill level, causing frustration or boredom | `scripts/domains/fractions.js`, `shared/mathpath/fractions/fractionSkillGraph.js` | Run `auditAndRepairFractionSkillMappings.js` and verify F-code/title/objective alignment | M |

---

## P1 — Strongly Recommended Before Pilot

These will improve pilot quality and reduce manual support needed.

| # | Issue | User Impact | Files | Fix | Complexity |
|---|-------|------------|-------|-----|-----------|
| P1-1 | **No auth route tests** | Login/register failures undetectable before production | `routes/auth.js` | Add tests for register, login, invalid credentials, token generation | M |
| P1-2 | **Mobile unverified at 375px/390px** | Most pilot students will use phones at these widths | `frontend/src/pages/student/mathpath/PracticeSession.jsx`, `DiagnosticQuestionScreen.jsx` | Test and fix layout at iPhone SE/13/14/15 widths | M |
| P1-3 | **Tutor student cards inline styles** | Tutor cards break on mobile/tablet | `frontend/src/pages/tutor/TutorHome.jsx` | Convert inline styles to Tailwind responsive classes | S |
| P1-4 | **No E2E test for learning loop** | Regressions in core flow undetectable | New test file | Add Playwright test: student diagnostic -> practice -> mistake review | L |
| P1-5 | **Mixed-number input mode not obvious** | Students may not realize they need to switch input mode | `frontend/src/pages/student/mathpath/components/FractionAnswerInput.jsx` | Add clearer mode indicator or auto-detect from question | S |

---

## P2 — Can Wait Until After Pilot

Useful improvements but not required for first 5 students.

| # | Issue | Notes |
|---|-------|-------|
| P2-1 | Split monolithic route files (mastery.js, admin.js, teacher.js) | Maintainability, not user-facing |
| P2-2 | Migrate questionTemplates.js (79K lines) to database | Performance at scale, not pilot-blocking |
| P2-3 | Add workspace isolation tests for all 59 untested routes | Security depth, not pilot-blocking with 5 known students |
| P2-4 | Unify role system (`roles[]` primary, deprecate `role`) | Multi-role edge cases rare in pilot |
| P2-5 | Expand Fractions content to 100 items per skill | Current 47-67 items sufficient for pilot |
| P2-6 | Add push notifications for parent when child requests help | Parent can check dashboard manually during pilot |
| P2-7 | Add mastery celebration moment for students | Nice-to-have, not blocking learning |
| P2-8 | Extract WorkingCanvas + WorkingEvidenceDecision into shared WorkingEvidencePanel | Code quality, not user-facing |
| P2-9 | Add centralized validation (Joi/Zod) | Consistency, not user-facing |
| P2-10 | Archive/delete stale directories (tian-os/, mathpath/, mathpath-mvp/) | Repo hygiene |

---

## P3 — Future Roadmap

| # | Item | Priority |
|---|------|----------|
| P3-1 | New math domains (Whole Numbers, Decimals, Measurement) | Post-pilot expansion |
| P3-2 | Complete PostgreSQL migration for core models | Scalability |
| P3-3 | Add error monitoring service (Sentry/DataDog) | Observability at scale |
| P3-4 | Implement caching layer (Redis) for workspace lookups | Performance at scale |
| P3-5 | Add visual regression tests | Design system stability |
| P3-6 | Build content authoring/review tools | Teacher-driven content |
| P3-7 | AI-powered explanation/audio for all question types | Learning experience |
| P3-8 | Teacher-facing worksheet generator integration | Content distribution |
| P3-9 | Problem Solving Lab full launch | Module expansion |
| P3-10 | Admin partner management and licensing | Business operations |

---

## Minimum Fixes Before 5-Student Pilot

1. **P0-1**: Guard QA bypass with `NODE_ENV !== 'production'` check (30 minutes)
2. **P0-2**: Verify working linkage ID conversion (1-2 hours of testing + potential fix)
3. **P0-3**: Run curriculum mapping audit script and fix misalignments (2-3 hours)
4. **P1-2**: Quick mobile test at 375px/390px and fix critical layout breaks (2-3 hours)
5. **P1-5**: Improve mixed-number input visibility (1 hour)

**Total estimated time for minimum fixes: 1-2 days**
