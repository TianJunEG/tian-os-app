import { describe, it, expect } from 'vitest';
import { assertDomainServable, GATED_STUB_DOMAINS, WITHHELD_DOMAINS } from './stubDomainGate.js';
import { buildGeometryPracticeSession } from './geometryPracticeService.js';

describe('stubDomainGate', () => {
  it('withholds only Geometry (the last stub)', () => {
    expect(WITHHELD_DOMAINS).toEqual({
      geometry: 'stub',
    });
  });

  it('no longer withholds money, time, operations, number-sense or measurement', () => {
    expect(() => assertDomainServable('money')).not.toThrow();
    expect(() => assertDomainServable('time')).not.toThrow();
    expect(() => assertDomainServable('operations')).not.toThrow();
    expect(() => assertDomainServable('number-sense')).not.toThrow();
    expect(() => assertDomainServable('measurement')).not.toThrow();
  });

  it('exposes the pure-stub subset', () => {
    expect(GATED_STUB_DOMAINS).toEqual(
      new Set(['geometry']),
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
    ['geometry', buildGeometryPracticeSession],
  ])('build*PracticeSession refuses to serve %s', (_id, build) => {
    expect(() => build({})).toThrowError(/temporarily unavailable/);
  });
});
