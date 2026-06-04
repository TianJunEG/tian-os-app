# MathPath 5-Student Pilot Runbook v1.0

## Purpose

This runbook is the execution guide for a real 5-student MathPath Fractions pilot.

Scope:
- Fractions domain only
- Primary 3 to Primary 6
- 2-week supervised pilot
- 5 students only
- Internal team operated
- No major feature development during the pilot

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

## 2-Week Execution Plan

## Week 0: Setup + Baseline

1. Finalize cohort roster (5 students) and parent consent.
2. Create accounts and verify login/device readiness.
3. Run baseline diagnostic for each student.
4. Run baseline assessment (if enabled in current build).
5. Create baseline outcome records.
6. Confirm each student has a recommended starting skill.
7. Record starting mastery, mistake count, confidence pattern, and working usage baseline.

Exit gate:
- 5/5 students complete onboarding
- 5/5 baseline diagnostic runs complete
- 5/5 students have a starting focus skill

## Week 1: Guided Practice Start

1. Minimum 1 short practice session per student per school day.
2. Capture engagement, completion, confidence, mistake, and working evidence daily.
3. Capture student + tutor feedback at week end.
4. Triage only critical/high bugs that block the pilot.
5. Publish first pilot summary snapshot.

Exit gate:
- >= 70% planned sessions completed
- no unresolved critical student-flow bug
- every inactive student has a documented follow-up

## Week 2: Learning Signal + Closeout

1. Continue 1 short practice session per student per school day.
2. Run targeted practice for each student's current weak skill.
3. Review high-confidence wrong answers and submitted working.
4. Collect parent feedback and tutor notes.
5. Run end-of-pilot assessment or skill check.
6. Produce pilot outcome report and go/no-go recommendation.

Exit gate:
- outcome metrics update for active students
- no data-loss incidents
- final reports generated
- pilot recommendation approved by lead

---

## Weekly Minimum Targets (Per Student)

- Practice sessions: 4
- Questions answered: 40+
- Feedback cadence: weekly student feedback
- Parent check-in: once per week

---

## Pilot Measures

Engagement:
- sessions per student per day
- completion rate
- questions answered
- return days

Learning:
- mastery gain from baseline to closeout
- weak skill accuracy change
- mistake reduction
- current focus skill movement

Behaviour:
- working usage rate
- high-confidence wrong answers
- low-confidence correct answers
- help requests

Primary pilot questions:
- Are students coming back without heavy prompting?
- Does the system identify the real weak skill?
- Does practice reduce mistakes within two weeks?
- Does working evidence help a tutor understand the misconception?

---

## Severity SLA

- Critical: triage same day, fix/hot workaround within 24h
- High: triage same day, fix target within 48h
- Medium: schedule within current pilot week
- Low: backlog unless it affects completion/engagement

During Step 11, do not start new feature work unless it is needed to unblock a critical pilot flow.

---

## Operational Commands (Reference)

- Generate daily MathPath Fractions pilot monitor report:
  - `MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match node scripts/mathpathPilotMonitorReport.js`
- Generate pilot summary:
  - `buildPilotSummary({ pilotId, domainId: "fractions" })`
- Validate feedback engine:
  - `validatePilotFeedbackEngine({ pilotId, domainId: "fractions" })`
- Update student outcome:
  - `updateOutcomeTracking(studentId, "fractions")`

---

## Daily Operating Cadence

- Morning:
  - run the pilot monitor report
  - check active students, sessions/day, completion rate, and unresolved blockers
- Midday:
  - support responses and bug triage
- End of day:
  - update tracker, log confidence/working/mistake signals, publish short ops note

---

## Go/No-Go Rules for Expanding Beyond 5 Students

Go only if all are true:
- >= 70% completion sustained across the 2-week pilot
- no unresolved critical bugs in core student flow
- outcome data is complete enough for trend comparison
- parent satisfaction average >= 3.5/5
- student satisfaction average >= 3.5/5
- at least 3/5 students show either mastery gain, mistake reduction, or improved confidence calibration

If not met:
- remain in 5-student pilot and execute targeted fixes

---

## Linked Templates

- `docs/mathpath/pilot/templates/pilot_student_roster_template.csv`
- `docs/mathpath/pilot/templates/pilot_weekly_tracker_template.csv`
- `docs/mathpath/pilot/templates/pilot_bug_log_template.csv`
- `docs/mathpath/pilot/templates/pilot_feedback_rollup_template.csv`
