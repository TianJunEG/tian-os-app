# MathPath Domain Architecture

**Status:** Working documentation
**Last updated:** June 2026

---

## 1. Overview

MathPath is organised around 18 Singapore Primary Mathematics domains. Every domain follows the same file pattern and plugs into the same runtime via the domain registry and diagnostic domain registry. A new domain is built by producing those files; no other part of the system needs to change.

The authoritative catalog is `shared/mathpath/domainCatalog.js`.

---

## 2. Domain catalog

All 18 domains in pathway order:

| # | Domain ID | Display Name | Level | Exam Weight | Practice | Diagnostic | Story |
|---|---|---|---|---|---|---|---|
| 1 | `whole_numbers` | Whole Numbers | P1–P6 | very_high | available | engine_ready | planned |
| 2 | `fractions` | Fractions | P2–P6 | very_high | available | available | live |
| 3 | `decimals` | Decimals | P3–P5 | high | available | engine_ready | planned |
| 4 | `percentage` | Percentage | P4–P6 | high | available | engine_ready | planned |
| 5 | `ratio` | Ratio | P5–P6 | high | available | engine_ready | planned |
| 6 | `rate` | Rate | P5–P6 | high | available | engine_ready | planned |
| 7 | `algebra` | Algebra | P6 | high | available | planned | planned |
| 8 | `money` | Money | P1–P5 | medium | available | engine_ready | planned |
| 9 | `time` | Time | P1–P5 | medium | available | engine_ready | planned |
| 10 | `measurement` | Measurement | P1–P6 | medium | available | planned | planned |
| 11 | `area_perimeter` | Area & Perimeter | P3–P6 | high | available | engine_ready | planned |
| 12 | `volume` | Volume | P4–P6 | high | available | engine_ready | planned |
| 13 | `geometry` | Geometry | P1–P6 | medium | available | planned | planned |
| 14 | `circles` | Circles | P6 | medium | available | engine_ready | planned |
| 15 | `statistics` | Statistics | P2–P6 | medium | available | planned | planned |
| 16 | `four_operations` | Four Operations | P1–P6 | very_high | available | engine_ready | planned |
| 17 | `word_problems_heuristics` | Word Problems & Heuristics | P1–P6 | very_high | available (PSL) | available (PSL) | planned |
| 18 | `mental_math_fluency` | Mental Math & Fluency | P1–P6 | low | available | n/a | n/a |

**Capability status values:**

| Value | Meaning |
|---|---|
| `available` | Live in production — full engine, DB content, UI |
| `engine_ready` | Logic built and validated; DB session or UI is pending |
| `planned` | Not yet built |
| `not_applicable` | Not relevant for this domain type |

For the precise per-capability status of each domain check `DOMAIN_CATALOG` in `shared/mathpath/domainCatalog.js` — the catalog is the source of truth and is more granular than the summary above.

---

## 3. Per-domain file pattern

Each domain lives under `shared/mathpath/{domainId}/`. All files follow this pattern:

### Required for every domain

```
shared/mathpath/{domain}/
  {Domain}SkillGraph.js            Skill hierarchy, prerequisites, mastery criteria
  {Domain}QuestionFamilies.js      Question family definitions (IDs, difficulty, working requirements)
  {Domain}QuestionGenerator.js     Procedural question generation from families
  {Domain}PracticeEngine.js        Next-question selection for practice sessions
  {Domain}LearningPathModel.js     Pathway ordering; which skills to surface first
  {Domain}MisconceptionMap.js      Misconception codes → remediation hint text
  diagnosticAssetModel.js          Diagnostic question asset definitions
  remediationAssetModel.js         Recovery pack asset definitions
  knowledgeMapModel.js             Knowledge structure for dashboard visualisation
```

### Additional files for fully built domains (Fractions, Percentage, Ratio)

```
  {domain}FluencyEngine.js         Fluency score calculation for this domain's skills
  {domain}RetentionEngine.js       Spaced-repetition scheduling (3/7/14/30-day cycle)
  {domain}PracticeFlow.js          Session flow state machine
  {domain}MistakeToMasteryEngine.js Remediation planning from mistake records
  {domain}AssessmentReadinessGate.js Assessment eligibility check
```

### Fractions-specific extras

```
  fractionSkillGraph.js            F001–F026 (do not change skill IDs or slugs)
  fractionsDiagnosticAssetMapV1.js Maps F001–F026 to diagnostic question assets
  fractionsKnowledgeMapV1.js       Knowledge structure V1
  fractionsRemediationAssetMapV1.js Remediation assets per skill
```

---

## 4. Diagnostic domain adapters

The diagnostic engine is domain-agnostic. Each domain plugs in via an adapter in `services/diagnostics/domains/`.

```
services/diagnostics/
  diagnosticDomainRegistry.js      Registers all 17 adapters; resolves {subjectId, domainId} → adapter
  diagnosticRuntime.js             Adaptive decision engine (domain-agnostic)
  genericDiagnosticAdapterFactory.js Factory that wraps a skill graph into an adapter
  domains/
    fractionsDiagnosticDomain.js   Custom adapter (F001–F026, adaptive probing)
    decimalsDiagnosticDomain.js
    percentageDiagnosticDomain.js
    ratioDiagnosticDomain.js
    rateDiagnosticDomain.js
    wholeNumbersDiagnosticDomain.js
    fourOperationsDiagnosticDomain.js
    moneyDiagnosticDomain.js
    timeDiagnosticDomain.js
    areaPerimeterDiagnosticDomain.js
    volumeDiagnosticDomain.js
    circlesDiagnosticDomain.js
    numberSenseDiagnosticDomain.js
    measurementDiagnosticDomain.js
    geometryDiagnosticDomain.js
    statisticsDiagnosticDomain.js
    algebraDiagnosticDomain.js
```

The registry is keyed on `{subjectId}:{domainId}` (e.g. `math:fractions`). The runtime calls into the adapter for:
- next question selection
- answer validation
- skill-level result mapping

Adaptive decisions emitted by the runtime: `MOVE_UP`, `SAME_LEVEL_CONFIRMATION`, `STEP_DOWN`, `PREREQUISITE_PROBE`, `MISCONCEPTION_PROBE`, `REPHRASE_ONCE`, `STOP_AND_ASSIGN_PRACTICE`, `MARK_SECURE`, `MARK_FRAGILE`, `ASSIGN_REMEDIATION`.

---

## 5. Domain registry

`services/domains/domainRegistry.js` is the capability registry (separate from the diagnostic registry). It maps each domain to its adapter set:

```js
registerDomain({
  subjectId: 'math',
  domainId: 'fractions',
  displayName: 'Fractions',
  diagnosticAdapter:    { ... },
  assignmentAdapter:    { ... },
  worksheetAdapter:     { ... },
  paperAnalysisAdapter: { ... },
  interventionAdapter:  { ... },
  skillGraphAdapter:    { ... },
})
```

The registry validates adapter shape on registration. Capabilities that are not yet built pass `null` or `{ enabled: false }`.

---

## 6. Domain orchestrator

`frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js` coordinates the session lifecycle from the client side:

```
Start session (domain, skill, mode)
  → Load skill graph for domain
  → Load question generator
  → Start session via API
  → Drive question loop
  → On completion: update mastery + fluency state
  → Schedule retention review if newly fluent
```

The orchestrator is the only client-side entry point for all domain engines. Pages should not import domain engines directly.

---

## 7. Seed scripts

Reference data for each domain is seeded via `scripts/domains/{domain}.js`. Each seed file creates:
- Skills with F/D/... codes, slugs, and pathway order
- Question families
- Prerequisite edges

Run order for a full seed:

```bash
npm run seed:mathpath          # Calls seedFoundation.js + seedQuestions.js + seedFluency.js
npm run seed:fractions-alpha-pack  # Required before pilot-students
```

Individual domain seeds can be imported and run standalone for repair/reconciliation:

```bash
node scripts/reconcileDomains.js   # Reconciles all domain seeds against DB
```

---

## 8. How to add a new domain

1. **Add to `shared/mathpath/domainCatalog.js`** — new entry with `domainId`, `displayName`, `levelRange`, `capabilities` set to `planned` initially.

2. **Create `shared/mathpath/{domain}/`** with at minimum:
   - `{Domain}SkillGraph.js` — skill nodes with `skillId`, `slug`, `prerequisites`, `masteryThreshold`
   - `{Domain}QuestionFamilies.js` — family IDs and metadata
   - `{Domain}QuestionGenerator.js` — `generate(familyId, difficulty)` function
   - `{Domain}PracticeEngine.js` — `selectNextQuestion(studentState)` function

3. **Create a diagnostic adapter** in `services/diagnostics/domains/{domain}DiagnosticDomain.js`. For most domains, wrap the skill graph with `genericDiagnosticAdapterFactory`:

   ```js
   import { genericDiagnosticAdapterFactory } from '../genericDiagnosticAdapterFactory.js';
   import { DOMAIN_SKILL_GRAPH } from '../../../shared/mathpath/{domain}/{Domain}SkillGraph.js';
   export default genericDiagnosticAdapterFactory({ skillGraph: DOMAIN_SKILL_GRAPH, domainId: '{domain}' });
   ```

4. **Register the adapter** in `services/diagnostics/diagnosticDomainRegistry.js`.

5. **Add a seed file** at `scripts/domains/{domain}.js` and add it to `npm run seed:domains` in `package.json`.

6. **Add a domain route** at `routes/mathpath{Domain}.js` (pattern: see `routes/mathpathFractions.js`).

7. **Add a feature flag** in `config/featureFlags.js` (default off: `process.env.FEAT_{DOMAIN} === '1'`) and mirror it in `frontend/src/config/featureFlags.js`.

8. **Add a student learning page** at `frontend/src/pages/student/mathpath/{Domain}LearningPathPage.jsx`.

9. Update capability status in `domainCatalog.js` as each piece goes live.

---

## 9. P1–P6 grade-level engines

`frontend/src/mathpath/primary/` (272 files) contains grade-scoped implementations for Singapore primary math topics. These are organised differently from the shared domain engines:

- Scope: one grade × one topic (e.g. P3 Fractions, P5 Percentage)
- Files per grade-topic: skill graph, question generator, question families, misconception map, orchestrator, practice flow
- Each grade has its own orchestrator (`p{N}Orchestrator.js`) that coordinates all topics in that year
- Used for grade-targeted practice when a student is working within their year-level curriculum

The P1-P6 engines do not replace the shared domain engines — they complement them. A student can work on Fractions via the shared domain engine (cross-grade, skill-ordered) or via the grade engine (year-level, topic-ordered). The orchestrator determines which mode is active.
