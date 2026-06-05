import { describe, expect, it } from 'vitest';
import {
  hasWorkingDecision,
  resolveWorkingRequirementLevel,
} from './WorkingEvidenceDecision.jsx';

describe('WorkingEvidenceDecision helpers', () => {
  it('classifies recognition questions as low working requirement', () => {
    expect(resolveWorkingRequirementLevel({
      prompt: 'What fraction of the shape is shaded?',
      type: 'mcq',
    })).toBe('LOW');
  });

  it('classifies multi-step and operation questions as high working requirement', () => {
    expect(resolveWorkingRequirementLevel({
      prompt: 'Ali used 1/2 of the ribbon, then 1/3 of the remainder. How much is left?',
      questionFamilyId: 'QF_F025_WORD_PROBLEM',
    })).toBe('HIGH');
  });

  it('requires submitted working, paper working, or an explicit not-needed declaration', () => {
    expect(hasWorkingDecision({})).toBe(false);
    expect(hasWorkingDecision({ workingSubmitted: true })).toBe(true);
    expect(hasWorkingDecision({ workingOnPaper: true })).toBe(true);
    expect(hasWorkingDecision({ workingNotNeeded: true })).toBe(true);
  });
});
