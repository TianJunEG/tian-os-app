# Tian OS Multi-Subject Expansion Framework

## Executive Summary

Tian OS now has a platform-level domain registry in `services/domains/domainRegistry.js`.
The first registered live domain is MathPath Fractions, which wraps the existing adaptive diagnostic domain and advertises assignment, worksheet, paper analysis, and intervention capabilities.

Current verdict: partially domain-agnostic. The pure adaptive diagnostic engine is generic, but several surrounding services still contain MathPath/Fractions defaults and should be moved behind adapters before SciencePath or EnglishPath launch.

## Architecture

Core engines should depend on metadata and contracts:

```text
Domain Registry
  -> Diagnostic Adapter
  -> Assignment Adapter
  -> Worksheet Adapter
  -> Paper Analysis Adapter
  -> Intervention Adapter
  -> Skill Graph Adapter
```

Subject-specific knowledge belongs in domain adapters and domain data, not in shared engines.

## Registered Domains

| Subject | Domain | Status | Notes |
| --- | --- | --- | --- |
| math | fractions | Available | First live registered domain. Uses existing MathPath/Fractions services. |

## Adapter Contracts

### Diagnostic Adapter

Required responsibilities:

- `normaliseQuestion`
- `scoreAnswer`
- `detectErrorTags`
- `buildResult`
- `getSupportiveCopy`

The adaptive decision engine must not know Fractions, Science, English, or any topic-specific skill ID.

### Assignment Adapter

Required responsibilities:

- `assignFromDiagnostic`
- `assignFromPaperAnalysis`
- `assignFromSkills`

MathPath currently uses Recovery Pack language and `MathPathAssignment`. Future domains should expose the same capability without forcing MathPath model names into the caller.

### Worksheet Adapter

Required responsibilities:

- `generateFromSkills`
- `generateFromDiagnostic`
- `generateFromPaperAnalysis`

Current worksheet generation is MathPath-aware and should become an adapter implementation before cross-subject worksheets are launched.

### Paper Analysis Adapter

Required responsibilities:

- `mapQuestionToSkills`
- `detectMisconceptions`
- `buildRecommendations`

The current paper analysis mapper uses Fractions F-code keywords. That is acceptable only inside the MathPath/Fractions adapter.

### Intervention Adapter

Required responsibilities:

- `recommendIntervention`
- `evaluateRecheckReadiness`
- `advanceAfterCompletion`

The intervention engine should reason over skill status, evidence, and thresholds supplied by the domain.

## Domain Dependency Audit

### Critical

| Area | Current Assumption | Risk | Recommended Fix |
| --- | --- | --- | --- |
| `services/studentProfile/studentProfileService.js` | Defaults current domain to Fractions, total skills to 26, and routes to `/student/mathpath`. | Student profile cannot represent SciencePath or EnglishPath accurately. | Move current-focus and totals behind domain registry/student evidence service. |
| `services/mathpath/paperAnalysisSkillMapper.js` | Hardcoded `FRACTIONS_KEYWORDS` and F-codes. | Science/English papers would map to Fractions incorrectly or fail. | Introduce per-domain paper analysis mapper. |
| `services/mathpath/misconceptionDetectionService.js` | Fraction-specific numerator/denominator rules. | Misconception detection is not reusable. | Keep as MathPath adapter implementation; define generic misconception contract. |
| `services/mathpath/worksheetGenerationEngine.js` | Imports MathPath models and defaults to Fractions sources. | Cross-subject worksheet generation would need another engine. | Expose through worksheet adapter and move shared orchestration to a generic service later. |
| `services/mathpath/mathPathAssignmentService.js` | Recovery Pack assignment uses MathPath models and Fractions defaults. | Non-math assignments cannot reuse the same workflow cleanly. | Wrap as MathPath assignment adapter; create generic assignment service later. |

### Medium

| Area | Current Assumption | Risk | Recommended Fix |
| --- | --- | --- | --- |
| `services/mathpath/tutorLessonPrepEngine.js` | Defaults `domainId` to `fractions`. | Tutor prep is MathPath-only. | Make lesson-prep inputs domain-required and resolve adapters. |
| `services/mathpath/parentRecommendationEngine.js` | MathPath recommendation vocabulary and model usage. | Parent dashboard remains MathPath-first. | Add domain-aware recommendation service. |
| `services/mathpath/pilotDashboardMetricsService.js` | Defaults to `math/fractions`. | Pilot analytics cannot compare multiple domains. | Add domain filter and registry-backed aggregation. |
| `services/mathpath/workingCodeService.js` | Maps `fractions` to `FRAC`. | Working code prefixes need domain registration. | Move code prefixes into domain metadata. |
| `routes/diagnostics.js` | Generic endpoint exists but defaults to `math/fractions`. | Safe for backwards compatibility, but new domains need explicit requests. | Keep default; add UI domain selector later. |

### Low

| Area | Current Assumption | Risk | Recommended Fix |
| --- | --- | --- | --- |
| Frontend `/student/mathpath/*` routes | Product-specific route names. | Expected while only MathPath is live. | Add `/student/:domainId` shell after second domain. |
| `services/mathpath/fractionSkillResolver.js` | Fraction-specific resolver. | Acceptable domain utility. | Keep inside MathPath/Fractions adapter. |
| `services/mathpath/questionQualityAuditService.js` | F001-F026 audit rules. | Acceptable audit tool for Fractions. | Do not use as shared quality engine. |

## Generic Skill Graph

Shared engines should operate on:

- `subjectId`
- `domainId`
- `skillId`
- `difficulty`
- `prerequisiteSkillIds`
- `diagnosticTags`
- `commonErrorTags`
- `masteryThreshold`

They should not inspect topic strings such as numerator, denominator, fraction, grammar, or energy.

## SciencePath Readiness Audit

### Science MCQ

Partially supported. The adaptive diagnostic engine can route MCQ items if a Science skill graph and question bank provide metadata. Missing pieces are Science question bank ingestion, Science scoring adapter, and Science misconception tags.

### Science Open-Ended

Not pilot-ready. Open-ended Science needs rubric-based scoring, adult review states, evidence tagging, and safer AI-assisted evaluation. The current deterministic MathPath answer checking does not cover scientific explanation quality.

### Science Practical Concepts

Partially supported for diagnostics and worksheets if questions are structured. Not ready for diagram-heavy or experimental-process marking without a Science paper-analysis adapter.

## EnglishPath Readiness Audit

### Grammar

Partially supported. Grammar can use the adaptive engine with MCQ, cloze, and short-answer items if an English grammar skill graph and scoring adapter are registered.

### Vocabulary

Partially supported. Vocabulary needs synonym/accepted-answer metadata, distractor tagging, and confidence-aware practice routing.

### Comprehension

Not pilot-ready. Comprehension requires passage-aware question grouping, evidence extraction, and rubric-based scoring for inference/open-ended answers.

### Composition

Not supported by current engines. Composition needs writing submission, rubric analysis, teacher/adult review, and long-form feedback workflows.

## Remaining MathPath Assumptions

The platform can register multiple domains, but the live services still include MathPath-specific model names and defaults. Before launching the next subject, prioritise:

1. Generic assignment service with domain adapters.
2. Generic paper analysis orchestrator with per-domain skill mappers.
3. Generic worksheet orchestrator with per-domain question selectors.
4. Domain-aware student profile/current focus.
5. Domain prefixes and labels in `workingCodeService`.

## Recommended Next Domain

EnglishPath Grammar is the lowest-risk second domain because it can start with structured item types and deterministic marking. Science open-ended should wait until rubric scoring and adult review workflows are stronger.

## Recommended Next Sprint

Build the generic assignment and paper-analysis adapter layer:

1. Define `services/domains/adapters/*` interfaces.
2. Move MathPath assignment calls behind the registry.
3. Move MathPath paper skill mapping behind `paperAnalysisAdapter`.
4. Add fake Science/English adapter tests at the API route level.
5. Keep UI domain-specific until a second real domain is enabled.
