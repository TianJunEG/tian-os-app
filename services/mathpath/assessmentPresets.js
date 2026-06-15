// Assessment preset configs + convenience builder.
// Each preset is a plain-object spec consumable by buildQuestionBank().
// P4 Fractions preset requires DB (fractions domain is DB-backed).

import { buildQuestionBank } from './blueprintBankAssembler.js';

export const PRESETS = {
  P2_NUMBER_FOUNDATIONS: {
    title: 'P2 Number Foundations Check',
    level: 'Primary 2',
    topics: [
      {
        domainId: 'whole_numbers',
        count: 8,
        difficultyMix: { easy: 60, medium: 40, hard: 0 },
        includePrior: true,
      },
      {
        domainId: 'four_operations',
        count: 7,
        difficultyMix: { easy: 60, medium: 40, hard: 0 },
        includePrior: true,
      },
    ],
  },

  P4_FRACTIONS_TOPICAL: {
    title: 'P4 Fractions Topical Test',
    level: 'Primary 4',
    topics: [
      {
        domainId: 'fractions',
        count: 12,
        difficultyMix: { easy: 30, medium: 50, hard: 20 },
        includePrior: false,
      },
      {
        domainId: 'whole_numbers',
        count: 3,
        difficultyMix: { easy: 50, medium: 50, hard: 0 },
        includePrior: true,
      },
    ],
  },

  P5_PERCENTAGE_EXAM: {
    title: 'P5 Percentage Exam Prep',
    level: 'Primary 5',
    topics: [
      {
        domainId: 'percentage',
        count: 10,
        difficultyMix: { easy: 20, medium: 50, hard: 30 },
        includePrior: true,
      },
      {
        domainId: 'four_operations',
        count: 5,
        difficultyMix: { easy: 30, medium: 50, hard: 20 },
        includePrior: true,
      },
    ],
  },
};

export function buildPresetBank(key) {
  const spec = PRESETS[key];
  if (!spec) {
    throw new Error(`Unknown assessment preset: ${key}. Available: ${Object.keys(PRESETS).join(', ')}`);
  }
  return buildQuestionBank(spec);
}

export default { PRESETS, buildPresetBank };
