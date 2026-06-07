# Remediation Quality & Recovery Pack Effectiveness

Audit date: 2026-06-07

Scope: MathPath Fractions Recovery Pack quality, misconception-to-intervention mapping, guided progression, worked-example coverage, recheck alignment, and intervention effectiveness.

## Executive Summary

This sprint adds an internal remediation quality layer for Tian OS. It does not generate new questions and does not change student practice behaviour. It answers whether the current intervention loop is educationally defensible:

Weakness Identified -> Correct Intervention Assigned -> Misconception Addressed -> Recheck Passed

The implementation is advisory and admin-only. It scores Recovery Pack quality, audits whether major misconceptions have targeted interventions, checks worked-example and guided-practice coverage, validates recheck alignment, and calculates intervention effectiveness from assignment and recheck evidence.

## Recovery Pack Coverage Matrix

The new coverage matrix reports, for each Fractions skill:

- whether recovery content exists
- whether misconception targeting exists
- whether guided practice exists
- whether worked examples exist
- whether recheck alignment exists
- missing stages

This is based on the existing skill misconception map and the new misconception intervention map.

## Misconception To Intervention Mapping

Every registered MathPath misconception now has a structured intervention plan:

- intervention type
- worksheet type
- guided practice sequence
- recheck strategy
- worked example focus

Example:

`adds_denominators_directly`

Recommended path:

- common denominator visual model
- Recovery Worksheet
- fraction-strip common parts
- worked example
- guided unlike-denominator addition
- independent practice
- recheck using an unlike-denominator addition probe

## Recovery Pack Quality Scoring

Each Recovery Pack can now receive a 0-100 quality score from:

- misconception alignment
- skill alignment
- progression quality
- recheck readiness
- evidence support

Quality bands:

- strong: 85+
- partial: 65-84
- weak: below 65

Low-quality packs are flagged for manual review.

## Worked Example Audit

The worked-example audit checks whether each major misconception has explanation support for:

- why the wrong answer is wrong
- the correct method
- the common trap

Current limitation: this validates planned worked-example coverage, not a rendered student-facing worked-example library.

## Guided Practice Audit

The guided-practice audit checks for a complete progression:

1. Visual understanding
2. Guided practice
3. Independent practice
4. Recheck / mastery check

Skills missing any stage are reported as gaps.

## Recovery Effectiveness Analysis

The effectiveness service calculates:

- Recovery Pack completion rate
- recheck success rate
- average improvement
- repeated failure rate
- unresolved misconceptions

Metrics are grouped per skill. A completed Recovery Pack below 70% accuracy is treated as unresolved remediation risk, even before recheck.

## Recheck Validation

The recheck alignment audit checks whether a recheck tests the same target skills as the Recovery Pack.

Flags:

- missing recheck
- partial recheck alignment
- target skill missing from recheck snapshot

## Admin Report

New admin route:

- `/admin/remediation-quality`

New API endpoint:

- `GET /api/admin/remediation-quality`

The report shows:

- Recovery Pack coverage matrix
- strongest interventions
- weakest interventions
- low-quality Recovery Packs
- misconceptions without complete interventions
- worked-example gaps
- recheck weaknesses

## Strongest Recovery Packs

Strong Recovery Packs are those with:

- target skill ids
- mapped misconceptions
- visual or model-based intervention
- worked example focus
- guided practice sequence
- independent practice
- recheck strategy
- source evidence from diagnostic or paper analysis

## Weakest Recovery Packs

Weak Recovery Packs are those missing:

- skill alignment
- misconception alignment
- worked example support
- guided practice
- recheck alignment
- source evidence

## Missing Interventions

The current registered misconception set is fully mapped at the architecture level. Remaining risk is not the absence of an intervention plan; it is whether those planned interventions are represented by enough high-quality rendered learning assets and questions.

## Recheck Weaknesses

Main weakness:

- A Recovery Pack may be completed before a linked recheck exists.
- A linked recheck may not include every target skill in its snapshot.

Recommendation:

- Recheck creation should require target skills from the Recovery Pack.
- Recheck reports should explicitly list covered and uncovered target skills.

## Recommended Fixes

1. Convert planned worked-example focus entries into actual rendered worked-example assets.
2. Ensure every Recovery Pack stores the misconception tags used to create it.
3. Ensure every recheck generated from an assignment preserves the assignment target skills.
4. Add minimum item requirements for rechecks per target skill.
5. Use repeated failure metrics to refine Recovery Pack question selection.

## Recommended Next Sprint

Recommended next sprint: Recovery Pack Asset Realisation.

Focus:

- build actual worked-example assets for the highest-risk Fractions misconceptions
- add misconception tags to Recovery Pack assignment metadata
- enforce recheck target-skill alignment
- use effectiveness data to improve intervention selection
