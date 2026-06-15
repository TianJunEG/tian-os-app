const STEP_HINTS = {
  understand: [
    { title: 'Read again', text: 'Read the story once more — what is happening? Who is involved?' },
    { title: 'What kind of action?', text: 'Think about what kind of action the story describes: combining, removing, comparing, or sharing?' },
  ],
  identify_info: [
    { title: 'Find the numbers', text: 'Look for all the numbers mentioned in the story — some might be hiding in words!' },
    { title: 'Which ones matter?', text: 'Which numbers are directly useful for answering the question? Ignore any that describe something unrelated.' },
  ],
  identify_question: [
    { title: 'Read the last sentence', text: 'Read the last sentence again — what exactly is the question asking you to find?' },
    { title: 'What type of answer?', text: 'Is the question asking for a total, a difference, a part, or how many of something?' },
  ],
  plan: [
    { title: 'Which operation?', text: 'Think about what operation connects the numbers you found to the answer you need.' },
    { title: 'Picture it', text: 'Try drawing or picturing the problem — does it look like parts joining, a comparison, or something being shared?' },
  ],
  solve: [
    { title: 'Write it out', text: 'Write out the number sentence before calculating — make sure the numbers and operation are right.' },
    { title: 'Step by step', text: 'Work step by step. If there are two steps, finish the first one before starting the second.' },
  ],
  check: [
    { title: 'Re-read with your answer', text: 'Read the story one more time with your answer in mind — does it fit?' },
    { title: 'Reasonable size?', text: 'Is your answer a reasonable size? Too big or too small for what the story describes?' },
  ],
};

const HEURISTIC_HINTS = {
  'bar-model': {
    plan: [
      { title: 'Bar model hint', text: 'Think about the bar model — are you looking for the whole bar, or a missing part?' },
      { title: 'Compare bars', text: 'Draw two bars if you are comparing. The difference is the extra piece one bar has.' },
    ],
    solve: [
      { title: 'Bar model operations', text: 'In a part-whole model: parts add up to the whole. In a comparison model: subtract to find the difference.' },
    ],
  },
  'before-after': {
    plan: [
      { title: 'What changed?', text: 'What changed? Think about what happened between before and after.' },
      { title: 'Bigger or smaller?', text: 'If something was added, the after is bigger. If something was removed, it is smaller.' },
    ],
  },
  'work-backwards': {
    plan: [
      { title: 'Start from the end', text: 'Start from the end result and undo each step — reverse the operations.' },
      { title: 'Reverse operations', text: 'Addition becomes subtraction, multiplication becomes division when going backwards.' },
    ],
    solve: [
      { title: 'Write each undo step', text: 'Write out each undo step one at a time — do not try to do it all in your head.' },
    ],
  },
  'guess-check': {
    plan: [
      { title: 'Pick a starting guess', text: 'Pick a starting guess and check if it fits ALL the conditions in the story.' },
      { title: 'Adjust your guess', text: 'If your guess is too high, try lower. If too low, try higher.' },
    ],
    solve: [
      { title: 'Make a table', text: 'Make a table: Guess then Check each condition then Does it work? Adjust and try again.' },
    ],
  },
  ratio: {
    plan: [
      { title: 'Total parts', text: 'Count the total number of parts in the ratio first.' },
      { title: 'One part value', text: 'Find what one part is worth by dividing the total by the number of parts.' },
    ],
  },
  assumption: {
    plan: [
      { title: 'Assume all same', text: 'Start by assuming all items are the same type — the simpler one.' },
      { title: 'Find the difference', text: 'Compare your assumed total with the actual total to find the difference.' },
    ],
    solve: [
      { title: 'Per-swap change', text: 'Each swap changes the total by a fixed amount. Divide the total difference by the per-swap change.' },
    ],
  },
  'excess-shortage': {
    plan: [
      { title: 'Compare methods', text: 'Compare the two distribution methods — what is the total excess plus shortage?' },
    ],
  },
  simultaneous: {
    plan: [
      { title: 'Write equations', text: 'Write down the two pieces of information as equations.' },
      { title: 'Eliminate a variable', text: 'Can you subtract one equation from the other to cancel a variable?' },
    ],
  },
  'pattern-recognition': {
    plan: [
      { title: 'Look for patterns', text: 'Look at the differences between consecutive terms — is there a pattern?' },
    ],
    solve: [
      { title: 'Apply the rule', text: 'Once you know the rule, apply it step by step to reach the term you need.' },
    ],
  },
  'data-interpretation': {
    identify_info: [
      { title: 'Read the chart', text: 'Look carefully at the chart labels and axes — what does each part represent?' },
    ],
    solve: [
      { title: 'Double-check your reading', text: 'Double-check you are reading the right row, column, or bar from the data.' },
    ],
  },
};

const MISCONCEPTION_HINTS = {
  'psl/missed-number': [
    { title: 'Nudge', text: 'One of the important numbers is still hiding in the story.' },
    { title: 'Clue', text: 'Numbers can appear as words or inside phrases. Scan every sentence.' },
    { title: 'Reveal', text: 'Underline every number in the story, then cross out the ones not needed.' },
  ],
  'psl/included-irrelevant': [
    { title: 'Nudge', text: 'One of the numbers you picked is a distractor.' },
    { title: 'Clue', text: 'Re-read the question. Which numbers connect directly to what you need to find?' },
    { title: 'Reveal', text: 'For each number ask: Do I need this to answer the question? Remove background info.' },
  ],
  'psl/confused-question': [
    { title: 'Nudge', text: 'The question is hiding in the last line of the story.' },
    { title: 'Clue', text: 'Look for question words: How many? How much? What is?' },
    { title: 'Reveal', text: 'Underline the sentence with the question mark. That is what you need to find.' },
  ],
  'psl/wrong-model-type': [
    { title: 'Nudge', text: 'Think about whether the story is about combining parts or comparing two things.' },
    { title: 'Clue', text: 'Combining/removing = part-whole model. Comparing = comparison model.' },
    { title: 'Reveal', text: 'If the story says "in total" or "altogether", use part-whole. "More than" or "fewer than" = comparison.' },
  ],
  'psl/wrong-unknown-position': [
    { title: 'Nudge', text: 'Where does the mystery number go in your model?' },
    { title: 'Clue', text: 'The unknown is the value the question asks you to find. Put the ? there.' },
    { title: 'Reveal', text: 'Draw your model with all known numbers in place. The empty spot is where the ? goes.' },
  ],
  'psl/wrong-strategy': [
    { title: 'Nudge', text: 'Re-read the problem — does this strategy really match?' },
    { title: 'Clue', text: 'Is something being combined, taken away, compared, or shared?' },
    { title: 'Reveal', text: 'Open the Decision Guide to match the story type to the right strategy.' },
  ],
  'psl/wrong-operation': [
    { title: 'Nudge', text: 'Your model is right, but the operation does not match it.' },
    { title: 'Clue', text: 'Finding the whole = add. Finding a part = subtract. Equal groups = multiply or divide.' },
    { title: 'Reveal', text: 'If the ? is the whole, add the parts. If the ? is a part, subtract the known part from the whole.' },
  ],
  'psl/arithmetic-error': [
    { title: 'Nudge', text: 'Your method is spot on — but the calculation has a small slip.' },
    { title: 'Clue', text: 'Redo the arithmetic slowly, writing each step down.' },
    { title: 'Reveal', text: 'Try the calculation again from scratch. Check each step before moving to the next.' },
  ],
  'psl/used-wrong-numbers': [
    { title: 'Nudge', text: 'One of the numbers in your working does not match the story.' },
    { title: 'Clue', text: 'Write down only the numbers you need, then start your calculation with those.' },
    { title: 'Reveal', text: 'Cross-check every number in your working against the story.' },
  ],
  'psl/forgot-total-parts': [
    { title: 'Nudge', text: 'You jumped straight to the answer, but missed the first step with the ratio.' },
    { title: 'Clue', text: 'In a ratio like 3:2, there are 3+2=5 total parts. Find the total parts first.' },
    { title: 'Reveal', text: 'Step 1: Add ratio parts. Step 2: Divide total by parts. Step 3: Multiply by the part you need.' },
  ],
  'psl/skipped-check': [
    { title: 'Nudge', text: 'Do not skip this step! Checking catches silly mistakes.' },
    { title: 'Clue', text: 'Put your answer back into the story. Does every sentence still make sense?' },
    { title: 'Reveal', text: 'Read the story aloud replacing the unknown with your answer.' },
  ],
};

function interpolate(text, vars) {
  if (!text || !vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
}

function interpolateHint(hint, vars) {
  if (!hint || !vars) return hint;
  return {
    ...hint,
    text: interpolate(hint.text, vars),
    steps: hint.steps?.map((s) => interpolate(s, vars)),
  };
}

export function getHintsForStep(stepId, heuristic, hintsUsedCount = 0, options = {}) {
  const { misconceptionTag, problemVars } = options;
  const heuristicKey = heuristic?.split(':')[0] || '';

  if (misconceptionTag && MISCONCEPTION_HINTS[misconceptionTag]) {
    const hints = MISCONCEPTION_HINTS[misconceptionTag];
    if (hintsUsedCount >= hints.length) {
      return { hint: null, totalAvailable: hints.length, exhausted: true };
    }
    const hint = interpolateHint(hints[hintsUsedCount], problemVars);
    return { hint, hintIndex: hintsUsedCount, totalAvailable: hints.length, exhausted: false };
  }

  const specific = HEURISTIC_HINTS[heuristicKey]?.[stepId] || [];
  const generic = STEP_HINTS[stepId] || [];
  const combined = [...specific, ...generic];

  if (hintsUsedCount >= combined.length) {
    return { hint: null, totalAvailable: combined.length, exhausted: true };
  }

  const hint = interpolateHint(combined[hintsUsedCount], problemVars);
  return { hint, hintIndex: hintsUsedCount, totalAvailable: combined.length, exhausted: false };
}
