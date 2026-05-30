# MathPath Founder/Team Alpha Test Script v1.0

## Purpose

This script is the repeatable internal alpha checklist for MathPath Fractions.

Scope:
- Founder/team internal testing only
- Validate real user flows across Student, Parent, Tutor, Teacher
- Validate core data integrity and mobile usability

Out of scope:
- New feature development
- UI redesign
- Public beta validation

---

## Test Setup

Environment:
- Backend running
- Frontend running
- Demo accounts seeded (`demo.student@tianos.test`, `demo.parent@tianos.test`, `demo.tutor@tianos.test`, `demo.teacher@tianos.test`)
- Fractions question data present

Suggested run metadata:
- Test date:
- Tester name:
- Build/version:
- Device/browser:

---

## Student Flow (Demo Student)

| # | Step | Expected Result | Pass | Fail | Notes |
|---|------|-----------------|------|------|-------|
| S1 | Login as demo student | Login succeeds and routes to student area | ☐ | ☐ | |
| S2 | Open Student Dashboard | Dashboard loads without crash/spinner lock | ☐ | ☐ | |
| S3 | Open MathPath | MathPath home loads with selectable/startable practice path | ☐ | ☐ | |
| S4 | Start recommended practice | Practice session starts and first question appears | ☐ | ☐ | |
| S5 | Answer 10 fraction questions | Inputs are accepted and navigation to next question works | ☐ | ☐ | |
| S6 | Submit answers during session | Each submission returns correctness feedback | ☐ | ☐ | |
| S7 | Complete session | Session completes successfully without API/UI error | ☐ | ☐ | |
| S8 | View result screen | Accuracy/time/result summary visible and coherent | ☐ | ☐ | |
| S9 | Review mistakes | Mistake list/detail appears for wrong attempts | ☐ | ☐ | |
| S10 | Return to MathPath dashboard | Navigation back works with no broken links | ☐ | ☐ | |
| S11 | Confirm progress updated | Mastery/progress indicators reflect latest session activity | ☐ | ☐ | |

---

## Parent Flow (Demo Parent)

| # | Step | Expected Result | Pass | Fail | Notes |
|---|------|-----------------|------|------|-------|
| P1 | Login as demo parent | Login succeeds and parent area opens | ☐ | ☐ | |
| P2 | Open Parent Dashboard | Parent dashboard loads without crash | ☐ | ☐ | |
| P3 | Select child | Child profile/context opens correctly | ☐ | ☐ | |
| P4 | View MathPath progress | Parent can see understandable progress summary | ☐ | ☐ | |
| P5 | View weak topics | Weak/needs-support areas are visible | ☐ | ☐ | |
| P6 | View recommended actions | Action recommendations are visible and readable | ☐ | ☐ | |
| P7 | Assign practice (if available) | Assignment action works or is clearly unavailable by scope | ☐ | ☐ | |
| P8 | Confirm progress is understandable | Parent-facing language is clear (no confusing raw internals) | ☐ | ☐ | |

---

## Tutor Flow (Demo Tutor)

| # | Step | Expected Result | Pass | Fail | Notes |
|---|------|-----------------|------|------|-------|
| T1 | Login as demo tutor | Login succeeds and tutor area opens | ☐ | ☐ | |
| T2 | Open Tutor Dashboard | Tutor dashboard/home loads | ☐ | ☐ | |
| T3 | Select assigned student | Assigned student profile opens | ☐ | ☐ | |
| T4 | View student MathPath profile | Student skill/progress context is visible | ☐ | ☐ | |
| T5 | View weak skills | Weak skills list is present and usable | ☐ | ☐ | |
| T6 | View mistake history | Mistake history loads for the student | ☐ | ☐ | |
| T7 | Open lesson prep | Lesson prep screen loads with recommendations | ☐ | ☐ | |
| T8 | Confirm recommendation usefulness | Next-lesson recommendation is actionable for tutor session planning | ☐ | ☐ | |

---

## Teacher Flow (Demo Teacher)

| # | Step | Expected Result | Pass | Fail | Notes |
|---|------|-----------------|------|------|-------|
| H1 | Login as demo teacher | Login succeeds and teacher area opens | ☐ | ☐ | |
| H2 | Open Teacher Dashboard | Teacher dashboard/home loads | ☐ | ☐ | |
| H3 | Open class | Class page opens with roster/context | ☐ | ☐ | |
| H4 | View class overview | Class summary stats/insights appear | ☐ | ☐ | |
| H5 | View mastery map | Class mastery map view loads and is readable | ☐ | ☐ | |
| H6 | View students needing support | At-risk/support list is visible | ☐ | ☐ | |
| H7 | View grouping/intervention page | Grouping/intervention view loads | ☐ | ☐ | |
| H8 | Confirm class insight usefulness | Data is actionable for teacher intervention planning | ☐ | ☐ | |

---

## Device Test Checklist

### iPhone / Mobile Browser

| Check | Expected Result | Pass | Fail | Notes |
|------|------------------|------|------|-------|
| Layout | No major overlap/cutoff | ☐ | ☐ | |
| Scrolling | Smooth vertical flow; no trapped scroll areas | ☐ | ☐ | |
| Button size | Tap targets are comfortably usable | ☐ | ☐ | |
| Question readability | Fraction prompts/feedback are legible | ☐ | ☐ | |
| Input usability | Answer/confidence inputs are easy to use | ☐ | ☐ | |

### iPad / Tablet

| Check | Expected Result | Pass | Fail | Notes |
|------|------------------|------|------|-------|
| Layout | Balanced card/column layout | ☐ | ☐ | |
| Scrolling | No broken nested scroll patterns | ☐ | ☐ | |
| Button size | Controls are finger-friendly | ☐ | ☐ | |
| Question readability | Prompt + feedback fit well | ☐ | ☐ | |
| Input usability | Inputs and nav controls feel stable | ☐ | ☐ | |

### Laptop / Desktop

| Check | Expected Result | Pass | Fail | Notes |
|------|------------------|------|------|-------|
| Layout | Dashboard/practice layout is coherent | ☐ | ☐ | |
| Scrolling | No unnecessary overflow issues | ☐ | ☐ | |
| Button size | Clear and consistent interactions | ☐ | ☐ | |
| Question readability | Prompts/solutions clear at desktop sizes | ☐ | ☐ | |
| Input usability | Keyboard entry and submit flow reliable | ☐ | ☐ | |

---

## Data Integrity Checks

| # | Check | Expected Result | Pass | Fail | Notes |
|---|-------|-----------------|------|------|-------|
| D1 | Attempt saved | Practice attempt appears in session/result data | ☐ | ☐ | |
| D2 | Mastery updated | Mastery record reflects new attempt outcome | ☐ | ☐ | |
| D3 | Mistake recorded when wrong | Wrong answer creates/updates mistake item | ☐ | ☐ | |
| D4 | Result screen match | Result stats match submitted answers | ☐ | ☐ | |
| D5 | Dashboard refresh | Post-session dashboard reflects latest state | ☐ | ☐ | |

---

## Bug Log Template

| Bug ID | Role | Page | Step | Expected | Actual | Severity | Screenshot/Notes | Fixed? |
|--------|------|------|------|----------|--------|----------|------------------|--------|
| MP-001 | Student/Parent/Tutor/Teacher |  |  |  |  | Critical / High / Medium / Low |  | ☐ |
| MP-002 | Student/Parent/Tutor/Teacher |  |  |  |  | Critical / High / Medium / Low |  | ☐ |
| MP-003 | Student/Parent/Tutor/Teacher |  |  |  |  | Critical / High / Medium / Low |  | ☐ |

Severity guide:
- **Critical**: blocks core journey (cannot login/start/submit/complete)
- **High**: major flow degradation; workaround difficult
- **Medium**: feature works but with notable usability/data issue
- **Low**: minor polish issue, no core impact

---

## Alpha Exit Criteria

Internal alpha is considered passed when all are true:

1. Student can complete full fractions practice flow end-to-end.
2. Attempts save correctly.
3. Mastery updates correctly.
4. Results display correctly.
5. No critical login/navigation bugs.
6. No critical mobile blockers.
7. Parent/tutor/teacher can view meaningful progress context.

Release recommendation:
- If any **Critical** bug remains open: **Do not pass internal alpha**.
- If only Medium/Low bugs remain with clear workarounds: **Pass with follow-up fixes queued**.

---

## Test Run Summary

- Total role-flow steps: 35  
  - Student: 11  
  - Parent: 8  
  - Tutor: 8  
  - Teacher: 8
- Device checks: 15
- Data checks: 5
- Total checklist items: 55

Sign-off:
- Founder sign-off:  
- Product/Engineering sign-off:  
- Date:

