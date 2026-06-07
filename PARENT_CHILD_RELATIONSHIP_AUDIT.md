# Parent-Child Relationship Audit

Date: 2026-06-07

Scope: parent dashboard, child progress isolation, family summary aggregation, sibling data leakage risk, and single-child default behaviour.

No runtime code changes were made.

## Executive Summary

Verdict: **Ready with minor gaps**

The current parent-facing `/parent` system supports multiple children through `StudentGuardian` links and per-child `Student` records. Most MathPath, worksheet, assignment, diagnostic, working, and paper-analysis APIs use `resolveStudent()`, which enforces student-level access before reading child data.

The main privacy boundary is sound for the current parent routes:

- Parent child list is built from `StudentGuardian`.
- Per-child recommendations call `resolveStudent()`.
- MathPath parent screens pass explicit `studentId`.
- Most backend APIs resolve the requested student before querying records.

Key gaps:

- There are two parent-child systems: current `StudentGuardian`/`Student`, and legacy embedded `User.children`.
- The legacy `/children` route still exists and uses older embedded child IDs.
- Parent multi-child behaviour has limited automated test coverage.
- `StudentGuardian` lookup in `resolveStudent()` does not include workspace scoping, although `StudentGuardian` records include `workspaceId`.
- `/api/family/children` self-heals missing guardian links from parent-owned records, which is useful for pilot continuity but should be logged/monitored.

## 1. Parent Dashboard Multiple-Children Support

Status: **PASS**

Current parent dashboard flow:

- `frontend/src/pages/parent/ParentHome.jsx`
- `frontend/src/pages/parent/ParentChildren.jsx`
- `routes/family.js`
- `frontend/src/services/api.js`

Evidence:

- `ParentHome` loads `familyAPI.children()` and receives an array of children.
- If multiple children exist and no `?child=` query is selected, it redirects to `/parent/children`.
- `ParentChildren` renders all linked children and links each child to per-child progress.
- `/api/family/children` loads all `StudentGuardian` links for the parent and returns one summary per linked student.

Relevant references:

- `frontend/src/pages/parent/ParentHome.jsx:30-42`
- `frontend/src/pages/parent/ParentHome.jsx:71-85`
- `frontend/src/pages/parent/ParentChildren.jsx:23-34`
- `routes/family.js:73-118`

Conclusion:

The active parent dashboard supports multiple children.

## 2. Child Progress Isolation

Status: **PASS with one hardening recommendation**

Current isolation mechanism:

- Newer child records are stored in `Student`.
- Parent-child links are stored in `StudentGuardian`.
- Per-child APIs use `studentId`.
- Most route handlers call `resolveStudent(req, studentId)` before querying child records.

`resolveStudent()` permits access only when:

- the logged-in user is the student,
- the logged-in user is a guardian,
- the logged-in user is an assigned tutor,
- the logged-in user is a workspace member,
- the logged-in user has partner-centre access.

Relevant references:

- `models/Student.js`
- `models/StudentGuardian.js`
- `utils/studentContext.js:16-47`
- `routes/mastery.js:1018-1065`
- `routes/mastery.js:1071-1101`
- `routes/family.js:127-137`
- `routes/mathpathAssignments.js`
- `routes/worksheetsGen.js`
- `routes/diagnostics.js`

Sibling isolation:

- `ParentHome` stores the selected child ID in `?child=`.
- Recommendations are loaded from `/api/family/children/:studentId/recommendations`.
- Assignments are loaded with `studentId`.
- MathPath parent dashboard calls mastery, latest diagnostic, growth, working review, and fluency APIs with the selected `studentId`.

Relevant frontend references:

- `frontend/src/pages/parent/ParentHome.jsx:45-59`
- `frontend/src/pages/parent/ChildProgress.jsx:18-24`
- `frontend/src/pages/parent/ParentMathPathDashboardPage.jsx:432-448`

Hardening recommendation:

`resolveStudent()` checks `StudentGuardian.findOne({ studentId, guardianUserId })` but does not include `workspaceId`, even though `StudentGuardian` has a `workspaceId` field. This is probably acceptable if `(studentId, guardianUserId)` is globally unique, but for stricter workspace isolation the query should include workspace context when available or enforce a unique index on `(studentId, guardianUserId)`.

## 3. Parent Summary Aggregation

Status: **PARTIAL PASS**

There are two aggregation surfaces:

### Active `/parent` system

`/api/family/children` returns one summary per child:

- `overallMastery`
- `skillsSeen`
- `masteredCount`
- `weakestTopic`
- `weakestSkill`
- per-subject breakdown

This is safe because each row is calculated with `masterySummary(s._id)`.

Reference:

- `routes/family.js:24-68`
- `routes/family.js:113-118`

### ParentHome UX

For one child, `/parent` defaults to that child.

For multiple children, `/parent` redirects to `/parent/children` unless a `?child=` is provided. This avoids silently showing the first child as if it were a whole-family summary.

Reference:

- `frontend/src/pages/parent/ParentHome.jsx:30-42`

Risk:

The title in multi-child selected mode says `Family overview`, but the displayed data is for the selected child. This is not a data-leak risk, but it can be semantically confusing. Suggested copy later: `Child overview` or `Family overview: {child.name}`.

Conclusion:

Parent summary aggregation is safe at the child-list level. There is not yet a true combined household aggregate dashboard, but the current UI intentionally avoids pretending to aggregate all children.

## 4. Sibling Data Leakage Risk

Status: **LOW RISK in active parent routes**

Active route safety:

- `/api/family/children/:studentId/recommendations` uses `resolveStudent`.
- `/api/mastery`, `/api/mastery/map`, diagnostics, worksheets, assignments and success centre routes generally use `resolveStudent`.
- Per-child frontend routes pass the selected `studentId`.

Potential leak vectors:

1. Legacy `/api/learning/children`

This older API uses embedded `User.children` and `child` fields on `LearningResult` / `SpellingAttempt`.

It does check embedded child ownership for `/api/learning/children/:childId/profile`.

References:

- `routes/learning.js:73-118`
- `utils/learningProfile.js:9`

Risk: low to medium, because it is a parallel model that can drift from `StudentGuardian`.

2. Legacy `/children` frontend routes

`frontend/src/pages/ParentDashboardPage.jsx` still reads `learningAPI.getChildren()` and navigates to `/children/:childId`. The active parent shell uses `/parent/children`, but the legacy route remains registered.

References:

- `frontend/src/App.jsx:391-393`
- `frontend/src/pages/ParentDashboardPage.jsx`

Risk: medium for product consistency, low for data leakage because the legacy backend scopes to the current user.

3. Guardian link self-healing

`/api/family/children` creates missing guardian links from parent-owned student records or linked student user accounts.

Reference:

- `routes/family.js:77-110`

Risk: low for pilot, but should be logged because silent self-healing can hide seed/data integrity problems.

## 5. Single-Child Default View

Status: **PASS**

Requirement:

Dashboard defaults to single-child view if only one child exists.

Evidence:

`ParentHome` sets `?child=<studentId>` if exactly one child exists and no active child is selected.

Reference:

- `frontend/src/pages/parent/ParentHome.jsx:34-40`

Multiple children:

If more than one child exists, `/parent` redirects to `/parent/children`.

This prevents accidental first-child defaulting.

## 6. Test Coverage

Status: **PARTIAL**

Existing tests found:

- `utils/studentContext.test.js` covers the core resolver boundary.
- Route tests using mocked `resolveStudent` exist for assignment and paper analysis flows.
- Parent recommendation unit tests exist:
  - `utils/parentRecommendationEngine.test.js`
  - `utils/parentRecommendations.test.js`

Gaps:

- No focused `/api/family/children` route test found.
- No test proving parent A cannot request parent B's child through `/api/family/children/:studentId/recommendations`.
- No frontend tests found for:
  - one child auto-selects
  - multiple children redirects to `/parent/children`
  - child selector switches data
  - invalid child ID shows safe error state

## Audit Matrix

| Requirement | Status | Evidence | Risk |
| --- | --- | --- | --- |
| Parent dashboard supports multiple children | PASS | `ParentHome`, `ParentChildren`, `/api/family/children` | Low |
| Child progress is isolated correctly | PASS | `resolveStudent`, per-child `studentId` APIs | Low |
| Parent summary aggregates children safely | PARTIAL PASS | child-list summaries are per-child; no true household aggregate yet | Low |
| No student data leaks between siblings | PASS with hardening | active APIs use `resolveStudent`; legacy route remains | Low/Medium |
| Single-child default view | PASS | `ParentHome` sets `?child=` for one child | Low |

## Recommended Fixes

### Priority 1: Add tests

Add tests for:

1. `/api/family/children` returns only children linked by `StudentGuardian`.
2. `/api/family/children/:studentId/recommendations` rejects an unlinked child.
3. Parent with one child lands on `/parent?child=<studentId>`.
4. Parent with multiple children is redirected to `/parent/children`.
5. Switching child selector changes recommendation and assignment calls.

### Priority 2: Clarify model ownership

Document that the current source of truth is:

`Student` + `StudentGuardian`

Legacy `User.children` and `/api/learning/children` should be treated as old cross-app prototype support unless still intentionally used.

### Priority 3: Harden guardian scoping

Consider:

- unique index on `{ studentId, guardianUserId }`
- include `workspaceId` in guardian access checks when workspace context is available
- log `/api/family/children` self-healing events

### Priority 4: Copy cleanup

On `ParentHome`, when a parent has multiple children and a selected child is shown, change title from `Family overview` to a child-specific label to reduce ambiguity.

## Final Verdict

The active parent-child relationship system is **pilot-safe with minor gaps**.

The largest technical risk is not sibling data leakage in the active routes; it is the coexistence of two parent-child models:

- current: `Student` + `StudentGuardian`
- legacy: embedded `User.children`

For pilot, the active `/parent` routes are acceptable. Before broader rollout, consolidate or clearly quarantine the legacy `/children` and `/api/learning/children` paths.
