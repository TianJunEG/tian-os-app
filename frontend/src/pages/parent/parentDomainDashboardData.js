import { runMathPathDomainPipeline } from '../../mathpath/orchestration/mathPathDomainOrchestrator';

// Pure data helpers for the parent MathPath dashboard's per-domain view
// (parent-dashboard domain parity, phase 3). Kept out of the page component so
// the filtering/derivation logic is unit-testable without rendering.

// Canonical domainId -> parent-facing label, for the domain selector and copy.
export const PARENT_DOMAIN_LABELS = {
  fractions: 'Fractions',
  decimals: 'Decimals',
  percentage: 'Percentage',
  ratio: 'Ratio & Rate',
  circles: 'Circles',
  geometry: 'Geometry',
  algebra: 'Algebra',
  volume: 'Volume',
  area_perimeter: 'Area & Perimeter',
  statistics: 'Statistics',
  speed: 'Speed',
  four_operations: 'Operations',
  number_sense: 'Number Sense',
  money: 'Money',
  time: 'Time',
  measurement: 'Measurement',
};

export function domainLabel(domainId) {
  return PARENT_DOMAIN_LABELS[domainId] || 'MathPath';
}

// Which domains the child actually has mastery data for (so the selector only
// offers populated domains). Fractions is always offered for the pilot.
export function availableDomainsFromMastery(mastery) {
  const records = Array.isArray(mastery?.records) ? mastery.records : [];
  const found = new Set(['fractions']);
  for (const r of records) {
    if (r.domainId) found.add(r.domainId);
  }
  return [...found].filter((id) => PARENT_DOMAIN_LABELS[id]);
}

export function deriveParentPayload(studentId, mastery, workingAnalysisSummary = {}, domainId = 'fractions') {
  const allRecords = Array.isArray(mastery?.records) ? mastery.records : [];
  // Records are tagged with domainId by the backend (phase 2). Filter to the
  // selected domain; for fractions also keep any untagged records so pilot data
  // that predates tagging is never hidden.
  const records = allRecords.filter(
    (r) => r.domainId === domainId || (domainId === 'fractions' && !r.domainId)
  );
  // Records expose skillId as a Mongo ObjectId (not a framework ID the skill
  // graph can name), so label from the record's skillName to keep parent-facing
  // names readable. These flow through the engine's labeller unchanged.
  const labelOf = (r) => r.skillName || String(r.skillId || '');
  const byStatus = (statuses) => records
    .filter((r) => statuses.includes(String(r.status || '').toLowerCase()))
    .map(labelOf)
    .filter(Boolean);

  const pipeline = runMathPathDomainPipeline({
    studentId,
    domainId,
    mode: 'full',
    practiceState: {
      currentSkillId: mastery?.recommended?.skillId || null,
      masteredSkillIds: byStatus(['mastered', 'accurate', 'fluent', 'retained']),
      weakSkillIds: byStatus(['weak', 'needs_review', 'needsreview']),
      fluentSkillIds: byStatus(['fluent', 'retained']),
    },
    retentionState: {},
    assessmentResults: [],
    mistakePlans: [],
    workingAnalysisSummary,
  });
  return pipeline.parentDashboard || null;
}
