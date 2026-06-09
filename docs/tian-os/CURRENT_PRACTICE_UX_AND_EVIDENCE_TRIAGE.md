# Current Practice UX & Evidence Triage

**Scope:** Tian OS MathPath — Fractions Intervention Pilot
**Date:** 2026-06-09
**Status:** Audit only. No code changed in this pass.
**Goal:** Make the existing MathPath Fractions practice → mistakes → recovery → evidence chain trustworthy enough for a controlled pilot. This report ranks the founder-observed bugs by how badly they break the core promise (identify the gap → teach it → verify improvement → show trustworthy evidence to adults) and proposes a fix order. Code citations below were read directly from the repo; line numbers are approximate and may drift as files change.

---

# Executive Summary

The repository is in much better shape on *architecture* than on *runtime trust*. The practice engine, mistake model, working-evidence capture, fluency engine, and a runtime evidence-integrity audit service all exist. The problems the founder hit are concentrated in three thin but critical layers:

1. **Practice session integrity** — the client-side fraction practice flow has no rendered-signature dedupe and computes accuracy over a denominator that can include phantom/stale questions. This directly corrupts the numbers parents and the mastery chain depend on. **These are the most damaging bugs in the list** because they make correct evidence look wrong (50% accuracy when the child got everything right) and make the session feel broken (same question three times).

2. **Diagram / visual delivery** — DB-served questions are serialized to the client without their `diagramSpec`/visual-requirement metadata, so visual-required questions (and "Try Again" regenerations) arrive with no diagram. For Recognise-Fractions items, the visual *is* the question, so these are unanswerable.

3. **Adult-facing surfaces leaking internal state** — the mistake list pools fluency drills (times-tables) with fractions, several dashboard cards and badges imply navigation/features that don't exist or are flag-gated, the worksheet page turns an access/empty condition into a scary error, and review copy reads like an internal audit log.

Two reassuring findings: parent↔child mistake **scoping is correct** (no cross-student or null-owner leakage was found — the "unknown" mistakes are the student's own fluency attempts), and **leaving a session does not auto-complete it or inflate mastery** (the real gap is that there is no graceful save-and-exit, so progress is lost instead).

One content-trust finding stands out for the pilot: the **14 incorrect and 21 questionable** fraction question→skill mappings reported earlier are **still live in source** — nothing is quarantined yet. That has to be resolved before any evidence generated from those families is shown to adults.

---

# Urgent Student-Blocking Bugs

These break the act of doing practice or make a question impossible to answer.

**U1 — Duplicate rendered questions (Bug 1).** `generatePracticeQuestionSet()` in `frontend/src/mathpath/fractions/fractionQuestionGenerator.js` (~L1253–1272) builds the set by cycling `practiceQueue[i % len]` across multiple question families for the same skill and calling `generateFractionQuestion({ variant: i })`. There is **no dedupe at all** in this path. Worse, several `templateForSkill` branches ignore the family and fall through to a shared default (e.g. the F018 default ~L960), so "Add Unlike Fractions (LCM Scaffolded / Independent / Simplify & Convert / In Context)" can emit byte-identical prompts like "Compute: 2/3 + 1/2". A signature helper, `normalizeFractionPromptSignature()` (~L40), already exists but is unused here. **Dedupe by questionId/family is insufficient; we must dedupe by rendered signature (normalized prompt + operands).**

**U2 — Missing diagram on visual-required questions (Bug 5/"shaded shape").** `clientQuestion` in `routes/practice.js` (~L51–60) serializes only `visual`, `hasFigure`, `figureUrl`, `figureAlt` — it **omits `diagramSpec`, `requiresDiagram`/`requiresVisual`, and `requiredVisualTypes`**. Any DB question that depends on `diagramSpec` arrives with no diagram. `components/QuestionDiagram.jsx` then tries to *infer* a shaded-fraction diagram from prompt text; F001's generated prompt is literally "What fraction of the shape is shaded?" with no part counts, so inference fails and the diagram silently disappears. A client-side guard (`filterDisplayablePracticeQuestions` + `validateQuestionDiagram`, `PracticeSession.jsx` ~L961) exists but only runs on the client-generated flow, **not** on questions served via `clientQuestion`. Visual-required questions must never be served without a renderable visual model.

**U3 — "Try Again" loses the diagram (Bug 6).** Two retry paths, both strip visuals: (a) `MistakeReview.jsx` (~L87–102) `practiseSimilar` → `mathpathAPI.startSession(...)` → the same `clientQuestion` serialization as U2; (b) `SimilarQuestionPractice.jsx` renders `q.prompt` via `<MathText>` (~L214) but **never renders `QuestionDiagram`/`VisualBlock`**, and its generator (`services/mathpath/questionPatternTrainer.js` ~L652) emits text-only variants with no visual payload. For Recognise-Fractions, this converts the question into an impossible/wrong-modality task ("A bar is divided into 4 equal parts…").

**U4 — Fraction input popover clipped + won't close (Bugs 3 & 4).** Popover component `components/MathInputPopup.jsx` is `absolute … top-full` anchored inside `FractionAnswerInput` (`components/FractionAnswerInput.jsx` ~L275, ~L303–317), which sits inside the session card wrapper `PracticeSession.jsx` (~L1462) that uses `overflow-hidden`; the Insert/confirm button overflowing the card bottom gets clipped. On close behaviour: `insertValue` (~L180) *does* `setPopupOpen(false)` on Insert, but **nothing closes it on Submit** — `openSubmissionReview`/submit handlers never clear `popupOpen`, so it lingers over the "Correct" feedback. (The "stays open after Insert" symptom is likely the clipped Insert button never being clickable in the first place.)

**U5 — No Exit Practice control (Bug 12).** The active session header (`PracticeSession.jsx` ~L1450–1459) has only the label, "Question X of Y", and the timer. There is no exit/save-and-exit button mid-session. **Good news:** completion only fires via `nextOrFinish` on the last question, so leaving does **not** mark the session complete or inflate mastery (there is no `beforeunload`/unmount completion, and the Express `/abandon` endpoint at `routes/practice.js` ~L467 is never called by this flow). The real defect is the *absence* of a save-and-exit, so a child who leaves loses the session.

---

# Evidence-Integrity Bugs

These corrupt the numbers the mastery, recheck, and parent-report chain rely on. Highest priority overall.

**E1 — Wrong Practice Complete accuracy (Bug 2). CONFIRMED root cause.** In `frontend/src/mathpath/fractions/fractionPracticeFlow.js` `submitFractionPracticeAttempt` (~L224–301): `results = responses.map(...)`; a response whose `questionId` is **not** in the session map returns `{ error: 'Question not found in practice session.', correct: false }` (~L226–232) and is **still pushed into `results`**. Accuracy is then `correctCount / results.length` (~L300–301), and `accuracySummary.totalQuestions = results.length` includes those phantom rows. Note `toFamilySummary` *does* filter `r.error` (~L302) and the mastery `bySkill` path filters too — but the headline accuracy number does not. So 2 correct answers + 2 stale/duplicate/regenerated questionIds → **50%**, exactly what the founder saw. Responses are appended unconditionally (`setResponses(prev => [...prev, current])`, `PracticeSession.jsx` ~L1149/1186) with no per-questionId guard, so duplicates/regenerations (see U1/U3) feed phantom rows here. **This is evidence-critical: it poisons mastery, fluency, progress, parent reports, and recheck readiness simultaneously.**

**E2 — Mistake list pools fluency drills with fractions (Bug 7). Scoping is correct; the leak is a missing filter.** `routes/mistakes.js` `GET /` (~L100–113) calls `resolveStudent(req)` then `Mistake.find({ studentId: student._id, module: req.query.module || 'MathPath' })`. `resolveStudent` (`utils/studentContext.js` ~L16–47) falls back to `Student.findOne({ userId: req.user.id })` and enforces an access check if an id is passed — **no cross-student or null-owner path was found**. The "29 mistakes including 7+4 and 8×11" are **real fluency attempts by this same student**: `utils/questionTemplates.js` (~L361, L371–374) generates `${a} + ${b} = ?` / `${a} × ${b} = ?` for fluency skills; answering wrong runs through `routes/practice.js` (~L288–303) which writes `Mistake.create({ module: 'MathPath' })`. The mistakes query has **no filter by skill type / fluency-vs-concept / source**, so times-table drills surface in the Fractions mistake review. *Recommended DB check to confirm provenance:* `Mistake.find({ studentId }).distinct('source')`.

**E3 — Live content→skill mapping drift (see Content Integrity).** The 14 incorrect mappings are still feeding question generation and therefore evidence. Listed below under Content Integrity but it is fundamentally an evidence-trust issue.

**E4 — Confidence captured but not surfaced (Bug 10).** `PracticeSession.jsx` captures confidence thoroughly (per-question `confidence`/`confidenceCalibration`, telemetry `confidence_selected` ~L492). `PracticeResult.jsx` has **zero** references to confidence/reflection/calibration — the signal is collected but never shown on Practice Complete, weakening the "verify improvement / show evidence" step. (It does feed the dashboard "Confidence Insight" tile via `confidenceBuckets`.)

---

# Parent/Adult UX Bugs

These make adult surfaces look untrustworthy or internal, even when data underneath is fine.

**P1 — Worksheet page shows error instead of empty state (Bug 14).** `frontend/src/pages/parent/WorksheetHome.jsx` (~L31–34) uses `.catch(() => setError(true))`, rendering the red "Couldn't load worksheets." for **any** non-2xx. The empty-state card (~L78) only shows on a *successful* empty list. Backend `routes/worksheetsGen.js` (~L118–122) correctly returns `200 {worksheets: []}` when none exist, so a truly empty bank is *not* the trigger — the trigger is most likely a guardian-linkage `403`/stale-id `404` from `resolveStudent` (`utils/studentContext.js` ~L25/40), which the UI flattens into a generic error. Fix is twofold: (a) distinguish access/linkage failure from load failure, (b) treat empty as empty. Access is correctly guardian-linked via `StudentGuardian`.

**P2 — Parent cannot edit child display name (Bug 15). Capability does not exist.** `frontend/src/pages/parent/ParentChildren.jsx` (~L28–40) renders `{c.name}` with no edit control. The only name-write endpoint, `PUT /api/parents/profile` (`routes/parents.js` ~L116), updates the **parent's own** `parentProfile.studentName` (legacy single-child onboarding field), not the linked `Student.name`. There is **no** `StudentGuardian`-validated route to update a `Student` document's display name. Seed names like "Demo Student" are therefore not editable. (Confirm whether `c.name` reads from `Student.name` or the legacy field before building the fix.)

**P3 — Dashboard cards look clickable but are dead (Bug 16).** `frontend/src/pages/student/StudentDashboard.jsx` `StudentMetricTile` (~L413–434) renders a decorative `<ChevronRight>` but the tiles (Accuracy, Questions Answered, Working Submitted, Confidence Insight; call sites ~L537–540) have **no `onClick`/`to`/`Link`**. All four are decorative-only. Either wire them to real detail routes or remove the chevron + pointer styling.

**P4 — "Open working" friction / URL churn (Bug 8). Two systems are being conflated.** The in-modal path is genuinely one click: `SubmissionReviewModal.jsx` (~L61–70) "Open working" → `onOpenWorking` → `PracticeSession.jsx` (~L800/1637) `setFullscreenOpen(true)`; `FullScreenWorkingMode.jsx` uses **no** `navigate` (no URL change). The churn comes from a separate 3-screen upload route — `PracticeSession.jsx` (~L1412) → `/working/upload` → `/working/review` → `/working/success` (`WorkingUploadScreen.jsx` ~L98/116, `WorkingUploadReviewScreen.jsx` ~L78/159) — whose guards bounce between URLs when entered without a populated router `state` (e.g. from bare links in `StudentDashboard.jsx` ~L54, `FractionsLearningPathPage.jsx` ~L74). **Determine at runtime which button the child clicked** before fixing; the likely fix is ensuring the upload flow is only entered with `workingSessionId`/`practiceSessionId` in state, or routing those entry points to the one-click modal.

**P5 — Review/feedback copy reads like an internal audit (Bugs 9 & 11).** Hardcoded strings in `frontend/src/components/mathpath/review/QuestionReviewCards.jsx`: "No specific mistake pattern was detected for this question." (~L98) and "Working was expected but not uploaded." (~L130); related `workingAnalysisFramework.js` ~L87. Also "Working Evidence"/"HIGH"/"Not yet" labels in the Review Response modal. These are static JSX — straightforward to reword to child-friendly copy ("Nice work — nothing to fix here", gentle working nudge, "Before you submit / Show your working / Go back / Submit answer").

**P6 — Fluency badge implies a feature that may be off (Bug 17).** A real timed speed/accuracy feature exists (`/student/mathpath/fluency`, `routes/fluency.js` `/session/start` + `/session/complete`, records `averageTimeSeconds`, `fluencyType:'timed'`), but it is gated by `FLUENCY_ENABLED = flagEnabled('FLUENCY_PILOT', false)` (`frontend/src/config/featureFlags.js` ~L11) — **default off**. When off, `FluencyHome.jsx` (~L32) shows "not available yet", yet the profile still displays a "First Fluency Session — Locked" badge (`services/studentProfile/studentProfileService.js` ~L114) with no link. Either expose a real entry point when the flag is on, or hide/clarify the badge when it's off. Confirm the live `FLUENCY_PILOT` value in the pilot environment.

---

# Content Integrity Bugs

**C1 — 14 incorrect + 21 questionable fraction mappings are still live (Bugs 8/9 of the "not done" list).** Source of the figures: `docs/mathpath/FRACTIONS_QUESTION_SKILL_INTEGRITY_AUDIT.md` (~L51–54), 110 families total. The recommended remaps (e.g. `QF_F011_004→F007`, `QF_F012_004→F008`, `QF_F015_004/005→F016`, `QF_F018_006→F019`) are listed under "Recommended Fixes Before Pilot / Next Sprint" — i.e. **pending**. There are **zero** `quarantined`/`qualityStatus`/`disabled` markers in `frontend/src/mathpath/fractions/fractionQuestionFamilies.js` or `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`. So the 14 incorrect families **still generate live questions and therefore live evidence**. Tooling to detect *and* quarantine exists (`services/mathpath/fractionsRuntimeEvidenceIntegrityService.js` checks invalid/legacy skill refs, misconception mismatches, question→skill target mismatches, missing explanations, and *quarantined* references at ~L278) — but nothing is currently flagged.

**C2 — Runtime evidence audit blockers unresolved.** `fractionsRuntimeEvidenceIntegrityService.js` (admin route `GET /api/admin/fractions-skill-integrity`) still reports the previously noted gaps: recheck evidence refs, legacy mistake/misconception normalization, and worksheet audit coverage (no real seeded worksheet record to audit against). A second static checker, `fractions-audit.mjs`, flags invalid `questionFamilyId`, diagram-data errors, difficulty-band drift, duplicate stems, and malformed notation.

**C3 — Server-side worksheet dedupe is by static stem, not rendered operands.** `utils/worksheetGen.js` `selectSimilarQuestions` (~L124–147) dedupes by `JSON.stringify({stem, answer, visual, figureUrl})` on the DB stem — it will not catch client-generated operand collisions (related to U1).

---

# Existing Files/Routes Likely Involved

Backend
- `routes/practice.js` — session start/serialize (`clientQuestion` ~L51), attempt save + mistake create (~L288–303), accuracy over saved attempts (~L343), `/abandon` (~L467).
- `routes/mistakes.js` — mistake list (~L100–113), the unfiltered `module:'MathPath'` query (~L109).
- `routes/worksheetsGen.js` / `routes/worksheets.js` — generator list (~L118–122).
- `routes/parents.js` — parent profile update (~L116); no Student-name route.
- `routes/fluency.js` — timed fluency session start/complete.
- `utils/studentContext.js` — `resolveStudent` access/guardian resolution (~L16–47).
- `utils/questionTemplates.js` — fluency arithmetic generators (~L361, L371–374).
- `utils/worksheetGen.js` — `selectSimilarQuestions` dedupe (~L124–147).
- `services/mathpath/fractionsRuntimeEvidenceIntegrityService.js` — runtime evidence audit.
- `services/mathpath/questionPatternTrainer.js` — `startSimilarQuestionPractice` text-only variants (~L652).
- `models/Mistake.js`, `models/StudentGuardian.js`, `models/Student.js`, `models/PracticeSession.js`, `models/PracticeAttempt.js`.

Frontend
- `frontend/src/pages/student/mathpath/PracticeSession.jsx` — session UI, response accumulation, popover host, working entry, header (no exit).
- `frontend/src/pages/student/mathpath/PracticeResult.jsx` — Practice Complete (no confidence display).
- `frontend/src/mathpath/fractions/fractionQuestionGenerator.js` — `generatePracticeQuestionSet` (no dedupe), `normalizeFractionPromptSignature` (unused).
- `frontend/src/mathpath/fractions/fractionPracticeFlow.js` — `submitFractionPracticeAttempt` accuracy bug (~L224–301).
- `frontend/src/pages/student/mathpath/SimilarQuestionPractice.jsx`, `MistakeReview.jsx`, `MistakesHome.jsx`, `MistakeDetail.jsx`, `RecoveryPackTeachingFlow.jsx`.
- `frontend/src/components/FractionAnswerInput.jsx`, `frontend/src/components/MathInputPopup.jsx`, `frontend/src/components/QuestionDiagram.jsx`.
- `frontend/src/components/mathpath/review/QuestionReviewCards.jsx` — admin-like copy.
- `frontend/src/pages/parent/WorksheetHome.jsx`, `ParentChildren.jsx`; `frontend/src/pages/student/StudentDashboard.jsx`, `StudentProfile.jsx`.
- `frontend/src/components/learning/FullScreenWorkingMode.jsx`, `.../working/WorkingUploadScreen.jsx`, `WorkingUploadReviewScreen.jsx`, `SubmissionReviewModal.jsx`.
- `frontend/src/config/featureFlags.js` (`FLUENCY_PILOT`).
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`, `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`.

---

# Recommended Fix Order

Ranked by evidence-trust damage × student-blocking severity × fix isolation.

1. **E1 — accuracy denominator** (`fractionPracticeFlow.js`). Smallest, highest-value fix: exclude `r.error` rows (and decide skipped-question policy explicitly) from `accuracySummary.totalQuestions`/`accuracyPercentage`. Poisons everything downstream.
2. **U1 — rendered-signature dedupe** in `generatePracticeQuestionSet`. Removes the phantom/duplicate questionIds that *also* feed E1, so do it alongside E1.
3. **U2 + U3 — diagram serialization + Try-Again visual preservation.** Add `diagramSpec`/visual-requirement fields to `clientQuestion`; gate visual-required questions behind a renderable-visual check on the served path; make Similar/Try-Again carry the original visual or regenerate a valid one.
4. **U4 — popover clip + close-on-submit.** Localized CSS/state fix.
5. **E2 — mistake list filtering / fluency separation.** Add a source/skill-type filter so fractions review only shows fraction mistakes; route fluency mistakes to the fluency surface (links to Bug 18).
6. **U5 — save-and-exit** without marking complete.
7. **C1/C2 — quarantine the 14 incorrect families, review the 21, repair runtime evidence refs, seed a real worksheet audit record.**
8. **P1, P5, P3, P6, E4 — adult-surface copy/empty-state/dead-card/badge/confidence-summary polish.**
9. **P2 — parent child-name edit** (new StudentGuardian-validated route).

---

# Tests Needed

Regression tests should land **with** each fix, focused (not broad).

- **Accuracy (E1):** unit test on `submitFractionPracticeAttempt` — all-correct responses → 100%; responses containing one unknown/stale `questionId` → still scores only real questions; skipped policy asserted explicitly. This is the single most important new test.
- **Dedupe (U1):** `generatePracticeQuestionSet` returns no two questions with the same normalized prompt+operand signature across a 10-question set spanning multiple families.
- **Diagram serialization (U2):** `clientQuestion` includes `diagramSpec`/visual-requirement fields; a visual-required question without a renderable visual is filtered/withheld rather than served.
- **Try Again (U3):** Similar/retry path for a Recognise-Fractions item yields a question that renders a visual (assert `QuestionDiagram`/visual payload present).
- **Popover (U4):** Insert closes the popup; Submit closes the popup; layout test (or snapshot) that the Insert button is not inside an `overflow-hidden` clip.
- **Mistake filtering (E2):** mistakes query for a student with both fraction and fluency mistakes returns only the requested category; existing guardian-isolation tests (`routes/learningChildren.guardianIsolation.test.js`, `mathpathSuccessCentre.parentIsolation.test.js`) remain green.
- **Worksheet empty vs error (P1):** zero-worksheet response renders empty state; 403 renders an access message, not the generic error.
- **Content quarantine (C1):** a quarantined family is excluded from generation and flagged by the runtime evidence audit.
- Run focused frontend tests for touched components; run the frontend build if frontend changes; clean Playwright/test-results artifacts before reporting.

---

# What Not To Touch Yet

- **Do not** wire LifeLab / SciencePath / EnglishPath into the student experience. LifeLab stays a sibling module behind a feature flag pending its own audit (`docs/tian-os/LIFELAB_EXISTING_IMPLEMENTATION_AUDIT.md`).
- **Do not** weaken or bypass the `StudentGuardian` access model — scoping is currently correct; every new parent/child write must validate through it.
- **Do not** broaden navigation or run cross-cutting refactors. Each fix should be the smallest safe change.
- **Do not** remove existing evidence fields on `Mistake`/`PracticeAttempt`/working models.
- **Do not** treat reviewed/corrected mistakes as full skill mastery, and do not strengthen parent-facing claims beyond "Fractions intervention pilot." No "mastered fractions", no "P1–P6 ready".
- **Do not** expose raw F-codes or misconception IDs to student/parent UI.
- **Do not** commit or stage anything until the founder approves the fix plan; do not leave Playwright artifacts in commits.
- Hold the larger feature builds (mistake mini-lesson SVG/mascot engine, Times-Tables fluency module, achievement-screen redesign) until the integrity hotfixes land.

---

# Suggested First 3 Implementation Sprints

**Sprint 1 — Practice Session Integrity Hotfix.** The trust-critical core.
- Fix accuracy denominator (E1) — exclude phantom/error rows, define skipped policy.
- Add rendered-signature dedupe to `generatePracticeQuestionSet` (U1).
- Serialize `diagramSpec`/visual-requirement in `clientQuestion`; withhold visual-required questions that have no renderable visual (U2).
- Preserve/regenerate the visual on Try Again / Similar Practice (U3).
- Fix fraction popover clipping + close-on-Insert/close-on-Submit (U4).
- Tests: accuracy, dedupe, diagram serialization, Try-Again visual, popover.

**Sprint 2 — Mistake Review Data Integrity + Working Space UX.**
- Separate fluency mistakes from the Fractions mistake review via an explicit source/skill-type filter (E2); confirm provenance with a one-off `distinct('source')` DB check.
- Resolve "Open working" friction by routing entry points to the one-click modal or guaranteeing router `state` on the upload flow (P4).
- Reword review/feedback copy to child-friendly language; make missing-working a gentle note, not the headline (P5).
- Add save-and-exit that does not complete the session or inflate mastery (U5).
- Tests: mistake filtering, guardian-isolation still green, working-entry one-click, exit-without-completion.

**Sprint 3 — Fractions Content / Evidence Repair.**
- Quarantine the 14 incorrect families and review the 21 questionable mappings (C1); regenerate any pilot worksheets/recovery packs sourced from flagged families.
- Repair recheck evidence refs, normalize legacy mistake/misconception links, seed a real worksheet record for the audit, and rerun the runtime evidence audit (C2).
- Improve misconception specificity and recheck targeting.
- Materialise Recovery Pack question refs so the fallback is QA-only.
- Tests: quarantine exclusion + audit flagging; runtime evidence audit passes clean.

---

**Next step:** await founder approval before changing any code. Recommended starting point on approval is **Sprint 1, items E1 + U1 together**, since the duplicate questions are a direct cause of the phantom rows that corrupt accuracy.
