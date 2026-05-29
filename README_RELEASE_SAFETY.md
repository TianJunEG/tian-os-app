# Release Safety Rules

This project uses version-aware and role-aware navigation. Before any future release, QA, or implementation prompt, read this file first.

## v0.1 Scope

v0.1 is the production-visible Student MathPath vertical slice only:

- Student Dashboard
- MathPath Roadmap
- Skill Practice
- Practice Result
- Mistake Review
- Remediation
- Follow-up Practice
- Progress / Skill Graph

The v0.1 journey must let a student open the dashboard, start today's MathPath task, complete one short practice set, review a mistake, receive remediation, complete follow-up practice, and see progress update.

Do not expose unfinished future modules in v0.1.

## Feature Flags And Versions

- Navigation is version-aware and role-aware.
- A feature must not appear in production navigation unless its version and feature flag allow it.
- Future modules must remain hidden behind their configured version and feature flags until explicitly released.
- Do not bypass navigation guards to make a hidden feature visible.
- Do not add new navigation entries unless the release scope explicitly requires it.
- MathPath full-curriculum preview is development/admin-only via `VITE_ENABLE_MATHPATH_FULL_PREVIEW=true`; it must remain off for beta production users unless explicitly enabled for admin review.

## Release Rules

- Do not add new features during a release hardening pass.
- Do not redesign the app during release hardening.
- Fix only the minimum broken parts required for the named release flow.
- Reuse existing components, APIs, routes, and patterns where possible.
- Keep mobile layouts usable.
- Do not polish unrelated screens.
- Do not work on Parent, Tutor, Teacher, Admin, SciencePath, LifeLab, D&T, Spelling, Payments, Marketplace, or Certification unless the prompt explicitly scopes that area.
- Do not expose hidden future features.
- Do not change the navigation system unless it is broken for the release flow.

## Staging And Production Separation

- Staging may contain prototype and future-module work.
- Production must show only the approved version scope and enabled feature flags.
- Demo seed data must not be treated as production data.
- Any seed change needed for a release must be called out clearly so staging and production can be reseeded intentionally.
- Environment variables must remain environment-specific. Do not copy secrets between staging and production.

## Rollback Rules

- Every production release should be traceable to a specific commit.
- If a release breaks the approved user journey, roll back to the last known good commit first, then diagnose.
- Prefer small, reversible commits over broad mixed-scope changes.
- Do not roll back unrelated user work or unrelated dirty files.
- If only seed data is wrong, prefer a seed/data rollback over an app-code rollback.

## Required Verification

Before freezing a release:

- Run relevant frontend tests.
- Run relevant backend tests when backend behavior changed.
- Run a production frontend build when frontend routes or lazy-loaded pages changed.
- Manually walk the approved user journey.
- Report what works, what was fixed, what still does not work, and whether the release is ready to freeze.

## Future Prompt Rule

All future prompts about release readiness, QA, navigation, production visibility, feature freezing, or version scope must read this file first before inspecting or changing code.
