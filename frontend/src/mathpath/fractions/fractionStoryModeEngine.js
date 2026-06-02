import { checkFractionAnswer } from './fractionQuestionGenerator';

const STRATEGIES = [
  'Draw a bar model',
  'Work backwards',
  'Find the remaining fraction',
  'Find one unit first',
  'Use equivalent fractions',
  'Break the problem into parts',
  'Check the final answer against the question',
];

const ONE_UNIT_STRATEGY_CHOICES = [
  'Use the 5/8 left to find 1/8, then the whole',
  'Use 3/8 to find completed pages only',
  'Add 3/8 and 25 pages directly',
];

const REMAINDER_BACKWARDS_CHOICES = [
  'Work backwards from the final amount left',
  'Use the first fraction only',
  'Add the two fractions straight away',
];

const TRACK_REMAINDER_CHOICES = [
  'Track each remainder, then find one unit',
  'Use only the final number',
  'Add all denominators first',
];

const SUPPORTIVE_FEEDBACK = {
  wrong_remaining_fraction: 'Not quite. Check what fraction is left after the part is used or given away.',
  did_not_work_backwards: 'Not quite. We know what is left, so working backwards may help.',
  wrong_whole: 'Good effort. Check whether the number given is the whole or only the remaining part.',
  confused_part_with_remainder: 'Careful. This step is about the remainder, not the original whole.',
  operation_mismatch: 'Try again. Match the operation to what happened in the story.',
  calculation_error: 'Your thinking is close. Recheck the calculation in this step.',
  final_answer_does_not_match_question: 'Check the question again. Make sure your answer gives what it asks for.',
  guessed_without_unpacking: 'Try unpacking the story one step at a time before choosing an answer.',
};

export const STORY_VISUAL_HINT_TYPES = [
  'fraction_bar',
  'fraction_bar_remainder',
  'shaded_grid',
  'number_line',
  'part_whole_cards',
];

function fact(id, sentenceIndex, text, type, modelPrompt, strategyTag = '') {
  return {
    id,
    sentenceIndex,
    text,
    type,
    modelPrompt,
    modelAction: modelPrompt,
    strategyTag,
  };
}

function missionTitleFor(story = {}) {
  if (story.skillId === 'F026') return 'Remainder Rescue Mission';
  return 'Fraction Rescue Mission';
}

function titleForStep(step = {}, index = 0) {
  const titles = {
    read_story: 'Read the Mission Brief',
    identify_question: 'Name the Target',
    identify_parts: 'Find the Fraction Clue',
    identify_whole: 'Track What Remains',
    choose_strategy: 'Choose a Solving Tool',
    choose_operation: 'Connect the Operation',
    compute_step: 'Work Out the Key Value',
    final_answer: 'Complete the Rescue',
    reflection: 'Review the Strategy',
  };
  return titles[step.type] || `Scene ${index + 1}`;
}

function visualHintFor(story = {}, step = {}, index = 0) {
  if (step.type === 'read_story' || step.type === 'identify_question') return 'part_whole_cards';
  if (step.type === 'compute_step') return story.problemSchema === 'multi_step_sequence' ? 'number_line' : 'shaded_grid';
  if (story.problemSchema === 'multi_step_sequence' || /remainder/i.test(step.prompt || '')) return 'fraction_bar_remainder';
  return index % 2 === 0 ? 'fraction_bar' : 'shaded_grid';
}

function guidedStepsFor(story = {}, step = {}, index = 0) {
  const modelPrompts = (story.modelSequence || []).map((item) => item.prompt).filter(Boolean);
  if (step.type === 'final_answer') {
    return [
      'Check what the question wants.',
      'Use the value you already found.',
      'Scale back to the whole amount.',
      'Write the answer with the correct unit if needed.',
    ];
  }
  if (step.type === 'compute_step') {
    return modelPrompts.slice(Math.max(0, index - 2), Math.max(3, index + 1));
  }
  return [
    story.schemaHint || 'Read the story one fact at a time.',
    ...(modelPrompts.slice(0, 3)),
  ].slice(0, 5);
}

export function buildStorySceneItems(story = {}) {
  const missionTitle = story.missionTitle || missionTitleFor(story);
  return (story.steps || []).map((step, index) => {
    const guidedSteps = guidedStepsFor(story, step, index);
    const sceneTitle = step.sceneTitle || titleForStep(step, index);
    const visualHintType = step.visualHintType || visualHintFor(story, step, index);
    const successNarration = step.successNarration
      || (step.type === 'final_answer'
        ? 'Great. The mission result now matches the story.'
        : 'Good. This clue is now clear, so the next part of the story can open.');
    return {
      missionTitle,
      sceneTitle,
      sceneNarration: step.sceneNarration || story.schemaHint || story.prompt,
      characterPrompt: step.characterPrompt || (story.needToFind ? `Can you help find: ${story.needToFind}?` : 'Can you help solve this scene?'),
      mathGoal: step.mathGoal || story.needToFind || story.problemSchema || 'Use fraction reasoning to solve the story.',
      questionText: step.questionText || step.prompt,
      guidedSteps,
      visualHintType,
      visualModel: story.barModel || {},
      successNarration,
      errorHint: step.errorHint || SUPPORTIVE_FEEDBACK[step.mistakeTag] || story.schemaHint || 'Try the guided steps before answering again.',
      retryPrompt: step.retryPrompt || guidedSteps[0] || 'Try again using the first clue.',
      nextSceneUnlockText: step.nextSceneUnlockText || (index === (story.steps || []).length - 1 ? 'Mission complete.' : `Scene ${index + 2} is unlocked.`),
      type: step.type,
      prompt: step.prompt,
      choices: step.choices,
      correct: step.correct,
      answer: step.answer,
      mistakeTag: step.mistakeTag,
    };
  });
}

function buildModelSequence({ denominator, removed, knownRemaining, subdivideRemainingBy = null, removedSubparts = null, unknownWhole = true }) {
  const sequence = [
    { id: 'draw_whole', title: 'Draw one whole bar', prompt: 'Start with one bar for the whole amount.' },
    { id: 'divide_whole', title: 'Divide the bar', prompt: `Divide the whole bar into ${denominator} equal parts.` },
    { id: 'mark_removed', title: 'Mark the used part', prompt: `Shade or cross out ${removed} out of ${denominator} parts.` },
    { id: 'mark_remainder', title: 'Mark what is left', prompt: `The remaining part is ${denominator - removed}/${denominator}. Label this as the remainder.` },
  ];
  if (subdivideRemainingBy) {
    sequence.push({
      id: 'subdivide_remainder',
      title: 'Subdivide the remainder',
      prompt: `Treat the remainder as the new amount. Split it into ${subdivideRemainingBy} equal groups.`,
    });
    sequence.push({
      id: 'mark_second_action',
      title: 'Mark the second action',
      prompt: `Shade ${removedSubparts || 1} of those new groups, then look at what is still left.`,
    });
  }
  if (knownRemaining) {
    sequence.push({ id: 'label_known', title: 'Label the known value', prompt: `Write ${knownRemaining} on the remaining part.` });
  }
  sequence.push({ id: 'find_unit', title: 'Find one unit', prompt: 'Use the labelled remainder to find one equal unit.' });
  if (unknownWhole) sequence.push({ id: 'find_whole', title: 'Find the whole', prompt: 'Use one unit to find the whole amount at first.' });
  return sequence;
}

const STORY_TEMPLATES = [
  {
    storyId: 'STORY_F025_001',
    skillId: 'F025',
    officialSkillCode: 'F025',
    universalSkillSlug: 'fr.exam-applications',
    questionFamilyId: 'QF_F025_STORY_001',
    title: 'Stickers and the Missing Whole',
    prompt: 'Ali gave away 2/5 of his stickers and had 18 left. How many did he have at first?',
    problemSchema: 'remainder',
    schemaHint: 'This is a remainder problem. We know what is left, so we can work backwards.',
    needToFind: 'Number of stickers Ali had at first',
    knownFacts: ['2/5 was given away', '18 stickers were left', 'The whole is 5/5'],
    keyFacts: [
      fact('f025_001_fraction', 0, '2/5', 'fraction_part', 'Shade 2 out of 5 equal parts.', 'find_remaining_fraction'),
      fact('f025_001_remainder', 0, '18 left', 'quantity_known', 'Label the remaining 3 parts as 18 stickers.', 'find_one_unit_first'),
      fact('f025_001_target', 1, 'at first', 'target_unknown', 'We need the whole amount, not only the part left.', 'work_backwards'),
    ],
    strategyTags: ['find_remaining_fraction', 'find_one_unit_first', 'work_backwards', 'check_final_answer_against_question'],
    barModel: { denominator: 5, removed: 2, knownRemaining: '18', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 5, removed: 2, knownRemaining: '18 stickers' }),
    answer: { value: '30', display: '30' },
    workedSolution: [
      'Given away: 2/5, so left: 3/5.',
      'If 3/5 = 18, then 1/5 = 18 ÷ 3 = 6.',
      'So 5/5 = 6 × 5 = 30.',
    ],
    mistakeTags: ['wrong_whole', 'wrong_remaining_fraction', 'did_not_work_backwards'],
    singaporeLevel: 'P4',
    steps: [
      { type: 'read_story', prompt: 'Read the story carefully. What is the question asking?', choices: ['How many at first', 'How many given away'], correct: 'How many at first', mistakeTag: 'final_answer_does_not_match_question' },
      { type: 'identify_parts', prompt: 'What fraction is left?', choices: ['2/5', '3/5', '5/3'], correct: '3/5', mistakeTag: 'wrong_remaining_fraction' },
      { type: 'choose_strategy', prompt: 'What should you do after finding 3/5 is left?', choices: ['Use 3/5 = 18 to find 1/5, then 5/5', 'Use 2/5 = 18 to find 1/5', 'Add 2/5 and 18'], correct: 'Use 3/5 = 18 to find 1/5, then 5/5', mistakeTag: 'did_not_work_backwards' },
      { type: 'compute_step', prompt: 'If 3/5 is 18, what is 1/5?', answer: { value: '6', display: '6' }, mistakeTag: 'calculation_error' },
      { type: 'final_answer', prompt: 'So what is the total at first (5/5)?', answer: { value: '30', display: '30' }, mistakeTag: 'wrong_whole' },
      { type: 'reflection', prompt: 'Which step helped you most?', choices: ['Find remaining fraction', 'Find one unit', 'Check final whole'], correct: 'Find one unit' },
    ],
  },
  {
    storyId: 'STORY_F025_002',
    skillId: 'F025',
    officialSkillCode: 'F025',
    universalSkillSlug: 'fr.exam-applications',
    questionFamilyId: 'QF_F025_STORY_002',
    title: 'Marbles Challenge',
    prompt: 'Nora used 1/4 of her marbles. She has 21 marbles left. How many marbles did she have at first?',
    problemSchema: 'before_after',
    schemaHint: 'We are given the amount after some marbles were used. The answer asks for the amount at first.',
    needToFind: 'Total number of marbles at first',
    knownFacts: ['1/4 was used', '21 marbles were left', 'The remaining fraction is 3/4'],
    keyFacts: [
      fact('f025_002_fraction', 0, '1/4', 'fraction_part', 'Shade 1 out of 4 equal parts.', 'find_remaining_fraction'),
      fact('f025_002_remainder', 1, '21 marbles left', 'quantity_known', 'Label the remaining 3 parts as 21 marbles.', 'find_one_unit_first'),
      fact('f025_002_target', 2, 'at first', 'target_unknown', 'The question asks for the original whole.', 'work_backwards'),
    ],
    strategyTags: ['find_remaining_fraction', 'find_one_unit_first', 'work_backwards'],
    barModel: { denominator: 4, removed: 1, knownRemaining: '21', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 4, removed: 1, knownRemaining: '21 marbles' }),
    answer: { value: '28', display: '28' },
    workedSolution: ['Left fraction is 3/4.', '3/4 = 21, so 1/4 = 7.', 'Total = 7 × 4 = 28.'],
    mistakeTags: ['confused_part_with_whole', 'wrong_remaining_fraction', 'operation_mismatch'],
    singaporeLevel: 'P4',
    steps: [
      { type: 'read_story', prompt: 'What do we need to find?', choices: ['Used amount only', 'Total at first'], correct: 'Total at first' },
      { type: 'identify_parts', prompt: 'What fraction remains?', choices: ['1/4', '3/4', '4/3'], correct: '3/4' },
      { type: 'choose_strategy', prompt: 'What should you do after finding 3/4 remains?', choices: ['Use 3/4 = 21 to find 1/4, then 4/4', 'Use 1/4 = 21 to find 4/4', 'Subtract 1/4 from 21'], correct: 'Use 3/4 = 21 to find 1/4, then 4/4' },
      { type: 'compute_step', prompt: 'If 3/4 is 21, what is 1/4?', answer: { value: '7', display: '7' } },
      { type: 'final_answer', prompt: 'What is 4/4?', answer: { value: '28', display: '28' } },
      { type: 'reflection', prompt: 'What should you check next time?', choices: ['Fraction left', 'Draw neatly', 'Guess'], correct: 'Fraction left' },
    ],
  },
  {
    storyId: 'STORY_F025_003',
    skillId: 'F025',
    officialSkillCode: 'F025',
    universalSkillSlug: 'fr.exam-applications',
    questionFamilyId: 'QF_F025_STORY_003',
    title: 'Notebook Pages',
    prompt: 'Tim completed 3/8 of a notebook. 25 pages are still blank. How many pages are there in total?',
    problemSchema: 'part_whole',
    schemaHint: 'The blank pages are the remaining part. The question asks for the whole notebook.',
    needToFind: 'Total number of pages',
    knownFacts: ['3/8 completed', '25 pages blank', 'Blank fraction is 5/8'],
    keyFacts: [
      fact('f025_003_fraction', 0, '3/8', 'fraction_part', 'Shade 3 out of 8 parts to show completed pages.', 'find_remaining_fraction'),
      fact('f025_003_remainder', 1, '25 pages', 'quantity_known', 'Label the blank remaining 5 parts as 25 pages.', 'find_one_unit_first'),
      fact('f025_003_target', 2, 'in total', 'target_unknown', 'We need all 8 parts of the notebook.', 'compare_part_and_whole'),
    ],
    strategyTags: ['find_remaining_fraction', 'find_one_unit_first', 'compare_part_and_whole'],
    barModel: { denominator: 8, removed: 3, knownRemaining: '25', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 8, removed: 3, knownRemaining: '25 pages' }),
    answer: { value: '40', display: '40' },
    workedSolution: ['Completed = 3/8, so blank = 5/8.', '5/8 = 25, so 1/8 = 5.', 'Total = 5 × 8 = 40.'],
    mistakeTags: ['wrong_remaining_fraction', 'calculation_error', 'wrong_whole'],
    singaporeLevel: 'P5',
    steps: [
      { type: 'identify_question', prompt: 'Find:', choices: ['Blank pages', 'Total pages'], correct: 'Total pages' },
      { type: 'identify_parts', prompt: 'Blank fraction is:', choices: ['3/8', '5/8', '8/5'], correct: '5/8' },
      { type: 'choose_strategy', prompt: 'What should you do next?', choices: ONE_UNIT_STRATEGY_CHOICES, correct: ONE_UNIT_STRATEGY_CHOICES[0] },
      { type: 'compute_step', prompt: 'If 5/8 is 25, what is 1/8?', answer: { value: '5', display: '5' } },
      { type: 'final_answer', prompt: 'So total pages = ?', answer: { value: '40', display: '40' } },
      { type: 'reflection', prompt: 'Best check before final answer?', choices: ['Whole is 8/8', 'Subtract again', 'Skip check'], correct: 'Whole is 8/8' },
    ],
  },
  {
    storyId: 'STORY_F026_001',
    skillId: 'F026',
    officialSkillCode: 'F026',
    universalSkillSlug: 'fr.mastery-challenge',
    questionFamilyId: 'QF_F026_STORY_001',
    title: 'Money and Remainder',
    prompt: 'Mei spent 1/3 of her money on a book, then 1/4 of the remainder on a pen. She had $18 left. How much at first?',
    problemSchema: 'multi_step_sequence',
    schemaHint: 'This is a multi-step remainder story. The second fraction is taken from the remainder.',
    needToFind: 'Amount of money Mei had at first',
    knownFacts: ['1/3 spent first', '1/4 of the remainder spent next', '$18 left'],
    keyFacts: [
      fact('f026_001_first_fraction', 0, '1/3', 'fraction_part', 'Shade 1 out of 3 parts for the book.', 'break_story_into_steps'),
      fact('f026_001_remainder_fraction', 0, '1/4 of the remainder', 'remainder', 'Now focus only on the remaining 2/3 and split it into 4 groups.', 'track_remainder'),
      fact('f026_001_known_left', 1, '$18 left', 'quantity_known', 'Label the final unshaded remainder as $18.', 'work_backwards'),
      fact('f026_001_target', 2, 'at first', 'target_unknown', 'Work backwards to find the original whole amount.', 'work_backwards'),
    ],
    strategyTags: ['break_story_into_steps', 'track_remainder', 'work_backwards', 'use_equivalent_fractions'],
    barModel: { denominator: 3, removed: 1, subdivideRemainingBy: 4, removedSubparts: 1, knownRemaining: '$18', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 3, removed: 1, subdivideRemainingBy: 4, removedSubparts: 1, knownRemaining: '$18' }),
    answer: { value: '36', display: '36' },
    workedSolution: [
      'After spending 1/3, remaining is 2/3.',
      'Then 1/4 of remainder spent, so 3/4 of remainder left.',
      '3/4 of 2/3 = 1/2 of original. If 1/2 is 18, original is 36.',
    ],
    mistakeTags: ['did_not_work_backwards', 'wrong_remaining_fraction', 'operation_mismatch', 'confused_part_with_remainder'],
    singaporeLevel: 'P6',
    steps: [
      { type: 'read_story', prompt: 'What happened first?', choices: ['Spent 1/3', 'Spent 1/4'], correct: 'Spent 1/3' },
      { type: 'identify_whole', prompt: 'After first spend, fraction remaining is:', choices: ['1/3', '2/3', '3/2'], correct: '2/3' },
      { type: 'identify_parts', prompt: 'After second spend, what fraction of the remainder is left?', choices: ['1/4', '3/4', '4/3'], correct: '3/4' },
      { type: 'compute_step', prompt: 'What fraction of original is left? (3/4 × 2/3)', answer: { value: '1/2', display: '1/2' } },
      { type: 'final_answer', prompt: 'If 1/2 is 18, original amount is?', answer: { value: '36', display: '36' } },
      { type: 'reflection', prompt: 'Which strategy did you use most?', choices: ['Work backwards', 'Equivalent fractions', 'Guess and check'], correct: 'Work backwards' },
    ],
  },
  {
    storyId: 'STORY_F026_002',
    skillId: 'F026',
    officialSkillCode: 'F026',
    universalSkillSlug: 'fr.mastery-challenge',
    questionFamilyId: 'QF_F026_STORY_002',
    title: 'Ribbon Problem',
    prompt: 'A ribbon was cut: 1/5 used for a gift, then 1/2 of the remainder used for decoration. 12 cm remained. Find original length.',
    problemSchema: 'multi_step_sequence',
    schemaHint: 'The second cut is from the remainder, not from the whole ribbon.',
    needToFind: 'Original ribbon length',
    knownFacts: ['1/5 used first', '1/2 of the remainder used next', '12 cm remained'],
    keyFacts: [
      fact('f026_002_first_fraction', 0, '1/5', 'fraction_part', 'Shade 1 out of 5 parts for the gift.', 'break_story_into_steps'),
      fact('f026_002_remainder_fraction', 0, '1/2 of the remainder', 'remainder', 'Use the remaining 4 parts as the new amount and split it into 2 groups.', 'track_remainder'),
      fact('f026_002_known_left', 1, '12 cm remained', 'quantity_known', 'Label the final remaining group as 12 cm.', 'work_backwards'),
      fact('f026_002_target', 2, 'original length', 'target_unknown', 'Find the full length before any ribbon was used.', 'work_backwards'),
    ],
    strategyTags: ['track_remainder', 'work_backwards', 'find_one_unit_first'],
    barModel: { denominator: 5, removed: 1, subdivideRemainingBy: 2, removedSubparts: 1, knownRemaining: '12 cm', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 5, removed: 1, subdivideRemainingBy: 2, removedSubparts: 1, knownRemaining: '12 cm' }),
    answer: { value: '30', display: '30' },
    workedSolution: ['After first cut, 4/5 remained.', 'Then half of remainder used, so half remained: 2/5 of original.', '2/5 = 12, so 1/5 = 6 and 5/5 = 30.'],
    mistakeTags: ['operation_mismatch', 'wrong_remaining_fraction', 'wrong_whole'],
    singaporeLevel: 'P6',
    steps: [
      { type: 'identify_question', prompt: 'Need to find:', choices: ['Remaining part only', 'Original total length'], correct: 'Original total length' },
      { type: 'identify_parts', prompt: 'After first cut, fraction left:', choices: ['1/5', '4/5', '5/4'], correct: '4/5' },
      { type: 'choose_operation', prompt: 'Then half of remainder is used. Fraction of original left?', choices: ['2/5', '4/10', 'both are equivalent'], correct: 'both are equivalent' },
      { type: 'compute_step', prompt: 'If 2/5 is 12, what is 1/5?', answer: { value: '6', display: '6' } },
      { type: 'final_answer', prompt: 'Original length is?', answer: { value: '30', display: '30' } },
      { type: 'reflection', prompt: 'What helped avoid mistakes?', choices: ['Track each remainder', 'Add denominators', 'Skip steps'], correct: 'Track each remainder' },
    ],
  },
  {
    storyId: 'STORY_F026_003',
    skillId: 'F026',
    officialSkillCode: 'F026',
    universalSkillSlug: 'fr.mastery-challenge',
    questionFamilyId: 'QF_F026_STORY_003',
    title: 'Reading Plan',
    prompt: 'Lina read 2/7 of a book on Monday, then 1/3 of the remaining pages on Tuesday. She had 30 pages left. How many pages in the book?',
    problemSchema: 'multi_step_sequence',
    schemaHint: 'Each action changes the remaining amount. Keep track of the remainder after each day.',
    needToFind: 'Total pages in the book',
    knownFacts: ['2/7 read on Monday', '1/3 of remaining pages read on Tuesday', '30 pages left'],
    keyFacts: [
      fact('f026_003_first_fraction', 0, '2/7', 'fraction_part', 'Shade 2 out of 7 parts for Monday.', 'break_story_into_steps'),
      fact('f026_003_remainder_fraction', 0, '1/3 of the remaining pages', 'remainder', 'Use the remaining 5/7 as the new amount and split it into 3 groups.', 'track_remainder'),
      fact('f026_003_known_left', 1, '30 pages left', 'quantity_known', 'Label the final remaining 10/21 as 30 pages.', 'work_backwards'),
      fact('f026_003_target', 2, 'How many pages in the book', 'target_unknown', 'Find the original whole book, not just the pages left.', 'work_backwards'),
    ],
    strategyTags: ['break_story_into_steps', 'track_remainder', 'work_backwards', 'use_equivalent_fractions'],
    barModel: { denominator: 7, removed: 2, subdivideRemainingBy: 3, removedSubparts: 1, knownRemaining: '30 pages', unknownWhole: true },
    modelSequence: buildModelSequence({ denominator: 7, removed: 2, subdivideRemainingBy: 3, removedSubparts: 1, knownRemaining: '30 pages' }),
    answer: { value: '63', display: '63' },
    workedSolution: ['After Monday: 5/7 left.', 'After Tuesday: 2/3 of remainder left.', '2/3 × 5/7 = 10/21 left. If 10/21 is 30, then 1/21 is 3 and total is 63.'],
    mistakeTags: ['did_not_work_backwards', 'calculation_error', 'wrong_remaining_fraction'],
    singaporeLevel: 'P6',
    steps: [
      { type: 'read_story', prompt: 'After Monday, fraction left is:', choices: ['2/7', '5/7', '7/5'], correct: '5/7' },
      { type: 'identify_parts', prompt: 'After Tuesday, fraction of the remainder left is:', choices: ['1/3', '2/3', '3/2'], correct: '2/3' },
      { type: 'compute_step', prompt: 'Fraction of original left is?', answer: { value: '10/21', display: '10/21' } },
      { type: 'choose_strategy', prompt: 'What should you do now?', choices: TRACK_REMAINDER_CHOICES, correct: TRACK_REMAINDER_CHOICES[0] },
      { type: 'final_answer', prompt: 'If 10/21 is 30, original pages = ?', answer: { value: '63', display: '63' } },
      { type: 'reflection', prompt: 'What to improve next?', choices: ['Multiply fractions carefully', 'Guess final answer', 'Skip remainder step'], correct: 'Multiply fractions carefully' },
    ],
  },
];

export function getFractionsStoryTemplatesBySkill(skillId) {
  const normalized = String(skillId || '').toUpperCase();
  return STORY_TEMPLATES.filter((s) => s.skillId === normalized);
}

export function buildFractionsStorySession({ skillId = 'F025', studentId = 'demo-student' } = {}) {
  const templates = getFractionsStoryTemplatesBySkill(skillId);
  const picked = templates.length ? templates[Math.floor(Math.random() * templates.length)] : STORY_TEMPLATES[0];
  const session = {
    sessionId: `story_${picked.storyId}_${Date.now()}`,
    studentId,
    sessionType: 'story',
    ...picked,
  };
  return {
    ...session,
    missionTitle: session.missionTitle || missionTitleFor(session),
    sceneItems: buildStorySceneItems(session),
  };
}

export function evaluateStoryStep({ step, answer }) {
  if (!step) return { correct: false, reason: 'missing_step' };
  if (Array.isArray(step.choices)) {
    const correct = String(answer || '').trim() === String(step.correct || '').trim();
    return { correct, expected: step.correct || null };
  }
  if (step.answer) {
    const checked = checkFractionAnswer({
      studentAnswer: answer,
      correctAnswer: step.answer,
      acceptedAnswers: [],
    });
    return { correct: checked.correct, expected: step.answer?.display || null };
  }
  return { correct: true, expected: null };
}

export function evaluateFractionsStorySession({ story, responses = [] }) {
  const byStep = new Map((responses || []).map((r) => [r.stepIndex, r]));
  const stepResults = (story?.steps || []).map((step, idx) => {
    const response = byStep.get(idx);
    const checked = evaluateStoryStep({ step, answer: response?.answer || '' });
    const isReflection = step.type === 'reflection';
    return {
      stepIndex: idx,
      type: step.type,
      prompt: step.prompt,
      answer: response?.answer || '',
      correct: isReflection ? true : checked.correct,
      expected: checked.expected,
      isReflection,
    };
  });

  const gradable = stepResults.filter((r) => !r.isReflection);
  const correctCount = gradable.filter((r) => r.correct).length;
  const accuracy = gradable.length ? Math.round((correctCount / gradable.length) * 100) : 0;
  const finalAnswerStep = stepResults.find((r) => r.type === 'final_answer');
  const finalCorrect = Boolean(finalAnswerStep?.correct);
  const mistakeTags = finalCorrect ? [] : (story?.mistakeTags || ['operation_mismatch']).slice(0, 3);
  return {
    storyId: story?.storyId,
    skillId: story?.skillId,
    officialSkillCode: story?.officialSkillCode || story?.skillId,
    universalSkillSlug: story?.universalSkillSlug || '',
    questionFamilyId: story?.questionFamilyId || '',
    sessionType: 'story',
    stepResults,
    accuracy,
    finalCorrect,
    mistakeTags,
    strategyUsed: responses.find((r) => r.type === 'choose_strategy')?.answer || null,
    workedSolution: story?.workedSolution || [],
  };
}

export function getStoryFeedback(result = {}) {
  if (result.finalCorrect) {
    return {
      tone: 'success',
      message: 'Great work. You solved the story step by step.',
    };
  }
  return {
    tone: 'review',
    message: 'Not quite. You found part of it, but the question asks for the starting whole. Try working backwards from the remaining fraction.',
  };
}

export function getStoryStepFeedback({ story = {}, scene = {}, correct = false, attempts = 1 } = {}) {
  if (correct) {
    return {
      tone: 'success',
      message: scene.successNarration || 'Good. This part of the story is solved.',
      revealSolution: false,
    };
  }
  return {
    tone: 'retry',
    message: attempts >= 2
      ? `${scene.errorHint || 'Check the fraction relationship again'} ${scene.retryPrompt || ''}`.trim()
      : scene.errorHint || 'Check the guided step and try again.',
    guidedStep: scene.guidedSteps?.[Math.min(attempts - 1, Math.max(0, (scene.guidedSteps?.length || 1) - 1))] || story.schemaHint || '',
    revealSolution: attempts >= 3,
    workedSolution: attempts >= 3 ? story.workedSolution || [] : [],
  };
}

export const FRACTIONS_STORY_SUPPORTED_SKILLS = new Set(['F025', 'F026']);
