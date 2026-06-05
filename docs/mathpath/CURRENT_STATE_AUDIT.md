# Tian OS Current State Audit

Date: 2026-06-05

Scope: current fractions implementation, skill model, diagnostic engine, mistakes engine, working evidence, fluency, dashboards, and alignment against the proposed roadmap for knowledge maps, WordPath, Paper Review, and Learning Intelligence.

This audit is documentation-only. It does not recommend changing production behaviour in the current step.

## Executive Summary

Tian OS already has a substantial MathPath implementation. The active student flows are built around a flat `F001`-`F026` Fractions skill graph, question families, diagnostics, practice attempts, fluency records, mistake-to-mastery plans, working evidence, and adult dashboard summaries.

The proposed roadmap architecture also now exists in the codebase as mostly passive assets: Fractions Knowledge Map, Misconception Map, Diagnostic Asset Map, Remediation Asset Map, WordPath Knowledge Map, Paper Review architecture, and Learning Intelligence service. These assets are structurally aligned with the roadmap but are not yet the canonical source of truth for production question selection, student dashboards, diagnostics, remediation routing, or fluency.

The central migration problem is not absence of architecture. It is parallel architecture. Tian OS currently has multiple overlapping representations of skill, misconception, remediation, and student evidence. A safe migration needs adapters, shadow-mode validation, and dual-writing before any live flow switches from `F001`-`F026` to micro-skills.

## 1. What Already Exists

### Fractions Implementation

Active fractions implementation exists under `frontend/src/mathpath/fractions/`.

Key live files:

- `fractionSkillGraph.js`
- `fractionQuestionFamilies.js`
- `fractionQuestionGenerator.js`
- `fractionDiagnosticEngine.js`
- `fractionPracticeFlow.js`
- `fractionMistakeToMasteryEngine.js`
- `fractionFluencyEngine.js`
- `fractionFluencyRetentionEngine.js`
- `fractionAssessmentEngine.js`
- `fractionStoryModeEngine.js`

The active source of truth is still the flat `F001`-`F026` skill graph. Each skill has prerequisites, difficulty, Singapore level metadata, mastery expectations, fluency expectations, remediation links, and question family links.

`fractionQuestionFamilies.js` provides question-family level metadata including:

- `skillId`
- difficulty
- fluency target seconds
- mastery target accuracy
- misconception tags such as `M001`-`M013`
- `workingRequired`
- `mentalMathEligible`
- fluency benchmarks

This is useful and mature, but it is still organized by `F` skill and question family rather than by topic and micro-skill.

### Current Skill Model

The database `Skill` model exists in `models/Skill.js`.

Current shape:

- `topicId`
- `name`
- `slug`
- `domain`
- `moeLevel`
- `prerequisiteSkillIds`
- `order`
- flexible `metadata`

The model is backward-compatible and broad enough to carry richer architecture. It already supports seeded skill metadata, fluency metadata, misconceptions, remediation metadata, practice modes, and question structures through `metadata`.

However, runtime MathPath also uses string skill codes such as `F001`, Mongo `Skill` ObjectIds, `skillCode`, `skillId`, and question-family IDs. These are not yet normalized under one canonical skill identity.

### Diagnostic Engine

The live fractions diagnostic engine exists in `fractionDiagnosticEngine.js`.

It currently:

- builds diagnostic sessions from `F001`-`F026`
- supports diagnostic modes such as basic, core, and full
- scores responses by skill and strand
- identifies mastered skills and weak skills
- detects prerequisite gaps
- creates practice queues
- produces parent and student summaries
- recommends drill-down targets

This is active and useful, but it still depends on `fractionSkillGraph` and `fractionQuestionFamilies`, not on the new Fractions Diagnostic Asset Map.

### Mistakes Engine

The live mistake-to-mastery engine exists in `fractionMistakeToMasteryEngine.js`.

It includes:

- mistake taxonomy `M001`-`M013`
- category and severity mapping
- root-cause skill mapping
- remediation skill mapping
- intervention library
- model drawing hints
- heuristic mistake inference

The database `Mistake` model is rich and already supports:

- `studentId`
- `questionId`
- `sessionId`
- `attemptId`
- `skillCode`
- `workingId`
- `workingPreviewImage`
- `extractedWorkingText`
- `workingInsight`
- `workingAnalysisResult`
- `workingQualityScore`
- `qualityBand`
- `misconceptionTag`
- `rootCauseMapping`
- `skillMapping`
- `interventionPathway`
- `nextAction`

This gives the roadmap a strong foundation. The gap is that live mistake logic is still mapped to the existing `M` taxonomy and `F` skills, not the newer micro-skill misconception and remediation maps.

### Working Evidence

Working evidence is one of the strongest existing subsystems.

Existing components and models include:

- `MathPathAttempt`
- `MathPathWorkingSession`
- `MathPathWorkingIntelligence`
- `routes/mathpathWorking.js`
- `workingCodeService.js`
- `workingIntelligenceService.js`
- `procedureMisconceptionAnalysisService.js`
- `reasoningMethodMarkEngine.js`
- `workingInsightPipeline.js`
- `workingLinkageService.js`

The current models support:

- full-screen working
- canvas strokes
- uploaded working
- working images
- math objects
- OCR output
- detected steps
- procedure analysis
- reasoning analysis
- working insight
- parent insight
- tutor insight
- teacher insight
- quality scoring
- canonical `userId` and `studentId` linkage
- telemetry events for working analysis and remediation use

The student attempt model also supports the newer working declaration fields:

- `workingSubmitted`
- `workingNotNeeded`
- `workingRequirementLevel`

This aligns strongly with the roadmap. The main remaining work is not model capacity; it is consistent downstream consumption.

### Fluency

Fluency exists in both frontend engines and backend models/routes.

Key files:

- `fractionFluencyEngine.js`
- `fractionFluencyRetentionEngine.js`
- `models/FluencyRecord.js`
- `models/RetentionReview.js`
- `routes/fluency.js`
- `routes/skills.js`
- `services/fluency/fluencyCompletionService.js`

Current fluency logic supports:

- per-question fluency classification
- question-family fluency
- skill fluency
- accuracy/time/consistency scoring
- confidence adjustment
- mental math eligibility
- working-required safeguards
- retention reviews
- fluency telemetry

The `/api/skills?group=fluency` route now filters fluency skills with available questions and logs:

- total fluency skills found
- available fluency skills
- filtered fluency skills

Fluency is production-relevant but still keyed mostly by `Skill` ObjectIds, skill codes, and question families rather than micro-skills.

### Dashboards

Student, parent, tutor, and adult dashboard engines exist.

Relevant files include:

- `frontend/src/pages/student/StudentDashboard.jsx`
- `frontend/src/pages/student/Progress.jsx`
- `frontend/src/mathpath/dashboard/parentMathPathDashboardEngine.js`
- `frontend/src/mathpath/dashboard/tutorMathPathDashboardEngine.js`
- `frontend/src/mathpath/dashboard/adultIntelligenceEngine.js`
- backend parent/tutor route integrations

Dashboards already surface:

- mastery progress
- weak skills
- fluency bottlenecks
- retention status
- mistake summaries
- working quality summaries
- parent action plans
- tutor root-cause and intervention queues

The dashboard layer is functional, but it consumes current live evidence directly rather than consuming a single canonical StudentLearningProfile.

## 2. What Partially Exists

### Fractions Knowledge Map

Roadmap files exist:

- `docs/mathpath/FRACTIONS_SKILL_AUDIT.md`
- `docs/mathpath/FRACTIONS_KNOWLEDGE_MAP_V1.md`
- `frontend/src/mathpath/fractions/fractionsKnowledgeMapV1.js`
- `frontend/src/mathpath/knowledge/knowledgeMapModel.js`

These introduce domain -> topic -> micro-skill structure. They are not yet the live source of truth for diagnostics, practice, fluency, or dashboards.

Status: passive architecture exists; runtime migration not complete.

### Misconception and Remediation Maps

Roadmap files exist:

- `docs/mathpath/FRACTIONS_MISCONCEPTION_MAP_V1.md`
- `docs/mathpath/REMEDIATION_COVERAGE_AUDIT.md`
- `frontend/src/mathpath/fractions/fractionsRemediationMapV1.js`
- `frontend/src/mathpath/fractions/fractionsRemediationAssetMapV1.js`
- `frontend/src/mathpath/knowledge/remediationMapModel.js`
- `frontend/src/mathpath/knowledge/remediationAssetModel.js`

These are aligned with the future architecture, but the active Mistake-to-Mastery engine still uses `M001`-`M013` and `F` skill remediation links.

Status: structured future assets exist; active remediation still uses legacy taxonomy.

### Diagnostic Asset Architecture

Roadmap files exist:

- `docs/mathpath/DIAGNOSTIC_COVERAGE_AUDIT.md`
- `frontend/src/mathpath/fractions/fractionsDiagnosticAssetMapV1.js`
- `frontend/src/mathpath/knowledge/diagnosticAssetModel.js`

The live diagnostic engine does not yet consume this asset map. Diagnostic readiness therefore exists as curriculum architecture, not as production routing.

Status: diagnostic asset design exists; live diagnostic engine is not migrated.

### WordPath

Roadmap files exist:

- `docs/mathpath/WORDPATH_KNOWLEDGE_MAP_V1.md`
- `frontend/src/wordpath/`

WordPath introduces problem structures, micro-skills, misconception maps, diagnostic assets, remediation assets, model method integration, and MathPath links.

Paper review architecture can map word problems to WordPath structures. However, active practice, diagnostics, mistake review, and dashboards are not yet driven by WordPath.

Status: separate architecture exists; production WordPath diagnosis is not live.

### Paper Review

Roadmap files exist:

- `docs/mathpath/PAPER_REVIEW_ARCHITECTURE.md`
- `docs/mathpath/PAPER_REVIEW_EVIDENCE_MODEL.md`
- `models/mathpath/MathPathPaperUpload.js`
- `models/mathpath/MathPathPaperReviewSession.js`
- `services/mathpath/paperReviewArchitectureService.js`

The service supports:

- paper upload record shape
- review session shape
- evidence levels
- extraction stage constants
- skill mapping hooks
- WordPath mapping hooks
- mistake detection shape
- remediation plan shape
- parent summary payload
- tutor summary payload
- failure and low-confidence states

This is architecture and service-level scaffolding. Full upload UI, live routes, OCR integration, marking, and review workflow are not yet production flows.

Status: model/service architecture exists; live paper review workflow is not complete.

### Learning Intelligence Engine

Roadmap files exist:

- `docs/mathpath/LEARNING_INTELLIGENCE_ENGINE.md`
- `services/learning/learningIntelligenceService.js`
- `utils/learningIntelligenceService.test.js`

The service can aggregate:

- diagnostic results
- practice attempts
- mistake records
- working evidence
- fluency records
- paper reviews
- WordPath mappings
- telemetry events

It produces:

- strengths
- weaknesses
- misconceptions
- confidence risks
- working patterns
- WordPath weaknesses
- fluency weaknesses
- ranked intervention priorities
- recommended actions

This is close to the proposed central engine, but current dashboards and live student routing do not yet consume it as the canonical decision layer.

Status: service exists; production consumers not fully wired.

## 3. What Conflicts With The New Architecture

### Multiple Skill Identities

Current code uses several skill identifiers:

- `F001`-`F026`
- Mongo `Skill._id`
- `Skill.slug`
- `skillCode`
- question-family IDs such as `QF_F001_001`
- new micro-skill IDs such as `fractions.p4.*`

This creates migration risk because mastery, fluency, attempts, mistakes, dashboards, and remediation can all refer to the same learning target using different keys.

Required resolution: introduce a canonical skill resolver and compatibility mapping before switching live flows.

### Flat Skill Graph vs Topic/Micro-Skill Map

The active system treats `F001`-`F026` as the main skill graph. The roadmap treats micro-skills as the diagnostic unit under topics.

Some `F` skills are broad topic-level containers, while others already behave like micro-skills. Moving directly from `F` skills to micro-skills would affect:

- diagnostics
- mastery records
- fluency records
- practice selection
- progress summaries
- parent/tutor dashboards
- mistake remediation queues

Required resolution: maintain backward compatibility and dual-read/dual-write during migration.

### Parallel Misconception Taxonomies

The live taxonomy is `M001`-`M013`.

The new misconception maps are micro-skill specific and more granular.

Both are valid, but if used independently they can produce inconsistent recommendations. For example, a live `M004` equivalent-fractions issue may map to several different micro-skill misconceptions in the new map.

Required resolution: create an `M-code -> micro-skill misconception` adapter and keep both values on mistake records during transition.

### Parallel Remediation Systems

Live remediation is driven by:

- `fractionMistakeToMasteryEngine.js`
- mistake taxonomy remediation skill IDs
- intervention library
- active practice queue logic

Roadmap remediation is driven by:

- `fractionsRemediationMapV1.js`
- `fractionsRemediationAssetMapV1.js`
- micro-skill misconception pathways

Required resolution: run new remediation asset resolution in shadow mode and compare with current remediation output before replacing active queues.

### Diagnostic Asset Map Not Used By Live Diagnostics

The new diagnostic asset map can represent recognition, procedural, application, reasoning, confidence, working, and misconception signals.

The active diagnostic engine still samples and scores by `F` skill and question family.

Required resolution: add a diagnostic adapter that can map active diagnostic results into micro-skill evidence before changing question selection.

### WordPath Is Not Yet A Live Axis

WordPath exists as architecture, but active MathPath attempts and mistake records do not consistently store:

- problem structure
- WordPath micro-skill
- model method type
- structure-specific misconception

Required resolution: add WordPath tags first to paper review and word-problem attempts, then surface them in Learning Intelligence.

### Dashboards Consume Evidence Directly

Parent and tutor dashboard engines currently aggregate from live states and summaries directly. They do not yet use a canonical StudentLearningProfile.

This can lead to inconsistent recommendations once Paper Review, WordPath, diagnostic assets, working intelligence, and fluency all contribute evidence.

Required resolution: make Learning Intelligence the read model in shadow mode, then gradually switch dashboard sections.

### Paper Review Is Architecture-Only

Paper Review models and services exist, but no full production upload/extraction/review route is established as the main workflow.

Required resolution: build Paper Review MVP as a separate workflow with manual review gates before allowing it to influence high-confidence remediation.

## 4. Migration Risks

| Risk | Area | Impact | Mitigation |
|---|---|---:|---|
| Historical mastery data remains keyed to `F` skills or `Skill._id` | Skill model | High | Add resolver/backfill layer; do not rewrite historical data until reports match. |
| Practice selection changes too early | Student flow | High | Keep production question selection unchanged until shadow-mode parity passes. |
| Parent/tutor dashboards show conflicting recommendations | Dashboards | High | Use Learning Intelligence in shadow mode and compare outputs before rollout. |
| Misconception mapping becomes less precise during transition | Mistakes | Medium | Store both legacy `M` code and new micro-skill misconception ID. |
| Fluency loses link to question-family benchmarks | Fluency | Medium | Preserve question-family fluency metrics while adding micro-skill rollups. |
| Working evidence is over-weighted | Learning Intelligence | Medium | Use evidence confidence and quality bands; do not infer method errors without working. |
| Paper Review over-promises accuracy | Paper Review | High | Keep evidence levels, confidence scores, manual review flags, and clear limitation copy. |
| WordPath duplicates MathPath topic weakness | WordPath | Medium | Treat WordPath as interpretation structure, not content skill. |
| Untracked architecture files are committed with unrelated work | Repo hygiene | Medium | Commit roadmap architecture in focused commits; avoid mixing UI or generated reports. |
| Aggregation performance degrades as evidence volume grows | Learning Intelligence | Medium | Add repository/query helpers and indexes before broad dashboard use. |

## 5. Recommended Sequence

### Step 1: Freeze The Current Architecture Baseline

Create focused commits for passive architecture documents and models only. Do not mix UI, dashboard redesigns, worksheet work, generated reports, or unrelated dirty files.

Goal: establish a reviewable roadmap baseline without changing student behaviour.

### Step 2: Build Canonical Resolver Adapters

Add read-only adapters for:

- `F001`-`F026` -> topic -> micro-skill
- question family -> micro-skill
- `M001`-`M013` -> micro-skill misconception
- Mongo `Skill._id` -> `skillCode` -> micro-skill
- WordPath structure -> MathPath skill relationship

Goal: allow old and new systems to talk without forcing a data migration.

### Step 3: Shadow-Generate StudentLearningProfile

Use existing evidence to generate StudentLearningProfile in the background:

- diagnostics
- practice attempts
- mistakes
- working intelligence
- fluency records
- telemetry
- paper review when available

Do not display it as canonical yet. Compare recommendations against current dashboards.

Goal: validate priority ranking without user-facing regression.

### Step 4: Dual-Write Micro-Skill Metadata

For new attempts, mistakes, fluency records, and working intelligence records, preserve existing fields and add micro-skill metadata where resolvable.

Minimum additions:

- `microSkillId`
- `topicId`
- `legacySkillCode`
- `questionFamilyId`
- `misconceptionId`
- `legacyMisconceptionCode`

Goal: prepare future analytics while keeping legacy flows stable.

### Step 5: Wire Paper Review As A Separate MVP

Implement Paper Review as a separate workflow first:

- upload
- evidence declaration
- extraction pending state
- manual review
- skill/WordPath mapping
- remediation recommendation
- parent/tutor summaries

Do not let low-confidence paper review evidence override live practice recommendations.

Goal: useful parent/tutor insights with clear confidence boundaries.

### Step 6: Add WordPath Tags To Word Problems

Start with tagging only:

- paper review word problems
- existing fraction story/word-problem question families
- mistakes from word problems

Avoid launching a full student WordPath UI until evidence capture is stable.

Goal: diagnose interpretation weakness separately from fraction computation weakness.

### Step 7: Migrate Dashboards To Learning Intelligence In Sections

Recommended order:

1. Tutor dashboard priority queue
2. Parent dashboard recommendations
3. Student progress next action
4. Student home recommended next

Keep existing dashboard sections as fallback until output parity is acceptable.

Goal: make Learning Intelligence the central read model gradually.

### Step 8: Migrate Diagnostic Routing

Run the new diagnostic asset map in parallel with the existing diagnostic engine.

Only after parity:

- select diagnostic questions by micro-skill
- interpret confidence and working evidence through diagnostic rules
- output micro-skill mastery states

Goal: avoid breaking the proven `F001`-`F026` diagnostic flow.

### Step 9: Migrate Remediation Routing

Use the new Remediation Asset Map to enrich existing Mistake-to-Mastery, then gradually move routing decisions from legacy taxonomy to micro-skill pathways.

Recommended transition:

- legacy mistake -> mapped micro-skill misconception
- current remediation queue + new asset recommendation
- shadow comparison
- controlled rollout

Goal: preserve current working remediation while improving precision.

### Step 10: Make Micro-Skills The Canonical Future Unit

Only after adapters, shadow validation, dual-write, dashboard parity, and diagnostic/remediation parity should micro-skills become the default production unit for:

- diagnostics
- mastery
- fluency rollups
- remediation
- parent/tutor insights
- paper review
- future generated questions

## Final Assessment

Tian OS is well positioned for the roadmap. The existing system has strong foundations in attempts, working evidence, mistake records, fluency, telemetry, and dashboards. The new roadmap architecture is also mostly present as passive structure.

The main risk is not technical absence. The main risk is switching live flows before resolving identity and taxonomy conflicts.

Recommended immediate next step: add compatibility resolvers and shadow-mode Learning Intelligence output while leaving production selection and student flows unchanged.
