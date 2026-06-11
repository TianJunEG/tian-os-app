import { getSkill } from './p6AlgebraSkillGraph.js';
import { getQuestionFamiliesBySkill } from './p6AlgebraQuestionFamilies.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* ------------------------------------------------------------------ */
/*  P6-ALG-01 — Forming Algebraic Expressions                        */
/* ------------------------------------------------------------------ */

const NAMES = ['Ali', 'Mei', 'Ravi', 'Sarah', 'Tom', 'Lina', 'Wei', 'Priya', 'Hafiz', 'Siti'];
const ITEMS_PRICED = [
  { singular: 'book', plural: 'books' },
  { singular: 'pen', plural: 'pens' },
  { singular: 'notebook', plural: 'notebooks' },
  { singular: 'ruler', plural: 'rulers' },
  { singular: 'eraser', plural: 'erasers' },
  { singular: 'folder', plural: 'folders' },
  { singular: 'marker', plural: 'markers' },
];

function generateExpression(familyId) {
  if (familyId.endsWith('_001')) {
    // Simple one-variable expression from a shopping / quantity context
    const item = pick(ITEMS_PRICED);
    const pricePerItem = randInt(2, 9);
    const varLetter = pick(['n', 'x', 'y', 'k']);
    const templates = [
      {
        prompt: `${pick(NAMES)} buys ${varLetter} ${item.plural} at $${pricePerItem} each. Write an expression for the total cost.`,
        answer: `${pricePerItem}${varLetter}`,
        solutionText: `Each ${item.singular} costs $${pricePerItem}. For ${varLetter} ${item.plural}, total cost = ${pricePerItem} × ${varLetter} = ${pricePerItem}${varLetter}.`,
      },
      {
        prompt: `${pick(NAMES)} has $${pricePerItem * 10} and buys ${varLetter} ${item.plural} at $${pricePerItem} each. Write an expression for the amount of money left.`,
        answer: `${pricePerItem * 10} - ${pricePerItem}${varLetter}`,
        solutionText: `Money left = ${pricePerItem * 10} - (${pricePerItem} × ${varLetter}) = ${pricePerItem * 10} - ${pricePerItem}${varLetter}.`,
      },
      {
        prompt: `A ${item.singular} costs $${varLetter}. ${pick(NAMES)} buys ${pricePerItem} of them. Write an expression for the total cost.`,
        answer: `${pricePerItem}${varLetter}`,
        solutionText: `Total cost = ${pricePerItem} × ${varLetter} = ${pricePerItem}${varLetter}.`,
      },
    ];
    const t = pick(templates);
    return {
      skillId: 'P6-ALG-01', questionFamilyId: familyId,
      prompt: t.prompt, answer: t.answer, answerType: 'text',
      instructionHint: 'Use the letter to represent the unknown. Write the expression using numbers and the letter.',
      solutionText: t.solutionText,
      misconceptionTraps: ['confuses_variable_with_label', 'confuses_expression_and_equation'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Simplify like terms
    const varLetter = pick(['x', 'y', 'n', 'p']);
    const a = randInt(2, 8);
    const b = randInt(1, 7);
    const c = randInt(1, 9);
    const templates = [
      {
        prompt: `Simplify: ${a}${varLetter} + ${b}${varLetter} + ${c}`,
        answer: `${a + b}${varLetter} + ${c}`,
        solutionText: `${a}${varLetter} + ${b}${varLetter} = ${a + b}${varLetter} (add like terms). The constant ${c} stays. Answer: ${a + b}${varLetter} + ${c}.`,
      },
      {
        prompt: `Simplify: ${a}${varLetter} + ${c} + ${b}${varLetter}`,
        answer: `${a + b}${varLetter} + ${c}`,
        solutionText: `Collect like terms: ${a}${varLetter} + ${b}${varLetter} = ${a + b}${varLetter}. Answer: ${a + b}${varLetter} + ${c}.`,
      },
      {
        prompt: `Simplify: ${a + b + 1}${varLetter} - ${b}${varLetter} + ${c}`,
        answer: `${a + 1}${varLetter} + ${c}`,
        solutionText: `${a + b + 1}${varLetter} - ${b}${varLetter} = ${a + 1}${varLetter}. Answer: ${a + 1}${varLetter} + ${c}.`,
      },
    ];
    const t = pick(templates);
    return {
      skillId: 'P6-ALG-01', questionFamilyId: familyId,
      prompt: t.prompt, answer: t.answer, answerType: 'text',
      instructionHint: 'Combine terms that have the same variable. Constants (plain numbers) stay separate.',
      solutionText: t.solutionText,
      misconceptionTraps: ['adds_unlike_terms'],
    };
  }

  // _003: Multi-part expression from context
  const varLetter = pick(['n', 'x', 'p', 'w']);
  const name1 = pick(NAMES);
  const name2 = pick(NAMES.filter((n) => n !== name1));
  const baseQty = randInt(2, 6);
  const extraQty = randInt(1, 5);
  const priceA = randInt(2, 8);
  const priceB = randInt(1, 5);
  const templates = [
    {
      prompt: `${name1} buys ${baseQty} ${pick(ITEMS_PRICED).plural} at $${varLetter} each and ${extraQty} ${pick(ITEMS_PRICED).plural} at $${priceB} each. Write an expression for the total cost.`,
      answer: `${baseQty}${varLetter} + ${extraQty * priceB}`,
      solutionText: `Cost of first items = ${baseQty} × ${varLetter} = ${baseQty}${varLetter}. Cost of second items = ${extraQty} × ${priceB} = ${extraQty * priceB}. Total = ${baseQty}${varLetter} + ${extraQty * priceB}.`,
    },
    {
      prompt: `${name1} has ${varLetter} stickers. ${name2} has ${baseQty} times as many stickers as ${name1} plus ${extraQty} more. Write an expression for the number of stickers ${name2} has.`,
      answer: `${baseQty}${varLetter} + ${extraQty}`,
      solutionText: `${baseQty} times ${varLetter} = ${baseQty}${varLetter}. Plus ${extraQty} more = ${baseQty}${varLetter} + ${extraQty}.`,
    },
    {
      prompt: `A rectangular garden is ${varLetter} m long and ${baseQty} m wide. Write an expression for its perimeter.`,
      answer: `2${varLetter} + ${baseQty * 2}`,
      solutionText: `Perimeter = 2 × length + 2 × width = 2 × ${varLetter} + 2 × ${baseQty} = 2${varLetter} + ${baseQty * 2}.`,
    },
  ];
  const t = pick(templates);
  return {
    skillId: 'P6-ALG-01', questionFamilyId: familyId,
    prompt: t.prompt, answer: t.answer, answerType: 'text',
    instructionHint: 'Identify each part, write each as an expression, then combine.',
    solutionText: t.solutionText,
    misconceptionTraps: ['confuses_variable_with_label', 'adds_unlike_terms'],
  };
}

/* ------------------------------------------------------------------ */
/*  P6-ALG-02 — Solving Linear Equations                              */
/* ------------------------------------------------------------------ */

function generateEquation(familyId) {
  const varLetter = pick(['x', 'y', 'n', 'p']);

  if (familyId.endsWith('_001')) {
    // One-step equations: x + a = b, a*x = b, x - a = b, x/a = b
    const subType = randInt(1, 4);
    if (subType === 1) {
      const answer = randInt(3, 20);
      const addend = randInt(2, 15);
      const total = answer + addend;
      return {
        skillId: 'P6-ALG-02', questionFamilyId: familyId,
        prompt: `Solve: ${varLetter} + ${addend} = ${total}`,
        answer, answerType: 'number',
        instructionHint: `To find ${varLetter}, subtract ${addend} from both sides.`,
        solutionText: `${varLetter} + ${addend} = ${total}. ${varLetter} = ${total} - ${addend} = ${answer}.`,
        misconceptionTraps: ['forgets_inverse_operation'],
      };
    }
    if (subType === 2) {
      const answer = randInt(2, 12);
      const multiplier = randInt(2, 9);
      const product = answer * multiplier;
      return {
        skillId: 'P6-ALG-02', questionFamilyId: familyId,
        prompt: `Solve: ${multiplier}${varLetter} = ${product}`,
        answer, answerType: 'number',
        instructionHint: `To find ${varLetter}, divide both sides by ${multiplier}.`,
        solutionText: `${multiplier}${varLetter} = ${product}. ${varLetter} = ${product} ÷ ${multiplier} = ${answer}.`,
        misconceptionTraps: ['forgets_inverse_operation'],
      };
    }
    if (subType === 3) {
      const answer = randInt(5, 25);
      const subtrahend = randInt(2, answer - 1);
      const result = answer - subtrahend;
      return {
        skillId: 'P6-ALG-02', questionFamilyId: familyId,
        prompt: `Solve: ${varLetter} - ${subtrahend} = ${result}`,
        answer, answerType: 'number',
        instructionHint: `To find ${varLetter}, add ${subtrahend} to both sides.`,
        solutionText: `${varLetter} - ${subtrahend} = ${result}. ${varLetter} = ${result} + ${subtrahend} = ${answer}.`,
        misconceptionTraps: ['forgets_inverse_operation'],
      };
    }
    // subType 4: x / a = b
    const answer = randInt(2, 12);
    const divisor = randInt(2, 6);
    const quotient = answer; // x = answer, x/divisor = answer/divisor — no, we need clean: x/a = b => x = a*b
    const rhs = answer;
    const xVal = divisor * answer;
    return {
      skillId: 'P6-ALG-02', questionFamilyId: familyId,
      prompt: `Solve: ${varLetter} ÷ ${divisor} = ${rhs}`,
      answer: xVal, answerType: 'number',
      instructionHint: `To find ${varLetter}, multiply both sides by ${divisor}.`,
      solutionText: `${varLetter} ÷ ${divisor} = ${rhs}. ${varLetter} = ${rhs} × ${divisor} = ${xVal}.`,
      misconceptionTraps: ['forgets_inverse_operation'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Two-step equations: ax + b = c  or  ax - b = c
    const answer = randInt(2, 12);
    const multiplier = randInt(2, 7);
    const isAdd = Math.random() < 0.5;
    const constant = randInt(1, 15);
    const rhs = isAdd ? multiplier * answer + constant : multiplier * answer - constant;
    if (rhs < 1) {
      // Ensure positive right side by flipping to addition
      const rhsFixed = multiplier * answer + constant;
      return {
        skillId: 'P6-ALG-02', questionFamilyId: familyId,
        prompt: `Solve: ${multiplier}${varLetter} + ${constant} = ${rhsFixed}`,
        answer, answerType: 'number',
        instructionHint: `Step 1: Subtract ${constant} from both sides. Step 2: Divide both sides by ${multiplier}.`,
        solutionText: `${multiplier}${varLetter} + ${constant} = ${rhsFixed}. ${multiplier}${varLetter} = ${rhsFixed} - ${constant} = ${multiplier * answer}. ${varLetter} = ${multiplier * answer} ÷ ${multiplier} = ${answer}.`,
        misconceptionTraps: ['wrong_order_of_inverse', 'sign_error_in_equation'],
      };
    }
    const op = isAdd ? '+' : '-';
    const step1Result = multiplier * answer;
    const step1Explanation = isAdd
      ? `${multiplier}${varLetter} = ${rhs} - ${constant} = ${step1Result}`
      : `${multiplier}${varLetter} = ${rhs} + ${constant} = ${step1Result}`;
    return {
      skillId: 'P6-ALG-02', questionFamilyId: familyId,
      prompt: `Solve: ${multiplier}${varLetter} ${op} ${constant} = ${rhs}`,
      answer, answerType: 'number',
      instructionHint: `Step 1: ${isAdd ? 'Subtract' : 'Add'} ${constant} ${isAdd ? 'from' : 'to'} both sides. Step 2: Divide both sides by ${multiplier}.`,
      solutionText: `${multiplier}${varLetter} ${op} ${constant} = ${rhs}. ${step1Explanation}. ${varLetter} = ${step1Result} ÷ ${multiplier} = ${answer}.`,
      misconceptionTraps: ['wrong_order_of_inverse', 'sign_error_in_equation'],
    };
  }

  // _003: Equations with brackets: a(x + b) = c  or  a(x - b) = c
  const answer = randInt(2, 10);
  const multiplier = randInt(2, 5);
  const constant = randInt(1, 8);
  const isAdd = Math.random() < 0.5;
  const innerValue = isAdd ? answer + constant : answer - constant;
  if (innerValue < 1) {
    // Force addition to keep things positive
    const cAdd = answer + constant;
    const rhsAdd = multiplier * cAdd;
    return {
      skillId: 'P6-ALG-02', questionFamilyId: familyId,
      prompt: `Solve: ${multiplier}(${varLetter} + ${constant}) = ${rhsAdd}`,
      answer, answerType: 'number',
      instructionHint: `Step 1: Divide both sides by ${multiplier}. Step 2: Subtract ${constant} from both sides.`,
      solutionText: `${multiplier}(${varLetter} + ${constant}) = ${rhsAdd}. ${varLetter} + ${constant} = ${rhsAdd} ÷ ${multiplier} = ${cAdd}. ${varLetter} = ${cAdd} - ${constant} = ${answer}.`,
      misconceptionTraps: ['forgets_inverse_operation', 'wrong_order_of_inverse'],
    };
  }
  const op = isAdd ? '+' : '-';
  const bracketResult = isAdd ? answer + constant : answer - constant;
  const rhsVal = multiplier * bracketResult;
  const step2 = isAdd
    ? `${varLetter} = ${bracketResult} - ${constant} = ${answer}`
    : `${varLetter} = ${bracketResult} + ${constant} = ${answer}`;
  return {
    skillId: 'P6-ALG-02', questionFamilyId: familyId,
    prompt: `Solve: ${multiplier}(${varLetter} ${op} ${constant}) = ${rhsVal}`,
    answer, answerType: 'number',
    instructionHint: `Step 1: Divide both sides by ${multiplier}. Step 2: ${isAdd ? 'Subtract' : 'Add'} ${constant}.`,
    solutionText: `${multiplier}(${varLetter} ${op} ${constant}) = ${rhsVal}. ${varLetter} ${op} ${constant} = ${rhsVal} ÷ ${multiplier} = ${bracketResult}. ${step2}.`,
    misconceptionTraps: ['forgets_inverse_operation', 'wrong_order_of_inverse'],
  };
}

/* ------------------------------------------------------------------ */
/*  P6-ALG-03 — Algebraic Word Problems                               */
/* ------------------------------------------------------------------ */

function generateWordProblem(familyId) {
  const varLetter = pick(['x', 'n', 'y']);

  if (familyId.endsWith('_001')) {
    // Single-unknown word problems
    const name = pick(NAMES);
    const answer = randInt(5, 30);
    const templates = [
      (() => {
        const perItem = randInt(2, 8);
        const total = perItem * answer;
        return {
          prompt: `${name} bought some ${pick(ITEMS_PRICED).plural} at $${perItem} each. The total cost was $${total}. How many ${pick(ITEMS_PRICED).plural} did ${name} buy?`,
          solutionText: `Let ${varLetter} be the number bought. ${perItem}${varLetter} = ${total}. ${varLetter} = ${total} ÷ ${perItem} = ${answer}.`,
          answer,
        };
      })(),
      (() => {
        const given = randInt(3, 15);
        const total = answer + given;
        return {
          prompt: `${name} has some marbles. After receiving ${given} more marbles, ${name} has ${total} marbles altogether. How many marbles did ${name} have at first?`,
          solutionText: `Let ${varLetter} be the original number. ${varLetter} + ${given} = ${total}. ${varLetter} = ${total} - ${given} = ${answer}.`,
          answer,
        };
      })(),
      (() => {
        const multiplier = randInt(2, 5);
        const total = multiplier * answer;
        return {
          prompt: `A rope is cut into ${multiplier} equal pieces. Each piece is ${answer} cm long. What was the original length of the rope in cm?`,
          solutionText: `Let ${varLetter} be the original length. ${varLetter} ÷ ${multiplier} = ${answer}. ${varLetter} = ${answer} × ${multiplier} = ${total}.`,
          answer: total,
        };
      })(),
    ];
    const t = pick(templates);
    return {
      skillId: 'P6-ALG-03', questionFamilyId: familyId,
      prompt: t.prompt, answer: t.answer, answerType: 'number',
      instructionHint: 'Let a letter represent the unknown. Form an equation and solve it.',
      solutionText: t.solutionText,
      misconceptionTraps: ['writes_equation_backwards', 'ignores_units_in_algebra'],
    };
  }

  if (familyId.endsWith('_002')) {
    // Before-and-after word problems
    const name = pick(NAMES);
    const answer = randInt(8, 40);
    const templates = [
      (() => {
        const gaveAway = randInt(3, Math.floor(answer / 2));
        const remaining = answer - gaveAway;
        return {
          prompt: `${name} had some stickers. After giving away ${gaveAway} stickers, ${name} had ${remaining} stickers left. How many stickers did ${name} have at first?`,
          solutionText: `Let ${varLetter} be the original number. ${varLetter} - ${gaveAway} = ${remaining}. ${varLetter} = ${remaining} + ${gaveAway} = ${answer}.`,
          answer,
        };
      })(),
      (() => {
        const spent = randInt(2, 8);
        const timesSpent = randInt(2, 4);
        const totalSpent = spent * timesSpent;
        const answerVal = answer;
        const remaining = answerVal - totalSpent;
        if (remaining < 1) {
          const safeAnswer = totalSpent + randInt(5, 15);
          const safeRemaining = safeAnswer - totalSpent;
          return {
            prompt: `${name} had $${varLetter}. After buying ${timesSpent} ${pick(ITEMS_PRICED).plural} at $${spent} each, ${name} had $${safeRemaining} left. How much money did ${name} have at first?`,
            solutionText: `${varLetter} - ${timesSpent} × ${spent} = ${safeRemaining}. ${varLetter} - ${totalSpent} = ${safeRemaining}. ${varLetter} = ${safeRemaining} + ${totalSpent} = ${safeAnswer}.`,
            answer: safeAnswer,
          };
        }
        return {
          prompt: `${name} had $${varLetter}. After buying ${timesSpent} ${pick(ITEMS_PRICED).plural} at $${spent} each, ${name} had $${remaining} left. How much money did ${name} have at first?`,
          solutionText: `${varLetter} - ${timesSpent} × ${spent} = ${remaining}. ${varLetter} - ${totalSpent} = ${remaining}. ${varLetter} = ${remaining} + ${totalSpent} = ${answerVal}.`,
          answer: answerVal,
        };
      })(),
      (() => {
        const received = randInt(5, 15);
        const final_ = answer + received;
        return {
          prompt: `${name} saved some money. After receiving $${received} from a relative, ${name} had $${final_} in total. How much had ${name} saved?`,
          solutionText: `Let ${varLetter} be the savings. ${varLetter} + ${received} = ${final_}. ${varLetter} = ${final_} - ${received} = ${answer}.`,
          answer,
        };
      })(),
    ];
    const t = pick(templates);
    return {
      skillId: 'P6-ALG-03', questionFamilyId: familyId,
      prompt: t.prompt, answer: t.answer, answerType: 'number',
      instructionHint: 'Identify the unknown, form an equation using the before-and-after information, and solve.',
      solutionText: t.solutionText,
      misconceptionTraps: ['writes_equation_backwards', 'confuses_expression_and_equation'],
    };
  }

  // _003: Comparison word problems
  const name1 = pick(NAMES);
  const name2 = pick(NAMES.filter((n) => n !== name1));
  const answer = randInt(5, 25);
  const templates = [
    (() => {
      const multiplier = randInt(2, 4);
      const extra = randInt(2, 10);
      const person2Qty = multiplier * answer + extra;
      return {
        prompt: `${name2} has ${person2Qty} cards. This is ${multiplier} times as many as ${name1} has, plus ${extra} more. How many cards does ${name1} have?`,
        solutionText: `Let ${varLetter} be ${name1}'s cards. ${multiplier}${varLetter} + ${extra} = ${person2Qty}. ${multiplier}${varLetter} = ${person2Qty} - ${extra} = ${multiplier * answer}. ${varLetter} = ${multiplier * answer} ÷ ${multiplier} = ${answer}.`,
        answer,
      };
    })(),
    (() => {
      const diff = randInt(3, 12);
      const total = answer + (answer + diff);
      return {
        prompt: `${name1} and ${name2} have ${total} beads altogether. ${name2} has ${diff} more beads than ${name1}. How many beads does ${name1} have?`,
        solutionText: `Let ${varLetter} be ${name1}'s beads. ${name2} has ${varLetter} + ${diff}. ${varLetter} + (${varLetter} + ${diff}) = ${total}. 2${varLetter} + ${diff} = ${total}. 2${varLetter} = ${total - diff}. ${varLetter} = ${(total - diff) / 2} = ${answer}.`,
        answer,
      };
    })(),
    (() => {
      const multiplier = randInt(2, 3);
      const total = answer + multiplier * answer;
      return {
        prompt: `${name2} has ${multiplier} times as many stamps as ${name1}. They have ${total} stamps altogether. How many stamps does ${name1} have?`,
        solutionText: `Let ${varLetter} be ${name1}'s stamps. ${name2} has ${multiplier}${varLetter}. ${varLetter} + ${multiplier}${varLetter} = ${total}. ${multiplier + 1}${varLetter} = ${total}. ${varLetter} = ${total} ÷ ${multiplier + 1} = ${answer}.`,
        answer,
      };
    })(),
  ];
  const t = pick(templates);
  return {
    skillId: 'P6-ALG-03', questionFamilyId: familyId,
    prompt: t.prompt, answer: t.answer, answerType: 'number',
    instructionHint: 'Let a letter stand for the smaller or unknown quantity, express the other in terms of it, and solve.',
    solutionText: t.solutionText,
    misconceptionTraps: ['writes_equation_backwards', 'ignores_units_in_algebra'],
  };
}

/* ------------------------------------------------------------------ */
/*  Dispatcher and public API                                         */
/* ------------------------------------------------------------------ */

const generatorsBySkill = {
  'P6-ALG-01': generateExpression,
  'P6-ALG-02': generateEquation,
  'P6-ALG-03': generateWordProblem,
};

export function generateQuestion(skillId, options = {}) {
  const skill = getSkill(skillId);
  if (!skill) return null;
  const families = getQuestionFamiliesBySkill(skillId);
  if (!families.length) return null;
  const family = options.questionFamilyId ? families.find((f) => f.id === options.questionFamilyId) || pick(families) : pick(families);
  const generator = generatorsBySkill[skillId];
  if (!generator) return null;
  const question = generator(family.id);
  return { ...question, questionId: `${family.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, difficulty: family.difficulty, fluencyTargetSeconds: family.fluencyTargetSeconds, visualRequirement: family.visualRequirement || skill.visual };
}

export function generateQuestionSet(skillId, count = 5, options = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) { const q = generateQuestion(skillId, options); if (q) questions.push(q); }
  return questions;
}
export function generateDiagnosticSet(skillIds, questionsPerSkill = 3) {
  const questions = [];
  for (const skillId of skillIds) { questions.push(...generateQuestionSet(skillId, questionsPerSkill)); }
  return questions;
}
export function getSupportedSkillIds() { return Object.keys(generatorsBySkill); }
export default { generateQuestion, generateQuestionSet, generateDiagnosticSet, getSupportedSkillIds };
