# Pilot Commit Plan

Generated: 2026-06-05  
Action taken: audit only. No files were staged or committed.

## Current Git Status

`git status --short --untracked-files=all` shows:

```text
?? FRACTIONS_PILOT_INVENTORY.md
?? FRACTIONS_SKILL_MAPPING_AUDIT.md
?? PILOT_COMMIT_PLAN.md
```

There are no tracked modified files and no staged files.

Already tracked and clean:

- `docs/mathpath/PREFLIGHT_PILOT_RUN.md`
- `docs/mathpath/PILOT_FIX_PLAN.md`
- `docs/mathpath/PILOT_PRIORITY_ORDER.md`
- `docs/mathpath/5-STUDENT-PILOT-LAUNCH-CHECKLIST.md`
- `frontend/tests/e2e/pilot-preflight-core-loop.spec.js`
- `frontend/tests/e2e/pilot-visible-routes.spec.js`

## 1. Pilot Stability Code Changes

Files to stage:

- None.

Reason:

- No dirty production code files are currently present.
- The current worktree does not show modified routes, services, models, or frontend source files.

Files to exclude:

- None in this group.

## 2. Pilot Tests / Playwright Specs

Files to stage:

- None.

Reason:

- The pilot Playwright specs are already tracked and clean:
  - `frontend/tests/e2e/pilot-preflight-core-loop.spec.js`
  - `frontend/tests/e2e/pilot-visible-routes.spec.js`

Files to exclude:

- None in this group.

## 3. Pilot Documentation

Files to stage:

- Optional: `PILOT_COMMIT_PLAN.md`

Reason:

- This file is an internal commit-planning document requested for operational grouping.
- The core pilot launch and preflight docs are already tracked and clean.

Files already tracked and clean:

- `docs/mathpath/PREFLIGHT_PILOT_RUN.md`
- `docs/mathpath/PILOT_FIX_PLAN.md`
- `docs/mathpath/PILOT_PRIORITY_ORDER.md`
- `docs/mathpath/5-STUDENT-PILOT-LAUNCH-CHECKLIST.md`

Files to exclude from the curriculum audit commit:

- `PILOT_COMMIT_PLAN.md`

Reason:

- It is a meta planning artifact, not part of the Fractions inventory/curriculum audit itself.

## 4. Curriculum Audit Docs

Files to stage:

- `FRACTIONS_PILOT_INVENTORY.md`
- `FRACTIONS_SKILL_MAPPING_AUDIT.md`

Reason:

- `FRACTIONS_PILOT_INVENTORY.md` documents the active `F001-F026` inventory, pilot coverage readiness, working evidence support, and mapping risks.
- `FRACTIONS_SKILL_MAPPING_AUDIT.md` documents F-code/title/curriculum mapping drift and post-pilot curriculum architecture recommendations.
- Both are read-only documentation artifacts.
- Neither modifies production code, generated questions, routes, models, database data, or feature flags.

Exact stage command for this commit:

```bash
git add FRACTIONS_PILOT_INVENTORY.md FRACTIONS_SKILL_MAPPING_AUDIT.md
```

## 5. Generated Artifacts To Exclude

Files to exclude:

- None currently shown by `git status`.

Generated artifact paths to keep excluded if they appear later:

- `frontend/dist/`
- `frontend/test-results/`
- `frontend/playwright-report-pilot/`
- coverage output
- screenshots/videos/traces from Playwright
- cache files

## 6. Risky / Unrelated Files To Review

Files to review before committing:

- `FRACTIONS_SKILL_MAPPING_AUDIT.md`
  - Risk: contains curriculum-scope recommendations and flags high mapping risk across many F-codes. Product/curriculum owner should review before implementation work begins.
- `FRACTIONS_PILOT_INVENTORY.md`
  - Risk: relies on the latest checked-in DB-backed coverage report generated on 2026-06-04, rather than rerunning live coverage during this commit-planning task.

Files to exclude unless intentionally making a separate planning commit:

- `PILOT_COMMIT_PLAN.md`

Reason:

- It is useful operationally, but it is not required for the curriculum audit commit.

## Recommended Commit Structure

Recommended: split commits.

### Commit 1: Curriculum Audit Docs

Stage:

```bash
git add FRACTIONS_PILOT_INVENTORY.md FRACTIONS_SKILL_MAPPING_AUDIT.md
```

Recommended commit message:

```text
docs(mathpath): audit fractions pilot inventory and mappings
```

Suggested body:

```text
Document current F001-F026 pilot inventory coverage and working evidence support.
Classify pilot readiness separately from full curriculum coverage.
Identify F-code title and SG curriculum mapping drift before scale-up.
Recommend post-pilot mapping correction before stronger curriculum-scope claims.
```

### Commit 2: Optional Commit Planning Doc

Stage only if you want to preserve this planning artifact in git:

```bash
git add PILOT_COMMIT_PLAN.md
```

Recommended commit message:

```text
docs(mathpath): add pilot commit plan
```

## Exact Files To Exclude From Commit 1

```text
PILOT_COMMIT_PLAN.md
frontend/dist/
frontend/test-results/
frontend/playwright-report-pilot/
```

## Final Recommendation

Use two commits if `PILOT_COMMIT_PLAN.md` should be kept:

1. `docs(mathpath): audit fractions pilot inventory and mappings`
2. `docs(mathpath): add pilot commit plan`

If you want the cleanest repo history, commit only the two curriculum audit docs and leave `PILOT_COMMIT_PLAN.md` uncommitted or remove it after use.
