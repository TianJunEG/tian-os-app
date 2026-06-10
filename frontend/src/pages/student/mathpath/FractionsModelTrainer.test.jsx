import { describe, expect, it } from 'vitest';
import {
  buildWeDoPromptForStep,
  canRevealModelAnswer,
  checkWeDoAnswer,
  buildModelRevealStates,
  buildRevealedModelForPrompt,
  buildFinalAnswerQuestion,
  extractCueHighlights,
  getPhaseStatus,
  getStep5CompletionState,
  getTransitionCTA,
  getVisibleWeDoInstruction,
  MODE_ORDER,
} from './FractionsModelTrainer';

const fifthsModel = {
  wholeLabel: '1 L',
  denominator: 5,
  removedParts: [1, 2],
  remainingParts: [3, 4, 5],
  highlightRemaining: true,
  remainderLabel: '3/5 remains',
  finalAnswer: '3/5 L',
};

describe('FractionsModelTrainer reveal states', () => {
  it('hides denominator partitions before a split prompt is answered', () => {
    const state = buildRevealedModelForPrompt({
      model: { ...fifthsModel, removedParts: [], remainingParts: [1, 2, 3, 4, 5] },
      expectedAction: 'split_whole_into_denominator_parts',
      reveal: false,
    });

    expect(state.model.denominator).toBe(1);
    expect(state.model.remainingParts).toEqual([1]);
    expect(state.model.removedParts).toEqual([]);
    expect(state.hidePartLabels).toBe(true);
  });

  it('hides removed numerator details before a remove prompt is answered', () => {
    const state = buildRevealedModelForPrompt({
      model: fifthsModel,
      expectedAction: 'shade_or_remove_selected_parts',
      reveal: false,
    });

    expect(state.model.denominator).toBe(5);
    expect(state.model.removedParts).toEqual([]);
    expect(state.model.finalAnswer).toBe('');
    expect(state.hidePartLabels).toBe(true);
  });

  it('hides remaining labels and answer before a remaining-count prompt is answered', () => {
    const state = buildRevealedModelForPrompt({
      model: fifthsModel,
      expectedAction: 'count_remaining_parts',
      reveal: false,
    });

    expect(state.model.removedParts).toEqual([]);
    expect(state.model.remainingParts).toEqual([1, 2, 3, 4, 5]);
    expect(state.model.highlightRemaining).toBe(false);
    expect(state.model.remainderLabel).toBe('');
    expect(state.model.finalAnswer).toBe('');
    expect(state.hidePartLabels).toBe(true);
  });

  it('hides subdivision and remainder details before subdivision prompts are answered', () => {
    const state = buildRevealedModelForPrompt({
      model: {
        ...fifthsModel,
        selectedRegion: [3, 4, 5],
        subdivideRemainingBy: 2,
        removedSubparts: [1, 2, 3],
        finalSubpartsLeft: [4, 5, 6],
        equivalence: '3/5 = 6/10',
        branchModel: { type: 'branching' },
      },
      expectedAction: 'remove_fraction_of_remainder',
      reveal: false,
    });

    expect(state.model.removedParts).toEqual([]);
    expect(state.model.selectedRegion).toEqual([]);
    expect(state.model.removedSubparts).toEqual([]);
    expect(state.model.finalSubpartsLeft).toEqual([]);
    expect(state.model.equivalence).toBe('');
    expect(state.hideBranchModel).toBe(true);
  });

  it('reveals the full model after the student answers correctly', () => {
    const state = buildRevealedModelForPrompt({
      model: fifthsModel,
      expectedAction: 'count_remaining_parts',
      reveal: true,
    });

    expect(state.model).toBe(fifthsModel);
    expect(state.hidePartLabels).toBe(false);
    expect(state.hideBranchModel).toBe(false);
  });

  it('separates student attempt state from teacher solution state', () => {
    const states = buildModelRevealStates({
      model: fifthsModel,
      expectedAction: 'shade_or_remove_selected_parts',
      reveal: false,
    });

    expect(states.teacherSolutionState.model.removedParts).toEqual([1, 2]);
    expect(states.studentAttemptState.model.removedParts).toEqual([]);
    expect(states.activeState).toBe(states.studentAttemptState);
  });

  it('hides answer-bearing We Do instructions before check', () => {
    expect(getVisibleWeDoInstruction({
      instruction: 'Split the whole into 5 equal parts.',
      hasPrompt: true,
      reveal: false,
    })).toBe('Answer the prompt first. The completed model step will appear after you check.');

    expect(getVisibleWeDoInstruction({
      instruction: 'Split the whole into 5 equal parts.',
      hasPrompt: true,
      reveal: true,
    })).toBe('Split the whole into 5 equal parts.');
  });

  it('creates a final-answer We Do prompt for answer steps without a student prompt', () => {
    const prompt = buildWeDoPromptForStep({
      instruction: 'Answer: 3/5 L.',
      model: { wholeLabel: '1 L', finalAnswer: '3/5 L' },
    });

    expect(prompt).toMatchObject({
      type: 'text',
      question: 'How much juice is left?',
      expected_answer: '3/5 L',
      generated: true,
    });
  });

  it('accepts final answers with or without trailing unit labels', () => {
    expect(checkWeDoAnswer({
      answer: '3/5',
      expectedAnswer: '3/5 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(true);
    expect(checkWeDoAnswer({
      answer: '3/5 L',
      expectedAnswer: '3/5 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(true);
    expect(checkWeDoAnswer({
      answer: '3',
      expectedAnswer: '3/5 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(false);
  });

  it('builds a shared math answer input payload for model trainer final fractions', () => {
    expect(buildFinalAnswerQuestion({
      expectedAnswer: '3/5 L',
      prompt: 'Enter your final answer.',
    })).toMatchObject({
      prompt: 'Enter your final answer.',
      answerFormat: 'mixed_number',
      allowedInputTools: ['fraction', 'mixed', 'whole', 'clear'],
      answer: {
        type: 'fraction',
        display: '3/5',
        value: '3/5',
      },
    });
  });

  it('validates equivalent final fraction answers while preserving the display unit separately', () => {
    expect(checkWeDoAnswer({
      answer: '6/10',
      expectedAnswer: '3/5 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(true);
    expect(checkWeDoAnswer({
      answer: '1 1/6',
      expectedAnswer: '7/6 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(true);
    expect(checkWeDoAnswer({
      answer: '7/6 L',
      expectedAnswer: '1 1/6 L',
      expectedAction: 'write_final_answer',
    }).ok).toBe(true);
  });

  it('gates model reveal until drawing is saved or bypass is configured', () => {
    expect(canRevealModelAnswer({ working: {}, bypass: false })).toBe(false);
    expect(canRevealModelAnswer({ working: { workingSubmitted: true }, bypass: false })).toBe(true);
    expect(canRevealModelAnswer({ working: { workingImage: 'data:image/png;base64,abc' }, bypass: false })).toBe(true);
    expect(canRevealModelAnswer({ working: {}, bypass: true })).toBe(true);
  });

  it('does not allow Step 5 completion before drawing is saved', () => {
    expect(getStep5CompletionState({
      working: {},
      finalAnswer: '3/5',
      modelAnswerRevealed: true,
    })).toMatchObject({
      modelSaved: false,
      finalAnswerEntered: true,
      modelAnswerRevealed: true,
      canProceed: false,
    });
  });

  it('does not allow Step 5 completion before final answer is entered', () => {
    expect(getStep5CompletionState({
      working: { workingSubmitted: true },
      finalAnswer: '',
      modelAnswerRevealed: true,
    })).toMatchObject({
      modelSaved: true,
      finalAnswerEntered: false,
      modelAnswerRevealed: true,
      canProceed: false,
    });
  });

  it('does not allow Step 5 completion before model answer is revealed', () => {
    expect(getStep5CompletionState({
      working: { workingSubmitted: true },
      finalAnswer: '3/5',
      modelAnswerRevealed: false,
    })).toMatchObject({
      modelSaved: true,
      finalAnswerEntered: true,
      modelAnswerRevealed: false,
      canProceed: false,
    });
  });

  it('allows Step 5 completion after drawing, final answer, and reveal are complete', () => {
    expect(getStep5CompletionState({
      working: { workingSubmitted: true },
      finalAnswer: '3/5',
      modelAnswerRevealed: true,
    })).toMatchObject({
      modelSaved: true,
      finalAnswer: '3/5',
      finalAnswerEntered: true,
      modelAnswerRevealed: true,
      canProceed: true,
    });
  });
});

describe('Phase progression', () => {
  it('defines the correct phase order', () => {
    expect(MODE_ORDER).toEqual(['i_do', 'we_do', 'you_do']);
  });

  it('marks completed phases', () => {
    const completed = new Set(['i_do']);
    expect(getPhaseStatus('i_do', 'we_do', completed)).toBe('completed');
    expect(getPhaseStatus('we_do', 'we_do', completed)).toBe('current');
    expect(getPhaseStatus('you_do', 'we_do', completed)).toBe('next');
  });

  it('locks phases beyond the next one', () => {
    expect(getPhaseStatus('you_do', 'i_do', new Set())).toBe('locked');
  });

  it('returns transition CTA on last step of each phase', () => {
    expect(getTransitionCTA('i_do', true)).toMatchObject({ label: 'Continue to We Do', nextMode: 'we_do' });
    expect(getTransitionCTA('we_do', true)).toMatchObject({ label: 'Continue to You Do', nextMode: 'you_do' });
    expect(getTransitionCTA('you_do', true)).toMatchObject({ label: 'See results', nextMode: null });
  });

  it('returns null when not on last step', () => {
    expect(getTransitionCTA('i_do', false)).toBeNull();
    expect(getTransitionCTA('we_do', false)).toBeNull();
  });
});

describe('Cue highlighting', () => {
  it('highlights a matching phrase in question text', () => {
    const result = extractCueHighlights(
      'Ali had 24 stickers. He gave 1/3 of them away.',
      { questionHighlightPhrase: '1/3 of them', cueExplanation: 'This tells us the fraction.' },
    );
    expect(result.segments).toEqual([
      { text: 'Ali had 24 stickers. He gave ', highlighted: false },
      { text: '1/3 of them', highlighted: true },
      { text: ' away.', highlighted: false },
    ]);
    expect(result.cueExplanation).toBe('This tells us the fraction.');
  });

  it('returns the full text as a single segment when no cue phrase matches', () => {
    const result = extractCueHighlights('Find 2/5 of 30.', { reasoningCue: 'no match here' });
    expect(result.segments).toEqual([{ text: 'Find 2/5 of 30.', highlighted: false }]);
  });

  it('returns unhighlighted text when step has no cue', () => {
    const result = extractCueHighlights('Simple question.', {});
    expect(result.segments).toEqual([{ text: 'Simple question.', highlighted: false }]);
  });

  it('highlights multiple phrases', () => {
    const result = extractCueHighlights(
      'Ali had 24 stickers and gave 1/3 away.',
      { questionHighlightPhrase: ['24 stickers', '1/3'] },
    );
    const highlighted = result.segments.filter((s) => s.highlighted);
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0].text).toBe('24 stickers');
    expect(highlighted[1].text).toBe('1/3');
  });
});
