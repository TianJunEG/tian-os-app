import { describe, it, expect } from 'vitest';
import { assertDomainServable, GATED_STUB_DOMAINS, WITHHELD_DOMAINS } from './stubDomainGate.js';
import { buildNumberSensePracticeSession } from './numberSensePracticeService.js';
import { buildOperationsPracticeSession } from './operationsPracticeService.js';
import { buildGeometryPracticeSession } from './geometryPracticeService.js';
import { buildMeasurementPracticeSession } from './measurementPracticeService.js';

describe('stubDomainGate', () => {
  it('withholds only the four stub domains (Money and Time have been rebuilt)', () => {
    expect(WITHHELD_DOMAINS).toEqual({
      'number-sense': 'stub',
      operations: 'stub',
      geometry: 'stub',
      measurement: 'stub',
    });
  });

  it('no longer withholds money or time', () => {
    expect(() => assertDomainServable('money')).not.toThrow();
    expect(() => assertDomainServable('time')).not.toThrow();
  });

  it('exposes the pure-stub subset', () => {
    expect(GATED_STUB_DOMAINS).toEqual(
      new Set(['number-sense', 'operations', 'geometry', 'measurement']),
    );
  });

  it('throws a 503 with a reason for a withheld domain', () => {
    try {
      assertDomainServable('geometry');
      throw new Error('expected assertDomainServable to throw');
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.code).toBe('DOMAIN_NOT_SERVABLE');
      expect(err.reason).toBe('stub');
    }
  });

  it('is a no-op for a servable domain', () => {
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
