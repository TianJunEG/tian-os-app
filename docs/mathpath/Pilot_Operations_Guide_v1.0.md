# Pilot Operations Guide v1.0

## Purpose

This guide defines the operating workflow for a 5–10 student MathPath Fractions pilot and the feedback system used to capture:
- usage
- engagement
- outcomes
- bug reports
- parent feedback
- tutor feedback
- teacher feedback
- founder notes

---

## Scope

- Domain: Fractions only
- Pilot size: 5–10 students
- Duration: 4–8 weeks
- Levels: Primary 3–Primary 6
- Mode: supervised internal pilot

---

## System Components

### Data Model
- `models/mathpath/PilotFeedback.js`
  - Supports feedback types: `student`, `parent`, `tutor`, `teacher`, `founder`, `bug`
  - Supports numeric ratings (1–5), free-text responses, notes
  - Supports structured bug reports:
    - `category`
    - `severity` (`critical|high|medium|low`)
    - `description`
    - `screenshotUrl`
    - `reportedBy`
    - `createdAt`

### Service Engine
- `services/mathpath/pilotFeedbackEngine.js`
  - Creates role-based feedback
  - Stores bug reports
  - Produces pilot summary payload
  - Integrates with outcome tracking for growth metrics

---

## Feedback Forms Supported

## 1) Student Feedback (1–5 ratings)
Capture:
- Was practice easy to start?
- Was the question difficulty appropriate?
- Was the explanation useful?
- What was confusing?
- What would you improve?

## 2) Parent Feedback (1–5 ratings)
Capture:
- Was progress easy to understand?
- Was the dashboard useful?
- Did your child use the platform?
- Would you continue using it?
- What would you improve?

## 3) Tutor Feedback
Capture:
- Was student data useful?
- Were recommendations useful?
- Was lesson prep useful?
- What was missing?

## 4) Teacher Feedback
Capture:
- Was class data useful?
- Were intervention groups useful?
- Was mastery information useful?
- What was missing?

## 5) Founder Notes
Capture:
- strategic notes
- operation observations
- launch risks and decisions

---

## Usage Metrics (Tracked)

The pilot summary tracks:
- Daily Active Students (DAS)
- Weekly Active Students (WAS)
- Practice Sessions
- Questions Answered
- Average Session Length (minutes)
- Completion Rate (% completed sessions)
- Return Rate (% active across >=2 distinct days in window)

---

## Outcome Metrics (Tracked)

Integrated from Step 28 outcome tracking:
- Mastery Gain
- Fluency Gain
- Retention Gain
- Assessment Gain
- Readiness Gain

---

## Pilot Summary Payload

`buildPilotSummary()` returns:

```json
{
  "studentCount": 0,
  "activeStudents": 0,
  "completionRate": 0,
  "averageMasteryGain": 0,
  "averageFluencyGain": 0,
  "averageRetentionGain": 0,
  "averageAssessmentGain": 0,
  "averageParentSatisfaction": 0,
  "averageStudentSatisfaction": 0,
  "majorIssues": [],
  "recommendedActions": []
}
```

Plus attached operational detail:
- `usageMetrics` (DAS/WAS/session volume/return rate)
- `outcomeMetrics` (growth metrics)
- `generatedAt`

---

## Weekly Pilot Operating Rhythm

## Monday
- confirm active student roster
- run onboarding/support follow-up for low-usage students

## Mid-week
- collect student + tutor feedback
- triage bugs (critical/high within 24–48h)

## Friday
- collect parent/teacher feedback
- run `buildPilotSummary()`
- publish weekly operations snapshot

---

## Bug Triage Rules

Severity:
- **critical**: blocks core student practice flow
- **high**: major degradation with limited workaround
- **medium**: functional but painful
- **low**: minor UX/polish issue

Actions:
- critical: hotfix priority
- high: next sprint-slot priority
- medium/low: backlog with owner/date

---

## Validation Workflow

Use:
- `validatePilotFeedbackEngine()`

Checks:
1. feedback records save
2. pilot summary generates
3. outcome metrics integrate
4. bug reports save
5. satisfaction scores calculate

---

## Example Operational Calls (Service Level)

- `submitStudentFeedback(payload)`
- `submitParentFeedback(payload)`
- `submitTutorFeedback(payload)`
- `submitTeacherFeedback(payload)`
- `submitFounderNotes(payload)`
- `reportPilotBug(payload)`
- `listPilotFeedback(filters)`
- `buildPilotSummary(options)`
- `validatePilotFeedbackEngine(options)`

---

## Pilot Exit Signal

Pilot ops quality is acceptable when:
- feedback capture is running weekly
- bug backlog is triaged by severity
- summary payload generates reliably
- outcome metrics are populated for active students
- parent/student satisfaction trends are measurable

