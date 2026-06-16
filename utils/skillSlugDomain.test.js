import { describe, it, expect } from 'vitest';
import { domainIdFromSlug, PREFIX_TO_DOMAIN } from './skillSlugDomain.js';

describe('domainIdFromSlug', () => {
  it('maps known slug prefixes to canonical domain IDs', () => {
    expect(domainIdFromSlug('fr.equivalent')).toBe('fractions');
    expect(domainIdFromSlug('pct.convert')).toBe('percentage');
    expect(domainIdFromSlug('rr.meaning')).toBe('ratio');
    expect(domainIdFromSlug('op.long-division')).toBe('four_operations');
    expect(domainIdFromSlug('ns.place-value')).toBe('number_sense');
    expect(domainIdFromSlug('ap.composite')).toBe('area_perimeter');
    expect(domainIdFromSlug('cir.area')).toBe('circles');
  });

  it('uses canonical underscore domain IDs (registry-aligned)', () => {
    const values = Object.values(PREFIX_TO_DOMAIN);
    expect(values).toContain('four_operations');
    expect(values).toContain('number_sense');
    expect(values).toContain('area_perimeter');
  });

  it('returns null for missing or unrecognised slugs', () => {
    expect(domainIdFromSlug('')).toBeNull();
    expect(domainIdFromSlug(null)).toBeNull();
    expect(domainIdFromSlug('zzz.unknown')).toBeNull();
    expect(domainIdFromSlug('noprefix')).toBeNull();
  });
});
