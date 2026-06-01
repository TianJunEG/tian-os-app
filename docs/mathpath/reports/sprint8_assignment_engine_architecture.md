# Sprint 8 Assignment Engine Architecture

Status: Completed

## Root Cause

Existing assignments stored module, skills, due date, status, and score, but did not carry the intervention context that explains why the work was assigned.

## Files Involved

- `models/Assignment.js`
- `routes/assignments.js`
- `routes/teacher.js`
- `frontend/src/services/api.js`
- `frontend/src/mathpath/interventions/interventionOperatingSystem.js`

## Implemented Architecture

Assignments now support:

- assignment creator role: system, parent, tutor, teacher
- target type: student, group, class
- intervention ID and type
- linked skills and misconceptions
- priority
- reusable template ID
- reusable playbook ID
- next action
- schedule
- timestamps for assigned, started, in progress, completed, skipped, expired, overdue
- reassessment and effectiveness snapshots
- AI-ready planning context

## Result

Diagnostic, fluency, retention, exam, mistake, and help-request signals can now be turned into assignable work without losing root-cause context.

