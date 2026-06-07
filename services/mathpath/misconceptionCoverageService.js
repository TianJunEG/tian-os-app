import { listMisconceptions } from './misconceptionRegistry.js';
import { listSkillMisconceptionEntries } from './skillMisconceptionMap.js';

const DIAGNOSTIC_EVIDENCE = {
  F001: ['visual_fraction_identification'],
  F002: ['notation_interpretation'],
  F003: ['shaded_shape'],
  F004: ['unit_fraction_identification'],
  F005: ['number_line'],
  F006: ['unit_fraction_comparison'],
  F007: ['same_denominator_comparison'],
  F008: ['same_numerator_comparison'],
  F009: ['ordering'],
  F010: ['equivalent_fraction_recognition'],
  F011: ['equivalent_fraction_generation'],
  F012: ['simplification'],
  F013: ['improper_fraction_representation'],
  F014: ['mixed_number_representation'],
  F015: ['mixed_improper_conversion'],
  F016: ['like_denominator_addition'],
  F017: ['like_denominator_subtraction'],
  F018: ['unlike_denominator_addition'],
  F019: ['unlike_denominator_subtraction'],
  F020: ['fraction_of_quantity'],
  F021: ['fraction_multiplication'],
  F022: ['fraction_division'],
  F023: ['word_problem_one_step'],
  F024: ['word_problem_multi_step'],
  F025: ['exam_application'],
  F026: ['mixed_mastery'],
};

const REMEDIATION_COVERAGE = {
  visual_foundation: ['visual_model', 'guided_practice', 'recheck'],
  notation_foundation: ['guided_example', 'targeted_practice', 'recheck'],
  visual_comparison: ['visual_model', 'number_line', 'targeted_practice', 'recheck'],
  number_line: ['number_line', 'guided_practice', 'recheck'],
  comparison_reasoning: ['visual_model', 'common_denominator_guide', 'targeted_practice', 'recheck'],
  equivalence_model: ['area_model', 'guided_example', 'targeted_practice', 'recheck'],
  factor_review: ['factor_review', 'targeted_practice', 'recheck'],
  mixed_improper_model: ['visual_model', 'guided_example', 'targeted_practice', 'recheck'],
  like_denominator_operations: ['guided_example', 'fluency', 'targeted_practice', 'recheck'],
  common_denominator_operations: ['common_denominator_guide', 'guided_example', 'worksheet', 'recheck'],
  quantity_model: ['bar_model', 'guided_example', 'targeted_practice', 'recheck'],
  operation_meaning: ['concept_review', 'guided_example', 'targeted_practice', 'recheck'],
  story_problem_scaffold: ['story_mode', 'bar_model', 'targeted_practice', 'recheck'],
  multi_step_scaffold: ['story_mode', 'working_scaffold', 'targeted_practice', 'recheck'],
  exam_application_scaffold: ['story_mode', 'worksheet', 'targeted_practice', 'recheck'],
  mixed_review: ['mixed_review', 'worksheet', 'recheck'],
};

function unique(values = []) {
  return [...new Set((values || []).filter(Boolean))];
}

function coverageScoreFor(entry = {}) {
  const misconceptions = unique([...(entry.primary || []), ...(entry.secondary || [])]);
  const hasPrimary = (entry.primary || []).length > 0;
  const hasSecondary = (entry.secondary || []).length > 0;
  const diagnostic = DIAGNOSTIC_EVIDENCE[entry.skillId] || [];
  const remediation = REMEDIATION_COVERAGE[entry.remediationPriority] || [];
  const score = [
    hasPrimary ? 35 : 0,
    hasSecondary ? 15 : 0,
    diagnostic.length ? 25 : 0,
    remediation.length ? 25 : 0,
  ].reduce((sum, value) => sum + value, 0);
  return {
    skillId: entry.skillId,
    skillName: entry.skillName,
    misconceptionsCurrentlyCovered: misconceptions,
    misconceptionsMissing: missingMisconceptionsFor(entry),
    remediationCoverage: remediation,
    diagnosticCoverage: diagnostic,
    coverageScore: score,
    coverageBand: score >= 85 ? 'strong' : score >= 65 ? 'partial' : 'thin',
  };
}

function missingMisconceptionsFor(entry = {}) {
  const missing = [];
  if ((entry.primary || []).length < 1) missing.push('primary_misconception_missing');
  if ((entry.secondary || []).length < 1) missing.push('secondary_misconception_missing');
  if (!(DIAGNOSTIC_EVIDENCE[entry.skillId] || []).length) missing.push('diagnostic_evidence_missing');
  if (!(REMEDIATION_COVERAGE[entry.remediationPriority] || []).length) missing.push('remediation_missing');
  if (['F023', 'F024', 'F025', 'F026'].includes(entry.skillId)) {
    const mapped = unique([...(entry.primary || []), ...(entry.secondary || [])]);
    if (!mapped.includes('operation_mismatch')) missing.push('operation_mismatch_probe_needed');
    if (!mapped.includes('skipped_step')) missing.push('multi_step_step_tracking_needed');
  }
  return missing;
}

export function buildMisconceptionCoverageMatrix() {
  const rows = listSkillMisconceptionEntries().map(coverageScoreFor);
  const averageCoverage = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.coverageScore, 0) / rows.length)
    : 0;
  return {
    generatedAt: new Date().toISOString(),
    domainId: 'fractions',
    subjectId: 'math',
    registryVersion: 'mathpath-misconception-registry-v1',
    skillCount: rows.length,
    misconceptionCount: listMisconceptions().length,
    averageCoverage,
    coveragePercent: averageCoverage,
    rows,
    missingMisconceptions: rows.filter((row) => row.misconceptionsMissing.length > 0),
    weakSkills: rows.filter((row) => row.coverageScore < 85),
    remediationGaps: rows.filter((row) => !row.remediationCoverage.length),
  };
}

export default {
  buildMisconceptionCoverageMatrix,
};
