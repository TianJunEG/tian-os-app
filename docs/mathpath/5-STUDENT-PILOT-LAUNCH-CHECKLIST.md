# 5-Student Pilot Launch Checklist

Date: 2026-06-05

Source documents:

- `docs/mathpath/PREFLIGHT_PILOT_RUN.md`
- `docs/mathpath/PILOT_FIX_PLAN.md`
- `docs/mathpath/PILOT_PRIORITY_ORDER.md`

## 1. Pilot Scope

The 5-student pilot validates the stable Tian OS MathPath core loop only:

Student Dashboard -> MathPath -> Diagnostic -> Practice -> Answer Submission -> Confidence -> Working Evidence -> Mistake Creation -> Progress Update -> Student Dashboard Next Action

Pilot success means each student can:

- log in successfully
- see one clear next action
- complete a Fractions diagnostic
- complete normal Fractions practice
- submit working or declare working not needed
- create a real mistake from a wrong answer
- see Mistakes and Progress update from persisted attempts
- avoid broken routes, fake data, and developer-facing copy

Out of scope:

- Sprint 2 and Sprint 3
- Paper Review
- WordPath student experience
- Learning Intelligence dashboard migration
- Knowledge Map production migration
- AssessmentPath / ChallengePath
- new question bank generation
- P5/P6 expansion
- OCR/AI marking

## 2. Enabled Features

Student-facing pilot features:

- Student Dashboard / Today's Mission
- MathPath Home
- Fractions Diagnostic
- Recommended Fractions Practice
- Answer submission
- Confidence selection
- Working Evidence decision
- Full-screen working save/reopen
- Working on paper declaration
- Working not needed declaration
- Mistakes
- Mistake Review
- Progress page
- Student Profile, if visible in navigation

Backend/data features expected to be active:

- authenticated student identity resolution
- diagnostic session persistence
- practice session persistence
- MathPath attempt persistence
- mistake creation
- weak-skill aggregation
- persisted Fractions progress graph with 26 skills
- learning telemetry where already wired

## 3. Disabled / Gated Features

Keep hidden from pilot navigation or show safe unavailable states if directly opened:

- Fluency, unless inventory is verified and the empty state is clean
- Assessment / Test Mode
- Assessment Upload
- Test Specification
- Model Trainer
- Story Mode, unless explicitly enabled and smoke-tested for the pilot
- SciencePath
- WordPath
- Paper Review
- Worksheets / worksheet generator
- ChallengePath
- unsupported Story Mode domains
- developer/admin seeding controls
- adult marketplace or advanced tutor workflow links from the student path

Direct gated routes must not show broken pages, seed instructions, fake data, or developer copy.

## 4. Student Onboarding Checklist

Before first session:

- Confirm each student has a working pilot account.
- Confirm password works before the live session.
- Confirm each account is linked to the correct child Student record.
- Reset pilot state only when intentionally starting the pilot baseline.
- Confirm device, browser, internet, and audio/visual setup if observed remotely.
- Explain that Tian OS will ask for answer, confidence, and working evidence.
- Explain the three working choices:
  - show working in Tian OS
  - I did my working on paper
  - I did not need working for this question
- Tell students not to worry about mistakes; mistakes create review practice.
- Ask students to complete the diagnostic without help unless blocked by a technical issue.

During first session:

- Student logs in.
- Student lands on Student Dashboard.
- Student opens MathPath.
- Student starts Fractions Diagnostic.
- Student completes diagnostic.
- Student starts recommended practice.
- Student answers at least 5 practice questions.
- Student selects confidence for every answer.
- Student uses a working evidence option for every answer.
- Student intentionally or naturally creates at least one mistake.
- Student opens Mistakes or Mistake Review.
- Student checks Progress or returns to Dashboard.

## 5. Parent Onboarding Checklist

Before pilot:

- Explain pilot scope: MathPath Fractions core loop only.
- Explain disabled features are intentional, not account errors.
- Ask parent not to interpret early progress as a full academic report.
- Explain working evidence:
  - submitted working gives richer review
  - paper working may require upload/review later
  - no working can indicate mental fluency or possible overconfidence
- Explain that dashboard recommendations are pilot signals, not final curriculum placement.
- Provide support contact and bug-reporting process.

After first session:

- Confirm parent can access any intended parent view, if part of this pilot.
- Review whether the child completed diagnostic and practice.
- Check whether mistakes/progress appeared.
- Ask parent to report confusing copy, broken routes, or any place the child did not know what to do next.

## 6. Tutor / Admin Monitoring Checklist

Before launch:

- Verify five pilot accounts log in.
- Verify visible route preflight passes.
- Verify all gated features remain hidden or safely unavailable.
- Verify no student page shows:
  - `Route not found`
  - `Run npm run`
  - seed instructions
  - fake/demo visible content
  - `Question unavailable`
  - `undefined`
  - `NaN`
  - `0/1 skills mastered`
- Verify diagnostic target is 10 questions.
- Verify Fractions progress denominator is 26 skills.
- Confirm reset process is understood and not run accidentally during live usage.

During launch:

- Monitor login success.
- Monitor diagnostic completion.
- Monitor practice completion.
- Monitor attempt persistence.
- Monitor working evidence states.
- Monitor mistake creation.
- Monitor dashboard/progress updates.
- Record any broken route or confusing next action.

After each session:

- Confirm every student has diagnostic records.
- Confirm every student has practice attempts.
- Confirm wrong answers created mistake records.
- Confirm progress updated from real persisted state.
- Confirm no fake/demo/developer states appeared.

## 7. Daily Monitoring Tasks

Daily during pilot:

- Check login success/failure count.
- Check diagnostic starts and completions.
- Check practice sessions started and completed.
- Check average questions answered per student.
- Check attempts persisted per student.
- Check working evidence distribution:
  - submitted working
  - working on paper
  - working not needed
  - missing working decision
- Check mistake count and review count.
- Check progress changes by student.
- Check dashboard recommended next action.
- Check visible route health.
- Check error logs for 401, 403, 429, 500, failed save, and failed question generation.
- Check whether any student hit gated features unexpectedly.
- Review parent/student/tutor feedback notes.

## 8. Bug Reporting Process

For every bug, capture:

- reporter name
- student account
- role affected: student, parent, tutor, admin
- date and time
- route / URL
- device and browser
- action taken immediately before the issue
- expected result
- actual result
- screenshot or screen recording if available
- whether refresh fixed it
- whether the student could continue
- severity

Severity levels:

- Blocker: student cannot log in, complete diagnostic, complete practice, submit answer, submit working decision, or continue the pilot loop.
- High: mistakes/progress/dashboard data is wrong or missing after completion.
- Medium: confusing copy, poor empty state, non-critical route issue, or recoverable save problem.
- Low: visual polish, wording preference, or non-blocking layout issue.

Triage rule:

- Fix only true pilot blockers during the pilot.
- Do not open Sprint 2 work as part of pilot support.
- Hide or gate unstable surfaces instead of expanding scope.

## 9. Data To Collect

Student flow data:

- login success
- diagnostic started
- diagnostic completed
- diagnostic answered question count
- diagnostic completion reason
- recommended skill after diagnostic
- practice sessions started
- practice sessions completed
- questions answered
- answer correctness
- confidence selection
- time taken
- workingSubmitted
- workingOnPaper
- workingNotNeeded
- workingSessionId where applicable
- mistakes created
- mistake review opened
- progress state after practice
- dashboard next action after practice

Educational signal data:

- correct + high confidence
- wrong + high confidence
- wrong + low confidence
- wrong + no working needed
- wrong + high confidence + no working needed
- working submitted accuracy
- mental fluency accuracy
- repeated weak skills
- whether students understand what to do next

Operational data:

- broken routes
- gated route access attempts
- visible forbidden copy
- API errors
- failed saves
- reload/resume issues
- parent/tutor/student feedback

Do not present unsupported or fake analysis as real pilot data.

## 10. Success Metrics

Minimum success gate:

- 5 / 5 students can log in.
- 5 / 5 students can load Student Dashboard.
- 5 / 5 students can load MathPath.
- 5 / 5 students can complete diagnostic.
- Diagnostic completes expected 10-question flow unless a valid adaptive completion rule is logged.
- 5 / 5 students can start recommended practice.
- 5 / 5 students can answer at least 5 practice questions.
- 5 / 5 students persist confidence selections.
- 5 / 5 students persist a valid working evidence state.
- At least one wrong answer creates a real mistake record for each student.
- Mistakes page shows real records or clean empty state.
- Progress page shows 26 Fractions skills, not `0/1`.
- Dashboard next action loads from real state.
- No pilot-visible route shows broken or developer-facing copy.

Quality success signals:

- Students understand what to do next without adult navigation help.
- Students can complete the loop in one sitting.
- Mistakes feel useful rather than punitive.
- Working evidence does not create unnecessary friction for simple questions.
- Parents understand that the pilot is a focused MathPath loop, not the full Tian OS roadmap.

## 11. Stop / Go Criteria

GO if:

- latest preflight passes
- all five student accounts are ready
- visible pilot route set is stable
- gated features remain hidden or safe
- diagnostic, practice, working evidence, mistakes, progress, and dashboard all persist correctly
- support owner is available during pilot sessions

STOP if:

- any student cannot log in and no workaround exists
- diagnostic ends after one question without a valid logged reason
- practice answers do not persist
- working evidence blocks valid submissions or disappears after save
- wrong answers do not create mistakes
- progress/dashboard shows fake, stale, or impossible state
- visible pages show `Route not found`, developer seed text, `undefined`, `NaN`, or fake/demo content
- data is stored under the wrong student identity
- multiple students hit the same unrecoverable error

PAUSE / INVESTIGATE if:

- one student hits a recoverable route issue
- one save request fails but retry works
- parent/tutor views lag but student core loop remains intact
- non-pilot gated feature is directly opened and shows safe copy

## 12. Known Limitations

- Pilot is limited to MathPath Fractions.
- Current live flow remains based on `F001`-`F026`; Knowledge Map and micro-skill architecture are not the production source of truth yet.
- WordPath architecture exists but is not student-facing for pilot.
- Paper Review architecture exists but is not part of the pilot.
- Learning Intelligence may exist in services but should not become the canonical dashboard engine during pilot.
- Fluency should remain hidden or safe unless inventory is verified.
- Model Trainer should remain hidden unless deliberately enabled and smoke-tested.
- Story Mode should remain hidden unless deliberately enabled and smoke-tested.
- Working analysis can be pending; do not imply method analysis exists when working is unavailable.
- Parent/tutor advanced insights are not the primary pilot success measure.
- Local QA may require `QA_DISABLE_RATE_LIMIT=1` and explicit frontend/API base URLs for repeatable test runs.

## 13. Support Procedure

Before each pilot day:

1. Confirm backend and frontend are running the intended build.
2. Confirm pilot feature gates are in the expected state.
3. Run the visible-route smoke or full preflight if changes landed since the previous session.
4. Confirm no generated reports or stale bundles are being reviewed as source changes.
5. Confirm support contact and escalation path.

During a live issue:

1. Ask the student to stop and keep the screen as-is.
2. Record route, action, student account, and timestamp.
3. Capture screenshot or recording if possible.
4. Check whether refresh/resume is safe.
5. If the issue is a blocker, pause that student and preserve data.
6. If the issue is recoverable, allow the student to continue and mark it for later triage.

After a live issue:

1. Classify severity.
2. Check backend records for diagnostic/session/attempt/mistake/progress state.
3. Check whether the issue affects other students.
4. Fix only true pilot blockers.
5. Rerun targeted tests and the relevant Playwright route/flow.
6. Update pilot notes with resolution or workaround.

Recommended validation commands after any pilot-blocking fix:

```bash
npm test -- routes/diagnostics.test.js utils/diagnosticRuntime.test.js utils/practicePersistence.test.js utils/mistakesRoute.test.js
```

```bash
npm --prefix frontend run test -- src/pages/student/StudentDashboard.test.jsx src/pages/student/SkillGraph.test.jsx src/pages/student/mathpath/MistakesHome.test.jsx src/pages/student/mathpath/MistakeReview.test.jsx src/pages/student/mathpath/PracticeSession.test.jsx src/pages/student/mathpath/PracticeSession.telemetry.test.jsx
```

```bash
npm --prefix frontend run build
```

```bash
PLAYWRIGHT_BASE_URL=<frontend-url> PLAYWRIGHT_API_BASE_URL=<api-url> npm --prefix frontend run test:e2e -- tests/e2e/pilot-preflight-core-loop.spec.js
```

## Final Launch Readiness

Current recommendation from preflight:

GO for the 5-student stable-core pilot, with the current gated feature set preserved.

Do not open Sprint 2 features until the pilot loop has been observed with real student usage.
