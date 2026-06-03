# Adaptive Diagnostic Domain Registry

## Purpose

Tian OS diagnostics use one adaptive decision machine across subjects. The engine must not know what Fractions, Science, Grammar, or any future domain means.

Text architecture:

```text
Diagnostic API
  -> Diagnostic Domain Registry
    -> Domain Adapter
      -> Skill Graph
      -> Question Bank
      -> Answer Validator
      -> Result Adapter
  -> Adaptive Diagnostic Decision Engine
  -> Next Question Selector
  -> Diagnostic Session Persistence
```

## Responsibility Split

### Diagnostic Engine

The engine decides:

- `MOVE_UP`
- `SAME_LEVEL_CONFIRMATION`
- `STEP_DOWN`
- `PREREQUISITE_PROBE`
- `MISCONCEPTION_PROBE`
- `REPHRASE_ONCE`
- `STOP_AND_ASSIGN_PRACTICE`
- `MARK_SECURE`
- `MARK_FRAGILE`
- `ASSIGN_REMEDIATION`

It consumes only metadata:

- `skillId`
- `subjectId`
- `domainId`
- `difficulty`
- `prerequisiteSkillIds`
- `relatedSkillIds`
- question metadata
- correctness
- confidence
- timing
- skip/blank state
- working evidence state
- session history

It must not hardcode topic rules.

### Domain Registry

The registry maps `{ subjectId, domainId }` to a domain adapter.

Current real domain:

```js
{
  subjectId: 'math',
  domainId: 'fractions',
  displayName: 'Fractions'
}
```

### Domain Adapter

Each domain adapter provides subject/domain knowledge:

```js
{
  subjectId,
  domainId,
  domainVersion,
  displayName,
  defaultStartSkillIds,
  fallbackSkillId,
  scoringConfig,
  normalizeLevelTag,
  normalizeDiagnosticModeForLevel,
  resolveDiagnosticCount,
  loadSkills,
  buildSkillGraph,
  selectTargetSkills,
  selectInitialQuestions,
  getQuestionById,
  getQuestionBank,
  normaliseQuestion,
  toGenericQuestion,
  scoreAnswer,
  detectErrorTags,
  buildResult,
  getSupportiveCopy
}
```

Safe defaults may be used during early domain setup, but production domains should provide explicit skill graph and question metadata.

## Required Skill Metadata

Each diagnostic skill should provide:

```js
{
  skillId,
  subjectId,
  domainId,
  name,
  difficulty,
  prerequisiteSkillIds,
  relatedSkillIds,
  diagnosticTags,
  commonErrorTags,
  masteryThreshold
}
```

## Required Question Metadata

Each diagnostic question should provide:

```js
{
  questionId,
  skillId,
  domainId,
  difficulty,
  questionType,
  responseType,
  diagnosticPurpose,
  prerequisiteSkillIdsTested,
  errorTagsSupported,
  canRephrase,
  hasParallelItem,
  requiresWorking
}
```

Domain-specific constraints such as countable Fractions contexts belong in the domain adapter, generator validators, or question metadata.

## API Shape

Generic start:

```http
POST /api/diagnostics/start
```

```js
{
  subjectId: 'math',
  domainId: 'fractions',
  startSkillId: 'F010',
  requestedMode: 'core',
  studentLevel: 'P4',
  diagnosticPurpose: 'baseline'
}
```

Generic answer:

```http
POST /api/diagnostics/:sessionId/answer
```

```js
{
  questionId,
  answer,
  confidence,
  timeTakenMs,
  skipped,
  blankAnswer,
  workingSubmitted,
  attempts
}
```

Backward-compatible MathPath endpoints still work:

```http
POST /api/mastery/diagnostic/start
POST /api/mastery/diagnostic/:sessionId/answer
```

They delegate to the registry-backed runtime with `{ subjectId: 'math', domainId: 'fractions' }`.

## What Must Not Be Hardcoded

Do not put these into the generic engine:

- specific Fractions skill IDs
- topic-specific prerequisite chains
- subject-specific text parsing
- hardcoded misconception routing
- fixed question sequences

Put them in:

- skill graph data
- question metadata
- domain adapter
- generator validators
- result adapter

## Adding A New Domain

1. Create a domain adapter in `services/diagnostics/domains/`.
2. Implement `loadSkills`, `buildSkillGraph`, `getQuestionBank`, and `scoreAnswer`.
3. Register it in `diagnosticDomainRegistry.js`.
4. Add fake-domain tests first, then seeded data tests.
5. Confirm the pure engine source remains free of domain-specific rules.
