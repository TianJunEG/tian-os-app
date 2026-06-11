import {
  FRACTION_CANONICAL_SKILL_ROWS,
  FRACTIONS_PILOT_SCOPE_LABEL,
  getCanonicalFractionSkill,
  getCanonicalFractionSkillBySlug,
} from '../../shared/mathpath/curriculum/fractionCanonicalSkillMap.js';
import { fractionQuestionFamilies } from '../../shared/mathpath/fractions/fractionQuestionFamilies.js';
import { fractionSkillGraph } from '../../shared/mathpath/fractions/fractionSkillGraph.js';
import { fractionCurriculumMappings } from '../../shared/mathpath/curriculum/fractionCurriculumMappings.js';
import { fractionUniversalSkills } from '../../shared/mathpath/curriculum/fractionUniversalSkills.js';

const F_CODE_RE = /^F\d{3}$/i;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeFCode(value = '') {
  const raw = clean(value);
  return F_CODE_RE.test(raw) ? raw.toUpperCase() : '';
}

function objectId(value = {}) {
  return clean(value._id || value.id || value.diagnosticSessionId || value.worksheetId || value.assignmentId || value.reportId);
}

function issue({ severity = 'medium', type, source, objectId: id = '', skillId = '', expected = '', actual = '', message = '' }) {
  return {
    severity,
    type,
    source,
    objectId: id,
    skillId,
    expected,
    actual,
    message,
  };
}

function canonicalForReference(value = '') {
  const raw = clean(value);
  const fCode = normalizeFCode(raw);
  if (fCode) return getCanonicalFractionSkill(fCode);
  return getCanonicalFractionSkillBySlug(raw) || null;
}

function validateSkillReference({ source, object, value, field, severity = 'critical' }) {
  const raw = clean(value);
  if (!raw) return [];
  const canonical = canonicalForReference(raw);
  if (!canonical) {
    return [issue({
      severity,
      type: 'invalid_skill_reference',
      source,
      objectId: objectId(object),
      actual: raw,
      message: `${source}.${field} references a skill that is not in the canonical F001-F026 Fractions map.`,
    })];
  }
  if (!normalizeFCode(raw) && raw !== canonical.slug) {
    return [issue({
      severity: 'high',
      type: 'non_canonical_skill_alias',
      source,
      objectId: objectId(object),
      skillId: canonical.frameworkSkillId,
      expected: canonical.slug,
      actual: raw,
      message: `${source}.${field} uses a non-canonical alias for ${canonical.frameworkSkillId}.`,
    })];
  }
  return [];
}

function validateNamedSkillRow({ source, object, skillId, slug, displayName, studentName, parentName }) {
  const canonical = canonicalForReference(skillId || slug);
  if (!canonical) {
    return validateSkillReference({ source, object, value: skillId || slug, field: 'skillId' });
  }

  const issues = [];
  if (slug && slug !== canonical.slug) {
    issues.push(issue({
      severity: 'critical',
      type: 'skill_slug_mismatch',
      source,
      objectId: objectId(object),
      skillId: canonical.frameworkSkillId,
      expected: canonical.slug,
      actual: slug,
      message: `${source} maps ${canonical.frameworkSkillId} to the wrong slug.`,
    }));
  }
  if (displayName && displayName !== canonical.displayName) {
    issues.push(issue({
      severity: 'high',
      type: 'skill_display_name_mismatch',
      source,
      objectId: objectId(object),
      skillId: canonical.frameworkSkillId,
      expected: canonical.displayName,
      actual: displayName,
      message: `${source} display name does not match the canonical Fractions map.`,
    }));
  }
  if (studentName && studentName !== canonical.studentName) {
    issues.push(issue({
      severity: 'medium',
      type: 'student_label_mismatch',
      source,
      objectId: objectId(object),
      skillId: canonical.frameworkSkillId,
      expected: canonical.studentName,
      actual: studentName,
      message: `${source} student-facing label does not match the canonical Fractions map.`,
    }));
  }
  if (parentName && parentName !== canonical.parentName) {
    issues.push(issue({
      severity: 'medium',
      type: 'parent_label_mismatch',
      source,
      objectId: objectId(object),
      skillId: canonical.frameworkSkillId,
      expected: canonical.parentName,
      actual: parentName,
      message: `${source} parent-facing label does not match the canonical Fractions map.`,
    }));
  }
  return issues;
}

function countBySeverity(issues = []) {
  return issues.reduce((acc, row) => {
    acc[row.severity] = (acc[row.severity] || 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

function extractSkillRefs(value = {}) {
  return [
    ...asArray(value.skillIds),
    ...asArray(value.targetSkillIds),
    ...asArray(value.weakSkillIds),
    ...asArray(value.masteredSkillIds),
    ...asArray(value.remainingWeakSkills),
    ...asArray(value.recheckQuestionIds),
    ...asArray(value.recommendedSkillIds),
    clean(value.skillId),
    clean(value.frameworkSkillId),
    clean(value.recommendedStartingSkillId),
    clean(value.recommendedStartingSkill?.skillId),
  ].filter(Boolean);
}

export function buildCanonicalFractionMappingTable() {
  return FRACTION_CANONICAL_SKILL_ROWS.map((row) => ({
    skillId: row.frameworkSkillId,
    canonicalSlug: row.slug,
    internalDisplayName: row.displayName,
    studentFacingName: row.studentName,
    parentFacingName: row.parentName,
    moeLevel: row.masteryLevel,
    topicGrouping: row.topic,
    prerequisiteSkills: [...row.prerequisites],
    diagnosticLinkage: [...row.questionFamilies],
    questionLinkage: [...row.questionFamilies],
    recoveryPackLinkage: `skill:${row.frameworkSkillId}`,
    recheckLinkage: `skill:${row.frameworkSkillId}`,
    worksheetLinkage: `skill:${row.frameworkSkillId}`,
  }));
}

export function auditStaticFractionCurriculumMap({
  canonicalRows = FRACTION_CANONICAL_SKILL_ROWS,
  skillGraph = fractionSkillGraph,
  curriculumMappings = fractionCurriculumMappings,
  universalSkills = fractionUniversalSkills,
  questionFamilies = fractionQuestionFamilies,
} = {}) {
  const issues = [];
  const expectedIds = Array.from({ length: 26 }, (_, index) => `F${String(index + 1).padStart(3, '0')}`);
  const ids = canonicalRows.map((row) => row.frameworkSkillId);
  const slugs = canonicalRows.map((row) => row.slug);

  if (ids.join('|') !== expectedIds.join('|')) {
    issues.push(issue({
      severity: 'critical',
      type: 'canonical_id_sequence_mismatch',
      source: 'fractionCanonicalSkillMap',
      expected: expectedIds.join(', '),
      actual: ids.join(', '),
      message: 'Canonical Fractions map must contain exactly F001-F026 in order.',
    }));
  }

  const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  for (const slug of new Set(duplicateSlugs)) {
    issues.push(issue({
      severity: 'critical',
      type: 'duplicate_slug',
      source: 'fractionCanonicalSkillMap',
      actual: slug,
      message: 'Canonical Fractions map contains a duplicate slug.',
    }));
  }

  for (const row of canonicalRows) {
    issues.push(...validateNamedSkillRow({
      source: 'fractionCanonicalSkillMap',
      object: row,
      skillId: row.frameworkSkillId,
      slug: row.slug,
      displayName: row.displayName,
      studentName: row.studentName,
      parentName: row.parentName,
    }));
    for (const prereq of row.prerequisites || []) {
      issues.push(...validateSkillReference({ source: 'fractionCanonicalSkillMap', object: row, value: prereq, field: 'prerequisites' }));
    }
  }

  for (const skill of asArray(skillGraph.skills)) {
    const canonical = getCanonicalFractionSkill(skill.id);
    if (!canonical) {
      issues.push(...validateSkillReference({ source: 'fractionSkillGraph', object: skill, value: skill.id, field: 'id' }));
      continue;
    }
    if (skill.name !== canonical.displayName) {
      issues.push(issue({
        severity: 'critical',
        type: 'skill_graph_display_name_mismatch',
        source: 'fractionSkillGraph',
        objectId: skill.id,
        skillId: skill.id,
        expected: canonical.displayName,
        actual: skill.name,
        message: 'Active fraction skill graph title does not match canonical map.',
      }));
    }
    for (const familyId of skill.questionFamilies || []) {
      if (!String(familyId).includes(skill.id)) {
        issues.push(issue({
          severity: 'high',
          type: 'question_family_id_mismatch',
          source: 'fractionSkillGraph',
          objectId: familyId,
          skillId: skill.id,
          expected: `family id containing ${skill.id}`,
          actual: familyId,
          message: 'Question family identifier does not include the owning F-code.',
        }));
      }
    }
  }

  for (const row of curriculumMappings) {
    issues.push(...validateNamedSkillRow({
      source: 'fractionCurriculumMappings',
      object: row,
      skillId: row.frameworkSkillId,
      slug: row.skillId || row.slug,
      displayName: row.title,
      studentName: row.studentName,
      parentName: row.parentName,
    }));
  }

  for (const row of universalSkills) {
    issues.push(...validateNamedSkillRow({
      source: 'fractionUniversalSkills',
      object: row,
      skillId: row.frameworkSkillId,
      slug: row.skillId,
      displayName: row.title || row.name,
    }));
  }

  for (const family of questionFamilies) {
    issues.push(...validateSkillReference({ source: 'fractionQuestionFamilies', object: family, value: family.skillId, field: 'skillId' }));
    if (family.id && family.skillId && !String(family.id).includes(family.skillId)) {
      issues.push(issue({
        severity: 'high',
        type: 'question_family_skill_mismatch',
        source: 'fractionQuestionFamilies',
        objectId: family.id,
        skillId: family.skillId,
        expected: `family id containing ${family.skillId}`,
        actual: family.id,
        message: 'Question family appears linked to a different skill.',
      }));
    }
  }

  return {
    ok: !issues.some((row) => row.severity === 'critical' || row.severity === 'high'),
    pilotScope: FRACTIONS_PILOT_SCOPE_LABEL,
    canonicalSkillCount: canonicalRows.length,
    issues,
    issueCounts: countBySeverity(issues),
  };
}

export function auditFractionRuntimeReferences({
  diagnostics = [],
  diagnosticQuestions = [],
  recoveryPacks = [],
  rechecks = [],
  worksheets = [],
  reports = [],
} = {}) {
  const issues = [];

  const scanRefs = (source, rows, fields = []) => {
    for (const row of rows) {
      const refs = fields.length ? fields.flatMap((field) => asArray(row[field]).length ? row[field] : [row[field]]) : extractSkillRefs(row);
      for (const ref of refs.filter(Boolean)) {
        issues.push(...validateSkillReference({ source, object: row, value: ref, field: 'skill references' }));
      }
    }
  };

  scanRefs('diagnosticQuestions', diagnosticQuestions);
  scanRefs('diagnostics', diagnostics);
  scanRefs('worksheets', worksheets);
  scanRefs('rechecks', rechecks);

  for (const pack of recoveryPacks) {
    scanRefs('recoveryPacks', [pack]);
    if (!asArray(pack.misconceptionIds).length && !asArray(pack.interventionIds).length) {
      issues.push(issue({
        severity: 'high',
        type: 'recovery_pack_missing_misconception_target',
        source: 'recoveryPacks',
        objectId: objectId(pack),
        actual: '',
        message: 'Recovery Pack is linked to skills but has no misconception or intervention target.',
      }));
    }
  }

  for (const recheck of rechecks) {
    if (!asArray(recheck.misconceptionTags).length && !asArray(recheck.targetMisconceptionIds).length) {
      issues.push(issue({
        severity: 'medium',
        type: 'recheck_missing_misconception_specificity',
        source: 'rechecks',
        objectId: objectId(recheck),
        message: 'Recheck is skill-linked but does not record targeted misconception evidence.',
      }));
    }
  }

  for (const report of reports) {
    const text = [
      report.title,
      report.summary,
      report.parentFriendlySummary,
      report.claim,
      ...(report.sections || []).map((section) => section.text || section.summary || ''),
    ].join(' ');
    if (/\bF\d{3}\b/.test(text)) {
      issues.push(issue({
        severity: 'high',
        type: 'report_raw_f_code',
        source: 'reports',
        objectId: objectId(report),
        message: 'Parent-facing report text contains raw F-code labels.',
      }));
    }
    if (/mastered fractions|all weak areas|complete singapore math|full p1.?p6|school-ready/i.test(text)) {
      issues.push(issue({
        severity: 'critical',
        type: 'report_overclaim',
        source: 'reports',
        objectId: objectId(report),
        message: 'Parent-facing report text makes a claim beyond the Fractions intervention pilot evidence scope.',
      }));
    }
    if (report.confidenceLabel && !['High Confidence', 'Moderate Confidence', 'Limited Evidence'].includes(report.confidenceLabel)) {
      issues.push(issue({
        severity: 'medium',
        type: 'report_confidence_label_invalid',
        source: 'reports',
        objectId: objectId(report),
        expected: 'High Confidence, Moderate Confidence, or Limited Evidence',
        actual: report.confidenceLabel,
        message: 'Report confidence label is not parent-safe.',
      }));
    }
  }

  return {
    ok: !issues.some((row) => row.severity === 'critical' || row.severity === 'high'),
    issues,
    issueCounts: countBySeverity(issues),
  };
}

export function confidenceLabelForEvidence({ evidenceCount = 0, hasRecheck = false, hasIndependentEvidence = false, hasWorkingEvidence = false } = {}) {
  const count = Number(evidenceCount) || 0;
  if (hasRecheck && hasIndependentEvidence && count >= 3) return 'High Confidence';
  if ((hasIndependentEvidence || hasWorkingEvidence || hasRecheck) && count >= 2) return 'Moderate Confidence';
  return 'Limited Evidence';
}

export function auditFractionCurriculumMappings(input = {}) {
  const staticAudit = auditStaticFractionCurriculumMap(input.staticSources || {});
  const runtimeAudit = auditFractionRuntimeReferences(input.runtimeSources || {});
  const issues = [...staticAudit.issues, ...runtimeAudit.issues];
  return {
    ok: !issues.some((row) => row.severity === 'critical' || row.severity === 'high'),
    pilotScope: FRACTIONS_PILOT_SCOPE_LABEL,
    canonicalMappingTable: buildCanonicalFractionMappingTable(),
    issues,
    issueCounts: countBySeverity(issues),
    staticAudit,
    runtimeAudit,
  };
}

export default {
  buildCanonicalFractionMappingTable,
  auditStaticFractionCurriculumMap,
  auditFractionRuntimeReferences,
  auditFractionCurriculumMappings,
  confidenceLabelForEvidence,
};
