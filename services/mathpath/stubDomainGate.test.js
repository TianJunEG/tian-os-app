import { describe, it, expect } from 'vitest';
import { assertDomainServable, GATED_STUB_DOMAINS, WITHHELD_DOMAINS } from './stubDomainGate.js';
import { buildGeometryPracticeSession } from './geometryPracticeService.js';

describe('stubDomainGate', () => {
  it('withholds no domains — all six have been rebuilt and re-enabled', () => {
    expect(WITHHELD_DOMAINS).toEqual({});
    expect(GATED_STUB_DOMAINS).toEqual(new Set());
  });

  it('is a no-op for every MathPath domain', () => {
    for (const id of ['money', 'time', 'operations', 'number-sense', 'measurement', 'geometry', 'fractions']) {
      expect(() => assertDomainServable(id), id).not.toThrow();
    }
  });

  it('a previously-gated service now builds a session instead of throwing 503', () => {
    const session = buildGeometryPracticeSession({ targetSkillId: 'GE001', questionCount: 4 });
    expect(session.domainId).toBe('geometry');
    expect(session.questions.length).toBe(4);
  });

  // The gate mechanism still works if a domain is ever re-added to the map.
  it('still throws 503 for a hypothetically-withheld domain', () => {
    const original = { ...WITHHELD_DOMAINS };
    WITHHELD_DOMAINS.geometry = 'stub';
    try {
      assertDomainServable('geometry');
      throw new Error('expected assertDomainServable to throw');
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.code).toBe('DOMAIN_NOT_SERVABLE');
    } finally {
      for (const k of Object.keys(WITHHELD_DOMAINS)) delete WITHHELD_DOMAINS[k];
      Object.assign(WITHHELD_DOMAINS, original);
    }
  });
});
