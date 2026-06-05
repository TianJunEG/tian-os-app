# Tian OS Pilot Priority Order

Date: 2026-06-05

Source: `CURRENT_STATE_AUDIT.md` and current repo inspection.

Goal: shortest path to a successful 5-student MathPath pilot. This plan optimizes for student experience, stability, and educational accuracy. It does not optimize for feature count.

## Pilot Definition

A successful 5-student pilot means each student can:

1. log in
2. see one clear next action
3. complete a fractions diagnostic
4. complete normal practice
5. submit working or declare working not needed
6. see mistakes/progress update from real attempts
7. avoid broken routes, fake data, and developer-facing copy

Anything outside that loop should be hidden, disabled, or postponed.

## 1. True Pilot Blockers

### Critical

| Item | Why It Is A True Blocker | Priority |
|---|---|---|
| Diagnostic start, answer, completion, and result persistence | Without diagnostic, pilot students cannot be placed or guided. | Critical |
| Practice question reliability | Students must be able to answer questions without broken diagrams, answer-input failures, or empty sessions. | Critical |
| Attempt persistence | If answers do not persist, progress, mistakes, and analytics become unusable. | Critical |
| Working Evidence decision flow | Working submission is central to Tian OS diagnostics. It must not block simple questions unnecessarily, but students must make a working decision. | Critical |
| Mistake creation and Mistake Review | The learning loop depends on wrong answers becoming useful review moments. | Critical |
| Student identity correctness | No `demo-student` fallback or wrong user/student id linkage in pilot flows. | Critical |
| Progress/Dashboard uses real state | Students need to know what to do next from real diagnostic/practice evidence. | Critical |
| Broken route cleanup | Pilot students must not hit dead routes, unstable flows, or unsupported feature pages. | Critical |
| Removal of fake/demo/developer copy | Student-facing copy like seed instructions or fake/demo states undermines pilot trust. | Critical |

### High

| Item | Why It Matters | Priority |
|---|---|---|
| Fluency safe empty state | Fluency is useful, but should not show broken inventory or developer text. | High |
| Story Mode route stability | If visible, Fractions Story Mode must work. If not stable, hide from pilot navigation. | High |
| Dashboard CTA consistency | Student should see one primary next action, not conflicting actions. | High |
| Error handling for stale backend/rate limit/session refresh | Prevents pilot interruption during QA and live sessions. | High |
| Route smoke tests for visible pilot navigation | Ensures the stable student path does not regress. | High |

## 2. Items That Can Wait Until After Pilot

### Medium

| Item | Why It Can Wait | Priority |
|---|---|---|
| Micro-skill canonical migration | Valuable, but switching from `F001`-`F026` before pilot creates risk. | Medium |
| Diagnostic Asset Map production routing | Existing diagnostic works around `F001`-`F026`; new asset map can remain passive. | Medium |
| Remediation Asset Map production routing | Existing Mistake-to-Mastery is enough for pilot if mistakes and review work. | Medium |
| WordPath production diagnosis | Important later, but not needed for 5-student fractions pilot. | Medium |
| Learning Intelligence as central dashboard engine | Service can remain passive until current dashboards are stable. | Medium |
| Parent/tutor advanced intelligence | Adult summaries are useful, but student pilot can run without advanced adult insight surfaces. | Medium |
| Model Trainer expansion | Useful remediation feature, but normal practice + mistakes are the core loop. | Medium |

### Low

| Item | Why It Should Wait | Priority |
|---|---|---|
| Paper Review | Explicitly out of pilot scope; architecture-only today. | Low |
| OCR/AI marking improvements | Not needed for the first student pilot. | Low |
| New question generation | Do not expand question bank until current flows are stable. | Low |
| P5/P6 curriculum expansion | Pilot should stay focused on current P4 fractions path. | Low |
| Full WordPath UI | Premature without stable tagging and evidence capture. | Low |
| Worksheet generator polish | Not part of the core diagnostic-practice-mistake loop. | Low |
| Adult marketplace/tutor workflow expansion | Not needed for 5-student validation. | Low |

## 3. Roadmap Phases That Already Partially Exist

| Roadmap Phase | Current Status | Pilot Priority |
|---|---|---|
| Phase 1: Fractions Knowledge Map V1 | Exists as passive architecture and docs. Not live source of truth. | Medium |
| Phase 2: Fractions Misconception & Remediation Map | Exists as passive structured metadata. Live system still uses `M001`-`M013`. | Medium |
| Phase 3: Diagnostic Asset Architecture | Exists as passive diagnostic asset map and coverage audit. Live diagnostic does not consume it. | Medium |
| Phase 4: Remediation Asset Architecture | Exists as passive remediation asset map. Live remediation remains legacy Mistake-to-Mastery. | Medium |
| Phase 5: WordPath Knowledge Map V1 | Exists as separate architecture. Not active in student flows. | Low |
| Phase 6: Paper Review Architecture | Models/services/docs exist. Not a complete production workflow. | Low |
| Phase 6A: Paper Review Evidence Model | Exists in paper review service/model architecture. Not pilot-critical. | Low |
| Phase 7: Learning Intelligence Engine | Service and tests exist. Not yet canonical dashboard/read model. | Medium |
| Working Intelligence / Step 7C linkage repair | Mostly implemented and pilot-relevant because working evidence must link to mistakes and dashboards. | Critical |
| Student dashboard/progress redesign | Partially implemented and pilot-relevant only where it clarifies next action and real progress. | High |

## 4. Roadmap Phases To Skip Or Merge For Pilot

### Skip For Pilot

| Phase / Feature | Decision | Reason |
|---|---|---|
| Paper Review | Skip | Not needed for students to complete diagnostic/practice/mistakes. High risk of over-promising analysis. |
| WordPath UI | Skip | Not required for first 5-student pilot. |
| P5/P6 expansion | Skip | Increases content and QA surface without improving pilot success. |
| New question bank generation | Skip | Current issue is reliability, not volume. |
| OCR/AI marking | Skip | Working evidence can use saved images/strokes and pending states. |
| Full Learning Intelligence dashboard switch | Skip | Avoid replacing stable dashboard logic before pilot. |

### Merge / Treat As One Post-Pilot Track

| Phases | Merge Into | Reason |
|---|---|---|
| Phase 1 + Phase 2 + Phase 3 + Phase 4 | Fractions Curriculum Intelligence Track | These are all passive curriculum intelligence assets. They should be integrated together through adapters after pilot, not as separate live migrations. |
| Phase 5 + future word-problem tagging | WordPath Interpretation Track | WordPath should first tag existing word problems and paper review, then become student-facing later. |
| Phase 6 + Phase 6A | Paper Review MVP Track | Evidence levels and paper review architecture belong together. Build after core MathPath pilot passes. |
| Phase 7 + dashboard migration | Learning Intelligence Shadow Track | Generate profiles in shadow mode before using them for visible recommendations. |

## 5. Shortest Path To A Successful 5-Student Pilot

### Critical Path

1. Lock pilot-visible features.
2. Remove fake/demo/developer-facing states from student paths.
3. Harden diagnostic start -> answer -> complete -> result.
4. Harden practice answer -> complete -> attempts persisted.
5. Verify working evidence submission/working-not-needed decision.
6. Verify wrong answers create mistakes.
7. Verify Mistake Review and Progress update.
8. Run one Playwright pilot smoke test over the visible student route set.

### What To Show Students

Show only:

- Student Dashboard / Today’s Mission
- MathPath Home
- Fractions Diagnostic
- Recommended Practice
- Working Evidence
- Mistakes / Mistake Review
- Progress
- Fluency only if inventory is verified and empty state is clean
- Fractions Story Mode only if route is stable and intentionally part of pilot

### What To Hide

Hide:

- Paper Review
- Assessment Upload
- Test Specification
- WordPath
- worksheet generator
- unsupported Story Mode domains
- Model Trainer if not fully smoke-tested
- tutor/parent advanced analysis links from student pilot flow
- all seed/admin/developer-facing states

## 6. Ranked Implementation Order

### Critical

1. Remove `demo-student` fallbacks from live student MathPath paths.
2. Replace seed/developer/fake copy in visible student pages.
3. Gate or hide unstable/non-pilot features.
4. Verify diagnostic full flow with persistence.
5. Verify practice full flow with attempt persistence.
6. Verify Working Evidence decision and full-screen working save/reopen.
7. Verify mistake creation and Mistake Review.
8. Verify Progress and Student Dashboard update from real state.
9. Add visible-route Playwright smoke test.

### High

1. Stabilize Fluency empty/available states.
2. Stabilize Story Mode route if visible, or hide it.
3. Add route regression tests for MathPath visible paths.
4. Improve stale-session/backend-error recovery copy.
5. Confirm no fake records appear in MistakesHome or Progress.

### Medium

1. Add compatibility resolvers for future micro-skill migration in shadow mode.
2. Shadow-generate Learning Intelligence profiles without showing them.
3. Map legacy `M` codes to new misconception map.
4. Add micro-skill metadata as non-authoritative extra fields on new evidence.
5. Prepare WordPath tagging for future word problems.

### Low

1. Build Paper Review MVP.
2. Wire Learning Intelligence to dashboards.
3. Expand curriculum or question banks.
4. Build full WordPath student experience.
5. Add advanced OCR/AI marking.

## 7. Educational Accuracy Priorities

For pilot, educational accuracy means:

- questions are mathematically valid
- answer checking is reliable
- feedback does not claim unsupported analysis
- working insights are shown only when working exists or analysis is pending
- progress reflects real student evidence
- mistakes explain the actual wrong answer pattern where possible
- no low-confidence roadmap feature presents itself as authoritative

The safest educational stance is to keep the proven `F001`-`F026` flow live, while hiding incomplete future architecture from students.

## 8. Pilot Success Gate

Before inviting the 5 students, the following must pass:

| Gate | Required Result |
|---|---|
| Diagnostic browser flow | PASS |
| Recommended practice browser flow | PASS |
| Wrong-answer-to-mistake browser flow | PASS |
| Working evidence browser flow | PASS |
| Progress/dashboard update browser flow | PASS |
| Visible-route smoke | PASS |
| Forbidden text scan | No `Run npm`, `seeded`, `demo-student`, fake/demo copy in visible student UI |
| Feature visibility check | Paper Review, WordPath, unsupported routes hidden |

## Final Recommendation

Do not migrate architecture before the pilot.

The shortest path is to make the current MathPath loop boringly reliable:

Diagnostic -> Practice -> Working Evidence -> Mistakes -> Progress -> Next Action.

Everything else should either be hidden or treated as post-pilot architecture.
