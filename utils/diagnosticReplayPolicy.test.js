import { describe, it, expect } from 'vitest';
import { evaluateDiagnosticReplayPolicy } from './diagnosticReplayPolicy.js';

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('diagnostic replay policy', () => {
  it('requires diagnostic for first-time student', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'baseline',
      latestCompletedSession: null,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('no_prior_diagnostic');
  });

  it('blocks baseline replay for returning student with recent valid placement', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'baseline',
      latestCompletedSession: {
        completedAt: daysAgo(5),
        result: { recommendedStartingSkill: { skillId: 'F010' } },
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('recent_placement_exists');
  });

  it('allows manual retake', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'recheck',
      latestCompletedSession: {
        completedAt: daysAgo(2),
        result: { recommendedStartingSkill: { skillId: 'F010' } },
      },
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('manual_or_assigned_retake');
  });

  it('allows assigned retake', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'assigned',
      latestCompletedSession: {
        completedAt: daysAgo(1),
        result: { recommendedStartingSkill: { skillId: 'F010' } },
      },
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('manual_or_assigned_retake');
  });

  it('allows baseline replay after long inactivity', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'baseline',
      latestCompletedSession: {
        completedAt: daysAgo(60),
        result: { recommendedStartingSkill: { skillId: 'F010' } },
      },
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('long_inactivity');
  });

  it('allows baseline replay if prior placement is missing/corrupted', () => {
    const result = evaluateDiagnosticReplayPolicy({
      diagnosticPurpose: 'baseline',
      latestCompletedSession: {
        completedAt: daysAgo(3),
        result: {},
      },
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('placement_missing_or_corrupted');
  });
});
