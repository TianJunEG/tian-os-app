// P0 production gate for MathPath domains that are not safe to serve to
// students. See MATHPATH_QUESTION_QUALITY_AUDIT.md. The gate is enforced at the
// practice-service entry point so it holds no matter which route or
// orchestrator calls in.
//
// Two reasons a domain is withheld:
//   'stub'          — the *QuestionGenerator.js emits "Compute: a + b = ?" for
//                     every skill, regardless of topic.
//   'not-exam-ready'— the generator computes real questions but ships pervasive
//                     correctness/misgrade bugs (e.g. answers stored in a format
//                     the answer-checker rejects, impossible values) that cannot
//                     be made safe with surgical fixes.
//
// To re-enable a domain: rebuild/repair its generator, then remove its id here
// (and flip its catalog `practice` status back to 'available' in
// shared/mathpath/domainCatalog.js).

export const WITHHELD_DOMAINS = {
  geometry: 'stub',
  // money:        rebuilt and re-enabled (see MoneyQuestionGenerator.js / P1).
  // time:         rebuilt and re-enabled (see TimeQuestionGenerator.js / P1).
  // operations:   rebuilt and re-enabled (see OperationsQuestionGenerator.js / P1).
  // number-sense: rebuilt and re-enabled (see NumberSenseQuestionGenerator.js / P1).
  // measurement:  rebuilt and re-enabled (see MeasurementQuestionGenerator.js / P1).
};

// Back-compat: the subset that are pure a+b stubs.
export const GATED_STUB_DOMAINS = new Set(
  Object.entries(WITHHELD_DOMAINS)
    .filter(([, reason]) => reason === 'stub')
    .map(([id]) => id),
);

/**
 * Throws a 503-tagged error when the domain is currently withheld.
 * Call at the top of each build*PracticeSession entry point.
 * @param {string} domainId
 */
export function assertDomainServable(domainId) {
  if (Object.prototype.hasOwnProperty.call(WITHHELD_DOMAINS, domainId)) {
    const err = new Error(
      `The "${domainId}" practice domain is temporarily unavailable while its ` +
        `question content is being rebuilt.`,
    );
    err.status = 503;
    err.code = 'DOMAIN_NOT_SERVABLE';
    err.reason = WITHHELD_DOMAINS[domainId];
    throw err;
  }
}
