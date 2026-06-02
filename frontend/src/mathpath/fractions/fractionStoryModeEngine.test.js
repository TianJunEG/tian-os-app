import { describe, it, expect } from 'vitest';
import {
  buildStorySceneItems,
  getFractionsStoryTemplatesBySkill,
  buildFractionsStorySession,
  evaluateFractionsStorySession,
  FRACTIONS_STORY_SUPPORTED_SKILLS,
} from './fractionStoryModeEngine';
import { validateCountableFractionSequence } from './fractionQuestionGenerator';

describe('fractionStoryModeEngine', () => {
  it('provides at least 3 templates for F025 and F026', () => {
    expect(getFractionsStoryTemplatesBySkill('F025').length).toBeGreaterThanOrEqual(3);
    expect(getFractionsStoryTemplatesBySkill('F026').length).toBeGreaterThanOrEqual(3);
  });

  it('supports only F025/F026 for story mode', () => {
    expect(FRACTIONS_STORY_SUPPORTED_SKILLS.has('F025')).toBe(true);
    expect(FRACTIONS_STORY_SUPPORTED_SKILLS.has('F026')).toBe(true);
    expect(FRACTIONS_STORY_SUPPORTED_SKILLS.has('F015')).toBe(false);
  });

  it('can score an F025 story with fully correct responses', () => {
    const story = buildFractionsStorySession({ skillId: 'F025', studentId: 's1' });
    const responses = story.steps.map((step, idx) => ({
      stepIndex: idx,
      type: step.type,
      answer: step.correct || step.answer?.value || '',
    }));
    const scored = evaluateFractionsStorySession({ story, responses });
    expect(scored.skillId).toBe('F025');
    expect(scored.finalCorrect).toBe(true);
    expect(scored.accuracy).toBe(100);
  });

  it('adds key facts and guided model steps to every F025/F026 story', () => {
    const stories = [
      ...getFractionsStoryTemplatesBySkill('F025'),
      ...getFractionsStoryTemplatesBySkill('F026'),
    ];
    expect(stories.length).toBeGreaterThanOrEqual(6);
    stories.forEach((story) => {
      expect(story.keyFacts?.length).toBeGreaterThanOrEqual(3);
      expect(story.modelSequence?.length).toBeGreaterThanOrEqual(6);
      expect(story.keyFacts.every((fact) => fact.text && fact.type && fact.modelPrompt)).toBe(true);
      expect(story.modelSequence.some((step) => step.id === 'label_known')).toBe(true);
      expect(story.modelSequence.some((step) => step.id === 'find_whole')).toBe(true);
    });
  });

  it('adds the Story Mode scene data required by the renderer', () => {
    const story = buildFractionsStorySession({ skillId: 'F026', studentId: 's3' });
    expect(story.sceneItems.length).toBe(story.steps.length);
    story.sceneItems.forEach((scene) => {
      expect(scene.missionTitle).toBeTruthy();
      expect(scene.sceneTitle).toBeTruthy();
      expect(scene.sceneNarration).toBeTruthy();
      expect(scene.characterPrompt).toBeTruthy();
      expect(scene.mathGoal).toBeTruthy();
      expect(scene.questionText).toBeTruthy();
      expect(scene.guidedSteps.length).toBeGreaterThan(0);
      expect(['fraction_bar', 'fraction_bar_remainder', 'shaded_grid', 'number_line', 'part_whole_cards']).toContain(scene.visualHintType);
      expect(scene.visualModel).toMatchObject(story.barModel);
      expect(scene.successNarration).toBeTruthy();
      expect(scene.errorHint).toBeTruthy();
      expect(scene.retryPrompt).toBeTruthy();
      expect(scene.nextSceneUnlockText).toBeTruthy();
    });
  });

  it('can build scene items directly from existing story templates', () => {
    const [template] = getFractionsStoryTemplatesBySkill('F025');
    const scenes = buildStorySceneItems(template);
    expect(scenes[0].missionTitle).toBe('Fraction Rescue Mission');
    expect(scenes[0].sceneTitle).toBeTruthy();
    expect(scenes[0].guidedSteps.length).toBeGreaterThan(0);
  });

  it('keeps countable Story Mode fraction examples integer-safe', () => {
    const examples = [
      { total: 30, fractions: [{ numerator: 2, denominator: 5 }] },
      { total: 28, fractions: [{ numerator: 1, denominator: 4 }] },
      { total: 40, fractions: [{ numerator: 3, denominator: 8 }] },
      { total: 63, fractions: [{ numerator: 2, denominator: 7 }, { numerator: 1, denominator: 3 }] },
    ];
    examples.forEach(({ total, fractions }) => {
      const result = validateCountableFractionSequence(total, fractions);
      expect(result.valid, `${total} with ${JSON.stringify(fractions)}`).toBe(true);
      expect(result.steps.every((step) => Number.isInteger(step.before) && Number.isInteger(step.amount) && Number.isInteger(step.remaining))).toBe(true);
    });
  });

  it('flags mistakes when final answer is wrong for F026', () => {
    const story = buildFractionsStorySession({ skillId: 'F026', studentId: 's2' });
    const responses = story.steps.map((step, idx) => ({
      stepIndex: idx,
      type: step.type,
      answer: step.type === 'final_answer' ? '9999' : (step.correct || step.answer?.value || ''),
    }));
    const scored = evaluateFractionsStorySession({ story, responses });
    expect(scored.skillId).toBe('F026');
    expect(scored.finalCorrect).toBe(false);
    expect(scored.mistakeTags.length).toBeGreaterThan(0);
  });
});
