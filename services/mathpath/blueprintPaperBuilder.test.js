import { describe, it, expect } from 'vitest';
import {
  mapBlueprintTypesToQuestionTypes,
  sectionPaper,
  sectionCalculatorAllowed,
  blueprintDifficultyMix,
  buildBlueprintSectionPlan,
} from './blueprintPaperBuilder.js';

describe('mapBlueprintTypesToQuestionTypes', () => {
  it('maps the richer blueprint enum onto bank types', () => {
    expect(mapBlueprintTypesToQuestionTypes(['mcq']).sort()).toEqual(['mcq']);
    expect(mapBlueprintTypesToQuestionTypes(['word_problem', 'multi_step']).sort()).toEqual(['open_ended']);
    expect(mapBlueprintTypesToQuestionTypes(['mcq', 'open_ended']).sort()).toEqual(['mcq', 'open_ended']);
  });

  it('returns no constraint for mixed/empty/unmappable types', () => {
    expect(mapBlueprintTypesToQuestionTypes(['mixed'])).toEqual([]);
    expect(mapBlueprintTypesToQuestionTypes([])).toEqual([]);
    expect(mapBlueprintTypesToQuestionTypes(['diagram', 'graph'])).toEqual([]);
  });
});

describe('sectionPaper / sectionCalculatorAllowed', () => {
  it('reads the paper from the section name, defaulting to Paper 1', () => {
    expect(sectionPaper({ name: 'Paper 2 (Structured)' })).toBe(2);
    expect(sectionPaper({ name: 'Paper 1 Booklet A' })).toBe(1);
    expect(sectionPaper({ name: 'Section A' })).toBe(1);
  });

  it('allows a calculator on Paper 2, else inherits the blueprint flag', () => {
    expect(sectionCalculatorAllowed({ name: 'Paper 2' }, { calculatorAllowed: false })).toBe(true);
    expect(sectionCalculatorAllowed({ name: 'Paper 1' }, { calculatorAllowed: false })).toBe(false);
    expect(sectionCalculatorAllowed({ name: 'Section A' }, { calculatorAllowed: true })).toBe(true);
  });
});

describe('blueprintDifficultyMix', () => {
  it('normalizes richer bands to easy/medium/hard', () => {
    expect(blueprintDifficultyMix({ difficultyMix: { basic: 30, standard: 50, advanced: 20 } }))
      .toEqual({ easy: 30, medium: 50, hard: 20 });
  });
  it('defaults when the mix is empty', () => {
    expect(blueprintDifficultyMix({})).toEqual({ easy: 40, medium: 40, hard: 20 });
  });
});

describe('buildBlueprintSectionPlan', () => {
  const blueprint = {
    calculatorAllowed: false,
    sections: [
      { name: 'Paper 1 Booklet A', marks: 10, questionCount: 10, questionTypes: ['mcq'], difficultyMix: { easy: 50, medium: 30, hard: 20 } },
      { name: 'Paper 2 Structured', marks: 20, questionCount: 5, questionTypes: ['open_ended'], difficultyMix: { standard: 60, advanced: 40 } },
      { name: 'Empty', marks: 0, questionCount: 0, questionTypes: ['mcq'] },
    ],
  };

  it('builds an ordered plan and skips zero-count sections', () => {
    const plan = buildBlueprintSectionPlan(blueprint);
    expect(plan).toHaveLength(2);
    expect(plan[0]).toMatchObject({ name: 'Paper 1 Booklet A', paper: 1, marks: 10, questionCount: 10, questionTypes: ['mcq'], calculatorAllowed: false });
    expect(plan[1]).toMatchObject({ name: 'Paper 2 Structured', paper: 2, questionCount: 5, questionTypes: ['open_ended'], calculatorAllowed: true });
    expect(plan[1].difficultyMix).toEqual({ easy: 0, medium: 60, hard: 40 });
  });

  it('returns empty for a blueprint with no sections', () => {
    expect(buildBlueprintSectionPlan({})).toEqual([]);
  });
});
