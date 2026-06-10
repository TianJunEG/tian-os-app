import { describe, it, expect } from 'vitest';
import {
  RECHECK_PASS_THRESHOLD,
  selectPassingRecheckSkills,
} from '../services/mathpath/recheckMasteryEvidenceService.js';

const recheck = (perSkillSnapshot) => ({
  diagnosticPurpose: 'recheck',
  domainId: 'fractions',
  studentId: 'student_1',
  perSkillSnapshot,
});

describe('recheck mastery evidence: pass selection', () => {
  it('selects only skills at or above the pass threshold', () => {
    const passing = selectPassingRecheckSkills(recheck([
      { skillId: 'F016', score: RECHECK_PASS_THRESHOLD, questionsAnswered: 4 },
      { skillId: 'F018', score: 95, questionsAnswered: 5 },
      { skillId: 'F010', score: 69, questionsAnswered: 4 },
    ]));
    expect(passing).toEqual(['F016', 'F018']);
  });

  it('ignores skills with no answered questions even if score is present', () => {
    const passing = selectPassingRecheckSkills(recheck([
      { skillId: 'F016', score: 100, questionsAnswered: 0 },
    ]));
    expect(passing).toEqual([]);
  });

  it('does not treat practice or baseline diagnostics as a recheck pass', () => {
    const baseline = { ...recheck([{ skillId: 'F016', score: 100, questionsAnswered: 4 }]), diagnosticPurpose: 'baseline' };
    expect(selectPassingRecheckSkills(baseline)).toEqual([]);
  });

  it('does not apply to non-fractions domains', () => {
    const other = { ...recheck([{ skillId: 'F016', score: 100, questionsAnswered: 4 }]), domainId: 'spelling' };
    expect(selectPassingRecheckSkills(other)).toEqual([]);
  });

  it('uppercases skill ids and dedupes via the caller', () => {
    const passing = selectPassingRecheckSkills(recheck([
      { skillId: 'f016', score: 80, questionsAnswered: 3 },
    ]));
    expect(passing).toEqual(['F016']);
  });
});
