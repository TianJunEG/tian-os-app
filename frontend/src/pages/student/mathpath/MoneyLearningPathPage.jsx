import DomainLearningPathPage from './domainPractice/DomainLearningPathPage';

// Thin wrapper over the shared, themed DomainLearningPathPage (registry-driven).
export default function MoneyLearningPathPage() {
  return <DomainLearningPathPage domain="money" />;
}
