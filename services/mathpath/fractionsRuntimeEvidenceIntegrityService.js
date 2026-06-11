import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import GeneratedQuestion from '../../models/mathpath/GeneratedQuestion.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import Mistake from '../../models/Mistake.js';
import Worksheet from '../../models/Worksheet.js';
import Question from '../../models/Question.js';
import Skill from '../../models/Skill.js';
import {
  FRACTION_CANONICAL_SKILL_ROWS,
  FRACTIONS_PILOT_SCOPE_LABEL,
  getCanonicalFractionSkill,
  getCanonicalFractionSkillBySlug,
} from '../../shared/mathpath/curriculum/fractionCanonicalSkillMap.js';
import { getMisconceptionsForSkill } from './skillMisconceptionMap.js';
import { buildRecoveryPackTeachingFlow } from './recoveryPackTeachingFlowService.js';
import { generateInterventionWorksheet } from './worksheetGenerationEngine.js';

const F_CODE_RE = /^F\d{3}$/i;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const CONFIDENCE_LABELS = new Set(['High Confidence', 'Moderate Confidence', 'Limited Evidence']);
const BROAD_CLAIM_RE = /mastered fractions|all weak areas|complete singapore math|full p1.?p6|school-ready|full mathpath/i;
const LEGACY_MISCONCEPTION_ALIASES = Object.freeze({
  M001: 'common_denominator_missing',
  M002: 'compares_denominators_only',
  M003: 'equal_parts_missing',
  M004: 'equivalence_scale_error',
  M006: 'mixed_improper_conversion_error',
  'frac/add-denominators': 'adds_denominators_directly',
  'frac/add-without-common': 'adds_denominators_directly',
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = '') {
  return String(value || '').trim();
}

function idOf(record = {}) {
  return clean(record._id || record.id || record.assignmentId || record.diagnosticSessionId || record.worksheetId || record.reportId || record.paperAnalysisId);
}

function fCode(value = '') {
  const raw = clean(value);
  return F_CODE_RE.test(raw) ? raw.toUpperCase() : '';
}

function canonicalFor(value = '') {
  const raw = clean(value);
  if (!raw) return null;
  const code = fCode(raw);
  if (code) return getCanonicalFractionSkill(code);
  return getCanonicalFractionSkillBySlug(raw);
}

function issue({
  severity = 'medium',
  type,
  source,
  objectId = '',
  skillId = '',
  expected = '',
  actual = '',
  message = '',
} = {}) {
  return { severity, type, source, objectId, skillId, expected, actual, message };
}

function countBySeverity(issues = []) {
  return issues.reduce((acc, row) => {
    acc[row.severity] = (acc[row.severity] || 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

function statusFromIssues(issues = []) {
  if (issues.some((row) => row.severity === 'critical' || row.severity === 'high')) return 'Not Ready';
  if (issues.some((row) => row.severity === 'medium')) return 'Partial';
  return 'Ready';
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function canonicalSkillId(value = '') {
  return canonicalFor(value)?.frameworkSkillId || '';
}

function skillLabelFor(skillId = '') {
  const row = getCanonicalFractionSkill(skillId);
  return row ? {
    skillId: row.frameworkSkillId,
    displayName: row.displayName,
    studentName: row.studentName,
    parentName: row.parentName,
  } : null;
}

function misconceptionAlias(value = '') {
  return LEGACY_MISCONCEPTION_ALIASES[clean(value)] || LEGACY_MISCONCEPTION_ALIASES[clean(value).toUpperCase()] || '';
}

function normalizeMisconceptionForSkill(value = '', skillId = '') {
  const raw = clean(value);
  if (!raw) return { value: '', changed: false, source: 'empty' };
  if (misconceptionRelevantToSkill(raw, skillId)) return { value: raw, changed: false, source: 'current' };
  const alias = misconceptionAlias(raw);
  if (alias && misconceptionRelevantToSkill(alias, skillId)) {
    return { value: alias, changed: true, source: 'legacy_alias' };
  }
  return { value: raw, changed: false, source: alias ? 'alias_not_relevant_to_skill' : 'unmapped' };
}

function validateSkillRefs({ refs = [], source = '', record = {}, field = 'skillIds', allowObjectIds = false } = {}) {
  const issues = [];
  for (const ref of unique(refs)) {
    if (allowObjectIds && OBJECT_ID_RE.test(ref)) {
      issues.push(issue({
        severity: 'medium',
        type: 'legacy_object_id_skill_reference',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source}.${field} uses a database ObjectId instead of a canonical F001-F026 skill id.`,
      }));
      continue;
    }
    const canonical = canonicalFor(ref);
    if (!canonical) {
      issues.push(issue({
        severity: 'critical',
        type: 'invalid_canonical_skill_reference',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source}.${field} does not resolve to the canonical F001-F026 Fractions map.`,
      }));
    }
  }
  return issues;
}

function misconceptionRelevantToSkill(misconceptionId = '', skillId = '') {
  const allowed = getMisconceptionsForSkill(skillId);
  return allowed.includes(clean(misconceptionId));
}

function validateMisconceptions({ misconceptionIds = [], skillIds = [], source = '', record = {}, required = false } = {}) {
  const issues = [];
  const normalizedSkills = unique(skillIds.map(canonicalSkillId).filter(Boolean));
  const normalizedMisconceptions = unique(misconceptionIds);
  if (required && !normalizedMisconceptions.length) {
    issues.push(issue({
      severity: 'high',
      type: 'missing_misconception_links',
      source,
      objectId: idOf(record),
      skillId: normalizedSkills.join(','),
      message: `${source} has intervention evidence but no misconception links.`,
    }));
    return issues;
  }

  for (const tag of normalizedMisconceptions) {
    if (!normalizedSkills.length) continue;
    const matched = normalizedSkills.some((skillId) => misconceptionRelevantToSkill(tag, skillId));
    if (!matched) {
      issues.push(issue({
        severity: 'medium',
        type: 'misconception_skill_mismatch',
        source,
        objectId: idOf(record),
        skillId: normalizedSkills.join(','),
        actual: tag,
        expected: 'misconception mapped to one of the target skills',
        message: `${source} misconception tag is not mapped to the target Fractions skill.`,
      }));
    }
  }
  return issues;
}

function questionKeyValues(question = {}) {
  return unique([
    question._id,
    question.id,
    question.questionId,
    question.sourceQuestionId,
    question.fingerprint,
    question.templateId,
    question.questionFamilyId,
  ]);
}

export function buildQuestionReferenceIndex({ generatedQuestions = [], questionRecords = [] } = {}) {
  const map = new Map();
  for (const question of [...asArray(generatedQuestions), ...asArray(questionRecords)]) {
    for (const key of questionKeyValues(question)) {
      map.set(key, question);
    }
  }
  return map;
}

function questionReferencesFromGuidedPracticeFlow(flow = {}) {
  const refs = [];
  for (const step of asArray(flow.steps)) {
    refs.push(
      step.practiceId,
      ...asArray(step.practiceIds),
      ...asArray(step.guidedPracticeIds),
      ...asArray(step.independentPracticeIds),
      ...asArray(step.masteryCheckIds),
      ...asArray(step.recheckQuestionIds),
      step.questionId,
    );
  }
  return unique(refs);
}

function validateQuestionRefs({ refs = [], questionIndex, source = '', record = {}, targetSkillIds = [], requireMisconceptionTags = false } = {}) {
  const issues = [];
  for (const ref of unique(refs)) {
    const question = questionIndex.get(ref);
    if (!question) {
      issues.push(issue({
        severity: 'high',
        type: 'missing_question_reference',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source} references a question that does not exist in GeneratedQuestion/Question records.`,
      }));
      continue;
    }

    const questionSkill = canonicalSkillId(question.skillId || question.frameworkSkillId || question.metadata?.skillId);
    const canonicalTargets = unique(targetSkillIds.map(canonicalSkillId).filter(Boolean));
    if (questionSkill && canonicalTargets.length && !canonicalTargets.includes(questionSkill)) {
      issues.push(issue({
        severity: 'high',
        type: 'question_skill_target_mismatch',
        source,
        objectId: idOf(record),
        skillId: questionSkill,
        expected: canonicalTargets.join(', '),
        actual: question.skillId,
        message: `${source} question reference is mapped to a different canonical skill than the runtime record.`,
      }));
    }
    if (!questionSkill) {
      issues.push(...validateSkillRefs({ refs: [question.skillId], source, record: question, field: 'question.skillId' }));
    }
    if (!clean(question.explanation) && !asArray(question.solutionSteps).length && !clean(question.workedSolution)) {
      issues.push(issue({
        severity: 'medium',
        type: 'question_missing_explanation',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source} question has no explanation, solution steps, or worked solution.`,
      }));
    }
    if (requireMisconceptionTags && !asArray(question.misconceptionTags).length) {
      issues.push(issue({
        severity: 'medium',
        type: 'question_missing_misconception_tags',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source} question is used in an intervention path but has no misconception tags.`,
      }));
    }
    if (question.quarantined || question.isQuarantined || question.metadata?.quarantined || question.metadata?.qualityStatus === 'quarantined') {
      issues.push(issue({
        severity: 'high',
        type: 'quarantined_question_reference',
        source,
        objectId: idOf(record),
        actual: ref,
        message: `${source} references a quarantined or blocked question record.`,
      }));
    }
  }
  return issues;
}

function evidenceQuestionIdsFromRecheck(recheck = {}) {
  return unique([
    ...asArray(recheck.questionIds),
    ...asArray(recheck.targetQuestionIds),
    clean(recheck.currentQuestionId),
    ...asArray(recheck.perSkillSnapshot).flatMap((row) => asArray(row.evidenceQuestionIds)),
    ...asArray(recheck.decisionHistory).flatMap((row) => [
      row.questionId,
      row.currentQuestionId,
      row.selectedQuestionId,
      row.evidenceQuestionId,
    ]),
    ...asArray(recheck.result?.questions).flatMap((row) => [row.questionId, row.id]),
    ...asArray(recheck.resultPayload?.questions).flatMap((row) => [row.questionId, row.id]),
  ]);
}

function reportText(report = {}) {
  return [
    report.title,
    report.summary,
    report.overallSummary,
    report.parentFriendlySummary,
    report.claim,
    report.scopeLabel,
    report.reportSummary?.overallSummary,
    report.reportSummary?.parentFriendlySummary,
    ...(asArray(report.sections).map((section) => [section.title, section.text, section.summary].join(' '))),
    ...(asArray(report.recommendedNextSteps).map((step) => [step.title, step.reason].join(' '))),
  ].join(' ');
}

export function auditReportClaimIntegrity({ reports = [] } = {}) {
  const issues = [];
  for (const report of asArray(reports)) {
    const text = reportText(report);
    if (/\bF\d{3}\b/.test(text)) {
      issues.push(issue({
        severity: 'high',
        type: 'report_raw_f_code',
        source: 'reports',
        objectId: idOf(report),
        message: 'User-facing report text contains raw F-code labels.',
      }));
    }
    if (BROAD_CLAIM_RE.test(text)) {
      issues.push(issue({
        severity: 'critical',
        type: 'report_overclaim',
        source: 'reports',
        objectId: idOf(report),
        message: 'Report text makes a claim broader than the Fractions intervention pilot evidence scope.',
      }));
    }
    const explicitScope = clean(report.scopeLabel || report.pilotScope || report.reportSummary?.scopeLabel);
    if (explicitScope && explicitScope !== FRACTIONS_PILOT_SCOPE_LABEL) {
      issues.push(issue({
        severity: 'medium',
        type: 'report_scope_label_mismatch',
        source: 'reports',
        objectId: idOf(report),
        expected: FRACTIONS_PILOT_SCOPE_LABEL,
        actual: explicitScope,
        message: 'Report scope label should use approved Fractions intervention pilot language.',
      }));
    }
    if (report.confidenceLabel && !CONFIDENCE_LABELS.has(report.confidenceLabel)) {
      issues.push(issue({
        severity: 'medium',
        type: 'report_confidence_label_invalid',
        source: 'reports',
        objectId: idOf(report),
        expected: [...CONFIDENCE_LABELS].join(', '),
        actual: report.confidenceLabel,
        message: 'Report confidence label is not parent-safe.',
      }));
    }
    if (report.mistakeMasteryClaim === 'skill_mastered' || /corrected mistake.*skill mastered/i.test(text)) {
      issues.push(issue({
        severity: 'high',
        type: 'mistake_mastery_skill_mastery_conflation',
        source: 'reports',
        objectId: idOf(report),
        message: 'Report appears to infer skill mastery from mistake-level correction.',
      }));
    }
  }
  return issues;
}

export function auditRecoveryPackIntegrity({ assignments = [], questionIndex = buildQuestionReferenceIndex() } = {}) {
  return asArray(assignments).map((assignment) => {
    const source = 'recoveryPacks';
    const targetSkillIds = asArray(assignment.skillIds).length ? assignment.skillIds : assignment.targetSkillIds;
    const misconceptionIds = [
      ...asArray(assignment.misconceptionIds),
      ...asArray(assignment.guidedPracticeFlow?.misconceptionIds),
      ...asArray(assignment.evidenceSource?.misconceptionIds),
    ];
    const refs = questionReferencesFromGuidedPracticeFlow(assignment.guidedPracticeFlow);
    const issues = [
      ...validateSkillRefs({ refs: targetSkillIds, source, record: assignment, field: 'skillIds' }),
      ...validateMisconceptions({ misconceptionIds, skillIds: targetSkillIds, source, record: assignment, required: true }),
      ...validateQuestionRefs({
        refs,
        questionIndex,
        source,
        record: assignment,
        targetSkillIds,
        requireMisconceptionTags: true,
      }),
    ];
    if (!clean(assignment.sourceType) || !clean(assignment.sourceId)) {
      issues.push(issue({
        severity: 'high',
        type: 'missing_source_evidence',
        source,
        objectId: idOf(assignment),
        message: 'Recovery Pack must preserve sourceType and sourceId evidence.',
      }));
    }
    if (!refs.length) {
      issues.push(issue({
        severity: 'high',
        type: 'missing_teaching_flow_question_refs',
        source,
        objectId: idOf(assignment),
        message: 'Recovery Pack has no guided, independent, or mastery question references.',
      }));
    }
    const fallbackWarnings = asArray(assignment.teachingFlowWarnings || assignment.warnings)
      .filter((row) => row?.type === 'missing_question_record' || /fallback/i.test(row?.message || row));
    if (fallbackWarnings.length) {
      issues.push(issue({
        severity: 'high',
        type: 'fallback_required_for_recovery_pack',
        source,
        objectId: idOf(assignment),
        message: 'Recovery Pack normal pilot flow requires fallback question rendering.',
      }));
    }
    return {
      recordType: source,
      recordId: idOf(assignment),
      targetSkillIds: unique(targetSkillIds.map(canonicalSkillId).filter(Boolean)),
      misconceptionIds: unique(misconceptionIds),
      questionReferenceCount: refs.length,
      status: statusFromIssues(issues),
      issues,
    };
  });
}

export function auditRecheckIntegrity({ rechecks = [], assignments = [], questionIndex = buildQuestionReferenceIndex() } = {}) {
  const assignmentsById = new Map(asArray(assignments).flatMap((assignment) => [
    [idOf(assignment), assignment],
    [clean(assignment._id), assignment],
    [clean(assignment.id), assignment],
  ].filter(([key]) => key)));

  return asArray(rechecks).map((recheck) => {
    const source = 'rechecks';
    const assignmentId = clean(recheck.assignmentId || recheck.sourceId);
    const assignment = assignmentsById.get(assignmentId);
    const targetSkillIds = asArray(recheck.targetSkillIds).length
      ? recheck.targetSkillIds
      : asArray(recheck.perSkillSnapshot).map((row) => row.skillId);
    const assignmentSkillIds = asArray(assignment?.skillIds);
    const misconceptionIds = [
      ...asArray(recheck.targetMisconceptionIds),
      ...asArray(recheck.misconceptionTags),
      ...asArray(recheck.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags)),
    ];
    const questionRefs = evidenceQuestionIdsFromRecheck(recheck);
    const issues = [
      ...validateSkillRefs({ refs: targetSkillIds, source, record: recheck, field: 'targetSkillIds' }),
      ...validateMisconceptions({ misconceptionIds, skillIds: targetSkillIds, source, record: recheck, required: false }),
      ...validateQuestionRefs({ refs: questionRefs, questionIndex, source, record: recheck, targetSkillIds }),
    ];
    if (!assignment) {
      issues.push(issue({
        severity: 'high',
        type: 'recheck_not_linked_to_assignment',
        source,
        objectId: idOf(recheck),
        actual: assignmentId,
        message: 'Recheck diagnostic is not linked to an audited Recovery Pack assignment.',
      }));
    } else {
      const targets = new Set(targetSkillIds.map(canonicalSkillId).filter(Boolean));
      const assigned = new Set(assignmentSkillIds.map(canonicalSkillId).filter(Boolean));
      const missing = [...assigned].filter((skillId) => !targets.has(skillId));
      const extra = [...targets].filter((skillId) => !assigned.has(skillId));
      if (missing.length || extra.length) {
        issues.push(issue({
          severity: 'high',
          type: 'recheck_target_mismatch',
          source,
          objectId: idOf(recheck),
          expected: [...assigned].join(', '),
          actual: [...targets].join(', '),
          message: 'Recheck target skills do not match the linked assignment target skills.',
        }));
      }
    }
    if (!misconceptionIds.length) {
      issues.push(issue({
        severity: 'medium',
        type: 'recheck_missing_misconception_specificity',
        source,
        objectId: idOf(recheck),
        message: 'Recheck is skill-linked but has no targeted misconception evidence.',
      }));
    }
    return {
      recordType: source,
      recordId: idOf(recheck),
      assignmentId,
      targetSkillIds: unique(targetSkillIds.map(canonicalSkillId).filter(Boolean)),
      status: statusFromIssues(issues),
      issues,
    };
  });
}

export function auditWorksheetIntegrity({ worksheets = [], questionIndex = buildQuestionReferenceIndex() } = {}) {
  return asArray(worksheets).map((worksheet) => {
    const source = 'worksheets';
    const generatedQuestions = asArray(worksheet.generatedContent?.questions);
    const refs = generatedQuestions.map((q) => q.questionId || q.sourceQuestionId || q.fingerprint).filter(Boolean);
    const skillRefs = [
      ...asArray(worksheet.skillIds),
      ...asArray(worksheet.skillsToReinforce),
      ...asArray(worksheet.completion?.skillsImproved),
      ...generatedQuestions.map((q) => q.frameworkSkillId || q.skillId),
      ...asArray(worksheet.answerKey).map((row) => row.skillId),
    ].filter(Boolean);
    const issues = [
      ...validateSkillRefs({ refs: skillRefs, source, record: worksheet, field: 'skill references', allowObjectIds: true }),
      ...validateQuestionRefs({ refs, questionIndex, source, record: worksheet, targetSkillIds: skillRefs }),
    ];
    if (!clean(worksheet.interventionSourceType || worksheet.sourceType || worksheet.sourceMode)
      || !clean(worksheet.interventionSourceId || worksheet.sourceId || worksheet.linkedAssignmentId)) {
      issues.push(issue({
        severity: 'medium',
        type: 'worksheet_missing_source_link',
        source,
        objectId: idOf(worksheet),
        message: 'Worksheet has no sourceType/sourceId or linked assignment evidence.',
      }));
    }
    const text = [
      worksheet.generatedContent?.title,
      worksheet.overallSummary,
      ...generatedQuestions.map((q) => `${q.stem || q.prompt || ''} ${q.skillName || ''}`),
      ...asArray(worksheet.answerKey).map((row) => `${row.skillName || ''} ${row.explanation || ''}`),
    ].join(' ');
    if (/\bF\d{3}\b/.test(text)) {
      issues.push(issue({
        severity: 'high',
        type: 'worksheet_user_copy_raw_f_code',
        source,
        objectId: idOf(worksheet),
        message: 'Worksheet student/parent-visible copy includes raw F-code labels.',
      }));
    }
    return {
      recordType: source,
      recordId: idOf(worksheet),
      sourceType: worksheet.interventionSourceType || worksheet.sourceMode || '',
      questionReferenceCount: refs.length,
      status: statusFromIssues(issues),
      issues,
    };
  });
}

export function normalizeRecheckSnapshot({ recheck = {}, assignment = null, questionIndex = buildQuestionReferenceIndex() } = {}) {
  const targetSkillIds = unique(
    (asArray(recheck.targetSkillIds).length ? recheck.targetSkillIds : asArray(recheck.perSkillSnapshot).map((row) => row.skillId))
      .map(canonicalSkillId)
      .filter(Boolean)
  );
  const assignmentSkillIds = unique(asArray(assignment?.skillIds).map(canonicalSkillId).filter(Boolean));
  const normalizedTargetSkillIds = targetSkillIds.length ? targetSkillIds : assignmentSkillIds;
  const assignmentMisconceptions = [
    ...asArray(assignment?.misconceptionIds),
    ...asArray(assignment?.guidedPracticeFlow?.misconceptionIds),
  ];
  const existingMisconceptions = [
    ...asArray(recheck.targetMisconceptionIds),
    ...asArray(recheck.misconceptionTags),
    ...asArray(recheck.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags)),
  ];
  const targetMisconceptionIds = unique([...existingMisconceptions, ...assignmentMisconceptions])
    .map((tag) => {
      const matchingSkill = normalizedTargetSkillIds.find((skillId) => misconceptionRelevantToSkill(tag, skillId));
      return matchingSkill ? tag : normalizeMisconceptionForSkill(tag, normalizedTargetSkillIds[0]).value;
    })
    .filter((tag) => normalizedTargetSkillIds.some((skillId) => misconceptionRelevantToSkill(tag, skillId)));
  const evidenceQuestionIds = evidenceQuestionIdsFromRecheck(recheck)
    .filter((ref) => questionIndex.has(ref));
  const missingEvidenceQuestionIds = evidenceQuestionIdsFromRecheck(recheck)
    .filter((ref) => !questionIndex.has(ref));
  const patch = {};
  if (assignment && !clean(recheck.assignmentId)) patch.assignmentId = idOf(assignment);
  if (assignment && !clean(recheck.sourceType)) patch.sourceType = 'assignment';
  if (assignment && !clean(recheck.sourceId)) patch.sourceId = idOf(assignment);
  if (normalizedTargetSkillIds.length && normalizedTargetSkillIds.join('|') !== asArray(recheck.targetSkillIds).join('|')) {
    patch.targetSkillIds = normalizedTargetSkillIds;
  }
  if (targetMisconceptionIds.length && targetMisconceptionIds.join('|') !== asArray(recheck.targetMisconceptionIds).join('|')) {
    patch.targetMisconceptionIds = targetMisconceptionIds;
  }
  if (evidenceQuestionIds.length) patch.evidenceQuestionIds = evidenceQuestionIds;
  patch.skillLabels = normalizedTargetSkillIds.map(skillLabelFor).filter(Boolean);
  patch.confidenceLabel = evidenceQuestionIds.length && targetMisconceptionIds.length ? 'Moderate Confidence' : 'Limited Evidence';

  return {
    recordId: idOf(recheck),
    patch,
    changed: Object.keys(patch).some((key) => JSON.stringify(patch[key]) !== JSON.stringify(recheck[key])),
    missingEvidenceQuestionIds,
    unrepaired: [
      missingEvidenceQuestionIds.length ? 'missing_question_reference' : null,
      targetMisconceptionIds.length ? null : 'missing_target_misconception',
      normalizedTargetSkillIds.length ? null : 'missing_target_skill',
      assignment ? null : 'missing_assignment_link',
    ].filter(Boolean),
  };
}

export function normalizeLegacyMistakeEvidence({ mistake = {}, skillLookup = {} } = {}) {
  const rawSkill = clean(mistake.skillCode || mistake.skillId);
  const canonicalFromRaw = canonicalSkillId(rawSkill);
  const lookup = skillLookup[rawSkill] || skillLookup[clean(mistake.skillId)] || skillLookup[clean(mistake.skillCode)] || null;
  const normalizedSkillId = canonicalFromRaw || canonicalSkillId(lookup?.frameworkSkillId || lookup?.mathPathSkillId || lookup?.slug || '');
  const normalizedMisconception = normalizeMisconceptionForSkill(mistake.misconceptionTag || mistake.mistakeCode, normalizedSkillId);
  const reviewed = Boolean(mistake.reviewed || mistake.status === 'reviewed');
  const hasMasteryEvidence = Boolean(clean(mistake.masteryEvidence?.evidenceType));
  const hasUnderstandingEvidence = Boolean(mistake.understandingCheck?.passed);
  const hasCorrectionEvidence = Boolean(clean(mistake.correctionAttempt) || clean(mistake.reflection));
  const learningStatus = hasMasteryEvidence
    ? 'mastered'
    : hasUnderstandingEvidence
      ? 'understood'
      : hasCorrectionEvidence
        ? 'corrected'
        : reviewed
          ? 'acknowledged'
          : clean(mistake.learningStatus || 'new') || 'new';
  const patch = {};
  if (normalizedSkillId && clean(mistake.skillCode) !== normalizedSkillId) patch.skillCode = normalizedSkillId;
  if (normalizedMisconception.changed) patch.misconceptionTag = normalizedMisconception.value;
  if (learningStatus && mistake.learningStatus !== learningStatus) patch.learningStatus = learningStatus;
  if (!hasMasteryEvidence && (mistake.resolved || mistake.learningStatus === 'mastered')) {
    patch.resolved = false;
    patch.status = reviewed || learningStatus !== 'new' ? 'reviewed' : 'open';
  }
  return {
    recordId: idOf(mistake),
    patch,
    changed: Object.keys(patch).length > 0,
    normalizedSkillId,
    normalizedMisconceptionId: normalizedMisconception.value,
    evidenceStatus: hasMasteryEvidence ? 'mastery_evidence' : hasUnderstandingEvidence ? 'understanding_evidence' : hasCorrectionEvidence ? 'correction_evidence' : reviewed ? 'reviewed_only' : 'limited_evidence',
    unrepaired: [
      normalizedSkillId ? null : 'missing_canonical_skill',
      normalizedMisconception.source === 'unmapped' || normalizedMisconception.source === 'alias_not_relevant_to_skill' ? 'missing_misconception_mapping' : null,
    ].filter(Boolean),
  };
}

export function buildAuditWorksheetFromAssignment({ assignment = {}, generatedQuestions = [] } = {}) {
  const refs = questionReferencesFromGuidedPracticeFlow(assignment.guidedPracticeFlow);
  const questionIndex = buildQuestionReferenceIndex({ generatedQuestions });
  const questions = refs
    .map((ref, index) => {
      const question = questionIndex.get(ref);
      if (!question) return null;
      const skillId = canonicalSkillId(question.skillId) || canonicalSkillId(asArray(assignment.skillIds)[0]);
      const label = skillLabelFor(skillId);
      return {
        n: index + 1,
        questionId: question.sourceQuestionId || question.fingerprint || clean(question._id || ref),
        frameworkSkillId: skillId,
        stem: question.prompt || question.stem || '',
        skillName: label?.studentName || label?.displayName || '',
        requiredVisualTypes: question.requiredVisualTypes || [],
        providedVisualTypes: question.providedVisualTypes || [],
        answer: question.finalAnswer || question.answer?.display || asArray(question.acceptedAnswers)[0] || '',
        workedSolution: asArray(question.solutionSteps).join('\n') || question.explanation || '',
        misconceptionTags: question.misconceptionTags || [],
      };
    })
    .filter(Boolean);
  const skillIds = unique([
    ...asArray(assignment.skillIds).map(canonicalSkillId),
    ...questions.map((q) => q.frameworkSkillId),
  ].filter(Boolean));
  return {
    _id: `audit_worksheet_${idOf(assignment) || 'recovery_pack'}`,
    domain: 'fractions',
    sourceMode: 'recovery_pack',
    worksheetType: 'recovery_worksheet',
    interventionSourceType: 'recovery_pack',
    interventionSourceId: idOf(assignment),
    generatedFor: { studentId: clean(assignment.studentId) },
    skillIds,
    generatedContent: {
      title: 'Recovery Pack Worksheet',
      scopeLabel: FRACTIONS_PILOT_SCOPE_LABEL,
      questions,
      visualModelReferences: questions
        .filter((q) => asArray(q.requiredVisualTypes).length || asArray(q.providedVisualTypes).length)
        .map((q) => ({
          questionId: q.questionId,
          skillId: q.frameworkSkillId,
          requiredVisualTypes: q.requiredVisualTypes,
          providedVisualTypes: q.providedVisualTypes,
        })),
    },
    answerKey: questions.map((q) => ({
      questionId: q.questionId,
      skillId: q.frameworkSkillId,
      skillName: q.skillName,
      answer: q.answer,
      explanation: q.workedSolution,
      misconceptionNotes: q.misconceptionTags,
    })),
  };
}

export function auditPaperAnalysisIntegrity({ paperAnalyses = [] } = {}) {
  return asArray(paperAnalyses).map((paper) => {
    const source = 'paperAnalyses';
    const skillRefs = [
      ...asArray(paper.weakSkillIds),
      ...asArray(paper.detectedQuestions).flatMap((question) => question.detectedSkillIds),
      ...asArray(paper.recommendedActions).map((action) => action.skillId),
    ];
    const misconceptionIds = asArray(paper.detectedQuestions).flatMap((question) => question.misconceptionTags);
    const issues = [
      ...validateSkillRefs({ refs: skillRefs, source, record: paper, field: 'skill references' }),
      ...validateMisconceptions({ misconceptionIds, skillIds: skillRefs, source, record: paper, required: false }),
      ...auditReportClaimIntegrity({ reports: [{ ...paper.reportSummary, _id: idOf(paper), reportSummary: paper.reportSummary }] }),
    ];
    if (['reviewed', 'assigned'].includes(paper.status) && !asArray(paper.detectedQuestions).some((q) => q.adultConfirmedWrong || q.adultConfirmedCorrect)) {
      issues.push(issue({
        severity: 'medium',
        type: 'paper_review_missing_adult_confirmation',
        source,
        objectId: idOf(paper),
        message: 'Reviewed paper analysis has no adult-confirmed question outcomes.',
      }));
    }
    return {
      recordType: source,
      recordId: idOf(paper),
      status: statusFromIssues(issues),
      issues,
    };
  });
}

export function buildMisconceptionDensityReport({
  generatedQuestions = [],
  mistakes = [],
  mistakeRecords = [],
  assignments = [],
  rechecks = [],
} = {}) {
  return FRACTION_CANONICAL_SKILL_ROWS.map((skill) => {
    const skillId = skill.frameworkSkillId;
    const questionTagCount = asArray(generatedQuestions)
      .filter((q) => canonicalSkillId(q.skillId) === skillId && asArray(q.misconceptionTags).length)
      .length;
    const mistakeTagCount = [
      ...asArray(mistakes).filter((m) => canonicalSkillId(m.skillCode || m.skillId) === skillId && clean(m.misconceptionTag)),
      ...asArray(mistakeRecords).filter((m) => canonicalSkillId(m.skillId) === skillId && clean(m.mistakeCode)),
    ].length;
    const recoveryPackTagCount = asArray(assignments)
      .filter((a) => asArray(a.skillIds).map(canonicalSkillId).includes(skillId))
      .filter((a) => asArray(a.misconceptionIds).length || asArray(a.guidedPracticeFlow?.misconceptionIds).length)
      .length;
    const recheckTagCount = asArray(rechecks)
      .filter((r) => {
        const targets = asArray(r.targetSkillIds).length ? r.targetSkillIds : asArray(r.perSkillSnapshot).map((row) => row.skillId);
        return targets.map(canonicalSkillId).includes(skillId);
      })
      .filter((r) => asArray(r.targetMisconceptionIds).length || asArray(r.misconceptionTags).length || asArray(r.perSkillSnapshot).some((row) => asArray(row.misconceptionTags).length))
      .length;
    const total = questionTagCount + mistakeTagCount + recoveryPackTagCount + recheckTagCount;
    const status = total === 0
      ? 'Not Ready'
      : (questionTagCount > 0 && (recoveryPackTagCount > 0 || recheckTagCount > 0))
        ? 'Ready'
        : 'Partial';
    return {
      skillId,
      skillName: skill.displayName,
      questionTagCount,
      mistakeTagCount,
      recoveryPackTagCount,
      recheckTagCount,
      status,
    };
  });
}

export function auditCuratedReferenceIntegrity({ assignments = [], generatedQuestions = [], questionRecords = [] } = {}) {
  const questionIndex = buildQuestionReferenceIndex({ generatedQuestions, questionRecords });
  const rows = [];
  for (const assignment of asArray(assignments)) {
    for (const ref of questionReferencesFromGuidedPracticeFlow(assignment.guidedPracticeFlow)) {
      const question = questionIndex.get(ref);
      rows.push({
        assignmentId: idOf(assignment),
        referenceId: ref,
        resolved: Boolean(question),
        source: question ? 'curated' : 'fallback_required',
        skillId: canonicalSkillId(question?.skillId),
        hasExplanation: Boolean(clean(question?.explanation) || asArray(question?.solutionSteps).length || clean(question?.workedSolution)),
        hasMisconceptionTags: asArray(question?.misconceptionTags).length > 0,
        issueTypes: [
          question ? null : 'missing_question_reference',
          question && !clean(question.explanation) && !asArray(question.solutionSteps).length && !clean(question.workedSolution) ? 'question_missing_explanation' : null,
          question && !asArray(question.misconceptionTags).length ? 'question_missing_misconception_tags' : null,
        ].filter(Boolean),
      });
    }
  }
  return rows;
}

function flattenIssues(rows = []) {
  return rows.flatMap((row) => asArray(row.issues));
}

function countStatuses(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, { Ready: 0, Partial: 0, 'Not Ready': 0 });
}

export async function auditFractionsRuntimeEvidenceIntegrity({
  assignments = [],
  generatedQuestions = [],
  questionRecords = [],
  rechecks = [],
  worksheets = [],
  paperAnalyses = [],
  reports = [],
  diagnostics = [],
  mistakes = [],
  mistakeRecords = [],
} = {}) {
  const questionIndex = buildQuestionReferenceIndex({ generatedQuestions, questionRecords });
  const recoveryPackRows = auditRecoveryPackIntegrity({ assignments, questionIndex });
  const recheckRows = auditRecheckIntegrity({ rechecks, assignments, questionIndex });
  const worksheetRows = auditWorksheetIntegrity({ worksheets, questionIndex });
  const paperRows = auditPaperAnalysisIntegrity({ paperAnalyses });
  const reportIssues = auditReportClaimIntegrity({ reports });
  const diagnosticIssues = asArray(diagnostics).flatMap((diagnostic) => [
    ...validateSkillRefs({
      refs: [
        ...asArray(diagnostic.targetSkillIds),
        ...asArray(diagnostic.assignedPracticeSkillIds),
        ...asArray(diagnostic.perSkillSnapshot).map((row) => row.skillId),
      ],
      source: 'diagnostics',
      record: diagnostic,
      field: 'skill references',
    }),
    ...validateMisconceptions({
      misconceptionIds: asArray(diagnostic.perSkillSnapshot).flatMap((row) => asArray(row.misconceptionTags)),
      skillIds: asArray(diagnostic.perSkillSnapshot).map((row) => row.skillId),
      source: 'diagnostics',
      record: diagnostic,
      required: false,
    }),
  ]);
  const mistakeIssues = [
    ...asArray(mistakes).flatMap((mistake) => [
      ...validateSkillRefs({ refs: [mistake.skillCode || mistake.skillId].filter(Boolean), source: 'mistakes', record: mistake, field: 'skillCode' }),
      ...validateMisconceptions({ misconceptionIds: [mistake.misconceptionTag].filter(Boolean), skillIds: [mistake.skillCode || mistake.skillId].filter(Boolean), source: 'mistakes', record: mistake }),
    ]),
    ...asArray(mistakeRecords).flatMap((record) => [
      ...validateSkillRefs({ refs: [record.skillId].filter(Boolean), source: 'mistakeRecords', record, field: 'skillId' }),
      ...validateMisconceptions({ misconceptionIds: [record.mistakeCode].filter(Boolean), skillIds: [record.skillId].filter(Boolean), source: 'mistakeRecords', record }),
    ]),
  ];
  const density = buildMisconceptionDensityReport({ generatedQuestions, mistakes, mistakeRecords, assignments, rechecks });
  const curatedReferences = auditCuratedReferenceIntegrity({ assignments, generatedQuestions, questionRecords });
  const densityIssues = density
    .filter((row) => row.status !== 'Ready')
    .map((row) => issue({
      severity: row.status === 'Not Ready' ? 'high' : 'medium',
      type: row.status === 'Not Ready' ? 'misconception_density_missing' : 'misconception_density_sparse',
      source: 'misconceptionDensity',
      skillId: row.skillId,
      message: `${row.skillId} has ${row.status === 'Not Ready' ? 'no' : 'thin'} runtime misconception evidence.`,
    }));

  const allIssues = [
    ...flattenIssues(recoveryPackRows),
    ...flattenIssues(recheckRows),
    ...flattenIssues(worksheetRows),
    ...flattenIssues(paperRows),
    ...reportIssues,
    ...diagnosticIssues,
    ...mistakeIssues,
    ...densityIssues,
  ];

  const recordsAudited = {
    assignments: asArray(assignments).length,
    recoveryPacks: recoveryPackRows.length,
    rechecks: asArray(rechecks).length,
    worksheets: asArray(worksheets).length,
    paperAnalyses: asArray(paperAnalyses).length,
    reports: asArray(reports).length,
    diagnostics: asArray(diagnostics).length,
    mistakes: asArray(mistakes).length,
    mistakeRecords: asArray(mistakeRecords).length,
    generatedQuestions: asArray(generatedQuestions).length,
    curatedReferences: curatedReferences.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    pilotScope: FRACTIONS_PILOT_SCOPE_LABEL,
    canonicalSkillCount: FRACTION_CANONICAL_SKILL_ROWS.length,
    recordsAudited,
    statusCounts: {
      recoveryPacks: countStatuses(recoveryPackRows),
      rechecks: countStatuses(recheckRows),
      worksheets: countStatuses(worksheetRows),
      paperAnalyses: countStatuses(paperRows),
      misconceptionDensity: countStatuses(density),
    },
    recoveryPacks: recoveryPackRows,
    rechecks: recheckRows,
    worksheets: worksheetRows,
    paperAnalyses: paperRows,
    reportClaimIssues: reportIssues,
    diagnosticIssues,
    mistakeIssues,
    misconceptionDensity: density,
    curatedReferences,
    issues: allIssues,
    issueCounts: countBySeverity(allIssues),
    ok: !allIssues.some((row) => row.severity === 'critical' || row.severity === 'high'),
  };
}

function assignmentMap(assignments = []) {
  return new Map(asArray(assignments).flatMap((assignment) => [
    [idOf(assignment), assignment],
    [clean(assignment._id), assignment],
    [clean(assignment.id), assignment],
  ].filter(([key]) => key)));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function applyPatch(row = {}, patch = {}) {
  return { ...clone(row), ...clone(patch) };
}

export function buildRuntimeEvidenceRepairPlan({
  assignments = [],
  generatedQuestions = [],
  questionRecords = [],
  rechecks = [],
  worksheets = [],
  paperAnalyses = [],
  reports = [],
  diagnostics = [],
  mistakes = [],
  mistakeRecords = [],
} = {}) {
  const questionIndex = buildQuestionReferenceIndex({ generatedQuestions, questionRecords });
  const assignmentsById = assignmentMap(assignments);
  const recheckRepairs = asArray(rechecks).map((recheck) => {
    const assignment = assignmentsById.get(clean(recheck.assignmentId || recheck.sourceId));
    return normalizeRecheckSnapshot({ recheck, assignment, questionIndex });
  });
  const repairedRechecks = asArray(rechecks).map((recheck) => {
    const repair = recheckRepairs.find((row) => row.recordId === idOf(recheck));
    return repair?.changed ? applyPatch(recheck, repair.patch) : recheck;
  });

  const mistakeRepairs = [
    ...asArray(mistakes).map((mistake) => ({ collection: 'mistakes', ...normalizeLegacyMistakeEvidence({ mistake }) })),
    ...asArray(mistakeRecords).map((record) => {
      const normalized = normalizeLegacyMistakeEvidence({
        mistake: {
          ...record,
          skillCode: record.skillId,
          misconceptionTag: record.mistakeCode,
        },
      });
      return {
        collection: 'mistakeRecords',
        ...normalized,
        patch: {
          ...(normalized.patch.skillCode ? { skillId: normalized.patch.skillCode } : {}),
          ...(normalized.patch.misconceptionTag ? { mistakeCode: normalized.patch.misconceptionTag } : {}),
        },
      };
    }),
  ];
  const repairedMistakes = asArray(mistakes).map((mistake) => {
    const repair = mistakeRepairs.find((row) => row.collection === 'mistakes' && row.recordId === idOf(mistake));
    return repair?.changed ? applyPatch(mistake, repair.patch) : mistake;
  });
  const repairedMistakeRecords = asArray(mistakeRecords).map((record) => {
    const repair = mistakeRepairs.find((row) => row.collection === 'mistakeRecords' && row.recordId === idOf(record));
    return repair?.changed ? applyPatch(record, repair.patch) : record;
  });

  const seededWorksheet = !asArray(worksheets).length && asArray(assignments).length
    ? buildAuditWorksheetFromAssignment({ assignment: assignments[0], generatedQuestions })
    : null;
  const repairedWorksheets = seededWorksheet ? [seededWorksheet] : worksheets;

  const repairedReports = asArray(reports).map((report) => ({
    ...report,
    scopeLabel: report.scopeLabel || report.pilotScope || report.reportSummary?.scopeLabel || FRACTIONS_PILOT_SCOPE_LABEL,
    confidenceLabel: report.confidenceLabel || report.reportSummary?.confidenceLabel || 'Limited Evidence',
  }));

  return {
    generatedAt: new Date().toISOString(),
    dryRun: true,
    recheckRepairs,
    mistakeRepairs,
    worksheetSeededForAudit: Boolean(seededWorksheet),
    worksheetSeedRecord: seededWorksheet,
    repairedRuntime: {
      assignments,
      generatedQuestions,
      questionRecords,
      rechecks: repairedRechecks,
      worksheets: repairedWorksheets,
      paperAnalyses,
      reports: repairedReports,
      diagnostics,
      mistakes: repairedMistakes,
      mistakeRecords: repairedMistakeRecords,
    },
    summary: {
      rechecksChanged: recheckRepairs.filter((row) => row.changed).length,
      rechecksUnrepaired: recheckRepairs.filter((row) => row.unrepaired.length).length,
      mistakesChanged: mistakeRepairs.filter((row) => row.changed).length,
      mistakesUnrepaired: mistakeRepairs.filter((row) => row.unrepaired.length).length,
      worksheetsSeededForAudit: seededWorksheet ? 1 : 0,
    },
  };
}

export function evaluatePilotClaimGate(report = {}) {
  const criticalIssues = asArray(report.issues).filter((row) => row.severity === 'critical');
  const highIssues = asArray(report.issues).filter((row) => row.severity === 'high');
  const unresolvedCriticalRecheckRefs = asArray(report.issues).filter((row) => row.source === 'rechecks' && row.type === 'missing_question_reference');
  const worksheetMissing = Number(report.recordsAudited?.worksheets || 0) === 0;
  const reportOverclaims = asArray(report.issues).filter((row) => row.type === 'report_overclaim');
  const mistakeMasteryInflation = asArray(report.issues).filter((row) => row.type === 'mistake_mastery_skill_mastery_conflation');
  const blocked = Boolean(
    criticalIssues.length
    || unresolvedCriticalRecheckRefs.length
    || worksheetMissing
    || reportOverclaims.length
    || mistakeMasteryInflation.length
  );
  const partial = !blocked && highIssues.length > 0;
  return {
    result: blocked ? 'Pilot evidence blocked' : partial ? 'Pilot evidence partial' : 'Pilot evidence clean',
    blocked,
    reasons: [
      criticalIssues.length ? `${criticalIssues.length} critical runtime issue(s)` : null,
      unresolvedCriticalRecheckRefs.length ? `${unresolvedCriticalRecheckRefs.length} unresolved recheck question reference issue(s)` : null,
      worksheetMissing ? 'worksheet audit path missing' : null,
      reportOverclaims.length ? 'parent/adult report overclaim detected' : null,
      mistakeMasteryInflation.length ? 'mistake-level mastery conflated with skill mastery' : null,
      !blocked && highIssues.length ? `${highIssues.length} high issue(s) remain` : null,
    ].filter(Boolean),
  };
}

export async function runRuntimeEvidenceRepairAudit(runtime = {}) {
  const before = await auditFractionsRuntimeEvidenceIntegrity(runtime);
  const repairPlan = buildRuntimeEvidenceRepairPlan(runtime);
  const after = await auditFractionsRuntimeEvidenceIntegrity(repairPlan.repairedRuntime);
  return {
    generatedAt: new Date().toISOString(),
    before,
    repairPlan,
    after,
    pilotClaimGate: evaluatePilotClaimGate(after),
  };
}

export async function loadFractionsRuntimeEvidenceFromDb({ limit = 200 } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  const [assignments, initialGeneratedQuestions, rechecks, diagnostics, worksheets, paperAnalyses, mistakes, mistakeRecords] = await Promise.all([
    MathPathAssignment.find({ domainId: 'fractions' }).sort({ updatedAt: -1 }).limit(cap).lean(),
    GeneratedQuestion.find({ domainId: 'fractions', isActive: true }).sort({ updatedAt: -1 }).limit(cap * 5).lean(),
    MathPathDiagnosticSession.find({ domainId: 'fractions', diagnosticPurpose: 'recheck' }).sort({ completedAt: -1, updatedAt: -1 }).limit(cap).lean(),
    MathPathDiagnosticSession.find({ domainId: 'fractions' }).sort({ completedAt: -1, updatedAt: -1 }).limit(cap).lean(),
    Worksheet.find({ domain: 'fractions' }).sort({ updatedAt: -1 }).limit(cap).lean(),
    PaperAnalysis.find({ domainId: 'fractions' }).sort({ updatedAt: -1 }).limit(cap).lean(),
    Mistake.find({ module: 'MathPath' }).sort({ updatedAt: -1, occurredAt: -1 }).limit(cap).lean(),
    MathPathMistakeRecord.find({ domainId: 'fractions' }).sort({ updatedAt: -1 }).limit(cap).lean(),
  ]);
  const recheckQuestionRefs = unique(asArray(rechecks).flatMap(evidenceQuestionIdsFromRecheck));
  const objectQuestionRefs = recheckQuestionRefs.filter((ref) => OBJECT_ID_RE.test(ref));
  const stringQuestionRefs = recheckQuestionRefs.filter((ref) => !OBJECT_ID_RE.test(ref));
  const referencedGeneratedQuestions = recheckQuestionRefs.length
    ? await GeneratedQuestion.find({
      domainId: 'fractions',
      $or: [
        ...(objectQuestionRefs.length ? [{ _id: { $in: objectQuestionRefs } }] : []),
        ...(stringQuestionRefs.length ? [
          { sourceQuestionId: { $in: stringQuestionRefs } },
          { fingerprint: { $in: stringQuestionRefs } },
          { templateId: { $in: stringQuestionRefs } },
          { questionFamilyId: { $in: stringQuestionRefs } },
        ] : []),
      ],
    }).lean()
    : [];
  const questionRecords = objectQuestionRefs.length
    ? await Question.find({ _id: { $in: objectQuestionRefs } }).lean()
    : [];
  const generatedQuestionsById = new Map([...initialGeneratedQuestions, ...referencedGeneratedQuestions].map((q) => [clean(q._id || q.fingerprint || q.sourceQuestionId), q]));
  const generatedQuestions = [...generatedQuestionsById.values()];

  const skillObjectIds = unique(asArray(mistakes).flatMap((mistake) => [
    clean(mistake.skillId),
    clean(mistake.skillCode),
  ]).filter((value) => OBJECT_ID_RE.test(value)));
  const skills = skillObjectIds.length
    ? await Skill.find({ _id: { $in: skillObjectIds } }).lean()
    : [];
  const skillLookup = Object.fromEntries(skills.map((skill) => [clean(skill._id), {
    frameworkSkillId: skill.metadata?.frameworkCode || skill.metadata?.mathPathSkillId || '',
    mathPathSkillId: skill.metadata?.mathPathSkillId || '',
    slug: skill.slug || '',
  }]));
  const normalizedMistakes = mistakes.map((mistake) => {
    const normalized = normalizeLegacyMistakeEvidence({ mistake, skillLookup });
    return normalized.changed ? applyPatch(mistake, normalized.patch) : mistake;
  });

  const reports = [
    ...paperAnalyses.map((paper) => ({
      _id: paper._id,
      reportSummary: paper.reportSummary,
      scopeLabel: paper.reportSummary?.scopeLabel,
      parentFriendlySummary: paper.reportSummary?.parentFriendlySummary,
      overallSummary: paper.reportSummary?.overallSummary,
    })),
  ];

  return {
    assignments,
    generatedQuestions,
    questionRecords,
    rechecks,
    diagnostics,
    worksheets,
    paperAnalyses,
    reports,
    mistakes: normalizedMistakes,
    mistakeRecords,
  };
}

export async function auditFractionsRuntimeEvidenceFromDb(options = {}) {
  const runtime = await loadFractionsRuntimeEvidenceFromDb(options);
  return auditFractionsRuntimeEvidenceIntegrity(runtime);
}

export async function attachTeachingFlowWarnings(assignments = []) {
  const out = [];
  for (const assignment of asArray(assignments)) {
    try {
      const flow = await buildRecoveryPackTeachingFlow(assignment);
      out.push({ ...assignment, teachingFlowWarnings: flow.warnings || [] });
    } catch {
      out.push(assignment);
    }
  }
  return out;
}

export default {
  attachTeachingFlowWarnings,
  auditCuratedReferenceIntegrity,
  auditFractionsRuntimeEvidenceFromDb,
  auditFractionsRuntimeEvidenceIntegrity,
  auditPaperAnalysisIntegrity,
  auditRecoveryPackIntegrity,
  auditRecheckIntegrity,
  auditReportClaimIntegrity,
  auditWorksheetIntegrity,
  buildAuditWorksheetFromAssignment,
  buildRuntimeEvidenceRepairPlan,
  buildMisconceptionDensityReport,
  buildQuestionReferenceIndex,
  evaluatePilotClaimGate,
  loadFractionsRuntimeEvidenceFromDb,
  normalizeLegacyMistakeEvidence,
  normalizeRecheckSnapshot,
  runRuntimeEvidenceRepairAudit,
};
