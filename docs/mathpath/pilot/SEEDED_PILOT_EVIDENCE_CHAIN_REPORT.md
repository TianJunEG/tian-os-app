# Seeded Pilot Evidence Chain — Smoke Pass

Implemented the seeded pilot evidence-chain smoke pass.

**Added**

- `scripts/seedPilotEvidenceChainSmokeData.js`
- `frontend/tests/e2e/seeded-pilot-evidence-chain.spec.js`
- `docs/mathpath/pilot/SEEDED_PILOT_EVIDENCE_CHAIN_REPORT.md`

**Verified**

- Seeded Parent A / Child A1 / Child A2 / Parent B / Child B1 records.

- Child A1 chain resolves:

  Baseline diagnostic → Recovery Pack → Teaching Flow → Recheck → Parent Success Centre/report.

- Recovery Pack references resolve to real generated question records, with `warningCount: 0`.

- Parent A cannot access Parent B’s child diagnostic history.

- Student can open the assigned Recovery Pack teaching-flow screen.

- Direct child-route QA still passes.

**Tests run**

- `npm --prefix frontend run test:e2e -- tests/e2e/seeded-pilot-evidence-chain.spec.js`

  Result: 2 passed

- `npm --prefix frontend run test:e2e -- tests/e2e/parent-direct-child-routes.spec.js`

  Result: 7 passed

- `npm --prefix frontend run build`

  Result: passed

Generated Playwright artifacts were cleaned/restored. Local servers started on 3000, 3003, and 5003 were stopped. This pass only added the three files listed above.
# Seeded Pilot Evidence-Chain Smoke Report

Generated: 2026-06-07

## Executive Summary

Verdict: PASS for controlled seeded pilot evidence-chain smoke coverage.

The local DB-backed smoke test now proves that a seeded Fractions intervention chain can be resolved from:

Baseline Diagnostic -> Recovery Pack Assignment -> Teaching Flow -> Recheck -> Parent Success Centre / Report Visibility

The smoke test also verifies parent-child isolation for the tested direct API path and checks that the student can open the assigned Recovery Pack teaching flow in the browser.

## Seed Scripts Used

- `scripts/seedPilotStudents.js`
  - Existing pilot seed script.
  - Provides default pilot parent/student accounts.
- `scripts/seedPilotEvidenceChainSmokeData.js`
  - New idempotent smoke-data script.
  - Creates/updates only `@tianos.test` pilot-chain records.
  - Adds generated Recovery Pack question records for the referenced guided, independent, and mastery-check questions.
  - Keeps only the current seeded pilot-chain recheck for the controlled Recovery Pack assignment.

## Seeded Accounts And Students

Password for all smoke accounts: `Passw0rd!`

| Role | Account | Student ID(s) | Purpose |
| --- | --- | --- | --- |
| Parent A | `pilot.parent@tianos.test` | `6a24320ddb9eff30898dab55`, `6a24320ddb9eff30898dab65` | Multi-child parent smoke path |
| Child A1 | `pilot.student2@tianos.test` | `6a24320ddb9eff30898dab55` | Full evidence-chain student |
| Child A2 | `pilot.student3@tianos.test` | `6a24320ddb9eff30898dab65` | Sibling isolation comparison |
| Parent B | `pilot.chain.parentb@tianos.test` | `6a2529e692bd142b0a854fe0` | Unauthorized-child isolation check |
| Child B1 | `pilot.chain.childb1@tianos.test` | `6a2529e692bd142b0a854fe0` | Parent B-only child |

## Evidence Chain Result

Tested student: Pilot Student 2 Weak Fractions

| Chain Element | Status | Evidence |
| --- | --- | --- |
| Baseline diagnostic | PASS | `pilot_chain_a1_baseline`, readiness `35` |
| Follow-up diagnostic / assignment source | PASS | `pilot_chain_a1_latest`, readiness `48` |
| Recovery Pack assignment | PASS | `6a2529e692bd142b0a854ff0` |
| Teaching flow assets | PASS | Worked example, visual explanation, guided practice, independent practice, mastery check |
| Generated question resolution | PASS | `warningCount: 0`; no teaching-flow fallback questions |
| Recheck | PASS | `fractionsdiag_1780821403763_x4k3xd`, readiness `86` |
| Parent Success Centre visibility | PASS | `/parent/success-centre?child=6a24320ddb9eff30898dab55` loaded |
| Parent report API visibility | PASS | `/api/mathpath/success-centre/parent/report` returned supported evidence |

## Recovery Pack Resolution

The smoke seed resolves these Recovery Pack references through real `GeneratedQuestion` records:

- `guided_common_denominator_missing_find_common_multiple`
- `guided_common_denominator_missing_rename_fractions`
- `independent_common_denominator_missing_practice`
- `recheck_common_denominator_missing_unlike_denominator_operation`

Result: PASS. The tested teaching flow returned `source: "generated_question"` for guided, independent, and mastery-check questions, with no fallback warnings.

## Child Isolation Result

| Check | Result |
| --- | --- |
| Parent A child list includes Child A1 and Child A2 | PASS |
| Parent A child list excludes Child B1 | PASS |
| Parent A opens Child A1 MathPath browser page | PASS |
| Parent A opens Child A2 MathPath browser page | PASS |
| Parent A API request for Child B1 diagnostic history | PASS, blocked with `403` |
| Direct child-route browser regression suite | PASS, 7/7 |

## Evidence Quality Checks

| Check | Result |
| --- | --- |
| Unsupported guarantee/proven/clinical claims | PASS in browser/API smoke assertions |
| `undefined` / `NaN` visible copy | PASS in browser/API smoke assertions |
| Recovery Pack fallback questions | PASS, none used |
| Mistake-level evidence presented as full skill mastery | PASS for smoke assertions |
| Parent/student browser surfaces | PASS for tested routes |

Note: API payloads intentionally carry technical IDs such as skill IDs for client logic. Raw F-code display should continue to be checked on visible UI surfaces, not JSON payloads.

## Tests Run

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003 \
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:5003/api \
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match \
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match \
npm --prefix frontend run test:e2e -- tests/e2e/seeded-pilot-evidence-chain.spec.js
```

Result: PASS, 2/2.

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003 \
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:5003/api \
npm --prefix frontend run test:e2e -- tests/e2e/parent-direct-child-routes.spec.js
```

Result: PASS, 7/7.

```bash
npm --prefix frontend run build
```

Result: PASS.

## Pilot Readiness Per Tested Student

| Student | Verdict | Notes |
| --- | --- | --- |
| Pilot Student 2 Weak Fractions | PASS for seeded evidence-chain smoke | Full chain from baseline through recheck and parent visibility is present. |
| Pilot Student 3 Strong Fractions | PASS for sibling isolation comparison | Has distinct diagnostic evidence for switching/direct-route checks. |
| Pilot Chain Child B1 | PASS for unauthorized access guard | Parent A cannot access Child B1 diagnostic history. |

## Remaining Blockers

None found in this seeded evidence-chain smoke pass.

## Remaining Limitations

- This is a controlled seeded smoke test, not a full organic live student journey from a blank DB.
- The Recovery Pack browser check verifies rendering and asset resolution, not every interactive stage transition in the UI.
- Parent Success Centre allows sibling names in a child selector; this is expected and is not evidence leakage.
- The test uses local pilot data and should not be run against production data.

## Recommended Next Sprint

Run the same evidence-chain smoke against a fresh seeded database in CI or a clean staging database, then add a separate UI-only visible-copy assertion pass for raw F-code display on parent/student surfaces.
