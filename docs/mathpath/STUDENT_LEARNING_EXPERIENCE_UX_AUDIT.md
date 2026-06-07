# Student Learning Experience & UX Completion Audit

Audit date: 2026-06-07

Scope: MathPath student loop from dashboard to diagnostic, practice, working evidence, Recovery Pack, recheck, mistakes, and progress.

## Executive Summary

MathPath is usable for a controlled Fractions pilot, but the experience is still stronger as a learning engine than as a fully self-explanatory student journey. The core loop exists:

Dashboard -> Diagnostic -> Results -> Practice -> Working Evidence -> Mistakes -> Recovery Pack -> Recheck -> Progress

The main UX risk is not visual polish. It is whether a student always knows:

1. What happened?
2. What should I do next?
3. How am I improving?

This sprint fixed one real student dead end in Recovery Packs: completed packs without a ready recheck now expose a clear "Check Recheck Readiness" action instead of telling the student to ask for a recheck. Student-facing diagnostic wording was also changed from "Assign Recovery Pack" to "Create Recovery Pack".

## Journey Map

| Step | Current State | Student Understanding | Issues | Priority |
|---|---|---|---|---|
| Student Dashboard | Shows today's mission, recommended next, progress cards | Mostly clear | Recommendations can still feel generic when data is thin | Medium |
| MathPath Home | Shows path, diagnostic/recheck/practice CTAs | Mostly clear | Multiple CTAs can compete with the primary next action | Medium |
| Diagnostic Intro | Explains diagnostic/recheck modes | Clear enough | Recheck purpose depends on source route context | Medium |
| Diagnostic Questions | Question, answer, confidence, working evidence | Functional | Some questions may not show enough visual/model support yet | High |
| Diagnostic Results | Readiness, weak skills, explanation, recommended practice | Stronger than before | Student wording used adult verb "Assign" for Recovery Pack | Fixed |
| Practice | Answer, confidence, working evidence, feedback | Functional | Feedback quality depends on generated explanation metadata | High |
| Working Evidence | Full-screen working, paper working, not-needed declaration | Functional | Full-screen canvas is powerful but still heavy on mobile | High |
| Mistakes | Shows real mistakes and safe empty states | Clear | Review quality depends on complete persisted mistake data | Medium |
| Recovery Packs | Lists assigned targeted practice and progress | Improved | Completed pack had no action if recheck not yet marked ready | Fixed |
| Recheck | Can launch from ready Recovery Pack | Partial | Improvement display after recheck is not yet strongly student-facing | High |
| Progress | Mastered / Working On / Needs Review / Not Started | Clearer than percentages | Needs tighter link to "what improved since last check" | High |

## Answer Input Audit

### Fraction Input

Current status: usable.

Strengths:

- Dedicated numerator and denominator fields.
- Supports pasted fraction values.
- Prevents free-text ambiguity for fraction answers.
- Mobile numeric keyboard is requested via `inputMode`.

Friction:

- Students must understand when to use fraction vs mixed mode.
- Denominator zero is detected in component state, but validation feedback should be made more visible where not already surfaced.

Priority: Medium.

### Mixed Number Input

Current status: usable with some friction.

Strengths:

- Whole number, numerator, and denominator fields are separated.
- Mixed-number mode can be inferred from question metadata.

Friction:

- Mixed number entry is more complex on small phones.
- Students may not notice the input mode has changed.

Priority: Medium.

### Decimal Input

Current status: basic.

Strengths:

- Decimal input uses decimal keyboard.

Friction:

- No structured validation or formatting guidance beyond placeholder text.

Priority: Low for Fractions pilot.

### Ratio / Algebra Input

Current status: limited/general text fallback.

Risk:

- Not a Fractions pilot blocker, but not ready for full MathPath v1 claims.

Priority: Medium before broader MathPath expansion.

## Working Evidence Experience

Current status: functional for pilot.

Strengths:

- Student can submit full-screen working.
- Student can declare working on paper.
- Student can declare working was not needed.
- Working state persists into practice attempt payloads.
- Upload review avoids showing false success when no pages were uploaded.

Friction:

- Full-screen working is still cognitively heavy for younger students.
- Paper upload is a separate step and can interrupt flow.
- Students may not understand why working is useful unless prompts are contextual.

Priority: High for mobile refinement.

## Practice Experience

Current status: functional.

Strengths:

- Question loading and answer submission are covered by existing tests.
- Confidence selection and working evidence are part of the submit flow.
- Mistakes can be created from wrong attempts.

Friction:

- Explanation quality depends on question metadata.
- Some feedback still risks feeling like answer checking rather than coaching.
- Progress indicators should consistently say what skill/pack/recheck step the student is in.

Priority: High.

## Recovery Pack Experience

Current status: improved in this sprint.

Strengths:

- Student sees why a pack exists.
- Student sees target skills, attempted questions, accuracy, and progress bar.
- Start/continue practice passes `assignmentId` and target skills into practice.
- Recheck-ready packs can launch recheck.

Fix made:

- Completed packs now show "Check Recheck Readiness" when recheck is not already marked ready.
- Diagnostic result now says "Create Recovery Pack" instead of "Assign Recovery Pack".

Remaining friction:

- Skills are shown as IDs when names are not provided.
- Completion feedback can be more explicit: what improved, what remains.

Priority: High.

## Recheck Experience

Current status: partial.

Strengths:

- Recheck creation endpoint is connected to assignments.
- Ready state appears in Recovery Packs.

Gaps:

- Student-facing improvement after recheck is not yet prominent enough.
- Recheck should clearly say which Recovery Pack and weak skills it is checking.
- If recheck is not ready, reason should be specific and encouraging.

Priority: High.

## Motivation Mechanisms

Current mechanisms:

- Skills mastered.
- Current streak.
- Learning XP.
- Recovery Pack progress.
- Accuracy.
- Readiness score.
- Mastered / Working On / Needs Review / Not Started categories.

Gaps:

- Achievements exist as a concept but are not yet consistently tied to the intervention loop.
- Improvement should be shown more often than raw score.
- Students need more "you got better at..." moments after recheck and mistake review.

Priority: Medium.

## Mobile Experience

Current status: pilot-usable with risks.

Likely acceptable:

- Dashboard cards.
- Recovery Pack list.
- Basic practice screen.
- Fraction input with numeric fields.

Risks:

- Full-screen working canvas on small phones.
- Mixed-number input spacing.
- Long diagnostic/result sections requiring a lot of scrolling.
- Diagrams and answer controls competing for vertical space.

Mobile blockers:

- Full-screen working should be verified with real touch/stylus sessions before parent pilot.
- Recheck/practice CTAs must remain visible without horizontal overflow.

Priority: High.

## Student Explainability

Current status: partial but improving.

Students can often see:

- readiness score
- weak skills
- why a Recovery Pack exists
- mistake review content
- working review insights when available

Students may not always understand:

- why one specific skill was weak
- whether an error was conceptual, careless, or working-related
- what changed after completing a Recovery Pack and recheck

Priority: High.

## UX Priority List

### Critical

None found in this pass that block the Fractions pilot loop after the Recovery Pack dead-end fix.

### High

1. Recheck result needs stronger "what improved" explanation.
   - Impact: Students may not see the payoff of intervention.
   - Effort: Medium.
   - Pilot risk: High.

2. Full-screen working needs mobile/stylus verification.
   - Impact: Working evidence is central to Tian OS.
   - Effort: Medium.
   - Pilot risk: High.

3. Practice feedback should be consistently coaching-oriented.
   - Impact: Prevents ordinary practice feel.
   - Effort: Medium.
   - Pilot risk: High.

4. Recovery Pack skill IDs should display friendly skill names.
   - Impact: Students understand what they are strengthening.
   - Effort: Small.
   - Pilot risk: Medium.

### Medium

5. Dashboard recommendation reason should be more specific when data is available.
6. Diagnostic result should reduce secondary CTAs on small screens.
7. Progress page should highlight improvement since last diagnostic.
8. Fraction/mixed input should show clearer denominator-zero validation.
9. Achievements should reinforce learning progress, not generic gamification.

### Low

10. Decimal/ratio/algebra answer input improvements can wait until non-Fractions expansion.
11. More animation/polish should wait until core intervention clarity is stronger.

## Tests Added / Updated

Updated:

- `frontend/src/pages/student/mathpath/MathPathAssignments.test.jsx`

Coverage added:

- Completed Recovery Pack shows "Check Recheck Readiness".
- Clicking it calls the existing create-recheck endpoint.
- Not-ready response is shown as a clear message.

## Final Verdict

The student loop is viable for a controlled Fractions pilot, but not yet complete enough for a broader self-serve product claim.

Fastest next UX sprint:

Student Recheck & Improvement Explanation.

Goal:

After a Recovery Pack and recheck, every student should clearly see:

- what they improved
- what still needs work
- what to do next
