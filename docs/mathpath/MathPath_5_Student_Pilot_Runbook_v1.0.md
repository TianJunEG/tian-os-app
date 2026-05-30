# MathPath 5-Student Pilot Runbook v1.0

## Purpose

This runbook is the execution guide for a real 5-student MathPath Fractions pilot.

Scope:
- Fractions domain only
- Primary 3 to Primary 6
- 4-week supervised pilot
- Internal team operated

---

## Pilot Team Roles

- Pilot Lead: owns schedule, go/no-go calls, weekly reporting
- Support Lead: handles student/parent support and escalation
- Data Lead: validates outcome tracking and summary quality
- QA Lead: tracks bugs and verifies fixes

---

## Cohort Design (5 Students)

- 1 student: stronger baseline (extension profile)
- 2 students: mid baseline
- 2 students: clear remediation need

Target:
- mixed readiness to validate recommendations and progression quality

---

## Entry Criteria (Must Pass Before Day 1)

- [ ] Backend runs without critical runtime errors
- [ ] Frontend build passes
- [ ] Fractions seed data exists and question generation is available
- [ ] Demo/pilot account creation flow works
- [ ] Attempt saving and mastery updates verified in staging
- [ ] Outcome tracking record can be created and updated
- [ ] Pilot feedback model/service can save and query records

If any item fails, delay student onboarding.

---

## 4-Week Execution Plan

## Week 0: Setup + Baseline

1. Finalize cohort roster (5 students) and parent consent.
2. Create accounts and verify login/device readiness.
3. Run baseline diagnostic for each student.
4. Run baseline assessment (if enabled in current build).
5. Create baseline outcome records.
6. Confirm each student has a recommended starting skill.

Exit gate:
- 5/5 students complete onboarding
- 5/5 baseline diagnostic runs complete

## Week 1: Guided Practice Start

1. Minimum 2 practice sessions per student.
2. Capture student + tutor feedback at week end.
3. Triage all critical/high bugs.
4. Publish first pilot summary snapshot.

Exit gate:
- >= 80% planned sessions completed
- no unresolved critical student-flow bug

## Week 2: Fluency + Retention Stability

1. Continue 2–3 practice sessions per student.
2. Ensure fluency flags are visible in outputs.
3. Run first retention due reviews where available.
4. Collect parent feedback.

Exit gate:
- attempt data quality stable
- no data-loss incidents

## Week 3: Consolidation + Interim Assessment

1. Run progress/mastery assessment (if enabled).
2. Validate score/readiness trend per student.
3. Review intervention effectiveness by student profile.
4. Continue bug triage and support follow-up.

Exit gate:
- outcome metrics update for active students
- major blockers resolved or mitigated

## Week 4: Closeout

1. Run end-of-pilot assessment.
2. Update final outcome records.
3. Collect final student/parent/tutor/teacher feedback.
4. Produce pilot outcome report + go/no-go recommendation.

Exit gate:
- final reports generated
- pilot recommendation approved by lead

---

## Weekly Minimum Targets (Per Student)

- Practice sessions: 2
- Questions answered: 20+
- Feedback cadence: weekly student feedback
- Parent check-in: at least once every 2 weeks

---

## Severity SLA

- Critical: triage same day, fix/hot workaround within 24h
- High: triage same day, fix target within 48h
- Medium: schedule within current pilot week
- Low: backlog unless it affects completion/engagement

---

## Operational Commands (Reference)

- Generate pilot summary:
  - `buildPilotSummary({ pilotId, domainId: "fractions" })`
- Validate feedback engine:
  - `validatePilotFeedbackEngine({ pilotId, domainId: "fractions" })`
- Update student outcome:
  - `updateOutcomeTracking(studentId, "fractions")`

---

## Daily Operating Cadence

- Morning:
  - check active students and unresolved blockers
- Midday:
  - support responses and bug triage
- End of day:
  - update tracker, log decisions, publish short ops note

---

## Go/No-Go Rules for Expanding Beyond 5 Students

Go only if all are true:
- >= 80% weekly completion sustained for 2 consecutive weeks
- no unresolved critical bugs in core student flow
- outcome data is complete enough for trend comparison
- parent satisfaction average >= 3.5/5
- student satisfaction average >= 3.5/5

If not met:
- remain in 5-student pilot and execute targeted fixes

---

## Linked Templates

- `docs/mathpath/pilot/templates/pilot_student_roster_template.csv`
- `docs/mathpath/pilot/templates/pilot_weekly_tracker_template.csv`
- `docs/mathpath/pilot/templates/pilot_bug_log_template.csv`
- `docs/mathpath/pilot/templates/pilot_feedback_rollup_template.csv`
