import { describe, expect, it } from 'vitest';
import {
  buildRemainderSubdivisionScenario,
  buildTwoStageRemainderSpendScenario,
  getFractionsModelTrainerForSkill,
  getFractionsModelTrainerTemplate,
  getModelDrawingRemediationPathway,
  listFractionsModelTrainerTemplates,
  validateFractionsModelTrainerTemplates,
} from '../services/mathpath/fractionsModelTrainer.js';
import { getRemediationForMistake } from '../shared/mathpath/fractions/fractionMistakeToMasteryEngine.js';

describe('Fractions Model Drawing Trainer templates', () => {
  it('exposes the three MVP templates with linked Fractions skills', () => {
    const templates = listFractionsModelTrainerTemplates();
    expect(templates).toHaveLength(3);
    expect(templates.map((t) => t.template_id)).toEqual([
      'fraction_of_whole_left',
      'remainder_after_giving_away',
      'fraction_of_remainder_subdivision',
    ]);
    expect(templates.every((t) => t.linked_skill_ids.length > 0)).toBe(true);
  });

  it('supports dynamic remainder subdivision from fifths into tenths', () => {
    const template = getFractionsModelTrainerTemplate('fraction_of_remainder_subdivision');
    const subdivision = template.model_steps.find((step) => step.step_id === 'subdivide_remainder');
    const final = template.model_steps.find((step) => step.step_id === 'answer');

    expect(subdivision.model.selectedRegion).toEqual([3, 4, 5]);
    expect(subdivision.model.subdivideRemainingBy).toBe(2);
    expect(subdivision.model.equivalentDenominator).toBe(10);
    expect(final.model.finalAnswer).toBe('3/10 L');
  });

  it('supports remainder subdivision variants that simplify the final fraction', () => {
    const scenario = buildRemainderSubdivisionScenario({
      wholeLabel: 'all tarts',
      firstRemovedNumerator: 2,
      firstDenominator: 5,
      secondRemovedNumerator: 1,
      secondDenominator: 6,
    });

    expect(scenario.remainder).toBe('3/5');
    expect(scenario.equivalentDenominator).toBe(30);
    expect(scenario.finalUnsimplified).toBe('15/30');
    expect(scenario.finalSimplified).toBe('1/2');
  });

  it('supports remainder subdivision variants with concrete quantities', () => {
    const scenario = buildRemainderSubdivisionScenario({
      wholeLabel: '75 buttons',
      totalQuantity: 75,
      unit: 'buttons',
      firstRemovedNumerator: 2,
      firstDenominator: 5,
      secondRemovedNumerator: 1,
      secondDenominator: 3,
    });

    expect(scenario.finalSimplified).toBe('2/5');
    expect(scenario.finalQuantity).toBe(30);
    expect(scenario.finalQuantityAnswer).toBe('30 buttons');
  });

  it('supports two-stage money remainder variants with backwards solving', () => {
    const scenario = buildTwoStageRemainderSpendScenario({
      wholeLabel: 'unknown money',
      firstRemovedNumerator: 1,
      firstDenominator: 3,
      secondRemovedNumerator: 2,
      secondDenominator: 5,
      knownLaterSpent: 360,
      finalLeft: 120,
    });

    expect(scenario.afterSecondKnownTotal).toBe(480);
    expect(scenario.secondSpentAmount).toBe(320);
    expect(scenario.afterFirstRemainderAmount).toBe(800);
    expect(scenario.initialAmount).toBe(1200);
    expect(scenario.secondSpentAnswer).toBe('$320');
    expect(scenario.initialAmountAnswer).toBe('$1200');
    expect(scenario.branchModel.type).toBe('branching_remainder_model');
    expect(scenario.branchModel.secondBranches.map((branch) => branch.label)).toEqual(['transport', 'food + left']);
  });

  it('returns skill-specific model trainer recommendations', () => {
    const f025 = getFractionsModelTrainerForSkill('F025');
    expect(f025.some((template) => template.template_id === 'fraction_of_remainder_subdivision')).toBe(true);

    const f003 = getFractionsModelTrainerForSkill('F003');
    expect(f003.map((t) => t.template_id)).toEqual(
      expect.arrayContaining(['fraction_of_whole_left', 'remainder_after_giving_away'])
    );
  });

  it('makes model drawing available to Mistake-to-Mastery for remainder errors', () => {
    const pathway = getModelDrawingRemediationPathway({ mistakeCode: 'M008', skillId: 'F023' });
    expect(pathway.type).toBe('model_drawing_trainer');
    expect(pathway.template_id).toBe('fraction_of_remainder_subdivision');
    expect(pathway.href).toContain('/student/mathpath/fractions/model-trainer/');

    const remediation = getRemediationForMistake('M008');
    expect(remediation.modelDrawingTrainer.template_id).toBe('fraction_of_remainder_subdivision');
  });

  it('passes the built-in template validator', () => {
    const result = validateFractionsModelTrainerTemplates();
    expect(result.isValid).toBe(true);
    expect(result.checks).toMatchObject({
      hasThreeTemplates: true,
      supportsRemainderSubdivision: true,
      updatesEquivalentDenominator: true,
      finalAnswerIsThreeTenths: true,
    });
  });
});
