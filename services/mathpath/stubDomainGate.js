// P0 production gate for MathPath domains whose question generators are still
// stubs (every skill emits "Compute: a + b = ?" regardless of topic).
//
// See MATHPATH_QUESTION_QUALITY_AUDIT.md. Until the content layer in the
// corresponding *QuestionGenerator.js is implemented, these domains must not
// serve practice to students. The gate is enforced at the practice-service
// entry point so it holds no matter which route or orchestrator calls in.
//
// To re-enable a domain: implement its generator, then remove its id from
// GATED_STUB_DOMAINS (and ideally flip its catalog `practice` status back to
// 'available' in shared/mathpath/domainCatalog.js).

export const GATED_STUB_DOMAINS = new Set([
  'number-sense',
  'operations',
  'geometry',
  'measurement',
]);

/**
 * Throws a 503-tagged error when the domain's generator is a known stub.
 * Call at the top of each build*PracticeSession entry point.
 * @param {string} domainId
 */
export function assertDomainServable(domainId) {
  if (GATED_STUB_DOMAINS.has(domainId)) {
    const err = new Error(
      `The "${domainId}" practice domain is temporarily unavailable while its ` +
        `question content is being rebuilt.`,
    );
    err.status = 503;
    err.code = 'DOMAIN_NOT_SERVABLE';
    throw err;
  }
}
