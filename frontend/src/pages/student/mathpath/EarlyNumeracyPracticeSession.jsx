import DomainPracticeSession from './domainPractice/DomainPracticeSession';

// Thin wrapper over the shared DomainPracticeSession (registry-driven via the
// 'early-numeracy' DOMAIN_PRACTICE_CONFIG entry).
export { buildSubmitPayload, summarisePracticeResult } from './domainPractice/core';

export default function EarlyNumeracyPracticeSession() {
  return <DomainPracticeSession domain="early-numeracy" />;
}
