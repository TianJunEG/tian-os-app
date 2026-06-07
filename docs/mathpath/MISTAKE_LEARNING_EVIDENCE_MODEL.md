# Mistake Learning Evidence Model

## Purpose

Mistakes are learning evidence only when the student has shown what changed.

A reviewed mistake is not automatically understood or mastered. This protects Tian OS progress, parent reports, tutor reports, Recovery Packs, and recheck readiness from being inflated by click-through review behaviour.

## Learning Statuses

| Status | Meaning | Evidence Required |
|---|---|---|
| `new` | Mistake is waiting for review. | Wrong answer record exists. |
| `acknowledged` | Student has seen and acknowledged the mistake. | Review action only. |
| `corrected` | Student has attempted a correction. | Reflection and correction attempt. |
| `understood` | Student has explained the idea or next step. | Passed understanding check. |
| `mastered` | Student can now solve similar work successfully. | Mastery evidence such as successful correction, guided question, independent question, or recheck. |

## Evidence Fields

| Field | Use |
|---|---|
| `reviewed` | Backward-compatible flag. Means acknowledged only. |
| `reflection` | Student explanation of the mistake. |
| `correctionAttempt` | Student's corrected answer or correction attempt. |
| `understandingCheck` | Lightweight explanation/check that shows understanding. |
| `masteryEvidence` | The only field that can justify mastered/resolved status. |

## Legacy Backfill Rules

Backfill logic is conservative:

| Legacy Record | Backfilled Learning Status |
|---|---|
| `reviewed=true` with no evidence | `acknowledged` |
| `reviewed=true` with correction/reflection evidence | `corrected` |
| `reviewed=true` with understanding evidence | `understood` |
| `resolved=true` or `status=resolved` with no mastery evidence | downgraded to non-mastered state |
| Any record with `masteryEvidence.evidenceType` | `mastered` |

The backfill never upgrades a legacy mistake to `mastered` unless mastery evidence exists.

## Mastery Evidence Rules

Mastery may be counted only when at least one of these exists:

- `masteryEvidence.evidenceType = successful_correction`
- `masteryEvidence.evidenceType = guided_question`
- `masteryEvidence.evidenceType = independent_question`
- `masteryEvidence.evidenceType = recheck`

The old `reviewed=true` flag must not be used as mastery, readiness, or resolved evidence.

## Pilot QA Checks

Run a dry-run audit before applying changes:

```bash
node scripts/backfillLegacyMistakeEvidence.js
```

Apply the backfill only after reviewing high-risk rows:

```bash
node scripts/backfillLegacyMistakeEvidence.js --apply
```

Optional filters:

```bash
node scripts/backfillLegacyMistakeEvidence.js --module=MathPath --studentId=<studentId> --limit=100
```

Admin QA endpoint:

```text
GET /api/admin/mathpath/legacy-mistake-evidence-audit
GET /api/admin/mathpath/legacy-mistake-evidence-audit?export=1
```

The export contains:

- `mistakeId`
- `studentId`
- `skillId`
- `oldState`
- `proposedState`
- `evidenceFound`
- `riskLevel`
- `recommendedAction`

## Audit Findings

The active MathPath mastery/progress paths primarily use attempts, diagnostic results, `MasteryRecord`, and `MathPathStudentSkillState`. The sprint audit did not find an active source path where `reviewed=true` alone directly creates skill mastery.

Remaining risk is legacy mistake records with `reviewed=true`, `resolved=true`, or `status=resolved` being interpreted by future reports or manual QA as stronger evidence than they are. The backfill and admin audit make those records explicit and downgrade resolved/mastered state when mastery evidence is missing.
