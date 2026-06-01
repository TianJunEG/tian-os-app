# Sprint 6 Benchmark Design

Status: Completed

## Benchmark Dimensions

Benchmarks are stored by:

- Skill
- Student level
- Difficulty
- Optional question family

## Benchmark Bands

- Developing
- Secure
- Fluent
- Automatic

Example model:

Equivalent Fractions can be tuned so developing may be around 120 seconds, secure around 60 seconds and fluent around 30 seconds, while automatic is faster.

## Implementation

- `getFluencyBenchmark`

Benchmarks are tuneable and do not hard-code mastery decisions.
