import { describe, expect, it } from 'vitest';
import { resolveWorkingSessionAnchor, hasWorkingSessionAnchor } from './mathpathWorking.js';

describe('working session anchor guard (orphan upload prevention)', () => {
  it('resolves a practice anchor (and accepts the sessionId alias)', () => {
    expect(resolveWorkingSessionAnchor({ practiceSessionId: 'practice_1' }).practiceSessionId).toBe('practice_1');
    expect(resolveWorkingSessionAnchor({ sessionId: 'practice_2' }).practiceSessionId).toBe('practice_2');
  });

  it('resolves an assessment anchor', () => {
    const anchor = resolveWorkingSessionAnchor({ assessmentSessionId: 'assess_1' });
    expect(anchor).toEqual({ practiceSessionId: null, assessmentSessionId: 'assess_1' });
  });

  it('treats a request with a practice or assessment session as anchored', () => {
    expect(hasWorkingSessionAnchor({ practiceSessionId: 'practice_1' })).toBe(true);
    expect(hasWorkingSessionAnchor({ sessionId: 'practice_1' })).toBe(true);
    expect(hasWorkingSessionAnchor({ assessmentSessionId: 'assess_1' })).toBe(true);
  });

  it('treats a context-free (manual) request as NOT anchored', () => {
    expect(hasWorkingSessionAnchor({})).toBe(false);
    expect(hasWorkingSessionAnchor({ studentId: 's1', skillIds: ['F016'], questionIds: ['q1'] })).toBe(false);
    expect(hasWorkingSessionAnchor({ practiceSessionId: null, assessmentSessionId: null })).toBe(false);
  });
});
