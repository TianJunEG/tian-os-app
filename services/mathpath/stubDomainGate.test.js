import { describe, it, expect } from 'vitest';
import { assertDomainServable, GATED_STUB_DOMAINS, WITHHELD_DOMAINS } from './stubDomainGate.js';
import { buildNumberSensePracticeSession } from './numberSensePracticeService.js';
import { buildOperationsPracticeSession } from './operationsPracticeService.js';
import { buildGeometryPracticeSession } from './geometryPracticeService.js';
import { buildMeasurementPracticeSession } from './measurementPracticeService.js';
import { buildTimePracticeSession } from './timePracticeService.js';

describe('stubDomainGate', () => {
  it('withholds the four stub domains and Time (Money has been rebuilt)', () => {
    expect(WITHHELD_DOMAINS).toEqual({
      'number-sense': 'stub',
      operations: 'stub',
      geometry: 'stub',
      measurement: 'stub',
      time: 'not-exam-ready',
    });
  });

  it('no longer withholds money', () => {
    expect(() => assertDomainServable('money')).not.toThrow();
  });

  it('exposes the pure-stub subset', () => {
    expect(GATED_STUB_DOMAINS).toEqual(
      new Set(['number-sense', 'operations', 'geometry', 'measurement']),
    );
  });

  it('throws a 503 with a reason for a withheld domain', () => {
    try {
      assertDomainServable('time');
      throw new Error('expected assertDomainServable to throw');
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.code).toBe('DOMAIN_NOT_SERVABLE');
      expect(err.reason).toBe('not-exam-ready');
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
    ['time', buildTimePracticeSession],
  ])('build*PracticeSession refuses to serve %s', (_id, build) => {
    expect(() => build({})).toThrowError(/temporarily unavailable/);
  });
});
