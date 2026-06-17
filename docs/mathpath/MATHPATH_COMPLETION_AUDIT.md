# MathPath Completion Audit

Audit date: 2026-06-07

Scope: Tian OS MathPath readiness as a complete P1-P6 Singapore Math intervention product.

Audit type: documentation-only. No code was modified, staged, or committed.

## Executive Summary

MathPath is not ready as a complete P1-P6 Singapore Math intervention product.

The platform has strong intervention infrastructure: diagnostic baseline/history/growth, working evidence, paper analysis foundations, assignments/rechecks, worksheet generation, question quality audit services, and adult dashboards. However, the live learning product remains heavily Fractions-first. Most student MathPath routes, engines, and orchestration paths are hardcoded to `fractions`, and the only domain with meaningful DB-backed content coverage is Fractions `F001-F026`.

Strict verdict:

- Internal testing: Ready for controlled Fractions-only testing.
- Parent pilot: Partial, only if clearly framed as a Fractions intervention pilot.
- Student care pilot: Partial, staff-assisted and Fractions-only.
- Tutor pilot: Partial, useful for Fractions recovery and lesson prep.
- School pilot: Not Ready.
- Full P1-P6 MathPath: Not Ready.

The biggest blockers are:

1. No complete P1-P6 domain coverage beyond Fractions.
2. Fractions F-code curriculum mappings conflict with active skill meanings.
3. Misconception coverage is architected but not live-tagged well enough.
4. Diagram and Singapore visual-model coverage is uneven and not counted per skill.
5. Question quality reports still show repeated templates and difficulty calibration issues.
6. Remediation assets exist as passive architecture, but live teaching depth is still incomplete.
7. Worksheet generation is intervention-aware but PDF output is text-first and diagram-light.
8. Live diagnostics are skill-level, not yet reliably micro-skill and misconception diagnostic.
9. Some advanced features exist, but their educational content is not complete enough for scale claims.

## MathPath Coverage Inventory

### Verified Live Domains

| Domain | Evidence | Live product status | Readiness |
|---|---|---|---|
| Fractions | `frontend/src/mathpath/fractions/*`, `docs/mathpath/Fractions_Content_Coverage_Report.md` | Active skill graph, generators, diagnostics, practice, fluency, assessment, story mode, mistake-to-mastery | Partial |
| Whole Numbers | No active equivalent domain engine found under `frontend/src/mathpath` | Not available as full MathPath domain | Not Ready |
| Decimals | No active equivalent domain engine found under `frontend/src/mathpath` | Not available as full MathPath domain | Not Ready |
| Percentage | Only assessment blueprint references found, not a complete domain | Not available as full MathPath domain | Not Ready |
| Ratio | Only assessment blueprint references found, not a complete domain | Not available as full MathPath domain | Not Ready |
| Measurement | Only assessment blueprint references found, not a complete domain | Not available as full MathPath domain | Not Ready |
| Geometry | Only assessment blueprint references found, not a complete domain | Not available as full MathPath domain | Not Ready |
| Data Handling | Only assessment blueprint references found, not a complete domain | Not available as full MathPath domain | Not Ready |
| Algebra / Patterns | Orchestrator test references unsupported `algebra`; no full domain | Not available as full MathPath domain | Not Ready |

Source evidence:

- `frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js`
- `frontend/src/pages/student/mathpath/*`
- `services/mathpath/assessmentBlueprintEngine.js`

The domain orchestrator imports Fractions engines directly and returns no domain engine for non-Fractions in the active orchestration path. Student MathPath pages repeatedly use `domainId: 'fractions'`.

### Fractions Domain Inventory

Coverage numbers come from `docs/mathpath/Fractions_Content_Coverage_Report.md`, generated from the database on `2026-06-04T06:12:42.077Z`.

Important note: the coverage report does not provide reliable per-skill diagram counts. It also shows misconception coverage is not meaningfully represented by M001-M013 except broad `M010` tagging. The table therefore lists diagram and misconception readiness strictly, not invented counts.

| Skill | Topic / strand | MOE level in active graph | Diagnostic | Practice | Fluency | Assessment | Remediation | Worksheet | Diagram readiness | Misconception coverage | Status |
|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|
| F001 Recognise Fractions | Foundations | P2 | 9 | 28 | 15 | 9 | 3 | 46 | Partial: fraction bars exist, uneven count | Weak live tags | Partial |
| F002 Numerator and Denominator | Foundations | P2 | 9 | 32 | 15 | 9 | 3 | 50 | Partial: visual support needed | Weak live tags | Partial |
| F003 Fraction of a Whole | Foundations | P2/P3 | 10 | 27 | 8 | 10 | 3 | 47 | Partial: shaded models needed throughout | Weak live tags | Partial |
| F004 Unit Fractions | Foundations | P2/P3 | 10 | 24 | 15 | 9 | 3 | 43 | Partial | Weak live tags | Partial |
| F005 Fractions on Number Line | Representation | P3/P4 | 10 | 22 | 11 | 9 | 3 | 41 | Partial: number-line coverage needed | Weak live tags | Partial |
| F006 Compare Unit Fractions | Comparison | P3/P4 | 10 | 17 | 14 | 6 | 3 | 33 | Partial | Weak live tags | Partial |
| F007 Compare Same Denominator | Comparison | P3/P4 | 10 | 26 | 15 | 10 | 3 | 46 | Partial | Weak live tags | Mapping risk |
| F008 Compare Same Numerator | Comparison | P4 | 10 | 25 | 12 | 10 | 3 | 45 | Partial | Weak live tags | Mapping risk |
| F009 Order Fractions | Comparison | P4/P5 | 10 | 22 | 9 | 10 | 3 | 42 | Partial | Weak live tags | Mapping risk |
| F010 Equivalent Fractions | Equivalence | P3/P4 | 10 | 32 | 15 | 10 | 3 | 52 | Partial: model/strip support needed | Weak live tags | Mapping risk |
| F011 Generate Equivalent Fractions | Equivalence | P4/P5 | 9 | 29 | 14 | 10 | 3 | 48 | Partial | Weak live tags | Mapping risk |
| F012 Simplify Fractions | Equivalence | P4/P5 | 9 | 31 | 13 | 8 | 3 | 48 | Partial | Weak live tags | Mapping risk |
| F013 Improper Fractions | Conversion | P4 | 10 | 31 | 11 | 10 | 3 | 51 | Partial | Weak live tags | Mapping risk |
| F014 Mixed Numbers | Conversion | P4/P5 | 10 | 30 | 14 | 10 | 3 | 50 | Partial | Weak live tags | Mapping risk |
| F015 Convert Mixed <-> Improper | Conversion | P4/P5 | 10 | 28 | 15 | 10 | 3 | 48 | Partial | Weak live tags | Mapping risk |
| F016 Add Same Denominator | Operations | P3/P4 | 10 | 27 | 15 | 10 | 3 | 47 | Partial | Weak live tags | Mapping risk |
| F017 Subtract Same Denominator | Operations | P3/P4 | 9 | 31 | 14 | 10 | 3 | 50 | Partial | Weak live tags | Mapping risk |
| F018 Add Different Denominators | Operations | P5 | 10 | 19 | 15 | 8 | 3 | 37 | Partial | Weak live tags | Mapping risk |
| F019 Subtract Different Denominators | Operations | P5 | 10 | 27 | 14 | 10 | 3 | 47 | Partial | Weak live tags | Mapping risk |
| F020 Fraction of Quantity | Applications | P4/P5 | 10 | 32 | 15 | 10 | 3 | 52 | Partial: set/quantity models needed | Weak live tags | Mapping risk |
| F021 Multiply Fractions | Operations | P6 | 8 | 30 | 14 | 8 | 3 | 46 | Partial | Weak live tags | Mapping risk |
| F022 Divide Fractions | Operations | P6 | 7 | 33 | 15 | 7 | 3 | 47 | Partial | Weak live tags | Mapping risk |
| F023 Fraction Word Problems | Applications | P5/P6 | 10 | 33 | 15 | 9 | 3 | 52 | Partial: bar models needed | Weak live tags | Mapping risk |
| F024 Multi-Step Fraction Problems | Applications | P6 | 10 | 30 | 15 | 10 | 3 | 50 | Partial: bar/remainder models needed | Weak live tags | Mapping risk |
| F025 Exam-Style Fraction Applications | Assessment Prep | P6 | 9 | 31 | 15 | 9 | 3 | 49 | Partial: model method needed | Weak live tags | Mapping risk |
| F026 Fractions Mastery Challenge | Mastery | P6 | 10 | 33 | 12 | 9 | 3 | 52 | Partial: mixed visual coverage needed | Weak live tags | Mapping risk |

Fractions totals:

- Active skills: 26.
- Pilot-ready by minimum question-volume thresholds: 26/26.
- Full coverage target: 100 items per skill.
- Full coverage score: 53/100.
- Skills below full 100-item target: 26/26.
- Misconception coverage report: M001-M009 and M011-M013 are missing; M010 is represented broadly.
- Live diagram count per skill: not reliably counted in checked-in DB coverage.

## P1-P6 Readiness

| Level | Topics available in active MathPath | Skills available | Missing topics | Content readiness | Pilot readiness |
|---|---|---|---|---|---|
| P1 | No complete active P1 MathPath domain | None verified as complete | Numbers to 100, addition/subtraction, shapes, measurement, data, money/time foundations | Not Ready | Not Ready |
| P2 | Early Fractions skills F001-F004 map to P2/P3 foundations, but MathPath is not a complete P2 product | Partial Fractions only | Whole numbers, four operations, multiplication/division foundations, money/time/length/mass/volume, graphs | Not Ready | Not Ready as P2; Partial for Fractions readiness |
| P3 | Fractions foundations/comparison/equivalence partially available | Partial Fractions only | Whole numbers, operations, measurement, angles/area/perimeter, tables/graphs | Not Ready | Not Ready as P3; Partial for Fractions readiness |
| P4 | Fractions is strongest here through micro-skill architecture | F001-F020 partly align, but mapping conflicts | Decimals, factors/multiples, angles, area/perimeter, volume, data, word-problem breadth | Partial | Partial for Fractions-only pilot |
| P5 | Fractions operations/applications partially available | F018-F023 partly align | Percentage, ratio, rate, area of triangle, volume, average, higher word problems | Not Ready | Partial only for Fractions intervention |
| P6 | Fractions advanced/applications partially available | F021-F026 partly align | Ratio, percentage, speed, circles, algebra, solid figures, data, PSLE paper coverage | Not Ready | Partial only for Fractions intervention |

P1-P6 verdict: Not Ready. The repo contains architecture for future domains, but not live, content-complete P1-P6 Singapore Math coverage.

## Fractions F001-F026 Audit

### Coverage Verdict

Fractions is the flagship and the only domain with meaningful live content depth. It is controlled-pilot viable but not production-complete.

Strengths:

- 26 active skills in `frontend/src/mathpath/fractions/fractionSkillGraph.js`.
- DB-backed pilot minimum coverage passes for diagnostic, practice, remediation, and worksheet-compatible counts.
- Live generators validate answer shapes, denominators, working metadata, and assessment marks.
- Fraction, mixed-number, whole-number, and ordering answer inputs exist in `AnswerInputRenderer.jsx` and `FractionAnswerInput.jsx`.
- Working evidence and assignment/recheck linkage exist.

Main concerns:

- Active `fractionSkillGraph.js` meanings conflict with `fractionCurriculumMappings.js` from F003 onward.
- `FRACTIONS_KNOWLEDGE_MAP_V1` and remediation/diagnostic asset maps are passive and do not yet fully drive production selection.
- Per-skill diagram counts are not persisted in coverage output.
- Live misconception tagging is not strong enough: the DB coverage report shows most M-code misconceptions as missing.
- Full coverage target is unmet for every skill.
- Repeated template warnings remain substantial.

### Curriculum Mapping Conflicts

The active skill graph says:

- F007 = Compare Same Denominator
- F008 = Compare Same Numerator
- F009 = Order Fractions
- F010 = Equivalent Fractions
- F011 = Generate Equivalent Fractions
- F012 = Simplify Fractions
- F013 = Improper Fractions
- F014 = Mixed Numbers
- F015 = Convert Mixed <-> Improper
- F016 = Add Same Denominator
- F017 = Subtract Same Denominator
- F018 = Add Different Denominators
- F019 = Subtract Different Denominators
- F020 = Fraction of Quantity

But `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js` maps those same F-codes to different syllabus titles. Example conflicts:

- F007 is mapped as "Equivalent fractions using models".
- F010 is mapped as "Simplifying fractions".
- F015 is mapped as "Adding like fractions".
- F021 is mapped as "Converting between mixed numbers and improper fractions".
- F023 is mapped as "Fraction of a quantity / set".
- F026 is mapped as "Multi-step fraction word problems".

This is a blocker for parent/tutor/school claims because the app can show good content coverage for a skill code while reporting the wrong curriculum meaning.

## Question Quality Issues

Evidence files:

- `docs/mathpath/Fractions_Question_Quality_Audit.md`
- `docs/mathpath/reports/sprint1_question_quality_report.md`
- `services/mathpath/questionQualityAuditService.js`
- `services/mathpath/questionVariationEngine.js`

Known findings:

- `Fractions_Question_Quality_Audit.md` generated 5,280 questions and found 751 warnings, all `repeated_generated_item`.
- Sprint 1 diagnostic audit found 260 diagnostic questions, 99 flagged questions, with 95 medium and 11 low severity findings.
- Top issue types included difficulty outside expected skill/family bands, duplicate stems, and multiple distinct accepted answers.

Examples from existing audit reports:

| File | Skill / ID | Issue | Risk |
|---|---|---|---|
| `docs/mathpath/Fractions_Question_Quality_Audit.md` | F001 / QF_F001_001 | Repeated prompt: "What fraction of the shape is shaded?" | Student sees obvious repetition |
| `docs/mathpath/reports/sprint1_question_quality_report.md` | `fq_1780316463370_v2rw5l` F009 | Multiple distinct accepted answers | Marking ambiguity |
| `docs/mathpath/reports/sprint1_question_quality_report.md` | F018 examples | Difficulty below/above family band | Calibration risk |
| `docs/mathpath/reports/sprint1_question_quality_report.md` | F022 examples | Duplicate stems and difficulty mismatch | Weak assessment reliability |
| `frontend/src/mathpath/fractions/fractionQuestionGenerator.js` | F001 generator prompts | Similar visual-recognition stems | Template diversity gap |

No high/critical blockers were reported in the latest quality reports, but the issues are still enough to prevent production-scale claims.

## Diagram / Visual Model Gaps

Evidence files:

- `frontend/src/mathpath/diagrams/diagramSpecSchema.js`
- `frontend/src/mathpath/diagrams/diagramValidators.js`
- `frontend/src/mathpath/diagrams/svgRenderers.js`
- `frontend/src/pages/student/mathpath/components/QuestionDiagram.jsx`
- `services/mathpath/questionDiagramRequirementEngine.js`
- `docs/mathpath/reports/sprint1_diagram_quality_report.md`
- `docs/mathpath/QUESTION_QUALITY_CURRICULUM_FIDELITY_ENGINE.md`

What exists:

- Fraction bars and number lines are supported by generated `diagramSpec` in the Fractions generator.
- `QuestionDiagram.jsx` has renderer fallback and prompt-based inference for simple shaded bars.
- `questionDiagramRequirementEngine.js` flags required visuals for shaded shapes, number lines, bar models, fraction strips, tables, and graphs.
- Story Mode has `visualHintType` values including `fraction_bar`, `fraction_bar_remainder`, `shaded_grid`, `number_line`, and `part_whole_cards`.

Gaps:

- Diagram count per skill is not included in `Fractions_Content_Coverage_Report.md`.
- Word problems F023-F026 need Singapore bar/model-method coverage, but this is flagged as a requirement rather than proven as full coverage.
- PDF worksheets currently note diagrams but are text-first; structured diagram rendering in PDFs remains MVP.
- Visual coverage is "uneven" in `docs/mathpath/reports/sprint1_diagram_quality_report.md`.
- Geometry diagrams, tables, graphs, and non-fraction visual model coverage are not product-complete because those domains are not live.

Visual readiness by model type:

| Visual model | Current status |
|---|---|
| Fraction strips / bars | Partial |
| Shaded shapes | Partial |
| Number lines | Partial |
| Bar models / model method | Partial, especially weak for word problems |
| Geometry diagrams | Not Ready as complete domain |
| Tables | Architecture references only |
| Graphs | Architecture references only |

## Student UX Issues

Evidence files:

- `frontend/src/pages/student/mathpath/MathPathHome.jsx`
- `frontend/src/pages/student/mathpath/PracticeSession.jsx`
- `frontend/src/pages/student/mathpath/diagnostic/*`
- `frontend/src/pages/student/mathpath/MistakesHome.jsx`
- `frontend/src/pages/student/mathpath/MistakeReview.jsx`
- `frontend/src/pages/student/mathpath/working/*`
- `frontend/src/pages/student/mathpath/components/AnswerInputRenderer.jsx`
- `frontend/src/pages/student/mathpath/components/FractionAnswerInput.jsx`
- `frontend/src/components/learning/WorkingCanvas.jsx`
- `frontend/src/components/learning/FullScreenWorkingMode.jsx`

What is strong:

- Diagnostic, practice, mistake review, working upload, assignments, story mode, fluency, and assessment routes exist.
- Fraction and mixed-number input is no longer plain text only.
- Working evidence supports submitted working, paper working, and no-working declaration.
- Full-screen working and preview/reopen workflows have been improved in earlier sprints.
- The 5-student pilot preflight and visible-route smoke tests exist.

Friction and risks:

- Many routes remain Fractions-only while the UI uses broader MathPath framing.
- Some features are pilot-gated because they are not stable enough for all students.
- Story Mode exists only for selected Fractions story routes.
- Assessment and fluency have infrastructure, but product readiness depends on seeded/available data.
- Model trainer, worksheets, and story experiences are valuable but not required for the core loop and may distract if exposed too broadly.
- Mobile layout has been checked in targeted audits, but full P1-P6 route coverage is not relevant yet because those domains are missing.

## Diagnostic Readiness

Evidence files:

- `services/diagnostics/diagnosticRuntime.js`
- `services/diagnostics/domains/fractionsDiagnosticDomain.js`
- `routes/diagnostics.js`
- `routes/mastery.js`
- `models/mathpath/MathPathDiagnosticSession.js`
- `frontend/src/mathpath/fractions/fractionDiagnosticEngine.js`
- `docs/mathpath/DIAGNOSTIC_COVERAGE_AUDIT.md`

What exists:

- Diagnostic baseline, history, growth, and per-skill snapshots exist.
- Recheck and assigned diagnostic purposes exist.
- Fractions diagnostic runtime supports adaptive/session completion handling.
- Passive Fractions Diagnostic Asset Map defines 22 P4 micro-skills with 3 diagnostic assets each.

Strict readiness:

- Fractions skill-level diagnostic: Partial to Ready for controlled pilot.
- Fractions micro-skill diagnostic: Partial, because the asset map is passive.
- P1-P6 diagnostic coverage: Not Ready.
- Misconception diagnostic accuracy: Partial at architecture level, weak in live coverage.
- Recheck readiness: Partial to Ready for Fractions intervention loop, not all domains.

Main diagnostic blocker:

The app can measure before/after for completed diagnostic sessions, but it cannot credibly diagnose all P1-P6 Singapore Math topics because those domains and content banks do not exist.

## Remediation Readiness

Evidence files:

- `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js`
- `frontend/src/mathpath/fractions/fractionsRemediationMapV1.js`
- `frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.js`
- `docs/mathpath/REMEDIATION_COVERAGE_AUDIT.md`
- `services/mathpath/mathPathAssignmentService.js`
- `services/mathpath/recheckRecommendationService.js`

What exists:

- Mistake-to-mastery engine exists for Fractions.
- Recovery Pack assignment and recheck recommendation exist.
- Passive remediation asset architecture is complete for 22 P4 Fractions micro-skills.
- Remediation path rules exist conceptually: concept explanation, worked example, model trainer, guided practice, independent practice, fluency, retention.

Strict readiness:

- Remediation routing infrastructure: Partial to Ready for Fractions.
- Remediation teaching quality: Partial.
- Misconception-specific remediation delivery: Partial, because live tagging and asset delivery are not fully wired to micro-skill maps.
- P1-P6 remediation: Not Ready.

Key issue:

`docs/mathpath/REMEDIATION_COVERAGE_AUDIT.md` explicitly states the remediation asset architecture should remain passive until later integration. That means the architecture exists, but the live student remediation product is not yet complete.

## Worksheet Readiness

Evidence files:

- `routes/worksheetsGen.js`
- `routes/worksheets.js`
- `models/Worksheet.js`
- `services/mathpath/worksheetGenerationEngine.js`
- `services/mathpath/worksheetQuestionSelector.js`
- `docs/mathpath/WORKSHEET_GENERATOR_2_0_INTERVENTION_ENGINE.md`

What exists:

- Intervention worksheet API exists at `POST /api/worksheets/gen/intervention`.
- Worksheet history exists at `GET /api/worksheets/gen/intervention/history`.
- Worksheets can be generated from diagnostic, recovery pack, paper analysis, tutor lesson, student care intervention, parent support, and manual skill selection sources.
- Worksheet types include recovery, practice, homework, tutor lesson, recheck, and parent support.
- PDF export exists and answer keys can be included.

Strict readiness:

- Fractions worksheet generation: Partial.
- Intervention-linked worksheet rationale: Partial to Ready.
- Printable Singapore-style worksheet quality: Partial.
- Diagram-rich PDF output: Not Ready.
- P1-P6 worksheet coverage: Not Ready.

Main issue:

Worksheet generation is now intervention-aware, but it depends on available question banks and diagram metadata. Since only Fractions has real depth and diagrams are uneven, worksheet readiness is not complete.

## Pilot Readiness Verdict

| Pilot type | Verdict | Reason |
|---|---|---|
| Internal testing | Ready for Fractions-only | Core loop can be tested: dashboard, diagnostic, practice, working evidence, mistakes, progress, assignment/recheck |
| Parent pilot | Partial | Acceptable only with explicit Fractions-only scope and no broad P1-P6 claims |
| Student care pilot | Partial | Staff can operate the Fractions intervention loop, but content breadth and visual/remediation quality limit scale |
| Tutor pilot | Partial | Useful lesson-prep/recovery direction for Fractions; not a full Singapore Math tutor product |
| School pilot | Not Ready | Curriculum mapping, P1-P6 breadth, assessment fidelity, diagrams, and reporting claims are not strong enough |
| Paid broad product | Not Ready | Missing domain breadth and production-grade content QA |

## Top 30 Fixes

### Critical Before Pilot

1. Freeze pilot scope as Fractions-only and state it in UI/admin copy.
2. Repair `fractionCurriculumMappings.js` so every F-code matches `fractionSkillGraph.js`.
3. Decide whether active F-codes or micro-skills are the reporting source of truth.
4. Add a resolver from F-code to topic/micro-skill and use it in reports first.
5. Add DB-backed diagram counts per skill to the content coverage report.
6. Add DB-backed misconception counts per skill and per question family.
7. Fix live misconception tagging so M001-M013 are represented beyond broad M010.
8. Reduce repeated generated stems, especially F001, F018, F019, F023, F024.
9. Recalibrate difficulty bands for flagged diagnostic questions.
10. Fix multi-answer ambiguity in F009 and F026 ordering/challenge items.
11. Confirm all Fractions visual-recognition questions render diagrams on mobile.
12. Confirm F023-F026 have bar-model/model-method support where required.
13. Keep non-pilot domains and unstable features gated from student navigation.
14. Run a live 5-student Fractions pilot only after curriculum mapping correction.
15. Produce a parent-facing pilot disclaimer: "Fractions intervention pilot, not full P1-P6 coverage."

### Important Before Paid Pilot

16. Integrate passive diagnostic asset maps into shadow-mode live diagnostics.
17. Integrate passive remediation asset maps into shadow-mode assignment recommendations.
18. Add worked examples and guided teaching screens for top weak Fractions skills.
19. Build misconception-specific recovery packs for common denominator, simplification, mixed/improper conversion, and remainder reasoning.
20. Render structured diagrams inside worksheet PDFs.
21. Add Singapore model-method diagrams for F023-F026.
22. Add more authentic Singapore classroom contexts to generated prompts.
23. Build full QA dashboards for low-quality questions, diagram gaps, and mapping drift.
24. Add live answer-input QA for fractions, mixed numbers, ordering, and whole-number answers.
25. Add progression QA so students do not see advanced P6 fraction skills when placed at P4.
26. Validate diagnostic recheck reports with real student flows after recovery packs.
27. Add tutor/student-care review controls for confirming remediation quality.
28. Add parent-safe reporting language that avoids unsupported curriculum claims.

### Nice To Have Before v1.0

29. Expand MathPath beyond Fractions into a full P1-P6 knowledge map: whole numbers, decimals, percentage, ratio, measurement, geometry, data, algebra/patterns.
30. Add full MOE-aligned assessment blueprints and school-paper analysis coverage across all major domains.

## Recommended Next 3 Sprints

### Sprint 1: Fractions Curriculum Fidelity and Live Mapping Repair

Goal: make Fractions safe for real pilot reporting.

Files likely involved:

- `frontend/src/mathpath/fractions/fractionSkillGraph.js`
- `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- `frontend/src/mathpath/curriculum/fractionUniversalSkills.js`
- `services/mathpath/contentCoverageEngine.js`
- `docs/mathpath/Fractions_Content_Coverage_Report.md`

Deliverables:

- Correct F001-F026 mappings.
- F-code to topic/micro-skill resolver.
- Updated coverage audit with curriculum-level grouping.
- Parent/tutor reporting labels aligned to actual skill meaning.

### Sprint 2: Fractions Question Quality, Diagram, and Misconception Coverage

Goal: make Fractions content feel teacher-grade.

Files likely involved:

- `frontend/src/mathpath/fractions/fractionQuestionGenerator.js`
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`
- `frontend/src/pages/student/mathpath/components/QuestionDiagram.jsx`
- `services/mathpath/questionQualityAuditService.js`
- `services/mathpath/questionDiagramRequirementEngine.js`
- `services/mathpath/questionVariationEngine.js`

Deliverables:

- Reduced repeated templates.
- Explicit diagram metadata per required skill.
- Live misconception tags per question family.
- Fixed difficulty calibration and ambiguous answers.
- DB-backed content audit showing diagram and misconception counts.

### Sprint 3: Fractions Remediation Delivery Depth

Goal: turn weak-skill detection into actual guided learning.

Files likely involved:

- `frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.js`
- `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js`
- `services/mathpath/mathPathAssignmentService.js`
- `services/mathpath/worksheetGenerationEngine.js`
- `frontend/src/pages/student/mathpath/MistakeReview.jsx`
- `frontend/src/pages/student/mathpath/PracticeSession.jsx`

Deliverables:

- Misconception-specific recovery paths.
- Worked examples and guided practice for high-risk skills.
- Bar-model/model-method teaching for word problems.
- Recovery Pack to recheck flow validated with real pilot students.

