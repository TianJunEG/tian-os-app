# Tian OS Pilot Readiness

Status date: 2026-06-04

Scope: 5-student supervised MathPath Fractions pilot, F001-F026.

## System Status

Tian OS is in pilot hardening mode. No new major modules should be added before the pilot. The current pilot scope is:

- Student dashboard, MathPath, practice, mistakes, progress, fluency, worksheets, working evidence
- Parent dashboard and worksheet generation
- Tutor dashboard and intervention visibility
- Teacher dashboard read-only class QA actions
- Internal admin pilot analytics

## Pilot Readiness Checks

Run these before each pilot day:

```bash
node scripts/qa-pilot-env-check.js   # verify env first: Node, MONGODB_URI, reachable+seeded DB, frontend build
npm test
npm --prefix frontend run build
node scripts/auditFractionsQuestionQuality.js --variants=12
node scripts/updateFractionsCoverageReport.js
QA_BASE=http://127.0.0.1:5002/api PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 node scripts/qa-pilot-preflight.js
```

Optional full browser gate when backend/frontend are running:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:5002/api VITE_API_URL=http://127.0.0.1:5002/api npm --prefix frontend run test:pilot-gate
```

## Student Pilot Checklist

Complete once per pilot student:

| Check | Student 1 | Student 2 | Student 3 | Student 4 | Student 5 |
|---|---|---|---|---|---|
| Login works |  |  |  |  |  |
| Dashboard loads |  |  |  |  |  |
| Diagnostic works |  |  |  |  |  |
| Practice works |  |  |  |  |  |
| Confidence works |  |  |  |  |  |
| Working submission works |  |  |  |  |  |
| No-working declaration works |  |  |  |  |  |
| Mistakes page works |  |  |  |  |  |
| Progress page works |  |  |  |  |  |
| Worksheet assignment works |  |  |  |  |  |
| Parent dashboard works |  |  |  |  |  |
| Tutor dashboard works |  |  |  |  |  |

## Quality Gates

Question quality:
- F001-F026 audit must pass with no blocking failures.
- Review `docs/mathpath/Fractions_Question_Quality_Audit.md`.
- Repeated-template warnings are acceptable only when the prompts remain readable and answer validation passes.

Progress accuracy:
- Fractions progress must use the full F001-F026 domain, not a one-skill denominator.
- Dashboard labels must avoid undefined values and blank metrics.
- Empty states should say what the student/parent/tutor can do next.

Working evidence:
- Verify canvas draw, save, edit, delete, submit, upload, preview, and no-working declaration on desktop and mobile.
- Working telemetry must include `working_submitted` and `working_not_needed_declared`.

Confidence:
- Confirm `I know this`, `I'm not sure`, and `I need help` are stored as telemetry.
- Overconfident wrong answers must appear in pilot analytics.

Worksheet flow:
- Recommended worksheets should come from weak skills, mistakes, confidence, retention, and fluency signals.
- Answer keys and PDFs must open.
- Student worksheet submission must update mastery and mistake records.

## Internal Monitoring

Use `/admin/pilot-analytics` for:

- Daily active students
- Questions answered
- Practice sessions
- Diagnostic completions
- Working submission rate
- No-working declaration rate
- Most missed skills
- Most active students
- Average session length
- Telemetry coverage

Use `/admin` → MathPath Pilot for the per-student operational monitor.

## Known Limitations

- Native PDF export is intentionally simple and single-document focused; browser print remains the preferred polished print path.
- Physical tablet stylus comfort should still be checked manually with the actual pilot devices.
- Analytics confidence improves after real pilot usage; seeded data is only a smoke baseline.
- Teacher worksheet flow is a lightweight launch path, not full class assignment management.

## Support Procedure

During the pilot:

1. Record blocker, student, device, URL, and screenshot.
2. Check `/admin/pilot-analytics` for missing telemetry or failed completion signals.
3. Reproduce on local seeded account if possible.
4. Patch only critical/high pilot blockers.
5. Re-run focused test/build and note the result in the pilot tracker.

## Success Metrics

Engagement:
- 5/5 students can log in and complete at least one MathPath activity.
- Daily active student trend is visible in admin analytics.
- Practice session completion rate remains trackable.

Learning:
- Diagnostic to weak-skill recommendation works.
- Mistake-to-mastery remediation path is traceable.
- Worksheet results feed back into mastery.

Behaviour:
- Confidence choices are captured.
- Working submission and no-working declaration are captured.
- Overconfidence and working evidence patterns are visible to adults.
