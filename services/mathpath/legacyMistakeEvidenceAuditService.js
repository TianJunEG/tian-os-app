const VALID_LEARNING_STATUSES = new Set(['new', 'acknowledged', 'corrected', 'understood', 'mastered']);

function clean(value = '') {
  return String(value || '').trim();
}

function id(value = '') {
  return String(value || '').trim();
}

export function hasCorrectionEvidence(mistake = {}) {
  return Boolean(clean(mistake.correctionAttempt) || clean(mistake.reflection));
}

export function hasUnderstandingEvidence(mistake = {}) {
  return Boolean(mistake.understandingCheck?.passed || clean(mistake.understandingCheck?.answer));
}

export function hasMasteryEvidence(mistake = {}) {
  return Boolean(clean(mistake.masteryEvidence?.evidenceType));
}

export function inferLegacyLearningStatus(mistake = {}) {
  if (hasMasteryEvidence(mistake)) return 'mastered';
  if (hasUnderstandingEvidence(mistake)) return 'understood';
  if (hasCorrectionEvidence(mistake)) return 'corrected';
  if (mistake.reviewed || mistake.status === 'reviewed') return 'acknowledged';
  const status = clean(mistake.learningStatus);
  return VALID_LEARNING_STATUSES.has(status) ? status : 'new';
}

export function classifyLegacyMistakeEvidence(mistake = {}) {
  const evidence = {
    correction: hasCorrectionEvidence(mistake),
    understanding: hasUnderstandingEvidence(mistake),
    mastery: hasMasteryEvidence(mistake),
  };
  const reviewed = Boolean(mistake.reviewed || mistake.status === 'reviewed');
  const resolved = Boolean(mistake.resolved || mistake.status === 'resolved');
  const learningStatus = VALID_LEARNING_STATUSES.has(clean(mistake.learningStatus)) ? clean(mistake.learningStatus) : '';
  const proposedState = inferLegacyLearningStatus(mistake);
  const masteredWithoutEvidence = (resolved || learningStatus === 'mastered') && !evidence.mastery;
  const reviewedWithoutEvidence = reviewed && !evidence.correction && !evidence.understanding && !evidence.mastery;

  let classification = 'new_or_unreviewed';
  if (learningStatus === 'mastered' || resolved) {
    classification = evidence.mastery ? 'mastered_with_evidence' : 'mastered_without_evidence';
  } else if (reviewed) {
    if (evidence.mastery) classification = 'mastered_with_evidence';
    else if (evidence.understanding || learningStatus === 'understood') classification = 'reviewed_with_understanding_evidence';
    else if (evidence.correction || learningStatus === 'corrected') classification = 'reviewed_with_correction_evidence';
    else classification = 'reviewed_without_evidence';
  } else if (evidence.mastery) {
    classification = 'mastered_with_evidence';
  }

  const riskLevel = masteredWithoutEvidence ? 'high' : reviewedWithoutEvidence ? 'medium' : 'low';
  const newResolved = proposedState === 'mastered' && evidence.mastery;
  const newStatus = newResolved ? 'resolved' : reviewed || proposedState !== 'new' ? 'reviewed' : 'open';

  return {
    mistakeId: id(mistake._id || mistake.id || mistake.mistakeId),
    studentId: id(mistake.studentId),
    skillId: id(mistake.skillCode || mistake.skillId),
    oldState: {
      reviewed: Boolean(mistake.reviewed),
      resolved: Boolean(mistake.resolved),
      status: mistake.status || '',
      learningStatus: mistake.learningStatus || '',
    },
    proposedState,
    proposedPatch: {
      learningStatus: proposedState,
      resolved: newResolved,
      status: newStatus,
    },
    evidenceFound: evidence,
    classification,
    riskLevel,
    progressRisk: masteredWithoutEvidence || reviewedWithoutEvidence,
    recommendedAction: masteredWithoutEvidence
      ? 'Remove resolved/mastered state until mastery evidence exists.'
      : reviewedWithoutEvidence
        ? 'Keep as acknowledged; ask student for correction and understanding evidence.'
        : 'No action needed.',
  };
}

export function buildLegacyMistakeEvidenceAudit({ mistakes = [] } = {}) {
  const rows = mistakes.map(classifyLegacyMistakeEvidence);
  const byClassification = rows.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    return acc;
  }, {});
  const progressRiskRecords = rows.filter((row) => row.progressRisk);
  return {
    generatedAt: new Date().toISOString(),
    totalLegacyMistakes: rows.length,
    reviewedWithEvidence: (byClassification.reviewed_with_correction_evidence || 0) + (byClassification.reviewed_with_understanding_evidence || 0),
    reviewedWithoutEvidence: byClassification.reviewed_without_evidence || 0,
    resolvedWithEvidence: byClassification.mastered_with_evidence || 0,
    resolvedWithoutEvidence: byClassification.mastered_without_evidence || 0,
    masteredWithEvidence: byClassification.mastered_with_evidence || 0,
    masteredWithoutEvidence: byClassification.mastered_without_evidence || 0,
    progressRiskRecords: progressRiskRecords.length,
    affectedStudents: [...new Set(progressRiskRecords.map((row) => row.studentId).filter(Boolean))],
    affectedSkills: [...new Set(progressRiskRecords.map((row) => row.skillId).filter(Boolean))],
    classifications: byClassification,
    recommendedAction: progressRiskRecords.length
      ? 'Run the dry-run report, review high-risk rows, then apply the backfill to downgrade reviewed-only/resolved-only legacy mistakes.'
      : 'No legacy mistake evidence risks found in this sample.',
    rows,
  };
}

export function buildLegacyMistakeEvidenceExport({ mistakes = [] } = {}) {
  return buildLegacyMistakeEvidenceAudit({ mistakes }).rows.map((row) => ({
    mistakeId: row.mistakeId,
    studentId: row.studentId,
    skillId: row.skillId,
    oldState: row.oldState,
    proposedState: row.proposedState,
    evidenceFound: row.evidenceFound,
    riskLevel: row.riskLevel,
    recommendedAction: row.recommendedAction,
  }));
}

export async function applyLegacyMistakeEvidenceBackfill({ mistakes = [], apply = false } = {}) {
  const rows = [];
  let updated = 0;

  for (const mistake of mistakes) {
    const row = classifyLegacyMistakeEvidence(mistake);
    rows.push(row);
    const needsUpdate = (
      mistake.learningStatus !== row.proposedPatch.learningStatus
      || Boolean(mistake.resolved) !== row.proposedPatch.resolved
      || mistake.status !== row.proposedPatch.status
    );
    if (apply && needsUpdate && typeof mistake.save === 'function') {
      mistake.learningStatus = row.proposedPatch.learningStatus;
      mistake.resolved = row.proposedPatch.resolved;
      mistake.status = row.proposedPatch.status;
      await mistake.save();
      updated += 1;
    } else if (apply && needsUpdate && typeof mistake.updateOne === 'function') {
      await mistake.updateOne({ $set: row.proposedPatch });
      updated += 1;
    } else if (!apply && needsUpdate) {
      updated += 1;
    }
  }

  const audit = buildLegacyMistakeEvidenceAudit({ mistakes });
  return {
    ...audit,
    dryRun: !apply,
    scanned: mistakes.length,
    wouldUpdate: apply ? undefined : updated,
    updated: apply ? updated : 0,
    rows,
  };
}

async function executeQuery(query, { sort = {}, limit = 0 } = {}) {
  let cursor = query;
  if (cursor?.sort) cursor = cursor.sort(sort);
  if (limit && cursor?.limit) cursor = cursor.limit(limit);
  if (cursor?.exec) return cursor.exec();
  return cursor;
}

export async function getLegacyMistakeEvidenceAudit({
  MistakeModel,
  module = 'MathPath',
  studentId = '',
  limit = 500,
  exportRows = false,
} = {}) {
  if (!MistakeModel?.find) throw new Error('MistakeModel is required.');
  const filter = {};
  if (module) filter.module = module;
  if (studentId) filter.studentId = studentId;
  const mistakes = await executeQuery(MistakeModel.find(filter), {
    sort: { occurredAt: -1, createdAt: -1 },
    limit: Math.min(Number(limit || 500), 1000),
  });
  const audit = buildLegacyMistakeEvidenceAudit({ mistakes });
  return exportRows ? { ...audit, export: buildLegacyMistakeEvidenceExport({ mistakes }) } : audit;
}

export default {
  applyLegacyMistakeEvidenceBackfill,
  buildLegacyMistakeEvidenceAudit,
  buildLegacyMistakeEvidenceExport,
  classifyLegacyMistakeEvidence,
  getLegacyMistakeEvidenceAudit,
  hasCorrectionEvidence,
  hasMasteryEvidence,
  hasUnderstandingEvidence,
  inferLegacyLearningStatus,
};
