import DomainLearningPathPage from './domainPractice/DomainLearningPathPage';

// Thin wrapper over the shared, registry-driven DomainLearningPathPage.
// The K2 Early Numeracy domain runs in gentle "Explore" mode (config.gentle),
// so the page shows "Let's Practise" instead of a diagnostic check-in.
export default function EarlyNumeracyLearningPathPage() {
  return <DomainLearningPathPage domain="early-numeracy" />;
}
