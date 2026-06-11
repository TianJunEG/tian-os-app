// Template factory — builds full PSL problem templates from compact definitions.
// Used by seed scripts to reduce boilerplate.

export function barModelScaffold({ understand, questionChoices, modelType, unknownPosition, solveType, solveSpec }) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understand },
    identify_info: solveSpec.highlight || { type: 'highlight', expected: [] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'model', modelType, unknownPosition },
    solve: solveType === 'twoStep' ? {
      type: 'twoStep',
      steps: solveSpec.steps,
      answer: solveSpec.answer,
    } : {
      type: 'expression',
      operation: solveSpec.operation,
      expression: solveSpec.expression,
      answer: solveSpec.answer,
    },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

export function strategyScaffold({ understand, questionChoices, strategyChoices, solveType, solveSpec }) {
  return {
    understand: { type: 'mc', prompt: 'What is this story about?', correctIndex: 0, choices: understand },
    identify_info: solveSpec.highlight || { type: 'highlight', expected: [] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'What strategy should we use?', correctIndex: 0, choices: strategyChoices },
    solve: solveType === 'twoStep' ? {
      type: 'twoStep',
      steps: solveSpec.steps,
      answer: solveSpec.answer,
    } : {
      type: 'expression',
      operation: solveSpec.operation,
      expression: solveSpec.expression,
      answer: solveSpec.answer,
    },
    check: { type: 'reasonableness', prompt: 'Is your answer reasonable?' },
  };
}

export function makeTemplate(id, skillId, structure, opts) {
  return {
    templateId: id,
    skillId,
    heuristic: opts.heuristic || 'bar-model',
    structure,
    unknownPosition: opts.unknownPosition || '',
    operations: opts.operations || [],
    difficulty: opts.difficulty || 1,
    contexts: opts.contexts,
    constraints: opts.constraints,
    storyTemplate: opts.storyTemplate || opts.story,
    solutionTemplate: opts.solutionTemplate || '',
    scaffold: opts.scaffold,
    misconceptions: opts.misconceptions || {},
  };
}
