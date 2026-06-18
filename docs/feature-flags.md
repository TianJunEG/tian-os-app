# Feature Flags

**Status:** Working documentation
**Last updated:** June 2026
**Source files:** `config/featureFlags.js` (backend), `frontend/src/config/featureFlags.js` (frontend)

The two files must be kept in sync manually — there is no shared build step between them.

---

## 1. Backend flags

Source: `config/featureFlags.js`

Consumed by `middleware/featureGate.js` and `services/billing/featureAccessService.js`.

### Default-on flags

These are live unless explicitly disabled via environment variable (`FEAT_X=0`).

| Flag | Env var to disable | What it controls |
|---|---|---|
| `mathpath` | hardcoded `true` | Core MathPath engine (cannot be disabled) |
| `fluency` | hardcoded `true` | Fluency practice sessions |
| `mistakes` | hardcoded `true` | Mistake-to-Mastery pipeline |
| `progress` | hardcoded `true` | Student progress tracking |
| `admin` | hardcoded `true` | Admin dashboard pages |
| `decimals` | `FEAT_DECIMALS=0` | Decimals domain |
| `percentages` | `FEAT_PERCENTAGES=0` | Percentage domain |
| `ratioRate` | `FEAT_RATIO_RATE=0` | Ratio & Rate domain |
| `operations` | `FEAT_OPERATIONS=0` | Four Operations domain |
| `numberSense` | `FEAT_NUMBER_SENSE=0` | Number Sense domain |
| `money` | `FEAT_MONEY=0` | Money domain |
| `timeDomain` | `FEAT_TIME_DOMAIN=0` | Time domain |
| `measurement` | `FEAT_MEASUREMENT=0` | Measurement domain |
| `geometry` | `FEAT_GEOMETRY=0` | Geometry domain |
| `areaPerimeter` | `FEAT_AREA_PERIMETER=0` | Area & Perimeter domain |
| `circles` | `FEAT_CIRCLES=0` | Circles domain |
| `volume` | `FEAT_VOLUME=0` | Volume domain |
| `statistics` | `FEAT_STATISTICS=0` | Statistics domain |
| `algebra` | `FEAT_ALGEBRA=0` | Algebra domain |
| `worksheets` | `FEAT_WORKSHEETS=0` | Worksheet generator |
| `parent` | `FEAT_PARENT=0` | Parent dashboard |
| `tutor` | `FEAT_TUTOR=0` | Tutor dashboard |
| `teacher` | `FEAT_TEACHER=0` | Teacher dashboard |
| `lifelab` | `FEAT_LIFELAB=0` | LifeLab module |
| `spelling` | `FEAT_SPELLING=0` | Spelling module |
| `psl` | `FEAT_PSL=0` | Problem Solving Lab |

### Default-off flags

These are hidden unless explicitly enabled via environment variable (`FEAT_X=1`).

| Flag | Env var to enable | What it controls |
|---|---|---|
| `science` | `FEAT_SCIENCE=1` | Science adaptive revision |
| `mechanisms` | `FEAT_MECHANISMS=1` | Mechanisms playground |

---

## 2. Frontend flags

Source: `frontend/src/config/featureFlags.js`

Read via `VITE_ENABLE_*` (Vite-injected) or `ENABLE_*` env vars. Checked at component render time via `FeatureGuard.jsx`.

### Default-on frontend flags

| Flag | Env var to disable | Notes |
|---|---|---|
| `mathpath` | hardcoded `true` | |
| `decimals` | `VITE_ENABLE_DECIMALS=false` | |
| `percentages` | `VITE_ENABLE_PERCENTAGES=false` | |
| `ratioRate` | `VITE_ENABLE_RATIO_RATE=false` | |
| `operations` | `VITE_ENABLE_OPERATIONS=false` | |
| `numberSense` | `VITE_ENABLE_NUMBER_SENSE=false` | |
| `money` | `VITE_ENABLE_MONEY=false` | |
| `timeDomain` | `VITE_ENABLE_TIME_DOMAIN=false` | |
| `measurement` | `VITE_ENABLE_MEASUREMENT=false` | |
| `geometry` | `VITE_ENABLE_GEOMETRY=false` | |
| `areaPerimeter` | `VITE_ENABLE_AREA_PERIMETER=false` | |
| `circles` | `VITE_ENABLE_CIRCLES=false` | |
| `volume` | `VITE_ENABLE_VOLUME=false` | |
| `statistics` | `VITE_ENABLE_STATISTICS=false` | |
| `algebra` | `VITE_ENABLE_ALGEBRA=false` | |
| `mistakes` | hardcoded `true` | |
| `progress` | hardcoded `true` | |
| `worksheets` | `VITE_ENABLE_WORKSHEETS=false` | |
| `parent` | `VITE_ENABLE_PARENT=false` | |
| `lifelab` | `VITE_ENABLE_LIFELAB=false` | |
| `spelling` | `VITE_ENABLE_SPELLING=false` | |
| `psl` | `VITE_ENABLE_PSL=false` | |
| `tutor` | `VITE_ENABLE_TUTOR=false` | |
| `teacher` | `VITE_ENABLE_TEACHER=false` | |
| `admin` | `VITE_ENABLE_ADMIN=false` | |

### Default-off frontend flags

These are prototype features requiring explicit opt-in. Use for local testing only; do not enable for production pilot students without sign-off.

| Flag | Env var to enable | What it controls | Notes |
|---|---|---|---|
| `fluency` | `VITE_ENABLE_FLUENCY_PILOT=true` | Fluency practice pilot surface | |
| `assessments` | `VITE_ENABLE_ASSESSMENTS_PILOT=true` | Assessment pilot | |
| `modelTrainer` | `VITE_ENABLE_MODEL_TRAINER_PILOT=true` | Question model trainer | |
| `workingMathInserts` | `VITE_ENABLE_WORKING_MATH_INSERTS_PILOT=true` | Working evidence math inserts | |
| `science` | `VITE_ENABLE_SCIENCE=true` | Science module | |
| `mechanisms` | `VITE_ENABLE_MECHANISMS=true` | Mechanisms playground | |
| `payments` | `VITE_ENABLE_PAYMENTS=true` | Payment flows | |
| `tutorMarketplace` | `VITE_ENABLE_TUTOR_MARKETPLACE=true` | Public tutor marketplace | |
| `certification` | `VITE_ENABLE_CERTIFICATION=true` | Tutor certification UI | |
| `fractionsStoryMode` | `VITE_ENABLE_FRACTIONS_STORY_MODE=true` | Comics/story mode (F025–F026) | |
| `parentNarration` | `VITE_ENABLE_PARENT_NARRATION=true` | Mascot-narrated parent updates (Chelya) | |
| `selfExplanation` | `VITE_ENABLE_SELF_EXPLANATION=true` | Post-correct self-explanation prompts | |
| `misconceptionFeedback` | `VITE_ENABLE_MISCONCEPTION_FEEDBACK=true` | Named misconception feedback after wrong answers | |
| `spokenInput` | `VITE_ENABLE_SPOKEN_INPUT=true` | Spoken self-explanation via mic (Web Speech API) | Requires parental consent for under-13 (COPPA/PDPA) |

---

## 3. Feature gate enforcement

### Backend

`middleware/featureGate.js` — Express middleware applied per-route:

```js
router.get('/route', protect, featureGate('science'), handler)
```

Returns `403` with `{ error: 'Feature not enabled' }` if the flag is off.

### Frontend

`frontend/src/components/FeatureGuard.jsx` — React wrapper:

```jsx
<FeatureGuard feature="science">
  <SciencePage />
</FeatureGuard>
```

Renders nothing (or an optional fallback) when the flag is off. Used on nav items, page routes, and feature-specific UI sections.

### Billing-aware access

`services/billing/featureAccessService.js` sits above the feature gate and adds plan-level gating. Some features are flag-enabled but plan-gated (e.g. worksheets on free tier). Tests: `utils/featureAccessService.test.js`, `utils/featureFlagConsistency.test.js`.

---

## 4. Adding a new flag

1. **Decide default**: off-by-default (`=== '1'`) for prototype or unfinished features; on-by-default (`!== '0'`) only for features that are pilot-ready and should be live immediately.

2. **Add to backend** (`config/featureFlags.js`):
   ```js
   myFeature: process.env.FEAT_MY_FEATURE === '1',   // off by default
   ```

3. **Add to frontend** (`frontend/src/config/featureFlags.js`):
   ```js
   myFeature: flagEnabled('MY_FEATURE', false),       // false = off by default
   ```

4. **Apply gate** in the relevant Express route and React component.

5. **Update this doc.**

---

## 5. Flag consistency check

`utils/featureFlagConsistency.test.js` verifies that backend and frontend flags do not contradict each other for the same feature. Run it after adding or changing flags:

```bash
npx vitest run utils/featureFlagConsistency.test.js
```
