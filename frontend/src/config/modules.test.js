import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS } from './featureFlags';
import { MODULES } from './modules';
import { buildNav } from './navigationConfig';

describe('pilot feature visibility', () => {
  it('exposes stable student modules and gates experimental ones', () => {
    // Both fluency and assessments graduated from pilot to live — now default to true.
    expect(FEATURE_FLAGS.fluency).toBe(true);
    expect(FEATURE_FLAGS.assessments).toBe(true);
    expect(FEATURE_FLAGS.worksheets).toBe(true);
    expect(FEATURE_FLAGS.science).toBe(false);
    expect(FEATURE_FLAGS.modelTrainer).toBe(false);

    const moduleKeys = MODULES.map((module) => module.key);
    expect(moduleKeys).toEqual(expect.arrayContaining(['mathpath', 'mistakes', 'progress', 'worksheets', 'fluency']));
    expect(moduleKeys).not.toContain('science');
  });

  it('keeps student navigation focused on stable pilot routes', () => {
    const nav = buildNav({ role: 'student' });
    const paths = nav.all.map((item) => item.path);

    expect(paths).toEqual(expect.arrayContaining([
      '/student',
      '/student/mathpath',
      '/student/mathpath/mistakes',
      '/student/progress',
    ]));
    expect(paths).not.toContain('/student/worksheets');
    expect(paths).not.toContain('/student/science');
    expect(paths).not.toContain('/student/mathpath/fluency');
  });
});
