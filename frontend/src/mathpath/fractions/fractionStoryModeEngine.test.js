import { describe, it, expect } from 'vitest';
import {
  getFractionsStoryTemplatesBySkill,
  buildFractionsStorySession,
  evaluateFractionsStorySession,
  FRACTIONS_STORY_SUPPORTED_SKILLS,
} from './fractionStoryModeEngine';

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
