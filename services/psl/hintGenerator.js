const STEP_HINTS = {
  understand: [
    "Read the story once more — what is happening? Who is involved?",
    "Think about what kind of action the story describes: combining, removing, comparing, or sharing?",
  ],
  identify_info: [
    "Look for all the numbers mentioned in the story — some might be hiding in words!",
    "Which numbers are directly useful for answering the question? Ignore any that describe something unrelated.",
  ],
  identify_question: [
    "Read the last sentence again — what exactly is the question asking you to find?",
    "Is the question asking for a total, a difference, a part, or how many of something?",
  ],
  plan: [
    "Think about what operation connects the numbers you found to the answer you need.",
    "Try drawing or picturing the problem — does it look like parts joining, a comparison, or something being shared?",
  ],
  solve: [
    "Write out the number sentence before calculating — make sure the numbers and operation are right.",
    "Work step by step. If there are two steps, finish the first one before starting the second.",
  ],
  check: [
    "Read the story one more time with your answer in mind — does it fit?",
    "Is your answer a reasonable size? Too big or too small for what the story describes?",
  ],
};

const HEURISTIC_HINTS = {
  'bar-model': {
    plan: [
      "Think about the bar model — are you looking for the whole bar, or a missing part?",
      "Draw two bars if you're comparing. The difference is the extra piece one bar has.",
    ],
    solve: [
      "In a part-whole model: parts add up to the whole. In a comparison model: subtract to find the difference.",
    ],
  },
  'before-after': {
    plan: [
      "What changed? Think about what happened between 'before' and 'after'.",
      "If something was added, the 'after' is bigger. If something was removed, it's smaller.",
    ],
  },
  'work-backwards': {
    plan: [
      "Start from the end result and undo each step — reverse the operations.",
      "Addition becomes subtraction, multiplication becomes division when going backwards.",
    ],
    solve: [
      "Write out each 'undo' step one at a time — don't try to do it all in your head.",
    ],
  },
  'guess-check': {
    plan: [
      "Pick a starting guess and check if it fits ALL the conditions in the story.",
      "If your guess is too high, try lower. If too low, try higher.",
    ],
    solve: [
      "Make a table: Guess → Check each condition → Does it work? Adjust and try again.",
    ],
  },
  'ratio': {
    plan: [
      "Count the total number of parts in the ratio first.",
      "Find what one part is worth by dividing the total by the number of parts.",
    ],
  },
  'assumption': {
    plan: [
      "Start by assuming all items are the same type — the simpler one.",
      "Compare your assumed total with the actual total to find the difference.",
    ],
    solve: [
      "Each swap changes the total by a fixed amount. Divide the total difference by the per-swap change.",
    ],
  },
  'excess-shortage': {
    plan: [
      "Compare the two distribution methods — what's the total excess plus shortage?",
    ],
  },
  'simultaneous': {
    plan: [
      "Write down the two pieces of information as equations.",
      "Can you subtract one equation from the other to cancel a variable?",
    ],
  },
  'pattern-recognition': {
    plan: [
      "Look at the differences between consecutive terms — is there a pattern?",
    ],
    solve: [
      "Once you know the rule, apply it step by step to reach the term you need.",
    ],
  },
  'data-interpretation': {
    identify_info: [
      "Look carefully at the chart labels and axes — what does each part represent?",
    ],
    solve: [
      "Double-check you're reading the right row, column, or bar from the data.",
    ],
  },
};

export function getHintsForStep(stepId, heuristic, hintsUsedCount = 0) {
  const generic = STEP_HINTS[stepId] || [];
  const heuristicKey = heuristic?.split(':')[0] || '';
  const specific = HEURISTIC_HINTS[heuristicKey]?.[stepId] || [];

  const combined = [...specific, ...generic];
  const unique = [...new Set(combined)];

  if (hintsUsedCount >= unique.length) {
    return { hint: null, totalAvailable: unique.length, exhausted: true };
  }

  return {
    hint: unique[hintsUsedCount],
    hintIndex: hintsUsedCount,
    totalAvailable: unique.length,
    exhausted: false,
  };
}
