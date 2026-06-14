# Tian OS Test Coverage Gaps

**Date:** 2026-06-14
**Framework:** Vitest + MongoMemoryServer
**Config:** `vitest.config.js`

---

## Current Test Coverage

### Summary

| Area | Test Files | Total Files | Coverage % | Quality |
|------|-----------|-------------|-----------|---------|
| Utils | 115 | ~147 | ~78% | Strong |
| Routes | 17 | 76 | 22% | Mixed |
| Middleware | 1 | 11 | 9% | Minimal |
| Services | Embedded in utils | ~65 | ~40% | Moderate |
| Frontend | ~10 | ~200+ | ~5% | Sparse |
| **Total** | **238** | **~500** | **~48%** | **Uneven** |

### Well-Tested Areas

| Area | Key Test Files | What's Covered |
|------|---------------|----------------|
| Diagnostic Engine | `diagnosticDecisionEngine.test.js` (10K), `simulateDiagnosticWalkthrough.test.js` (14K) | Adaptive Q selection, full diagnostic flow |
| Mastery Criteria | `masteryCriteriaEngine.test.js` | Mastery thresholds, progression rules |
| Worksheet Generation | `worksheetGen.test.js` (16.5K) | Dynamic generation, question selection |
| Fractions Curriculum | `fractionsCurriculumVisibility.test.js` | Skill scope, level visibility |
| Content Quality | `contentCoverageGuard.test.js`, `questionQualityAuditService.test.js` | Coverage validation, question correctness |
| Guardian Isolation | `learningChildren.guardianIsolation.test.js` | Parent-child data privacy |
| Workspace Privacy | `workspace.test.js` | Cross-workspace data leakage prevention |
| Admin Billing | `adminBilling.test.js` | Authorization, billing overview |
| Fluency Engine | `fluencyEngineRoutes.test.js`, `fluencyEngineCompletion.test.js` | Session management, completion |
| Assessment Blueprints | `assessmentBlueprints.test.js`, `assessmentUploads.test.js` | Blueprint CRUD, PDF upload |
| Learning Telemetry | `learningTelemetryService.test.js` (6.7K) | Event tracking, analytics |
| Remediation | `recoveryPackAssetService.test.js` | Recovery pack generation |

### Routes WITH Tests (17/76)

1. `adminBilling.test.js`
2. `assessmentBlueprints.test.js`
3. `assessmentUploads.test.js`
4. `diagnostics.test.js`
5. `fluencyEngineRoutes.test.js`
6. `learningChildren.guardianIsolation.test.js`
7. `learningTelemetryAnalytics.test.js`
8. `masteryReset.test.js`
9. `mathpathAssignmentsViewOnly.test.js`
10. `mathpathSuccessCentre.parentIsolation.test.js`
11. `notifications.test.js`
12. `offlineRecoveryPracticeSession.test.js`
13. `recordings.test.js`
14. `studentCare.test.js`
15. `studentProfile.test.js`
16. `tutorLessonPrepRoute.test.js`
17. `workingSessionAnchor.test.js`

---

## Missing Tests

### CRITICAL: Untested Routes (59/76)

**Authentication (Security-Critical):**
- `routes/auth.js` — Login, register, password reset, token generation, email verification
- No tests for: invalid credentials, banned accounts, token rotation, rate limit bypass

**Core Learning Paths:**
- `routes/practice.js` — Practice session lifecycle (2.5K lines)
- `routes/mastery.js` — Skill mastery tracking (2,824 lines)
- `routes/mistakes.js` — Misconception logging (17K lines)
- `routes/learning.js` — General learning routes

**Family & Relationships:**
- `routes/family.js` — Parent-child learning profiles
- `routes/parentInvites.js` — Parent invitations
- `routes/studentLinks.js` — Account linking

**Workspace & Collaboration:**
- `routes/tutor.js` — Tutor workspace (excluding lesson prep)
- `routes/teacher.js` — Teacher workspace (36K lines)
- `routes/messages.js` — Messaging system
- `routes/join.js` — Class/workspace join codes

**Assessment:**
- `routes/informalAssessments.js` — Teacher assessments
- `routes/informalAssessmentStudent.js` — Student assessment data
- `routes/assessmentSpecifications.js` — Assessment templates

**MathPath Specific:**
- `routes/mathpathWorking.js` — Working evidence management
- `routes/mathpathPaperAnalysis.js` — Paper analysis
- `routes/mathpathAssignments.js` — MathPath assignments
- `routes/mathpathSuccessCentre.js` — Success centre

**Other:**
- `routes/admin.js` (34K lines), `routes/billing.js`, `routes/payments.js`
- `routes/worksheets.js` (27K), `routes/worksheetsGen.js`
- `routes/spelling.js` (21K), `routes/spellingPractice.js`
- `routes/interventions.js`, `routes/remediationSessions.js`
- `routes/search.js` (22K), `routes/context.js`
- `routes/agency.js`, `routes/partners.js`

### CRITICAL: Untested Middleware (10/11)

- `middleware/auth.js` — JWT verification, role authorization
- `middleware/guardianAccess.js` — Parent-child access control
- `middleware/entitlements.js` — Feature entitlement gates
- `middleware/featureGate.js` — Runtime feature flags
- `middleware/rateLimiter.js` — Rate limiting
- `middleware/validation.js` — Input sanitization
- `middleware/upload.js` — File upload handling
- `middleware/uploadWorksheet.js`
- `middleware/uploadResource.js`
- `middleware/errorHandler.js` — Global error handling

---

## Recommended E2E Tests

### Priority 1: Core Learning Loop

```
Test: Student Diagnostic → Practice → Mistake Review
Steps:
1. Student logs in
2. Starts Fractions diagnostic
3. Answers 5+ questions (mix of correct/incorrect)
4. Receives placement result
5. Starts practice session at placed level
6. Answers incorrectly on 2 questions
7. Verifies mistake records created
8. Opens Mistake Review
9. Sees mistake detail with explanation
Assertions:
- Diagnostic session created and completed
- Placement result matches expected level
- Practice questions match placement
- Mistakes linked to correct skill IDs
- Mistake review shows question + student answer + correct answer
```

### Priority 2: Working Evidence Lifecycle

```
Test: Draw Working → Save → Preview → Adult Views
Steps:
1. Student starts practice session
2. Opens full-screen working mode
3. Draws strokes on canvas
4. Saves working
5. Closes full-screen mode
6. Verifies preview thumbnail shows
7. Submits answer (incorrect)
8. Verifies working linked to attempt/mistake
9. Parent logs in
10. Opens child's mistake history
11. Sees working evidence image
Assertions:
- Strokes persisted correctly
- Working linked to attempt via workingSessionId
- Working linked to mistake record
- Parent can view working image
```

### Priority 3: Parent-Child Data Isolation

```
Test: Parent Can Only See Own Children
Steps:
1. Create Parent A with Child A
2. Create Parent B with Child B
3. Parent A logs in
4. Fetches /api/family/children
5. Verify only Child A returned
6. Attempts to access Child B's data directly
7. Verify 403 or empty response
Assertions:
- Parent A cannot see Child B's mastery
- Parent A cannot see Child B's mistakes
- Parent A cannot see Child B's working evidence
- Guardian isolation enforced on all family endpoints
```

### Priority 4: Tutor-Student Assignment

```
Test: Tutor Sees Only Assigned Students
Steps:
1. Create Tutor with Student A assigned
2. Create Student B (not assigned)
3. Tutor logs in
4. Fetches /api/tutor/students
5. Verify only Student A returned
6. Attempts to access Student B's data
7. Verify blocked
Assertions:
- TutorStudentLink enforced
- Workspace scoping prevents cross-workspace access
```

### Priority 5: Mobile Practice Session

```
Test: Practice Session at 375px Width
Steps:
1. Set viewport to 375px width
2. Student starts practice session
3. Question diagram visible and readable
4. Answer input accessible (fraction input)
5. Submit button reachable
6. Working canvas opens in full-screen
7. Canvas responds to touch input
8. Save button accessible on small screen
Assertions:
- No horizontal scroll required
- All interactive elements have 44px+ touch targets
- No overlapping UI elements
- Answer input keyboard doesn't cover submit button
```

### Priority 6: Story Mode Flow

```
Test: Story Mode Complete Session
Steps:
1. Enable fractionsStoryMode feature flag
2. Student navigates to story mode
3. Story F025 scenario loads
4. TTS plays (or gracefully degrades)
5. Student progresses through 9 scene types
6. Wrong answer triggers adaptive feedback
7. Student completes story
8. Session recorded as MathPathPracticeSession with sessionType: 'story'
Assertions:
- All 9 scene types render
- Adaptive feedback displays on wrong answer
- Mastery engine receives story completion data
```

---

## Recommended Unit/Integration Tests

### Authentication Tests (Priority 1)

```javascript
// routes/auth.test.js
describe('POST /api/auth/register', () => {
  it('creates user with hashed password');
  it('returns JWT token');
  it('rejects duplicate email');
  it('validates email format');
  it('validates password strength');
  it('sets default role');
});

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials');
  it('rejects invalid password');
  it('rejects non-existent email');
  it('handles banned accounts');
  it('rate-limits after 10 attempts');
});

describe('JWT token rotation', () => {
  it('accepts token signed with current secret');
  it('accepts token signed with previous secret');
  it('rejects token signed with unknown secret');
});
```

### Middleware Tests (Priority 1)

```javascript
// middleware/auth.test.js
describe('protect middleware', () => {
  it('passes with valid token');
  it('rejects missing token');
  it('rejects expired token');
  it('sets req.user from token');
  it('supports token rotation');
});

describe('authorize middleware', () => {
  it('passes for matching role');
  it('rejects non-matching role');
  it('supports multiple allowed roles');
});

// middleware/guardianAccess.test.js
describe('requireGuardianAccess', () => {
  it('passes for linked guardian');
  it('rejects unlinked user');
  it('enforces view_only access level');
  it('allows full access for direct guardians');
});
```

### Practice Session Tests (Priority 2)

```javascript
// routes/practice.test.js
describe('POST /api/practice/start', () => {
  it('creates practice session for student');
  it('selects questions matching skill level');
  it('rejects unauthorized user');
});

describe('POST /api/practice/:sessionId/answer', () => {
  it('evaluates correct answer');
  it('creates mistake for incorrect answer');
  it('links working evidence to attempt');
  it('tracks time per question');
  it('captures confidence');
});
```

### Mistake Lifecycle Tests (Priority 2)

```javascript
// routes/mistakes.test.js
describe('POST /api/mistakes', () => {
  it('creates mistake with correct studentId');
  it('resolves skill from skillCode');
  it('maps misconception tag');
});

describe('PATCH /api/mistakes/:id/learning', () => {
  it('progresses through 5 correction stages');
  it('requires evidence for mastery stage');
  it('updates mastery record on completion');
});

describe('GET /api/mistakes', () => {
  it('returns only current student mistakes');
  it('aggregates by weak skill');
  it('includes working evidence linkage');
});
```

### Working Evidence Tests (Priority 2)

```javascript
// routes/mathpathWorking.test.js
describe('POST /api/mathpath-working/upload', () => {
  it('accepts PDF/JPG/PNG under 12MB');
  it('rejects files over 12MB');
  it('links upload to session and student');
  it('triggers analysis pipeline');
});

describe('Working linkage', () => {
  it('links working to attempt by workingId');
  it('links working to attempt by attemptId');
  it('handles ObjectId/String studentId conversion');
  it('falls back to legacy userId lookup');
});
```

---

## Fragile Tests to Fix

| Test File | Issue | Fix |
|-----------|-------|-----|
| Multiple utils tests | Use `vi.mock()` with hardcoded mock structures; break silently when model methods change | Migrate to MongoMemoryServer pattern |
| `diagnostics.test.js` | Uses mocked services for contract validation; may drift from real service API | Add integration test variant with real services |
| Various route tests | Test happy path only; no error condition tests | Add negative test cases |

---

## Test Infrastructure Recommendations

1. **Add E2E framework** — Playwright for browser-based tests (already in devDependencies)
2. **Standardize on MongoMemoryServer** — For all route/middleware tests (avoid fragile mocks)
3. **Add CI test pipeline** — Run all tests on PR; block merge on failure
4. **Add coverage reporting** — Track coverage percentage over time
5. **Add mutation testing** — Verify test quality, not just coverage
6. **Create test data factories** — Reusable fixtures for User, Student, Mistake, etc.
