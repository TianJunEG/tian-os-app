const RECHECK_COMPLETION_RATIO = 0.8;
const RECHECK_ACCURACY_THRESHOLD = 70;
const ADVANCEMENT_READINESS_THRESHOLD = 75;
const ENRICHMENT_READINESS_THRESHOLD = 88;
const WEAK_SKILL_THRESHOLD = 60;

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function latestAssignment(assignments = []) {
  return [...assignments]
    .filter((assignment) => assignment && ['assigned', 'in_progress', 'completed'].includes(assignment.status))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null;
}

function weakSkillsFromGrowth(growth = {}) {
  return unique([
    ...(growth.remainingWeakSkills || []),
    ...(growth.perSkillGrowth || [])
      .filter((row) => row.currentScore !== null && row.currentScore !== undefined && num(row.currentScore) < WEAK_SKILL_THRESHOLD)
      .map((row) => row.skillId),
  ]);
}

export function evaluateRecheckReadiness({ assignments = [], growth = {} } = {}) {
  const readyAssignments = [];
  const reasons = [];

  for (const assignment of assignments || []) {
    const completion = assignment.completion || {};
    const attempted = num(completion.questionsAttempted);
    const target = num(assignment.targetQuestionCount || completion.questionsAssigned);
    const accuracy = num(completion.accuracy);
    const alreadyCreated = Boolean(assignment.recheck?.diagnosticSessionId);
    const explicitReady = Boolean(assignment.recheck?.recommended && !alreadyCreated);
    const completedReady = assignment.status === 'completed' && !alreadyCreated;
    const thresholdReady = target > 0
      && attempted >= target * RECHECK_COMPLETION_RATIO
      && accuracy >= RECHECK_ACCURACY_THRESHOLD
      && !alreadyCreated;

    if (explicitReady || completedReady || thresholdReady) {
      readyAssignments.push({
        assignmentId: String(assignment._id || assignment.id || ''),
        title: assignment.title || 'Recovery Pack',
        skillIds: assignment.skillIds || [],
        attempted,
        target,
        accuracy,
        reason: explicitReady
          ? assignment.recheck?.reason || 'Recovery Pack is marked ready for recheck.'
          : completedReady
            ? 'Recovery Pack is completed.'
            : `At least ${Math.round(RECHECK_COMPLETION_RATIO * 100)}% complete with ${RECHECK_ACCURACY_THRESHOLD}% or higher accuracy.`,
      });
    }
  }

  if (!readyAssignments.length) {
    const active = latestAssignment(assignments);
    if (active) {
      const completion = active.completion || {};
      reasons.push(`${active.title || 'Recovery Pack'} is not ready yet: ${num(completion.questionsAttempted)}/${num(active.targetQuestionCount || completion.questionsAssigned)} completed at ${num(completion.accuracy)}% accuracy.`);
    } else if (growth.latest) {
      reasons.push('No active Recovery Pack is available to recheck.');
    } else {
      reasons.push('A baseline diagnostic is needed before recheck readiness can be evaluated.');
    }
  }

  return {
    ready: readyAssignments.length > 0,
    readyAssignments,
    reasons,
  };
}

export function evaluateAdvancementReadiness({ growth = {}, assignments = [] } = {}) {
  const latestReadiness = num(growth.latest?.readinessScore, null);
  const weakSkills = weakSkillsFromGrowth(growth);
  const activeAssignments = assignments.filter((assignment) => ['assigned', 'in_progress'].includes(assignment.status));
  const reasons = [];

  if (latestReadiness === null) reasons.push('No completed diagnostic is available yet.');
  if (latestReadiness !== null && latestReadiness < ADVANCEMENT_READINESS_THRESHOLD) {
    reasons.push(`Current readiness is ${latestReadiness}%, below the ${ADVANCEMENT_READINESS_THRESHOLD}% advancement threshold.`);
  }
  if (weakSkills.length) reasons.push(`${weakSkills[0]} still needs support.`);
  if (activeAssignments.length) reasons.push('An active Recovery Pack is still in progress.');

  return {
    ready: latestReadiness !== null
      && latestReadiness >= ADVANCEMENT_READINESS_THRESHOLD
      && weakSkills.length === 0
      && activeAssignments.length === 0,
    reasons,
    latestReadiness,
    weakSkills,
  };
}

export function evaluateEnrichmentReadiness({ growth = {}, assignments = [] } = {}) {
  const latestReadiness = num(growth.latest?.readinessScore, null);
  const perSkill = growth.perSkillGrowth || [];
  const lowSkill = perSkill.find((row) => row.currentScore !== null && row.currentScore !== undefined && num(row.currentScore) < 80);
  const activeAssignments = assignments.filter((assignment) => ['assigned', 'in_progress'].includes(assignment.status));
  const reasons = [];

  if (latestReadiness === null) reasons.push('No completed diagnostic is available yet.');
  if (latestReadiness !== null && latestReadiness < ENRICHMENT_READINESS_THRESHOLD) {
    reasons.push(`Current readiness is ${latestReadiness}%, below the ${ENRICHMENT_READINESS_THRESHOLD}% enrichment threshold.`);
  }
  if (lowSkill) reasons.push(`${lowSkill.skillId} is below enrichment readiness.`);
  if (activeAssignments.length) reasons.push('Finish active intervention before enrichment.');

  return {
    ready: latestReadiness !== null
      && latestReadiness >= ENRICHMENT_READINESS_THRESHOLD
      && !lowSkill
      && activeAssignments.length === 0,
    reasons,
    latestReadiness,
  };
}

export function evaluateStudentReadiness({ growth = {}, assignments = [] } = {}) {
  return {
    recheck: evaluateRecheckReadiness({ assignments, growth }),
    advancement: evaluateAdvancementReadiness({ growth, assignments }),
    enrichment: evaluateEnrichmentReadiness({ growth, assignments }),
  };
}

export default {
  evaluateRecheckReadiness,
  evaluateAdvancementReadiness,
  evaluateEnrichmentReadiness,
  evaluateStudentReadiness,
};
