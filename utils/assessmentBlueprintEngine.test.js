import { describe, expect, it } from 'vitest';
import {
  SAMPLE_ASSESSMENT_BLUEPRINTS,
  generateTestBlueprint,
  validateAssessmentBlueprint,
} from '../services/mathpath/assessmentBlueprintEngine.js';

function samplePayload() {
  return {
    title: 'P4 WA Blueprint',
    level: 'P4',
    subject: 'Math',
    school: 'Generic',
    assessmentType: 'WA',
    durationMinutes: 60,
    totalMarks: 50,
    calculatorAllowed: false,
    timed: true,
    status: 'active',
    sections: [
      {
        name: 'Section A',
        marks: 20,
        questionCount: 12,
        questionTypes: ['mcq', 'short_answer'],
        difficultyMix: { basic: 40, standard: 45, advanced: 15 },
        cognitiveMix: { Recall: 45, Procedural: 40, Application: 15, ComplexApplication: 0 },
      },
      {
        name: 'Section B',
        marks: 30,
        questionCount: 8,
        questionTypes: ['word_problem', 'multi_step'],
        difficultyMix: { basic: 20, standard: 40, advanced: 40 },
        cognitiveMix: { Recall: 10, Procedural: 35, Application: 35, ComplexApplication: 20 },
      },
    ],
    topics: [
      { topic: 'Fractions', marks: 20, weightage: 40, difficulty: 'mixed', difficultyMix: { basic: 25, standard: 45, advanced: 30 }, diagramTypes: ['fraction_model'] },
      { topic: 'Geometry', marks: 15, weightage: 30, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 50, advanced: 30 }, diagramTypes: ['shape_library'] },
      { topic: 'Data Analysis', marks: 15, weightage: 30, difficulty: 'mixed', difficultyMix: { basic: 20, standard: 45, advanced: 35 }, diagramTypes: ['bar_graph'] },
    ],
    requiredDiagramTypes: ['fraction_model', 'shape_library', 'bar_graph'],
  };
}

describe('assessmentBlueprintEngine (unit)', () => {
  it('accepts valid blueprint payload', () => {
    const out = validateAssessmentBlueprint(samplePayload());
    expect(out.valid).toBe(true);
    expect(out.errors).toEqual([]);
  });

  it('rejects invalid payload', () => {
    const bad = samplePayload();
    bad.totalMarks = 0;
    bad.topics[0].weightage = 80;
    const out = validateAssessmentBlueprint(bad);
    expect(out.valid).toBe(false);
    expect(out.errors.some((error) => error.includes('totalMarks'))).toBe(true);
    expect(out.errors.some((error) => error.includes('weightage'))).toBe(true);
  });

  it('builds test-mode blueprint payload without questions', async () => {
    const generated = await generateTestBlueprint({ ...samplePayload(), _id: 'bp_123' });
    expect(generated.blueprintId).toBe('bp_123');
    expect(generated.sections.length).toBe(2);
    expect(generated.marks.totalMarks).toBe(50);
    expect(generated.timing.timed).toBe(true);
    expect(generated.topics.length).toBe(3);
    expect(generated).not.toHaveProperty('questions');
  });

  it('exposes starter blueprint library', () => {
    expect(Array.isArray(SAMPLE_ASSESSMENT_BLUEPRINTS)).toBe(true);
    expect(SAMPLE_ASSESSMENT_BLUEPRINTS.length).toBe(6);
    expect(SAMPLE_ASSESSMENT_BLUEPRINTS.map((row) => row.level)).toEqual(
      expect.arrayContaining(['P3', 'P4', 'P5', 'P6'])
    );
  });
});
