# Diagnostic Session Completion Audit

## Issue

A fractions diagnostic configured for 10 questions could complete after only 1 submitted answer.

## Why It Ended Early

The adaptive runtime previously treated any `decision.shouldStopDiagnostic` value as an immediate session completion:

```js
sessionComplete = decision.shouldStopDiagnostic || answeredCount >= maxQuestions
```

That meant a remediation-style adaptive decision such as `STOP_AND_ASSIGN_PRACTICE` could end a baseline diagnostic before the configured question count had been reached.

## Expected Behaviour

A diagnostic should complete only when:

- the target question count is reached, or
- an explicit adaptive completion rule is allowed after the configured minimum question count, or
- no valid next question can be generated.

## Fix Applied

The diagnostic runtime now resolves completion through a dedicated completion contract:

- `target_reached`
- `placement_confident`
- `coverage_complete`
- `question_generation_failed`
- `in_progress`

For baseline fractions diagnostics, the minimum question count defaults to the configured target count. If an adaptive stop signal appears too early and there are still valid questions available, the stop is deferred and the runtime selects another unattempted diagnostic question.

## Lifecycle Logging

Each diagnostic start and answer now logs:

```js
{
  sessionId,
  targetQuestions,
  questionsAnswered,
  questionsRemaining,
  completionReason
}
```

The completion reason is also persisted on the diagnostic session and returned in API progress payloads.

## Pilot Expectation

A 10-question diagnostic should not terminate after 1 question unless question generation genuinely fails. If it does complete early, the stored `completionReason` will explain why.
