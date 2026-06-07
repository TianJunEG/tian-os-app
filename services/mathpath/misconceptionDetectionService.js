import { getMisconception, matchMisconceptionsFromText } from './misconceptionRegistry.js';

const LEGACY_TAG_ALIASES = {
  adds_denominators_directly: 'fraction_add_denominators_directly',
  numerator_denominator_confusion: 'numerator_denominator_reversed',
};

export function detectMisconceptions({ questionText = '', studentAnswer = '', teacherMarkedCorrect = null } = {}) {
  const text = `${questionText}\n${studentAnswer}`;
  const result = matchMisconceptionsFromText(text, { teacherMarkedCorrect });
  const misconceptionTags = [
    ...result.misconceptionTags,
    ...result.misconceptionTags.map((tag) => LEGACY_TAG_ALIASES[tag]).filter(Boolean),
  ];
  return {
    misconceptionTags: [...new Set(misconceptionTags)],
    misconceptionEvidence: result.misconceptions.map((match) => match.description),
    misconceptionDetails: result.misconceptions.map((match) => ({
      ...match,
      registryEntry: getMisconception(match.misconceptionId),
    })),
    confidence: result.confidence,
  };
}

export default { detectMisconceptions };
