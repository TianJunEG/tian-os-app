import { describe, it, expect } from 'vitest';
import { assertDomainServable, GATED_STUB_DOMAINS } from './stubDomainGate.js';
import { buildNumberSensePracticeSession } from './numberSensePracticeService.js';
import { buildOperationsPracticeSession } from './operationsPracticeService.js';
import { buildGeometryPracticeSession } from './geometryPracticeService.js';
import { buildMeasurementPracticeSession } from './measurementPracticeService.js';

describe('stubDomainGate', () => {
  it('gates the four known stub domains', () => {
    expect(GATED_STUB_DOMAINS).toEqual(
      new Set(['number-sense', 'operations', 'geometry', 'measurement']),
    );
  });

  it('throws a 503 for a gated domain', () => {
    try {
      assertDomainServable('geometry');
      throw new Error('expected assertDomainServable to throw');
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.code).toBe('DOMAIN_NOT_SERVABLE');
    }
  });

  it('is a no-op for a non-gated domain', () => {
    expect(() => assertDomainServable('fractions')).not.toThrow();
  });

  it.each([
    ['number-sense', buildNumberSensePracticeSession],
    ['operations', buildOperationsPracticeSession],
    ['geometry', buildGeometryPracticeSession],
    ['measurement', buildMeasurementPracticeSession],
  ])('build*PracticeSession refuses to serve %s', (_id, build) => {
    expect(() => build({})).toThrowError(/temporarily unavailable/);
  });
});
