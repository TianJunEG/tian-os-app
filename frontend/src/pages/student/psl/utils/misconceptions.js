const MISCONCEPTIONS = {
  'psl/missed-number': { label: 'Missed a number', category: 'Reading', tip: 'Re-read the story and underline every number before solving.', feedback: 'You missed an important number. Read the story again and underline every number.' },
  'psl/included-irrelevant': { label: 'Used an irrelevant number', category: 'Reading', tip: 'Not every number in the story is needed. Identify which ones answer the question.', feedback: 'One of the numbers you picked isn\'t needed for this problem. Re-read the question.' },
  'psl/misread-data': { label: 'Misread the data', category: 'Reading', tip: 'Read each value from the table or chart carefully. Check the scale and labels.', feedback: 'Check the data again — look at the labels and scale carefully.' },
  'psl/missed-ratio': { label: 'Missed the ratio', category: 'Reading', tip: 'Look for words like "ratio", "for every", or ":" — they signal a ratio.', feedback: 'There\'s a ratio in this problem that you need to identify first.' },
  'psl/missed-ratio-term': { label: 'Missed a ratio term', category: 'Reading', tip: 'A ratio has multiple parts. Make sure you\'ve identified all of them.', feedback: 'The ratio has more parts than you\'ve identified. Re-read to find them all.' },
  'psl/missed-fraction': { label: 'Missed the fraction', category: 'Reading', tip: 'Look for fraction words: "half", "quarter", "third", or fraction notation.', feedback: 'There\'s a fraction in this problem. Look for words like "half" or "quarter".' },
  'psl/missed-percentage': { label: 'Missed the percentage', category: 'Reading', tip: 'Look for the "%" sign or words like "percent" in the story.', feedback: 'This problem involves a percentage. Look for the % sign or "percent".' },
  'psl/missed-multiplier': { label: 'Missed the multiplier', category: 'Reading', tip: 'Words like "times as many", "double", "triple" tell you about multiplication.', feedback: 'There\'s a multiplier hiding in the story — look for "times", "double", or "triple".' },
  'psl/missed-step': { label: 'Missed a step', category: 'Reading', tip: 'This problem needs more than one step. Re-read to find all the information.', feedback: 'This is a multi-step problem. You may have skipped some information.' },
  'psl/confused-question': { label: 'Confused what is being asked', category: 'Understanding', tip: 'Focus on the last sentence — it usually tells you what to find.', feedback: 'Re-read the question carefully. The last sentence usually tells you what to find.' },
  'psl/misread-unknown': { label: 'Misread what\'s unknown', category: 'Understanding', tip: 'Identify which quantity is missing before choosing a method.', feedback: 'Check which quantity is unknown. Identify it before choosing your method.' },
  'psl/misidentified-unknown': { label: 'Misidentified the unknown', category: 'Understanding', tip: 'Circle the question word (How many? How much? What?) to find the unknown.', feedback: 'The unknown isn\'t what you think. Circle the question word to find it.' },
  'psl/wrong-model-type': { label: 'Wrong model type', category: 'Planning', tip: 'Are parts combining into a whole, or are we comparing two things?', feedback: 'Think again: are parts combining into a whole, or are we comparing two things?' },
  'psl/wrong-unknown-position': { label: 'Wrong unknown position', category: 'Planning', tip: 'Draw the model first, then place the "?" where the unknown goes.', feedback: 'The question mark should go where the unknown quantity is in the model.' },
  'psl/wrong-strategy': { label: 'Wrong strategy chosen', category: 'Planning', tip: 'Think about what the problem is asking before choosing a method.', feedback: 'That\'s not the best strategy for this problem. Think about what it\'s really asking.' },
  'psl/wrong-assumption': { label: 'Wrong assumption', category: 'Planning', tip: 'Check your assumption — does it match all the information given?', feedback: 'Your assumption doesn\'t match the problem. Re-read and check each condition.' },
  'psl/confused-excess-shortage': { label: 'Confused excess and shortage', category: 'Planning', tip: 'Excess means leftover. Shortage means not enough. Label them clearly.', feedback: 'Excess = leftover (too many). Shortage = not enough. Which is which here?' },
  'psl/excess-shortage-confusion': { label: 'Mixed up excess/shortage values', category: 'Planning', tip: 'Draw a diagram: one row for each distribution, mark excess or shortage.', feedback: 'Draw a diagram with both distributions side by side to see the excess and shortage.' },
  'psl/excess-shortage-mix': { label: 'Mixed excess-shortage formula', category: 'Planning', tip: 'Number = (excess + shortage) ÷ (difference per person).', feedback: 'Remember: Number = (excess + shortage) ÷ (difference per person).' },
  'psl/wrong-operation': { label: 'Wrong operation', category: 'Solving', tip: 'The model tells you which operation: whole = add parts, part = subtract from whole.', feedback: 'Think again: should you add, subtract, multiply, or divide?' },
  'psl/wrong-operation-choice': { label: 'Chose wrong operation', category: 'Solving', tip: 'Match the operation to the strategy. Ratio → divide then multiply.', feedback: 'The operation doesn\'t match the strategy. Think about what each step needs.' },
  'psl/reversed-operation': { label: 'Reversed the operation', category: 'Solving', tip: 'Should you add or subtract? Think about bigger vs smaller.', feedback: 'You used the opposite operation. Think about whether the answer should be bigger or smaller.' },
  'psl/reversed-steps': { label: 'Steps in wrong order', category: 'Solving', tip: 'Work through the problem step by step. The order matters!', feedback: 'The steps are in the wrong order. Think about which calculation comes first.' },
  'psl/division-direction-error': { label: 'Division direction wrong', category: 'Solving', tip: 'In division, the larger number usually goes first: total ÷ parts.', feedback: 'Check your division: total ÷ parts, not the other way around.' },
  'psl/arithmetic-error': { label: 'Arithmetic error', category: 'Solving', tip: 'Your method was right! Double-check the calculation.', feedback: 'Your method is correct, but check your calculation carefully.' },
  'psl/decimal-error': { label: 'Decimal error', category: 'Solving', tip: 'Line up the decimal points before calculating.', feedback: 'Watch the decimal points — line them up before you calculate.' },
  'psl/decimal-alignment': { label: 'Decimal alignment error', category: 'Solving', tip: 'When adding/subtracting decimals, align the decimal points vertically.', feedback: 'Align the decimal points vertically before adding or subtracting.' },
  'psl/used-wrong-numbers': { label: 'Used wrong numbers', category: 'Solving', tip: 'Check the numbers in your working match the numbers in the story.', feedback: 'Check you\'re using the right numbers from the story in your calculation.' },
  'psl/times-vs-more': { label: 'Confused "times" with "more"', category: 'Solving', tip: '"3 times as many" = multiply by 3. "3 more" = add 3.', feedback: '"Times as many" means multiply. "More than" means add. They\'re different!' },
  'psl/skipped-step': { label: 'Skipped a step', category: 'Solving', tip: 'This problem needs multiple steps. Check you haven\'t jumped ahead.', feedback: 'You skipped a step. This problem needs more than one calculation.' },
  'psl/fraction-error': { label: 'Fraction calculation error', category: 'Solving', tip: 'Same denominator to add/subtract, multiply across for multiplication.', feedback: 'Check your fraction work: same denominator to add/subtract, multiply across for ×.' },
  'psl/fraction-denom-error': { label: 'Denominator error', category: 'Solving', tip: 'Find a common denominator before adding fractions.', feedback: 'You need a common denominator before adding or subtracting fractions.' },
  'psl/fraction-invert': { label: 'Forgot to invert', category: 'Solving', tip: 'Dividing by a fraction? Flip it and multiply: a ÷ b/c = a × c/b.', feedback: 'To divide by a fraction, flip it and multiply instead.' },
  'psl/fraction-of-vs-subtract': { label: '"Fraction of" ≠ subtract', category: 'Solving', tip: '"1/3 of 12" means 12 ÷ 3 = 4, not 12 − 3 = 9.', feedback: '"Fraction of" means multiply or divide, not subtract.' },
  'psl/fraction-of-whole-error': { label: 'Wrong whole for fraction', category: 'Solving', tip: 'Check which number is the "whole" that the fraction applies to.', feedback: 'The fraction applies to a specific quantity. Check which one.' },
  'psl/fraction-of-wrong-whole': { label: 'Fraction of wrong amount', category: 'Solving', tip: 'The fraction applies to a specific quantity. Re-read to find which one.', feedback: 'You applied the fraction to the wrong number. Re-read the problem.' },
  'psl/percentage-error': { label: 'Percentage calculation error', category: 'Solving', tip: 'X% of a number: multiply by X, then divide by 100.', feedback: 'To find a percentage: multiply by the percentage, then divide by 100.' },
  'psl/percentage-conversion-error': { label: 'Percentage conversion error', category: 'Solving', tip: '25% = 0.25. Divide by 100 to convert.', feedback: 'To convert a percentage to a decimal, divide by 100 (e.g., 25% = 0.25).' },
  'psl/pct-decimal-error': { label: 'Percentage-decimal error', category: 'Solving', tip: '25% = 0.25. Move the decimal two places left.', feedback: 'Remember: to convert % to decimal, move the point two places left.' },
  'psl/percent-of-wrong-base': { label: 'Percentage of wrong base', category: 'Solving', tip: 'What is the "100%" amount? Apply the percentage to that.', feedback: 'You applied the percentage to the wrong amount. Find the "100%" value first.' },
  'psl/percentage-of-whole-error': { label: 'Wrong whole for percentage', category: 'Solving', tip: 'Find the original amount (100%) first.', feedback: 'Find the original amount first — that\'s your 100% — then calculate.' },
  'psl/ratio-error': { label: 'Ratio calculation error', category: 'Solving', tip: 'Find total parts first, then divide the total amount by it.', feedback: 'Find the total number of parts first, then divide to find one part.' },
  'psl/wrong-ratio-order': { label: 'Ratio terms in wrong order', category: 'Solving', tip: 'The order in a ratio matters: A:B ≠ B:A.', feedback: 'The order in a ratio matters! Match each name to its ratio number.' },
  'psl/forgot-total-parts': { label: 'Forgot to find total parts', category: 'Solving', tip: 'In ratio 3:2, total = 3+2 = 5. Find total parts first.', feedback: 'First add up all the ratio parts to get the total, then divide.' },
  'psl/ratio-total-units': { label: 'Wrong total units', category: 'Solving', tip: 'Add all ratio parts for total units, then find one unit\'s value.', feedback: 'Add all the ratio parts for the total units. Then find one unit\'s value.' },
  'psl/ratio-unit-error': { label: 'Ratio unit value wrong', category: 'Solving', tip: 'Value of 1 unit = total ÷ total parts. Check this.', feedback: 'Value of 1 unit = total amount ÷ total parts. Double-check this.' },
  'psl/ratio-fraction-confusion': { label: 'Confused ratio with fraction', category: 'Solving', tip: 'Ratio 3:2 = 3 and 2 parts (5 total). As fraction: 3/5.', feedback: 'Ratio and fraction are related but different. Ratio 3:2 means 3/5 and 2/5.' },
  'psl/ratio-percent-confusion': { label: 'Confused ratio with percentage', category: 'Solving', tip: 'Convert ratio to fraction first, then to percentage.', feedback: 'Convert the ratio to a fraction first, then to a percentage.' },
  'psl/unchanged-qty-confusion': { label: 'Confused the unchanged quantity', category: 'Solving', tip: 'Identify which quantity stays the same before and after.', feedback: 'One quantity doesn\'t change. Identify it and use it as your anchor.' },
  'psl/algebra-setup': { label: 'Algebra setup error', category: 'Solving', tip: 'Let the unknown be x. Write the equation from the story.', feedback: 'Set up the equation carefully. Let the unknown be x and translate the story.' },
  'psl/algebra-unit-error': { label: 'Algebra unit error', category: 'Solving', tip: 'Check all values use the same unit before solving.', feedback: 'Make sure all values use the same unit before solving the equation.' },
  'psl/unit-conversion-error': { label: 'Unit conversion error', category: 'Solving', tip: 'Convert all values to the same unit before calculating.', feedback: 'Convert all values to the same unit first, then calculate.' },
  'psl/unit-mismatch': { label: 'Unit mismatch', category: 'Solving', tip: 'The values use different units. Convert them to match.', feedback: 'The values use different units. Convert them to the same unit first.' },
  'psl/forgot-halving': { label: 'Forgot to halve', category: 'Solving', tip: 'This problem needs you to divide by 2 at the end.', feedback: 'Almost! You need to divide your answer by 2 for the final step.' },
  'psl/forgot-remainder-step': { label: 'Forgot the remainder step', category: 'Solving', tip: 'After the main calculation, there\'s one more step.', feedback: 'You\'re not done yet — there\'s one more step using what\'s left over.' },
  'psl/forgot-subtract': { label: 'Forgot to subtract', category: 'Solving', tip: 'You found a partial answer. Subtract for the final answer.', feedback: 'You found a partial answer. Remember to subtract to get the final answer.' },
  'psl/wrong-equation': { label: 'Wrong equation set up', category: 'Planning', tip: 'Translate the story into two equations \u2014 one per sentence with numbers.', feedback: 'Check your equations. Each condition in the story becomes one equation.' },
  'psl/elimination-error': { label: 'Elimination error', category: 'Solving', tip: 'To eliminate a variable, make its coefficients equal first, then subtract.', feedback: 'Make the coefficients match before subtracting the equations.' },
  'psl/substitution-error': { label: 'Substitution error', category: 'Solving', tip: 'After finding one variable, substitute it back into the original equation.', feedback: 'Substitute the value you found back into the other equation carefully.' },
  'psl/wrong-pattern-rule': { label: 'Wrong pattern rule', category: 'Planning', tip: 'Check the differences between consecutive terms \u2014 is the gap constant or changing?', feedback: 'Look at the differences between each pair of consecutive terms to find the rule.' },
  'psl/pattern-arithmetic-error': { label: 'Pattern calculation error', category: 'Solving', tip: 'Apply the rule carefully to each step.', feedback: 'You found the right rule but made a calculation error applying it.' },
  'psl/wrong-nth-term': { label: 'Wrong nth term', category: 'Solving', tip: 'Check: does your formula give the right answer for the terms you already know?', feedback: 'Verify your formula by checking it against the given terms.' },
  'psl/skipped-check': { label: 'Skipped the check', category: 'Checking', tip: 'Always ask: does my answer make sense in the story?', feedback: 'Always check: does your answer make sense in the context of the story?' },
};

export const CATEGORY_ORDER = ['Reading', 'Understanding', 'Planning', 'Solving', 'Checking'];

export function getMisconception(tag) {
  return MISCONCEPTIONS[tag] || {
    label: (tag || '').replace('psl/', '').replace(/-/g, ' '),
    category: 'Other',
    tip: '',
    feedback: 'Not quite right. Review your work and try again.',
  };
}

export function getFeedback(tag, isPartial) {
  const m = getMisconception(tag);
  if (isPartial) return `Almost! ${m.tip}`;
  return m.feedback;
}

export default MISCONCEPTIONS;