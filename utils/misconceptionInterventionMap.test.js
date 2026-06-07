import { describe, expect, it } from 'vitest';
import {
  auditMisconceptionInterventionCoverage,
  getInterventionForMisconception,
} from '../services/mathpath/misconceptionInterventionMap.js';

describe('misconceptionInterventionMap', () => {
  it('maps denominator addition misconception to targeted intervention and recheck', () => {
    const row = getInterventionForMisconception('adds_denominators_directly');

    expect(row.interventionType).toBe('common_denominator_visual_model');
    expect(row.worksheetType).toBe('recovery_worksheet');
    expect(row.guidedPracticeSequence).toContain('guided_unlike_denominator_addition');
    expect(row.recheckStrategy).toContain('unlike_denominator_addition');
  });

  it('audits every registered misconception for intervention coverage', () => {
    const audit = auditMisconceptionInterventionCoverage();

    expect(audit.misconceptionCount).toBeGreaterThan(0);
    expect(audit.mappedCount).toBe(audit.misconceptionCount);
    expect(audit.missingInterventions).toHaveLength(0);
  });
});
