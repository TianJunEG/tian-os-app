import { checkFractionAnswer } from './fractionQuestionGenerator';

const STRATEGIES = [
  'Draw a bar model',
  'Work backwards',
  'Find the remaining fraction',
  'Find one unit first',
  'Use equivalent fractions',
  'Break the problem into parts',
];

const STORY_TEMPLATES = [
  {
    storyId: 'STORY_F025_001',
    skillId: 'F025',
    officialSkillCode: 'F025',
    universalSkillSlug: 'fr.exam-applications',
    questionFamilyId: 'QF_F025_STORY_001',
    title: 'Stickers and the Missing Whole',
    prompt: 'Ali gave away 2/5 of his stickers and had 18 left. How many did he have at first?',
    answer: { value: '30', display: '30' },
    workedSolution: [
      'Given away: 2/5, so left: 3/5.',
      'If 3/5 = 18, then 1/5 = 18 ÷ 3 = 6.',
      'So 5/5 = 6 × 5 = 30.',
    ],
    mistakeTags: ['wrong_whole', 'wrong_remaining_fraction', 'did_not_work_backwards'],
    singaporeLevel: 'P4',
    steps: [
      { type: 'read_story', prompt: 'Read the story carefully. What is the question asking?', choices: ['How many at first', 'How many given away'], correct: 'How many at first' },
      { type: 'identify_parts', prompt: 'What fraction is left?', choices: ['2/5', '3/5', '5/3'], correct: '3/5' },
      { type: 'choose_strategy', prompt: 'Pick a strategy.', choices: STRATEGIES, correct: 'Find one unit first' },
      { type: 'compute_step', prompt: 'If 3/5 is 18, what is 1/5?', answer: { value: '6', display: '6' } },
      { type: 'final_answer', prompt: 'So what is the total at first (5/5)?', answer: { value: '30', display: '30' } },
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
    answer: { value: '28', display: '28' },
    workedSolution: ['Left fraction is 3/4.', '3/4 = 21, so 1/4 = 7.', 'Total = 7 × 4 = 28.'],
    mistakeTags: ['confused_part_with_whole', 'wrong_remaining_fraction', 'operation_mismatch'],
    singaporeLevel: 'P4',
    steps: [
      { type: 'read_story', prompt: 'What do we need to find?', choices: ['Used amount only', 'Total at first'], correct: 'Total at first' },
      { type: 'identify_parts', prompt: 'What fraction remains?', choices: ['1/4', '3/4', '4/3'], correct: '3/4' },
      { type: 'choose_strategy', prompt: 'Which strategy fits best?', choices: STRATEGIES, correct: 'Find one unit first' },
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
    answer: { value: '40', display: '40' },
    workedSolution: ['Completed = 3/8, so blank = 5/8.', '5/8 = 25, so 1/8 = 5.', 'Total = 5 × 8 = 40.'],
    mistakeTags: ['wrong_remaining_fraction', 'calculation_error', 'wrong_whole'],
    singaporeLevel: 'P5',
    steps: [
      { type: 'identify_question', prompt: 'Find:', choices: ['Blank pages', 'Total pages'], correct: 'Total pages' },
      { type: 'identify_parts', prompt: 'Blank fraction is:', choices: ['3/8', '5/8', '8/5'], correct: '5/8' },
      { type: 'choose_strategy', prompt: 'Choose strategy.', choices: STRATEGIES, correct: 'Find one unit first' },
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
    answer: { value: '36', display: '36' },
    workedSolution: [
      'After spending 1/3, remaining is 2/3.',
      'Then 1/4 of remainder spent, so 3/4 of remainder left.',
      '3/4 of 2/3 = 1/2 of original. If 1/2 is 18, original is 36.',
    ],
    mistakeTags: ['did_not_work_backwards', 'wrong_remaining_fraction', 'added_fractions_instead_of_subtracting'],
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
    answer: { value: '63', display: '63' },
    workedSolution: ['After Monday: 5/7 left.', 'After Tuesday: 2/3 of remainder left.', '2/3 × 5/7 = 10/21 left. If 10/21 is 30, then 1/21 is 3 and total is 63.'],
    mistakeTags: ['did_not_work_backwards', 'calculation_error', 'wrong_remaining_fraction'],
    singaporeLevel: 'P6',
    steps: [
      { type: 'read_story', prompt: 'After Monday, fraction left is:', choices: ['2/7', '5/7', '7/5'], correct: '5/7' },
      { type: 'identify_parts', prompt: 'After Tuesday, fraction of the remainder left is:', choices: ['1/3', '2/3', '3/2'], correct: '2/3' },
      { type: 'compute_step', prompt: 'Fraction of original left is?', answer: { value: '10/21', display: '10/21' } },
      { type: 'choose_strategy', prompt: 'Best method now?', choices: STRATEGIES, correct: 'Find one unit first' },
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
  return {
    sessionId: `story_${picked.storyId}_${Date.now()}`,
    studentId,
    sessionType: 'story',
    ...picked,
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

export const FRACTIONS_STORY_SUPPORTED_SKILLS = new Set(['F025', 'F026']);

