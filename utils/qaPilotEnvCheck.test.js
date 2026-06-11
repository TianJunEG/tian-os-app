import { describe, expect, it } from 'vitest';
import { satisfiesNodeVersion } from '../scripts/qa-pilot-env-check.js';

describe('satisfiesNodeVersion (pilot env doctor)', () => {
  it('accepts equal and higher versions', () => {
    expect(satisfiesNodeVersion('22.3.0', '22.3.0')).toBe(true);
    expect(satisfiesNodeVersion('22.3.1', '22.3.0')).toBe(true);
    expect(satisfiesNodeVersion('22.4.0', '22.3.0')).toBe(true);
    expect(satisfiesNodeVersion('24.0.0', '22.3.0')).toBe(true);
  });

  it('rejects lower versions', () => {
    expect(satisfiesNodeVersion('22.2.9', '22.3.0')).toBe(false);
    expect(satisfiesNodeVersion('20.18.0', '22.3.0')).toBe(false);
    expect(satisfiesNodeVersion('18.0.0', '22.3.0')).toBe(false);
  });

  it('tolerates a leading v and missing patch segments', () => {
    expect(satisfiesNodeVersion('v22.3.0', '22.3.0')).toBe(true);
    expect(satisfiesNodeVersion('22.3', '22.3.0')).toBe(true);
    expect(satisfiesNodeVersion('22', '22.3.0')).toBe(false);
  });
});
