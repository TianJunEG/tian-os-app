import { describe, expect, it } from 'vitest';
import {
  getVisualModelMetadata,
  getVisualModelRegistry,
  normalizeVisualType,
} from '../services/mathpath/visualModelRegistry.js';

describe('visualModelRegistry', () => {
  it('loads the supported visual model types', () => {
    const registry = getVisualModelRegistry();

    expect(registry.map((item) => item.type)).toEqual(expect.arrayContaining([
      'fraction_strip',
      'shaded_fraction_model',
      'number_line',
      'bar_model',
      'geometry_shape',
      'geometry_diagram',
      'table',
      'graph',
      'picture_model',
    ]));
  });

  it('normalizes legacy visual aliases', () => {
    expect(normalizeVisualType('fraction_bar')).toBe('fraction_strip');
    expect(normalizeVisualType('shaded_shape')).toBe('shaded_fraction_model');
    expect(normalizeVisualType('comparison_models')).toBe('bar_model');
  });

  it('returns metadata for Singapore Math model-method visuals', () => {
    const metadata = getVisualModelMetadata('bar_model');

    expect(metadata.label).toBe('Bar Model');
    expect(metadata.singaporeMathUse).toMatch(/Singapore Math/i);
  });
});
