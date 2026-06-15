// ---------------------------------------------------------------------------
// PSL Misconception Catalog
// Maps 57 misconception tags → { label, category, tip, feedback }
// ---------------------------------------------------------------------------

export const MISCONCEPTIONS = {
  // ── Reading (identify_info step) ──────────────────────────────────────────
  'psl/missed-number': {
    label: 'Missed a number',
    category: 'Reading',
    tip: 'Re-read the story and underline every number before solving.',
    feedback: 'You missed an important number in the story. Read it again carefully and underline every number.',
  },
  'psl/included-irrelevant': {
    label: 'Used an irrelevant number',
    category: 'Reading',
    tip: 'Not every number in the story is needed. Identify which ones answer the question.',
    feedback: 'You used a number that isn\'t needed for this problem. Go back and figure out which numbers actually matter.',
  },
  'psl/misread-data': {
    label: 'Misread the data',
    category: 'Reading',
    tip: 'Read each value from the table or chart carefully. Check the scale and labels.',
    feedback: 'You read a value incorrectly from the table or chart. Check the labels and scale again.',
  },
  'psl/missed-ratio': {
    label: 'Missed the ratio',
    category: 'Reading',
    tip: 'Look for words like \'ratio\', \'for every\', or \':\' — they signal a ratio relationship.',
    feedback: 'There\'s a ratio in this problem that you didn\'t spot. Look for words like "ratio", "for every", or the colon symbol.',
  },
  'psl/missed-ratio-term': {
    label: 'Missed a ratio term',
    category: 'Reading',
    tip: 'A ratio has multiple parts. Make sure you\'ve identified all of them.',
    feedback: 'You found the ratio but missed one of its parts. A ratio has multiple terms — make sure you\'ve got them all.',
  },
  'psl/missed-fraction': {
    label: 'Missed the fraction',
    category: 'Reading',
    tip: 'Look for fraction words: \'half\', \'quarter\', \'third\', or fraction notation.',
    feedback: 'There\'s a fraction in this problem that you didn\'t pick up. Look for words like "half", "quarter", or fraction notation.',
  },
  'psl/missed-percentage': {
    label: 'Missed the percentage',
    category: 'Reading',
    tip: 'Look for the \'%\' sign or words like \'percent\' in the story.',
    feedback: 'You missed a percentage in the story. Look for the "%" sign or the word "percent".',
  },
  'psl/missed-multiplier': {
    label: 'Missed the multiplier',
    category: 'Reading',
    tip: 'Words like \'times as many\', \'double\', \'triple\' tell you about multiplication.',
    feedback: 'You missed a multiplier in the problem. Words like "times as many", "double", or "triple" signal multiplication.',
  },
  'psl/missed-step': {
    label: 'Missed a step',
    category: 'Reading',
    tip: 'This problem needs more than one step. Re-read to find all the information.',
    feedback: 'This is a multi-step problem and you missed some information. Re-read the story to find everything you need.',
  },

  // ── Understanding (understand / identify_question steps) ──────────────────
  'psl/confused-question': {
    label: 'Confused what is being asked',
    category: 'Understanding',
    tip: 'Focus on the last sentence — it usually tells you what to find.',
    feedback: 'You got confused about what the question is asking. Focus on the last sentence — it usually tells you exactly what to find.',
  },
  'psl/misread-unknown': {
    label: 'Misread what\'s unknown',
    category: 'Understanding',
    tip: 'Identify which quantity is missing before choosing a method.',
    feedback: 'You misread which quantity is unknown. Before solving, figure out exactly which value is missing.',
  },
  'psl/misidentified-unknown': {
    label: 'Misidentified the unknown',
    category: 'Understanding',
    tip: 'Circle the question word (How many? How much? What?) to find the unknown.',
    feedback: 'You identified the wrong unknown. Circle the question word — "How many?", "How much?", "What?" — to find what you need to solve for.',
  },

  // ── Planning (plan step) ─────────────────────────────────────────────────
  'psl/wrong-model-type': {
    label: 'Wrong model type',
    category: 'Planning',
    tip: 'Are parts combining into a whole, or are we comparing two things?',
    feedback: 'You chose the wrong type of model. Think about whether parts are combining into a whole, or you\'re comparing two quantities.',
  },
  'psl/wrong-unknown-position': {
    label: 'Wrong unknown position',
    category: 'Planning',
    tip: 'Draw the model first, then place the \'?\' where the unknown goes.',
    feedback: 'You placed the unknown in the wrong spot. Draw out your model first, then put the "?" where the missing value belongs.',
  },
  'psl/wrong-strategy': {
    label: 'Wrong strategy chosen',
    category: 'Planning',
    tip: 'Think about what the problem is asking before choosing a method.',
    feedback: 'The strategy you picked doesn\'t fit this problem. Re-read the question and think about what method matches.',
  },
  'psl/wrong-assumption': {
    label: 'Wrong assumption made',
    category: 'Planning',
    tip: 'Check your assumption carefully — does it match all the information given?',
    feedback: 'You made an assumption that doesn\'t match the information in the problem. Check it against every detail given.',
  },
  'psl/confused-excess-shortage': {
    label: 'Confused excess and shortage',
    category: 'Planning',
    tip: 'Excess means leftover (too many). Shortage means not enough. Label them clearly.',
    feedback: 'You mixed up excess and shortage. Excess means there are leftovers; shortage means there aren\'t enough. Label each one clearly.',
  },
  'psl/excess-shortage-confusion': {
    label: 'Mixed up excess/shortage values',
    category: 'Planning',
    tip: 'Draw a diagram: one row for each distribution method, and mark excess or shortage.',
    feedback: 'You swapped the excess and shortage values. Draw a diagram with one row for each method, and label which is excess and which is shortage.',
  },
  'psl/excess-shortage-mix': {
    label: 'Mixed excess-shortage formula',
    category: 'Planning',
    tip: 'Remember: Number = (excess + shortage) ÷ (difference per person).',
    feedback: 'You mixed up the excess-shortage formula. Remember: Number = (excess + shortage) ÷ (difference per person).',
  },

  // ── Solving — operation errors ────────────────────────────────────────────
  'psl/wrong-operation': {
    label: 'Wrong operation',
    category: 'Solving',
    tip: 'The model tells you which operation to use: whole = add parts, part = subtract from whole.',
    feedback: 'You used the wrong operation. Look at your model: to find the whole, add the parts; to find a part, subtract from the whole.',
  },
  'psl/wrong-operation-choice': {
    label: 'Chose wrong operation',
    category: 'Solving',
    tip: 'Match the operation to the strategy: ratio problems use division then multiplication.',
    feedback: 'The operation you chose doesn\'t match the strategy. For example, ratio problems use division then multiplication.',
  },
  'psl/reversed-operation': {
    label: 'Reversed the operation',
    category: 'Solving',
    tip: 'Check: should you add or subtract? Multiply or divide? Think about what gets bigger or smaller.',
    feedback: 'You did the opposite operation. Think about whether the answer should be bigger or smaller than the numbers you started with.',
  },
  'psl/reversed-steps': {
    label: 'Steps in wrong order',
    category: 'Solving',
    tip: 'Work through the problem step by step. The order matters!',
    feedback: 'You did the steps in the wrong order. Go back and work through the problem one step at a time — the order matters.',
  },
  'psl/division-direction-error': {
    label: 'Division direction wrong',
    category: 'Solving',
    tip: 'In division, the larger number usually goes first: total ÷ parts, not parts ÷ total.',
    feedback: 'You divided the wrong way around. Remember: total ÷ parts, not parts ÷ total.',
  },

  // ── Solving — arithmetic errors ───────────────────────────────────────────
  'psl/arithmetic-error': {
    label: 'Arithmetic error',
    category: 'Solving',
    tip: 'Your method was right! Double-check the calculation or practise in MathPath.',
    feedback: 'Your method was correct, but there\'s a calculation mistake. Double-check your arithmetic step by step.',
  },
  'psl/decimal-error': {
    label: 'Decimal error',
    category: 'Solving',
    tip: 'Line up the decimal points before calculating.',
    feedback: 'You made a mistake with the decimals. Line up the decimal points before you add, subtract, or compare.',
  },
  'psl/decimal-alignment': {
    label: 'Decimal alignment error',
    category: 'Solving',
    tip: 'When adding or subtracting decimals, align the decimal points vertically.',
    feedback: 'Your decimal points weren\'t aligned. When working with decimals, write them so the decimal points line up vertically.',
  },

  // ── Solving — wrong numbers used ──────────────────────────────────────────
  'psl/used-wrong-numbers': {
    label: 'Used wrong numbers',
    category: 'Solving',
    tip: 'Check that the numbers in your working match the numbers in the story.',
    feedback: 'You used the wrong numbers in your calculation. Go back and check that your working matches the numbers in the story.',
  },
  'psl/times-vs-more': {
    label: "Confused 'times' with 'more'",
    category: 'Solving',
    tip: "'3 times as many' means multiply by 3. '3 more' means add 3. They are different!",
    feedback: 'You confused "times as many" with "more than". "3 times as many" means multiply by 3, but "3 more" means add 3.',
  },
  'psl/skipped-step': {
    label: 'Skipped a step',
    category: 'Solving',
    tip: 'This problem needs multiple steps. Check you haven\'t jumped ahead.',
    feedback: 'You skipped a step in this multi-step problem. Go back and make sure you haven\'t jumped ahead.',
  },

  // ── Solving — fraction errors ─────────────────────────────────────────────
  'psl/fraction-error': {
    label: 'Fraction calculation error',
    category: 'Solving',
    tip: 'Check: same denominator to add/subtract, multiply across for multiplication.',
    feedback: 'You made a mistake with fractions. Remember: same denominator to add/subtract, multiply across for multiplication.',
  },
  'psl/fraction-denom-error': {
    label: 'Denominator error',
    category: 'Solving',
    tip: 'When adding fractions, find a common denominator first.',
    feedback: 'You forgot to find a common denominator. Before adding or subtracting fractions, the denominators must match.',
  },
  'psl/fraction-invert': {
    label: 'Forgot to invert for division',
    category: 'Solving',
    tip: 'Dividing by a fraction? Flip it and multiply: a ÷ b/c = a × c/b.',
    feedback: 'When dividing by a fraction, you need to flip it and multiply. a ÷ b/c = a × c/b.',
  },
  'psl/fraction-of-vs-subtract': {
    label: "Used subtraction instead of 'fraction of'",
    category: 'Solving',
    tip: "'1/3 of 12' means 12 ÷ 3 = 4, not 12 − 3 = 9.",
    feedback: 'You subtracted instead of finding a fraction of the number. "1/3 of 12" means 12 ÷ 3 = 4, not 12 − 3 = 9.',
  },
  'psl/fraction-of-whole-error': {
    label: 'Wrong whole for fraction',
    category: 'Solving',
    tip: 'Check which number is the \'whole\' that the fraction applies to.',
    feedback: 'You applied the fraction to the wrong number. Re-read the problem to find which amount the fraction refers to.',
  },
  'psl/fraction-of-wrong-whole': {
    label: 'Fraction of wrong amount',
    category: 'Solving',
    tip: 'The fraction applies to a specific quantity. Re-read to find which one.',
    feedback: 'You took a fraction of the wrong amount. The fraction applies to a specific quantity — re-read to find which one.',
  },

  // ── Solving — percentage errors ───────────────────────────────────────────
  'psl/percentage-error': {
    label: 'Percentage calculation error',
    category: 'Solving',
    tip: 'To find X% of a number: multiply by X, then divide by 100.',
    feedback: 'You made a mistake with the percentage calculation. To find X% of a number: multiply by X, then divide by 100.',
  },
  'psl/percentage-conversion-error': {
    label: 'Percentage conversion error',
    category: 'Solving',
    tip: 'To convert a percentage to a decimal, divide by 100 (e.g., 25% = 0.25).',
    feedback: 'You converted the percentage incorrectly. Divide by 100 to get a decimal: 25% = 0.25.',
  },
  'psl/pct-decimal-error': {
    label: 'Percentage-decimal error',
    category: 'Solving',
    tip: '25% = 0.25, not 25. Move the decimal point two places left.',
    feedback: 'You forgot to convert the percentage to a decimal. 25% = 0.25, not 25 — move the decimal point two places left.',
  },
  'psl/percent-of-wrong-base': {
    label: 'Percentage of wrong base',
    category: 'Solving',
    tip: 'Check: what is the \'100%\' amount? The percentage should be applied to that.',
    feedback: 'You applied the percentage to the wrong base amount. Find the original "100%" quantity first.',
  },
  'psl/percentage-of-whole-error': {
    label: 'Wrong whole for percentage',
    category: 'Solving',
    tip: 'Find the original amount (100%) first, then calculate the percentage.',
    feedback: 'You used the wrong amount as the whole. Find the original amount that represents 100% first.',
  },
  'psl/percentage-of-wrong-base': {
    label: 'Percentage of wrong base',
    category: 'Solving',
    tip: 'Check: what is the \'100%\' amount? The percentage should be applied to that.',
    feedback: 'You applied the percentage to the wrong base amount. Find the original "100%" quantity first.',
  },

  // ── Solving — ratio errors ────────────────────────────────────────────────
  'psl/ratio-error': {
    label: 'Ratio calculation error',
    category: 'Solving',
    tip: 'Find the total number of parts first, then divide the total amount by it.',
    feedback: 'You made a ratio calculation error. Find the total number of parts first, then divide the total by that number.',
  },
  'psl/wrong-ratio-order': {
    label: 'Ratio terms in wrong order',
    category: 'Solving',
    tip: 'The order in a ratio matters: A:B is different from B:A. Match names to numbers.',
    feedback: 'You wrote the ratio terms in the wrong order. A:B is different from B:A — match each name to its number.',
  },
  'psl/forgot-total-parts': {
    label: 'Forgot to find total parts',
    category: 'Solving',
    tip: 'In ratio 3:2, total parts = 3+2 = 5. Find total parts before dividing.',
    feedback: 'You forgot to add the ratio parts together. In a ratio like 3:2, total parts = 3 + 2 = 5. Find total parts first.',
  },
  'psl/ratio-total-units': {
    label: 'Wrong total units',
    category: 'Solving',
    tip: 'Add all ratio parts to get total units, then find the value of one unit.',
    feedback: 'You got the total number of units wrong. Add all the ratio parts together, then find the value of one unit.',
  },
  'psl/ratio-unit-error': {
    label: 'Ratio unit value wrong',
    category: 'Solving',
    tip: 'Value of 1 unit = total amount ÷ total parts. Check this step.',
    feedback: 'You calculated the value of one unit incorrectly. Value of 1 unit = total amount ÷ total parts.',
  },
  'psl/ratio-fraction-confusion': {
    label: 'Confused ratio with fraction',
    category: 'Solving',
    tip: 'Ratio 3:2 means 3 parts and 2 parts (5 total). As a fraction, one part is 3/5.',
    feedback: 'You confused a ratio with a fraction. Ratio 3:2 means 3 parts and 2 parts (5 total). As a fraction, one share is 3/5.',
  },
  'psl/ratio-percent-confusion': {
    label: 'Confused ratio with percentage',
    category: 'Solving',
    tip: 'Convert the ratio to a fraction first, then to a percentage if needed.',
    feedback: 'You mixed up the ratio and percentage. Convert the ratio to a fraction first, then to a percentage if needed.',
  },
  'psl/unchanged-qty-confusion': {
    label: 'Confused the unchanged quantity',
    category: 'Solving',
    tip: 'Identify which quantity stays the same before and after the change.',
    feedback: 'You got confused about which quantity doesn\'t change. Identify what stays the same before and after.',
  },

  // ── Solving — algebra/unit errors ─────────────────────────────────────────
  'psl/algebra-setup': {
    label: 'Algebra setup error',
    category: 'Solving',
    tip: 'Let the unknown be a letter (e.g., x). Write the equation from the story.',
    feedback: 'You set up the equation incorrectly. Let the unknown be x, then translate the story into an equation step by step.',
  },
  'psl/algebra-unit-error': {
    label: 'Algebra unit error',
    category: 'Solving',
    tip: 'Check that all values use the same unit before solving the equation.',
    feedback: 'The values in your equation use different units. Convert everything to the same unit before solving.',
  },
  'psl/unit-conversion-error': {
    label: 'Unit conversion error',
    category: 'Solving',
    tip: 'Convert all values to the same unit before calculating.',
    feedback: 'You made a unit conversion mistake. Make sure all values are in the same unit before you calculate.',
  },
  'psl/unit-mismatch': {
    label: 'Unit mismatch',
    category: 'Solving',
    tip: 'The values use different units. Convert them to match before solving.',
    feedback: 'You\'re working with values in different units. Convert them to the same unit before doing any calculations.',
  },

  // ── Solving — other ───────────────────────────────────────────────────────
  'psl/forgot-halving': {
    label: 'Forgot to halve',
    category: 'Solving',
    tip: 'This problem needs you to divide by 2 at the end. Check if you did.',
    feedback: 'You forgot to divide by 2 at the end. This problem requires one final halving step.',
  },
  'psl/forgot-remainder-step': {
    label: 'Forgot the remainder step',
    category: 'Solving',
    tip: 'After the main calculation, there\'s one more step using the remainder.',
    feedback: 'You forgot the final step involving the remainder. After the main calculation, there\'s one more thing to do.',
  },
  'psl/forgot-subtract': {
    label: 'Forgot to subtract',
    category: 'Solving',
    tip: 'You found a partial answer. Remember to subtract to get the final answer.',
    feedback: 'You found a partial answer but forgot to subtract to get the final result. There\'s one more step.',
  },

  // ── Checking ──────────────────────────────────────────────────────────────
  'psl/wrong-equation': { label: 'Wrong equation set up', category: 'Planning', tip: 'Translate the story into two equations \u2014 one per sentence with numbers.', feedback: 'Check your equations. Each condition in the story becomes one equation.' },
  'psl/elimination-error': { label: 'Elimination error', category: 'Solving', tip: 'To eliminate a variable, make its coefficients equal first, then subtract.', feedback: 'Make the coefficients match before subtracting the equations.' },
  'psl/substitution-error': { label: 'Substitution error', category: 'Solving', tip: 'After finding one variable, substitute it back into the original equation.', feedback: 'Substitute the value you found back into the other equation carefully.' },
  'psl/wrong-pattern-rule': { label: 'Wrong pattern rule', category: 'Planning', tip: 'Check the differences between consecutive terms \u2014 is the gap constant or changing?', feedback: 'Look at the differences between each pair of consecutive terms to find the rule.' },
  'psl/pattern-arithmetic-error': { label: 'Pattern calculation error', category: 'Solving', tip: 'Apply the rule carefully to each step.', feedback: 'You found the right rule but made a calculation error applying it.' },
  'psl/wrong-nth-term': { label: 'Wrong nth term', category: 'Solving', tip: 'Check: does your formula give the right answer for the terms you already know?', feedback: 'Verify your formula by checking it against the given terms.' },
  'psl/skipped-check': {
    label: 'Skipped the check',
    category: 'Checking',
    tip: 'Always ask: does my answer make sense in the story?',
    feedback: 'You didn\'t check your answer. Always ask yourself: does this answer make sense in the context of the story?',
  },
};

// Category display order for UI grouping
export const CATEGORY_ORDER = ['Reading', 'Understanding', 'Planning', 'Solving', 'Checking'];

/**
 * Look up a misconception by tag. Returns a fallback entry for unknown tags.
 */
export function getMisconception(tag) {
  return MISCONCEPTIONS[tag] || {
    label: tag.replace('psl/', '').replace(/-/g, ' '),
    category: 'Other',
    tip: '',
    feedback: 'Not quite right. Review your work and try again.',
  };
}

/**
 * Return the appropriate feedback string for a misconception tag.
 * @param {string}  tag       – misconception tag, e.g. 'psl/arithmetic-error'
 * @param {boolean} isPartial – true when the student was partially correct
 */
export function getFeedback(tag, isPartial) {
  const m = getMisconception(tag);
  if (isPartial) return `Almost! ${m.tip}`;
  return m.feedback;
}

/**
 * Return structured feedback with an optional worked example and remediation hint.
 * The extra `vars` object is provided by the step evaluator so feedback can
 * reference specific numbers from the problem (not used in the base catalog, but
 * kept available for richer misconception entries in future).
 *
 * @param {string}  tag       – misconception tag
 * @param {boolean} isPartial – true when the student was partially correct
 * @param {object}  vars      – problem variables for template interpolation (ignored by base catalog)
 * @returns {{ feedback: string, workedExample: string|null, remediation: string|null }}
 */
export function getDetailedFeedback(tag, isPartial, vars = {}) {
  const m = getMisconception(tag);
  return {
    feedback: isPartial ? `Almost! ${m.tip}` : m.feedback,
    workedExample: m.workedExample || null,
    remediation: m.tip || null,
  };
}

const COUNTER_EXAMPLES = {
  'psl/arithmetic-error': (vars) => {
    if (vars.expression) return { title: 'Check your arithmetic', steps: [`The expression is: ${vars.expression}`, `Work it out step by step to get: ${vars.answer}`] };
    return null;
  },
  'psl/wrong-operation': (vars) => {
    const opWord = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
    if (vars.operation) return { title: 'Which operation?', steps: [`The story tells us to ${opWord[vars.operation] || vars.operation}.`, 'Clue words like "altogether" mean add, "left" means subtract, "each" means divide, "times" means multiply.'] };
    return null;
  },
  'psl/forgot-total-parts': (vars) => {
    if (vars.givenNumbers?.length >= 2) {
      const parts = vars.givenNumbers;
      const total = parts.reduce((a, b) => a + b, 0);
      return { title: 'Ratio parts', steps: [`Ratio parts: ${parts.join(' + ')} = ${total} total parts`, `Value of 1 part = total amount / ${total}`, 'Then multiply by the part you need.'] };
    }
    return null;
  },
  'psl/wrong-model-type': () => ({
    title: 'Choosing a model',
    steps: ['Part-whole: "altogether", "in total", "how many left"', 'Comparison: "more than", "fewer than", "difference"', 'Match the story words to the right model.'],
  }),
  'psl/wrong-unknown-position': (vars) => {
    if (vars.unknownPosition) return { title: 'Where does the ? go?', steps: [`In this problem, the unknown is the ${vars.unknownPosition}.`, 'Draw the model with all known values, then put "?" in the empty spot.'] };
    return null;
  },
  'psl/wrong-strategy': (vars) => {
    if (vars.heuristic) {
      const names = { 'bar-model': 'Bar Model', 'before-after': 'Before-After', 'work-backwards': 'Work Backwards', 'guess-check': 'Guess & Check', ratio: 'Ratio', assumption: 'Assumption', 'excess-shortage': 'Excess-Shortage', simultaneous: 'Simultaneous Equations', 'pattern-recognition': 'Pattern Recognition' };
      return { title: 'Right strategy', steps: [`This problem uses: ${names[vars.heuristic] || vars.heuristic}`, 'Open the Decision Guide if you are not sure why.'] };
    }
    return null;
  },
  'psl/used-wrong-numbers': (vars) => {
    if (vars.givenNumbers?.length) return { title: 'Correct numbers', steps: [`The numbers you need from the story are: ${vars.givenNumbers.join(', ')}`, 'Cross-check each number in your working against the story.'] };
    return null;
  },
  'psl/confused-question': () => ({
    title: 'Finding the question',
    steps: ['Look for the sentence ending with "?"', 'The answer to that sentence is what you need to find.', 'Circle the question word: How many? How much? What?'],
  }),
  'psl/missed-number': (vars) => {
    if (vars.givenNumbers?.length) return { title: 'All the clues', steps: [`This problem has ${vars.givenNumbers.length} important numbers.`, 'Re-read each sentence and underline every number you see.'] };
    return null;
  },
  'psl/skipped-check': (vars) => {
    if (vars.answer != null) return { title: 'Checking your answer', steps: [`Your answer is ${vars.answer}.`, 'Put it back into the story — does every sentence still make sense?', 'If something sounds wrong, go back and fix it.'] };
    return { title: 'Always check', steps: ['Put your answer back into the story.', 'Read it aloud — does it make sense?'] };
  },
  'psl/division-direction-error': (vars) => {
    if (vars.givenNumbers?.length >= 2) return { title: 'Division direction', steps: [`Divide the bigger number by the smaller: ${Math.max(...vars.givenNumbers)} / ${Math.min(...vars.givenNumbers)}`, 'Total / groups = group size, not the other way around.'] };
    return null;
  },
};

/**
 * Return detailed feedback with optional worked counter-example and remediation.
 */
export function getDetailedFeedback(tag, isPartial, vars = {}) {
  const feedback = getFeedback(tag, isPartial);
  const generator = COUNTER_EXAMPLES[tag];
  const workedExample = generator ? generator(vars) : null;
  const m = getMisconception(tag);
  const remediation = !isPartial && m.tip ? m.tip : null;
  const result = { feedback };
  if (workedExample) result.workedExample = workedExample;
  if (remediation) result.remediation = remediation;
  return result;
}
