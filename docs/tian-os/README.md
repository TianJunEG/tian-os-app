# Tian OS Master Documentation

## Current Truth

Tian OS is currently focused on completing MathPath Fractions Intervention before expanding into full P1–P6 Math or other subjects.

Current safe pilot positioning:

**Tian OS MathPath — Fractions Intervention Pilot**

Do not claim:
- Full P1–P6 MathPath readiness
- Full Singapore Math coverage
- School-ready platform
- Full mastery unless evidence supports it

## Current Learning Loop

Diagnostic  
→ Mistake Evidence  
→ Recovery Pack  
→ Teaching Flow  
→ Recheck  
→ Growth Report

## Current Pilot Readiness

- 5-student controlled Fractions pilot: ready with caveats
- 20–50 student parent pilot: not certified yet
- Tutor/student-care assisted Fractions pilot: partial
- School pilot: not ready

## Core Engineering Rules

- Work in branches
- Do not commit unrelated dirty files
- Do not commit Playwright artifacts
- Run focused tests before commit
- Run frontend build when frontend changes
- Preserve parent-child isolation
- StudentGuardian is the source of truth for parent-child access
- Legacy User.children is compatibility only
- Reviewed mistake does not mean mastered
- Correction does not mean full skill mastery
- Parent copy must remain Fractions-only and claim-safe

## Current Priority Sprints

1. Fractions Runtime Evidence Repair
2. Misconception Specificity & Recheck Targeting
3. Recovery Pack Question Materialisation
4. Fractions Visual Model Completion
5. 10-Student Seeded Pilot Simulation

## Critical Pilot Blockers

1. Runtime evidence integrity must be clean
2. Recovery Pack question references must resolve to curated records
3. Misconception tagging must be specific enough for “why” claims
4. Rechecks must target the actual skill and misconception
5. Parent reports must not overclaim
6. Broad P1–P6 claims must remain blocked

## Developer Onboarding Warning

This repository contains many interconnected learning-evidence systems. Do not make broad refactors without first auditing:

- diagnostics
- assignments
- mistakes
- recovery packs
- rechecks
- reports
- parent-child access
- worksheet generation
- paper analysis

Every change must protect the core promise:

**Identify what the child misunderstood, teach that specific gap, verify improvement, and show the evidence clearly to adults.**