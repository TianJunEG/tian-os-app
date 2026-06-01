# Sprint 6 Drill Engine Design

Status: Completed

## Drill Mode

Fluency drills are short, focused, high-repetition sessions.

## Drill Pack Fields

- Drill id
- Skill id
- Mode
- Session length
- Repetition target
- Adaptive difficulty flag
- Time tracking required
- Question family ids
- Target seconds

## Recommendation Logic

If accuracy is weak, the engine recommends concept work. If accuracy is strong but speed or consistency is weak, it recommends a fluency drill pack.

## Implementation

- `buildFluencyDrillPack`
- `recommendFluencyIntervention`
