import DomainPracticeSession from './domainPractice/DomainPracticeSession';

// Thin wrapper over the shared DomainPracticeSession. The tested pure helpers
// are re-exported from the shared core so existing unit tests keep importing
// them from here.
export { buildSubmitPayload, summarisePracticeResult } from './domainPractice/core';

export default function MoneyPracticeSession() {
  return <DomainPracticeSession domain="money" />;
}
