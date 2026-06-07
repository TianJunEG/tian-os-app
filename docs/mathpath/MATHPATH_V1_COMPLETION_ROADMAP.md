# MathPath v1 Completion Roadmap

Date: 2026-06-07

Source audit: `docs/mathpath/MATHPATH_COMPLETION_AUDIT.md`

Scope: MathPath only. This roadmap does not include SciencePath, EnglishPath, marketplace features, or multi-subject expansion.

Status: Planning-only. No code was modified, staged, or committed.

## Executive Summary

MathPath has strong intervention infrastructure, but it is not yet a complete P1-P6 Singapore Math product. The fastest credible path is not broad expansion. It is to finish Fractions as a trustworthy intervention product, run a tightly scoped parent/tutor/student-care pilot, then expand domain by domain using the same standards.

Current readiness:

- Fractions-only internal testing: approximately 80%
- Fractions-only parent pilot: approximately 65%
- Fractions-only tutor pilot: approximately 70%
- Fractions-only student care pilot: approximately 70%
- School pilot: approximately 30%
- Full P1-P6 MathPath v1.0: approximately 25%

The next sprint should be:

**Fractions Curriculum Fidelity and Live Mapping Repair**

Reason: the product cannot safely show parent/tutor/school claims while active F-code skill meanings conflict with curriculum mappings. This is the highest-trust blocker.

## Audit Gap Inventory

### 1. Content Coverage

| Gap | Evidence | Impact |
|---|---|---|
| Only Fractions has meaningful live coverage | `frontend/src/mathpath/fractions/*`; non-Fractions domains are not live engines | Blocks full P1-P6 claims |
| All 26 Fractions skills are below full 100-item coverage | `Fractions_Content_Coverage_Report.md` full score 53/100 | Limits production depth |
| Non-Fractions domains are architecture references only | Assessment blueprint references Percentage, Ratio, Geometry, Data, but no full live domain | Blocks school pilot |
| P1-P3 coverage is not a complete MathPath product | Only early Fractions map to P2/P3 | Blocks lower-primary positioning |
| P5-P6 coverage is not complete beyond Fractions | Ratio, percentage, speed, geometry, data missing | Blocks PSLE-readiness positioning |

### 2. Question Quality

| Gap | Evidence | Impact |
|---|---|---|
| Repeated templates remain | 751 `repeated_generated_item` warnings | Students may recognise patterns rather than learn |
| Difficulty calibration issues remain | 99 diagnostic questions flagged in Sprint 1 report | Weak diagnostic reliability |
| Some accepted answers are ambiguous | F009 and F026 multiple-answer warnings | Marking trust risk |
| Formulaic wording | MOE alignment report notes generic contexts | Feels less teacher-authored |
| Question QA is available but not yet a release gate | Quality audit service exists | Low-quality content can still reach students |

### 3. Diagram / Visual Models

| Gap | Evidence | Impact |
|---|---|---|
| Per-skill diagram count is not reported | Coverage report lacks diagram counts | Cannot prove visual coverage |
| Word-problem bar models are partial | F023-F026 flagged as needing model method | Weak Singapore Math fidelity |
| Worksheet PDF diagrams are text-first/MVP | Worksheet architecture doc notes diagram rendering gap | Worksheets may not feel school-ready |
| Tables, graphs, geometry diagrams are not complete | Non-Fractions domains missing | Blocks complete P1-P6 product |
| Visual coverage is uneven | Sprint 1 diagram report | Student support varies by skill |

### 4. Diagnostic Quality

| Gap | Evidence | Impact |
|---|---|---|
| Live diagnostics remain skill-level first | Passive micro-skill maps are not production source of truth | Lower diagnostic precision |
| Misconception detection is not robust live | Coverage report shows M001-M009 and M011-M013 missing | Weak "why student struggles" claim |
| P1-P6 diagnostics do not exist | Only Fractions domain has real coverage | Blocks full MathPath |
| Recheck works for Fractions loop but not all domains | Baseline/growth architecture exists, but content missing | Limits longitudinal reporting |
| Adaptive routing is not proven across all skill types | Audit says micro-skill diagnostic is partial | Pilot should remain controlled |

### 5. Remediation Quality

| Gap | Evidence | Impact |
|---|---|---|
| Remediation asset maps are passive | `REMEDIATION_COVERAGE_AUDIT.md` says keep passive until integration | Live teaching depth incomplete |
| Misconception-specific recovery packs are partial | Live misconception tagging weak | Interventions may be generic |
| Worked examples/guided teaching are incomplete | Audit calls teaching quality partial | Weak intervention effectiveness |
| Bar-model teaching for word problems is incomplete | F023-F026 visual/model gap | Weak Singapore Math intervention |
| P1-P6 remediation does not exist | Missing domains | Blocks v1.0 |

### 6. Worksheet Quality

| Gap | Evidence | Impact |
|---|---|---|
| Worksheet generation depends on Fractions bank | Only Fractions has real depth | Blocks broad worksheet claims |
| PDF output is text-first | Worksheet 2.0 doc notes diagrams not fully rendered | Limits parent/tutor usefulness |
| Weak-skill targeting exists but needs QA | Intervention worksheet engine exists | Needs evidence that generated worksheets teach the right weakness |
| Answer keys exist, but worked-solution quality varies by question source | Audit says printable quality partial | Tutor trust risk |
| Worksheet visual model support is incomplete | Diagram metadata uneven | Weak Singapore-style worksheet fidelity |

### 7. Student UX

| Gap | Evidence | Impact |
|---|---|---|
| MathPath framing is broader than live Fractions product | Student routes hardcode `fractions` | Expectation mismatch |
| Some features must remain gated | Audit notes pilot-gated unstable/incomplete features | Navigation needs strict pilot control |
| Story Mode is only selected Fractions skills | Story route supports F025/F026 most strongly | Not a general learning mode |
| Assessment/fluency depend on available data | Audit notes readiness depends on seeded data | Risk of empty or uneven states |
| Model trainer/worksheets/story can distract from pilot loop | Audit notes not all required for core loop | Keep pilot UI focused |

### 8. Technical Debt

| Gap | Evidence | Impact |
|---|---|---|
| Parallel skill architectures | F-codes, curriculum mappings, knowledge maps, micro-skills | Reporting drift |
| F-code curriculum mapping mismatch | `fractionCurriculumMappings.js` conflicts with `fractionSkillGraph.js` | Highest trust risk |
| Domain orchestrator is Fractions-first | Non-Fractions unsupported | Blocks expansion |
| Coverage reporting misses diagram/misconception dimensions | Audit notes missing counts | Cannot prove readiness |
| Passive maps not integrated | Diagnostic/remediation maps exist but do not drive live flow | Architecture drift |

### 9. Pilot Readiness Risks

| Gap | Evidence | Impact |
|---|---|---|
| Parent claims may overstate product breadth | Audit says only Fractions partial | Trust risk |
| Curriculum labels may be wrong | Mapping mismatch | Parent/tutor confusion |
| Interventions may feel like practice, not teaching | Remediation delivery partial | Weak learning outcome |
| Visual support may be inconsistent | Diagram gaps | Students may struggle on conceptual items |
| No broad school coverage | P1-P6 missing | School pilot not credible |

## Gap Prioritisation

| Gap | Priority | Why |
|---|---|---|
| Fractions F-code curriculum mapping mismatch | Critical | Blocks trustworthy parent/tutor reporting and pilot claims |
| Pilot scope not clearly Fractions-only | Critical | Prevents expectation mismatch |
| Live misconception tagging missing/weak | Critical | Blocks intervention intelligence claim |
| Repeated templates in Fractions generator | Critical | Affects student trust and diagnostic validity |
| Difficulty/answer ambiguity in flagged questions | Critical | Affects marking and diagnostic accuracy |
| Diagram counts absent from coverage reporting | Critical | Cannot verify visual readiness |
| F023-F026 model-method/bar-model gaps | Critical | Core Singapore Math word-problem fidelity |
| Non-pilot features exposed too broadly | Critical | Students may hit incomplete routes |
| Passive diagnostic/remediation maps not integrated | High | Significant educational-quality gap |
| Worksheet PDF diagram rendering missing | High | Hurts tutor/parent worksheet usefulness |
| Worked examples and guided teaching incomplete | High | Reduces remediation effectiveness |
| P1-P6 domains missing | High for v1, Low for first pilot | Major product gap, but not required for Fractions pilot |
| Per-skill misconception counts absent | High | Blocks QA and reporting confidence |
| Progression QA by student level missing | High | Prevents P4 students seeing P6 content inappropriately |
| Authentic Singapore contexts limited | Medium | Improves quality, not a blocker |
| Story Mode limited to selected skills | Medium | Useful, but not required for pilot |
| Fluency/assessment data dependency | Medium | Needs monitoring, but can be gated |
| Full domain orchestrator abstraction | Medium | Needed for expansion, not first pilot |
| Tables/graphs/geometry visual coverage | Medium | Needed for P1-P6, not Fractions pilot |
| Advanced analytics polish | Low | Helpful after pilot evidence exists |

## Effort Estimation

| Major gap | Effort | Expected work | Likely files/systems | Dependency risks |
|---|---|---|---|---|
| Repair F-code curriculum mapping | Medium | Align F001-F026 active names, levels, syllabus outcomes, reporting labels | `fractionSkillGraph.js`, `fractionCurriculumMappings.js`, `fractionUniversalSkills.js`, dashboard/report helpers | Must decide source of truth first |
| Add F-code to micro-skill resolver | Medium | Map legacy F-codes to topic/micro-skill IDs for reports and shadow-mode audits | `frontend/src/mathpath/curriculum/*`, `fractionsKnowledgeMapV1.js`, services/reporting | Depends on mapping repair |
| Add diagram/misconception coverage counts | Medium | Extend content coverage engine/report to count diagram metadata and misconception tags | `services/mathpath/contentCoverageEngine.js`, coverage scripts/docs | Needs DB records to expose metadata consistently |
| Fix live misconception tagging | Large | Tag question families and generated questions with meaningful M-codes and micro-skill misconception IDs | `fractionQuestionFamilies.js`, `fractionQuestionGenerator.js`, misconception maps | Needs educational review |
| Reduce repeated templates | Medium | Expand variants, contexts, number structures, stem generation | `fractionQuestionGenerator.js`, `questionVariationEngine.js` | Must avoid invalid math |
| Fix difficulty/answer ambiguity | Medium | Review flagged IDs/families, adjust difficulty and canonical answers | `fractionQuestionGenerator.js`, quality reports/tests | Requires regeneration QA |
| Add bar-model support for F023-F026 | Large | Define model specs, renderers, question metadata, student display, worksheet export | diagram schema/renderers, `QuestionDiagram.jsx`, generator, worksheet PDF | Needs design/educational validation |
| Integrate diagnostic asset map into live shadow mode | Medium | Record micro-skill diagnostics alongside F-code result without changing student flow | diagnostic runtime, fractions domain, result reports | Depends on resolver |
| Integrate remediation map into recovery recommendations | Large | Use detected misconception/micro-skill to choose guided examples and practice | assignment service, mistake-to-mastery, remediation maps | Depends on live misconception tagging |
| Improve worksheet PDF diagrams | Large | Render diagram specs and model-method visuals in PDFs | `routes/worksheets.js`, worksheet engine, SVG/PDF pipeline | PDF rendering complexity |
| Expand full P1-P6 content | Very Large | Build domains, skills, maps, generators, diagnostics, remediation, diagrams | New domain engines and content systems | Should wait until Fractions pattern is proven |

## Pilot Readiness Analysis

### 1. Internal Testing

Current readiness: **80%**

Major blockers:

- Mapping mismatch can confuse internal QA findings.
- Repeated templates and visual gaps may distort feedback.
- Some feature-gated routes need continued smoke coverage.

Recommended fixes:

- Repair mapping.
- Add pilot scope copy.
- Add diagram/misconception coverage reporting.
- Run controlled Fractions-only internal testing.

### 2. Parent Pilot

Current readiness: **65%**

Major blockers:

- Parent-facing curriculum labels may be wrong.
- Product cannot claim full P1-P6.
- Interventions may not yet feel sufficiently teaching-led.
- Visual support and worksheets are not consistently polished.

Recommended fixes:

- Parent copy must say Fractions intervention pilot.
- Repair F-code mapping.
- Improve F001-F006 and F023-F026 visuals.
- Add misconception-specific explanation in reports/reviews.
- Keep non-Fractions CTAs hidden.

### 3. Tutor Pilot

Current readiness: **70%**

Major blockers:

- Tutor lesson direction depends on weak-skill/misconception accuracy.
- Model-method gaps reduce usefulness for word-problem tutoring.
- Worksheet output is not diagram-rich enough.

Recommended fixes:

- Repair mapping.
- Add bar-model support for F023-F026.
- Make Recovery Pack rationale and worksheet rationale clear.
- Add tutor-visible misconception evidence.

### 4. Student Care Pilot

Current readiness: **70%**

Major blockers:

- Staff can operate the loop, but educational recommendations need clearer evidence.
- Paper/worksheet outputs may require manual adult judgment.
- Non-pilot domain expectations must be suppressed.

Recommended fixes:

- Add student-care-safe Fractions-only scope.
- Improve weak-skill and misconception labeling.
- Add staff review checklist for Recovery Packs.
- Keep school-paper analysis human-in-the-loop.

### 5. School Pilot

Current readiness: **30%**

Major blockers:

- No complete P1-P6 coverage.
- Curriculum mapping is inconsistent.
- Assessment fidelity not broad enough.
- Diagrams/models incomplete.
- Reporting claims are too narrow for school deployment.

Recommended fixes:

- Do not run school pilot yet.
- Complete Fractions v1 first.
- Then build one adjacent domain to prove repeatability.
- Only then prepare school-level claims.

## Fastest Path To Parent Pilot

Minimum work for **Parent Pilot Ready** without full P1-P6:

1. Reframe the pilot as **Fractions Recovery Pilot** everywhere visible.
2. Repair F001-F026 curriculum mappings.
3. Add parent-safe reporting labels using the repaired mapping.
4. Add diagram/misconception coverage counts to the readiness report.
5. Fix the highest-risk repeated templates and ambiguous answer families.
6. Ensure F001-F005 always show appropriate visual support.
7. Ensure F023-F026 have at least basic bar-model/model-method support.
8. Add live misconception tags for the top 6 Fractions misconceptions.
9. Wire those misconception tags into Mistake Review and Recovery Pack rationale.
10. Run a fresh 5-student parent-pilot preflight and produce a parent-facing go/no-go report.

This path avoids P1-P6 expansion and focuses on trust, educational quality, and intervention effectiveness.

## Fractions V1 Completion Checklist

Legend:

- Content: missing full 100-item target depth.
- Diagrams: visual/model support incomplete or not counted.
- Misconceptions: live M-code/micro-skill misconception coverage weak.
- Remediation: passive/remediation-path integration incomplete.
- Worksheet: printable visual and worked-solution quality incomplete.

| Skill | Missing content | Missing diagrams | Missing misconceptions | Missing remediation | Missing worksheet support | Effort |
|---|---|---|---|---|---|---|
| F001 Recognise Fractions | 39 items to full target | Shaded/part-whole count coverage | Equal-parts, shaded-count-as-denominator | Guided visual concept review | Visual worksheet rendering | Medium |
| F002 Numerator and Denominator | 35 | Numerator/denominator visual labeling | Swapped roles, denominator as selected part | Concept explanation + worked examples | Labeled fraction bars | Medium |
| F003 Fraction of a Whole | 45 | Shaded shapes consistency | Unequal parts, whole confusion | Model trainer path | Shape diagrams in PDF | Medium |
| F004 Unit Fractions | 42 | Unit fraction visual comparison | Larger denominator misconception | Visual comparison trainer | Fraction strip worksheets | Medium |
| F005 Fractions on Number Line | 48 | Number lines throughout | Interval/partition errors | Number-line guided examples | Number-line PDF rendering | Medium |
| F006 Compare Unit Fractions | 53 | Fraction strip/number-line comparison | Denominator-size reversal | Guided comparison practice | Visual comparison items | Medium |
| F007 Compare Same Denominator | 39 | Same-whole models | Numerator-only misconception precision | Targeted practice | Model-backed worksheets | Medium |
| F008 Compare Same Numerator | 43 | Strip comparison | Denominator direction error | Guided examples | Visual comparison worksheets | Medium |
| F009 Order Fractions | 49 | Ordering number lines | Benchmark/common denominator errors | Ordering worked examples | Clear ordering answer key | Medium |
| F010 Equivalent Fractions | 33 | Equivalent strips/models | Scale factor confusion | Model trainer | Equivalent fraction strips | Medium |
| F011 Generate Equivalent Fractions | 38 | Scaling model | Multiplies only one part | Guided scaling examples | Worked solution key | Medium |
| F012 Simplify Fractions | 39 | Factor/strip support | Partial simplification, wrong common factor | Guided simplification | Step-by-step answer key | Medium |
| F013 Improper Fractions | 38 | More-than-one whole models | Treats numerator as whole | Concept model trainer | Multiple-whole diagrams | Medium |
| F014 Mixed Numbers | 36 | Whole-plus-part models | Ignores whole number | Guided conversion readiness | Mixed-number visuals | Medium |
| F015 Convert Mixed <-> Improper | 37 | Conversion diagrams | Whole/remainder placement | Worked examples | Conversion steps | Medium |
| F016 Add Same Denominator | 38 | Same-denominator bars | Adds denominators | Procedure correction | Worked operation key | Medium |
| F017 Subtract Same Denominator | 36 | Difference bars | Subtracts denominators | Guided subtraction | Worked solution key | Medium |
| F018 Add Different Denominators | 48 | Common-denominator models | No common denominator, direct add | High-priority recovery path | Detailed worked steps | Large |
| F019 Subtract Different Denominators | 39 | Common-denominator subtraction models | Direct denominator subtraction | High-priority recovery path | Detailed worked steps | Large |
| F020 Fraction of Quantity | 33 | Set/quantity models | Finds denominator only, wrong base | Model trainer | Quantity diagrams | Large |
| F021 Multiply Fractions | 40 | Area/scaling models | Whole-number multiplication confusion | Guided procedure | Worked solutions | Medium |
| F022 Divide Fractions | 38 | Sharing/reciprocal models | Invert wrong fraction | Guided examples | Worked solutions | Medium |
| F023 Fraction Word Problems | 33 | Bar models | Operation selection, base quantity error | Model-method recovery | Bar-model worksheets | Large |
| F024 Multi-Step Fraction Problems | 35 | Bar/remainder models | Step order, remainder confusion | Multi-step guided path | Multi-step worked key | Large |
| F025 Exam-Style Applications | 36 | Model method + mixed diagrams | Exam strategy/method gaps | Guided exam-style pathway | Exam-style worksheet | Large |
| F026 Mastery Challenge | 36 | Mixed visual support | Composite misconceptions | Mastery remediation branching | Challenge answer key | Large |

Fractions v1 remaining effort: **Large** overall.

Reason: volume gaps are manageable, but mapping repair, live misconception coverage, visual-model depth, and remediation delivery must be done carefully.

## P1-P6 Expansion Plan

Recommended order after Fractions v1 is credible:

1. **Whole Numbers / Four Operations**
   - Reason: foundation for every level, diagnostic baseline for P1-P4, supports arithmetic errors in Fractions.
2. **Measurement**
   - Reason: strong P1-P5 relevance, natural visual/worksheet domain, supports word problems.
3. **Decimals**
   - Reason: close conceptual bridge from Fractions, useful for P4-P6.
4. **Percentage**
   - Reason: depends on Fractions/Decimals, major P5-P6 topic.
5. **Ratio**
   - Reason: depends on Fractions/Percentage and model method, major P5-P6 intervention need.
6. **Geometry**
   - Reason: visual-heavy, requires diagram system maturity.
7. **Time / Money**
   - Reason: lower-primary and practical contexts; can be added after foundational number architecture.
8. **Data Handling**
   - Reason: requires tables/graphs; useful but less central to intervention loop.
9. **Algebra / Patterns**
   - Reason: later-stage abstraction; should wait until core numeric domains are stable.

This order prioritises prerequisites, intervention leverage, and reuse of Fractions visual/diagnostic/remediation architecture.

## Recommended Sprint Sequence

### Sprint 1: Fractions Curriculum Fidelity Repair

Objective: make every F-code report the correct concept, level, and syllabus mapping.

Expected outcome: parent/tutor reports no longer mislabel skills.

Dependency: decide source of truth between active F-code graph and micro-skill map.

Pilot impact: critical trust unlock.

### Sprint 2: Fractions Coverage Report Upgrade

Objective: add diagram counts, misconception counts, and micro-skill mapping to coverage reports.

Expected outcome: readiness can be measured beyond raw question count.

Dependency: Sprint 1 mapping repair.

Pilot impact: critical QA visibility.

### Sprint 3: Question Quality Remediation

Objective: fix repeated stems, difficulty-band issues, and ambiguous accepted answers.

Expected outcome: teacher-grade question reliability for pilot skills.

Dependency: coverage report can identify affected families.

Pilot impact: critical diagnostic/practice trust.

### Sprint 4: Visual Model Coverage

Objective: complete visual support for F001-F006 and F023-F026.

Expected outcome: early fractions and word problems have clear visual scaffolds.

Dependency: diagram count reporting.

Pilot impact: high educational-quality gain.

### Sprint 5: Live Misconception Tagging

Objective: tag generated/live questions with top Fractions misconceptions.

Expected outcome: wrong answers can feed more specific review and remediation.

Dependency: corrected mapping and question family review.

Pilot impact: critical intervention intelligence.

### Sprint 6: Mistake Review and Recovery Pack Rationale

Objective: show student/adult explanations tied to detected misconception and weak skill.

Expected outcome: Recovery Packs feel purposeful, not generic practice.

Dependency: Sprint 5 live tags.

Pilot impact: high trust and learning value.

### Sprint 7: Guided Remediation Delivery

Objective: integrate worked examples, guided steps, and model trainer hooks for top weak skills.

Expected outcome: students get teaching before independent practice.

Dependency: remediation map integration and visual support.

Pilot impact: high intervention effectiveness.

### Sprint 8: Worksheet Quality Upgrade

Objective: render visual models and worked steps in generated worksheets.

Expected outcome: parent/tutor/student-care worksheets become useful offline intervention tools.

Dependency: visual model coverage.

Pilot impact: high for adult-supported pilots.

### Sprint 9: Fractions Recheck and Growth Evidence Validation

Objective: run end-to-end before/intervention/after tests with real pilot accounts.

Expected outcome: measured improvement reports are credible.

Dependency: Recovery Pack and recheck loop stable.

Pilot impact: critical for parent/tutor confidence.

### Sprint 10: Whole Numbers Foundation Architecture

Objective: start the first post-Fractions domain using the proven Fractions v1 standard.

Expected outcome: repeatable domain template for P1-P4 foundations.

Dependency: Fractions v1 standard documented.

Pilot impact: low for first Fractions pilot, high for MathPath v1.0.

## MathPath v1.0 Definition

Tian OS can honestly claim **MathPath v1.0** only when the following are true.

### Content

- At least the core P1-P6 Singapore Math domains have active knowledge maps, skill graphs, question families, and live routes.
- Each launched domain has diagnostic, practice, fluency, assessment, remediation, and worksheet-compatible content.
- Each skill meets agreed production coverage targets, not just pilot minimums.

### Diagnostics

- First diagnostic baseline is preserved.
- Rechecks link to baseline and intervention source.
- Diagnostic results include skill and micro-skill evidence.
- Misconception detection is live, not only architectural.
- Diagnostic reports can explain "what is weak" and "why it is weak."

### Remediation

- Recovery Packs are generated from actual weak skills and misconceptions.
- Students receive concept review, worked examples, guided practice, independent practice, fluency, and retention review where appropriate.
- Remediation is not generic practice.

### Worksheets

- Worksheets explain why they were generated.
- Questions are selected by weak skill/misconception.
- Diagrams and model-method visuals render in printable output.
- Answer keys include worked steps where needed.

### Visual Models

- Fraction strips, shaded shapes, number lines, bar models, geometry diagrams, tables, and graphs are supported where pedagogically required.
- Coverage reports count visual requirements and actual rendered visual assets.

### Pilot Evidence

- At least one controlled parent/tutor/student-care pilot shows students can complete baseline, intervention, recheck, and growth reporting.
- Support logs show no recurring broken-route, fake-data, or answer-input blockers.
- Parents/tutors understand the reports and trust the recommendations.

### Intervention Effectiveness

- Recovery Packs produce measurable improvement for targeted skills.
- Recheck readiness criteria are accurate enough for adults to trust.
- Common misconceptions reduce after guided intervention.
- Worksheets and working evidence improve adult support, not just data collection.

## Final Executive Summary

### 1. Current State

MathPath is an advanced Fractions intervention prototype with strong platform infrastructure. It is not a complete P1-P6 Singapore Math product.

### 2. Biggest Risks

- Curriculum mapping mismatch damages trust.
- Missing P1-P6 breadth blocks school-scale claims.
- Weak live misconception coverage reduces intervention intelligence.
- Visual/model-method gaps reduce Singapore Math fidelity.
- Repeated templates and difficulty issues weaken question quality.

### 3. Fastest Route To Parent Pilot

Run a **Fractions Recovery Pilot**, not a MathPath P1-P6 pilot. Complete mapping repair, visual coverage for core skills, misconception tagging, question-quality fixes, and parent-safe reporting.

### 4. Fastest Route To Student Care Pilot

Use staff-assisted Fractions intervention with clear weak-skill labels, Recovery Pack rationale, human review of paper/worksheet outputs, and controlled recheck reporting.

### 5. Fastest Route To Tutor Pilot

Prioritise tutor lesson direction: corrected skill labels, model-method support for F023-F026, misconception evidence, and printable guided worksheets.

### 6. Fastest Route To School Pilot

Do not attempt school pilot yet. Complete Fractions v1, then add Whole Numbers and Measurement/Decimals before making school-level claims.

### 7. Recommended Next Sprint

**Sprint 1: Fractions Curriculum Fidelity Repair**

This is the highest leverage sprint because it unlocks trustworthy reporting, parent/tutor communication, coverage auditing, and all later remediation work.

