import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS } from './featureFlags';
import { MODULES } from './modules';
import { buildNav } from './navigationConfig';

describe('pilot feature visibility', () => {
  it('hides unstable student modules by default for the pilot', () => {
    expect(FEATURE_FLAGS.fluency).toBe(false);
    expect(FEATURE_FLAGS.assessments).toBe(false);
    expect(FEATURE_FLAGS.worksheets).toBe(false);
    expect(FEATURE_FLAGS.science).toBe(false);
    expect(FEATURE_FLAGS.modelTrainer).toBe(false);

    const moduleKeys = MODULES.map((module) => module.key);
    expect(moduleKeys).toEqual(expect.arrayContaining(['mathpath', 'mistakes', 'progress']));
    expect(moduleKeys).not.toContain('fluency');
    expect(moduleKeys).not.toContain('worksheets');
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
