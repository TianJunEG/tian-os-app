const SCRIPTS = {
  'bar-model:partWhole:whole': {
    steps: [
      "Let's look at the numbers we're given — these are the parts.",
      "We need the total. In a part-whole model, the parts join to make the whole!",
      "Add the parts together to find the whole.",
    ],
    answer: "Well done! Always check — does the total make sense?",
  },
  'bar-model:partWhole:part': {
    steps: [
      "We know the whole and one part. Let's find the missing piece!",
      "In our bar model, the missing part is the gap between the whole and what we know.",
      "Subtract the known part from the whole.",
    ],
    answer: "Great! The missing part should be smaller than the whole.",
  },
  'bar-model:comparison': {
    steps: [
      "We're comparing two amounts. Which is bigger? Which is smaller?",
      "The difference is the extra bit that the larger bar has.",
      "Subtract the smaller from the larger to find the difference.",
    ],
    answer: "Nice work! The difference should always be positive.",
  },
  'bar-model:twoStep': {
    steps: [
      "This one needs two steps. Let's find the first piece of information.",
      "Now use that to figure out the next part.",
      "Combine your results to get the final answer.",
    ],
    answer: "Two steps, no problem! Does it all add up?",
  },
  'before-after:addition': {
    steps: [
      "Let's start with the 'before' — what we had at the beginning.",
      "Something was added — that's the change!",
      "Add the change to the before to get what we have now.",
    ],
    answer: "The after should be bigger than the before. Does it check out?",
  },
  'before-after:subtraction': {
    steps: [
      "Let's start with what we had at the beginning.",
      "Something was taken away or used up — that's the change.",
      "Subtract the change from the starting amount.",
    ],
    answer: "The answer should be smaller than what we started with!",
  },
  'work-backwards': {
    steps: [
      "We know how it ended. Let's work backwards to find the start!",
      "Undo the last thing that happened — reverse the operation.",
      "Keep going backwards — undo each step one at a time.",
    ],
    answer: "We've traced it all the way back to the beginning!",
  },
  'multi-step': {
    steps: [
      "This problem has a few steps. Let's break it down one at a time.",
      "Start with what we can work out right away.",
      "Now use that result to figure out the next part.",
    ],
    answer: "Step by step does it! Check your answer against the story.",
  },
  'guess-check': {
    steps: [
      "Let's use the given information to set up our approach.",
      "Work through the calculation step by step.",
      "Almost there — find the remaining value.",
    ],
    answer: "Check — do all the conditions in the story match?",
  },
  'ratio': {
    steps: [
      "Let's count the total number of parts in the ratio.",
      "Now divide the total by the number of parts to find what 1 part is worth.",
      "Multiply to find the actual amount for the group we need.",
    ],
    answer: "The ratio bar shows how the total is shared!",
  },
  'excess-shortage': {
    steps: [
      "We have two different ways to share out. Let's compare them.",
      "Add the excess and shortage to find the total difference.",
      "Divide by the difference per person to find the count.",
    ],
    answer: "Check — try both sharing methods with your answer!",
  },
  'simultaneous': {
    steps: [
      "Let's set up the two pieces of information as equations.",
      "Look — can we line them up to cancel out one unknown?",
      "Subtract or compare the equations to eliminate one variable.",
      "Now solve for the value we need.",
    ],
    answer: "Substitute back to double-check!",
  },
  'pattern-recognition': {
    steps: [
      "Let's look at the numbers in the sequence carefully.",
      "Can you spot the pattern? Look at the differences between terms.",
      "Use the rule to find the term we're looking for.",
    ],
    answer: "Check — does the rule work for all the terms we know?",
  },
  'assumption': {
    steps: [
      "Let's use the assumption method! First, let's assume all items are the same type.",
      "Now calculate the total under our assumption.",
      "Compare with the actual total — what's the difference?",
      "Each swap changes the total by a fixed amount. Divide the difference by the per-swap change!",
    ],
    answer: "The assumption method gives us a neat answer without any guessing!",
  },
  'assumption:animals': {
    steps: [
      "Let's assume all animals are the type with fewer legs.",
      "Calculate the total legs under our assumption.",
      "Now find the difference between assumed and actual legs.",
      "Each swap adds extra legs. Divide the difference by the extra legs per swap!",
    ],
    answer: "We found how many of each animal there are — no guessing needed!",
  },
  'data-interpretation': {
    steps: [
      "Let's look at the data — what does the chart or table show us?",
      "Read the values carefully. What numbers are given?",
      "Now use those values to answer the question — add, subtract, or compare.",
    ],
    answer: "Always double-check you read the right values from the data!",
  },
  'data-interpretation:dataTable': {
    steps: [
      "This is a table with rows and columns. Let's read the values we need.",
      "Find the right row or column for the question.",
      "Now do the calculation with the values you found.",
    ],
    answer: "Tables make it easy to find exact values — nice work!",
  },
  'data-interpretation:barChart': {
    steps: [
      "Look at the bar chart. Each bar represents a value — check the height!",
      "Read the scale on the left to find the exact numbers.",
      "Now calculate using the values from the bars.",
    ],
    answer: "Bar charts help us compare — the taller the bar, the bigger the value!",
  },
  'data-interpretation:lineGraph': {
    steps: [
      "A line graph shows how values change over time. Look at each point.",
      "Read the y-axis to find the exact value at each point.",
      "Now use those values to answer the question.",
    ],
    answer: "Line graphs show trends — going up means increasing, going down means decreasing!",
  },
  'data-interpretation:pieChart': {
    steps: [
      "This pie chart shows parts of a whole. Each slice is a percentage.",
      "Find the percentage for the category you need.",
      "Multiply the percentage by the total to get the actual number.",
    ],
    answer: "Remember — all the slices must add up to 100%!",
  },
  'assumption:scoring': {
    steps: [
      "Let's assume all answers are correct first.",
      "Calculate the maximum possible score.",
      "The gap between the maximum and actual score tells us something important.",
      "Each wrong answer costs you the gain PLUS the penalty. Divide the gap by this amount!",
    ],
    answer: "That's how many wrong answers there were!",
  },
};

export function getVoiceScripts(heuristic, structure, unknownPosition) {
  const keys = [
    `${heuristic}:${structure}:${unknownPosition}`,
    `${heuristic}:${structure}`,
    heuristic,
  ];
  for (const key of keys) {
    if (SCRIPTS[key]) return SCRIPTS[key];
  }
  return {
    steps: [
      "Let's look at what information the story gives us.",
      "Now let's work out the answer step by step.",
      "Almost there — put the pieces together.",
    ],
    answer: "Great work! Always double-check your answer.",
  };
}
