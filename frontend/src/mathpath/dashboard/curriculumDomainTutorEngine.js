// Generic, domain-agnostic tutor intelligence for curriculum domains
// (Money, Time, Area & Perimeter, Volume, Circles, Ratio, Rate, Percentage,
// Algebra). Unlike the bespoke Fractions engine, this works from the data that
// is actually available for every domain — persisted skill states + logged
// mistakes — and resolves all skill / misconception names via an injected
// `resolvers` bundle (see getDomainResolvers in curriculumDomainIndex.js), so it
// stays a pure, unit-testable function with no domain imports of its own.
//
// It deliberately does NOT attempt fluency / retention / diagnostic modelling:
// those have no per-domain data source yet and remain Fractions-only.

const SECURE = new Set(['accurate', 'fluent', 'retained', 'mastered']);
const WEAK = new Set(['weak', 'needsreview', 'forgotten']);

function norm(state) {
  return String(state || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function accuracyOf(s) {
  if (Number(s.attemptCount) > 0) return Math.round((Number(s.correctCount) / Number(s.attemptCount)) * 100);
  if (Number.isFinite(Number(s.accuracy)) && Number(s.accuracy) > 0) return Math.round(Number(s.accuracy));
  return null;
}

function isWeakState(s) {
  if (WEAK.has(norm(s.status || s.masteryState))) return true;
  const acc = accuracyOf(s);
  return Number(s.attemptCount) >= 3 && acc != null && acc < 60;
}

function isSecureState(s) {
  return SECURE.has(norm(s.status || s.masteryState));
}

function severityFromState(s) {
  const acc = accuracyOf(s);
  const state = norm(s.status || s.masteryState);
  if (state === 'forgotten' || (acc != null && acc < 45)) return 'high';
  if (WEAK.has(state) || (acc != null && acc < 60)) return 'medium';
  return 'low';
}

function severityFromFrequency(freq) {
  if (freq >= 3) return 'high';
  if (freq === 2) return 'medium';
  return 'low';
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

// Walk prerequisites depth-first, returning the chain leaf→…→target.
function prerequisiteChain(skillId, resolvers, depth = 0, seen = new Set()) {
  if (!skillId || seen.has(skillId) || depth > 8) return [];
  seen.add(skillId);
  const prereqs = resolvers.getPrerequisites(skillId) || [];
  const chain = [];
  prereqs.forEach((p) => chain.push(...prerequisiteChain(p, resolvers, depth + 1, seen)));
  chain.push(skillId);
  return chain;
}

const MIN_FLUENCY_ATTEMPTS = 3;

// Group answered (non-skipped) attempts by question family and score fluency
// against the family's benchmark. Surfaces only families that show an issue
// (slow-but-accurate, or inaccurate). Names resolved via injected resolvers.
function buildFluencyBottlenecks(attempts, resolvers) {
  const byFamily = new Map();
  (Array.isArray(attempts) ? attempts : []).forEach((a) => {
    if (a.skipped) return;
    const famId = a.questionFamilyId;
    if (!famId) return;
    if (!byFamily.has(famId)) byFamily.set(famId, []);
    byFamily.get(famId).push(a);
  });

  const rows = [];
  byFamily.forEach((items, famId) => {
    if (items.length < MIN_FLUENCY_ATTEMPTS) return;
    const family = resolvers.getQuestionFamily(famId);
    const total = items.length;
    const correct = items.filter((i) => i.correct || i.answerCorrect).length;
    const accuracy = Math.round((correct / total) * 100);
    const timed = items.map((i) => Number(i.timeTaken)).filter((t) => Number.isFinite(t) && t > 0);
    const averageTime = timed.length ? Math.round(timed.reduce((a, b) => a + b, 0) / timed.length) : null;
    const benchmarkTime = family?.fluencyTargetSeconds ?? family?.fluencyBenchmarks?.gold ?? null;
    const skillId = family?.skillId || items[0].skillId || '';

    let issueType = null;
    if (accuracy < 70) issueType = 'fastButInaccurate';
    else if (averageTime != null && benchmarkTime != null && averageTime > benchmarkTime * 1.4) issueType = 'accurateButSlow';
    if (!issueType) return; // fluent enough — not a bottleneck

    rows.push({
      skillId,
      skillName: resolvers.getSkillName(skillId),
      questionFamilyId: famId,
      questionFamilyName: family?.name || famId,
      accuracy,
      averageTime,
      benchmarkTime,
      attempts: total,
      issueType,
      recommendation: issueType === 'accurateButSlow' ? 'runFluencyDrill' : 'assignTargetedPractice',
    });
  });

  return rows.sort((a, b) => a.accuracy - b.accuracy);
}

// Read-side retention risk: a secure skill that hasn't been practised in a
// while is at risk of being forgotten. Derived from the masteredAt /
// lastPractisedAt timestamps the p{N} practice handlers already persist — no
// spaced-repetition schedule is stored, so this is a "stale mastery" heuristic
// rather than a full review scheduler.
const RETENTION_DUE_DAYS = 21;
const RETENTION_OVERDUE_DAYS = 60;

function buildRetentionRisks(skillStates, resolvers, now) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now) || Date.now();
  const rows = [];
  (Array.isArray(skillStates) ? skillStates : []).forEach((s) => {
    if (!isSecureState(s)) return;
    // Model field is British-spelt `lastPractisedAt`; tolerate the American variant.
    const last = s.lastPractisedAt || s.lastPracticedAt || s.masteredAt || null;
    if (!last) return;
    const days = Math.floor((nowMs - new Date(last).getTime()) / 86400000);
    if (days < RETENTION_DUE_DAYS) return; // still fresh
    const riskLevel = days >= RETENTION_OVERDUE_DAYS ? 'high' : 'medium';
    rows.push({
      skillId: s.skillId,
      skillName: resolvers.getSkillName(s.skillId),
      status: s.status || s.masteryState || 'mastered',
      lastPractisedAt: last,
      daysSincePractice: days,
      riskLevel,
      retentionStatus: riskLevel === 'high' ? 'forgotten' : 'needsReview',
      recommendation: riskLevel === 'high' ? 'scheduleRetentionReview' : 'conductMiniAssessment',
    });
  });
  return rows.sort((a, b) => b.daysSincePractice - a.daysSincePractice);
}

export function buildCurriculumDomainDashboard(options = {}) {
  const { resolvers, skillStates = [], mistakes = [], attempts = [], now } = options;
  if (!resolvers) {
    return {
      available: false,
      domainKey: null,
      domainLabel: null,
      skillSummary: { total: 0, mastered: 0, weak: 0, attempted: 0, averageAccuracy: null },
      weakSkills: [],
      rootCauses: [],
      mistakeClusters: [],
      fluencyBottlenecks: [],
      retentionRisks: [],
      interventionPriorities: [],
      recommendedFocus: null,
    };
  }

  const { domainKey, domainLabel } = resolvers;
  const states = Array.isArray(skillStates) ? skillStates : [];
  const stateBySkill = new Map(states.map((s) => [s.skillId, s]));

  // --- Skill summary -------------------------------------------------------
  const attempted = states.filter((s) => Number(s.attemptCount) > 0);
  const accuracies = attempted.map(accuracyOf).filter((a) => a != null);
  const skillSummary = {
    total: states.length,
    mastered: states.filter(isSecureState).length,
    weak: states.filter(isWeakState).length,
    attempted: attempted.length,
    averageAccuracy: accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : null,
  };

  // --- Weak skills ---------------------------------------------------------
  const weakSkills = states
    .filter(isWeakState)
    .map((s) => ({
      skillId: s.skillId,
      skillName: resolvers.getSkillName(s.skillId),
      status: s.status || s.masteryState || 'notStarted',
      accuracy: accuracyOf(s),
      attempts: Number(s.attemptCount) || 0,
      severity: severityFromState(s),
    }))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.accuracy ?? 100) - (b.accuracy ?? 100));

  // --- Root cause analysis -------------------------------------------------
  const rootCauses = weakSkills.map((w) => {
    const chain = prerequisiteChain(w.skillId, resolvers);
    const candidates = chain.filter((id) => id !== w.skillId);
    // Suspected root cause, in priority order: a tracked prerequisite that is
    // itself weak → a tracked prerequisite not yet secure → an in-domain
    // (name-resolvable) prerequisite → the weak skill itself. This avoids
    // surfacing unresolved cross-domain prerequisite ids (e.g. a Decimals skill
    // referenced by a Percentage skill) as the headline root cause.
    const suspect = candidates.find((id) => stateBySkill.has(id) && isWeakState(stateBySkill.get(id)))
      || candidates.find((id) => stateBySkill.has(id) && !isSecureState(stateBySkill.get(id)))
      || candidates.find((id) => resolvers.getSkillName(id) !== id)
      || w.skillId;
    return {
      weakSkillId: w.skillId,
      weakSkillName: w.skillName,
      suspectedRootCauseSkillId: suspect,
      suspectedRootCauseName: resolvers.getSkillName(suspect),
      prerequisiteChain: chain.map((id) => ({ skillId: id, name: resolvers.getSkillName(id) })),
      severity: w.severity,
      recommendedIntervention: w.severity === 'high' ? 'reteachConcept' : 'assignTargetedPractice',
    };
  });

  // --- Mistake clusters ----------------------------------------------------
  const domainSkillIds = new Set(states.map((s) => s.skillId));
  const domainMistakes = (Array.isArray(mistakes) ? mistakes : []).filter(
    (m) => !domainSkillIds.size || (m.skillCode && domainSkillIds.has(m.skillCode))
  );
  const clusterMap = new Map();
  domainMistakes.forEach((m) => {
    const key = m.misconceptionTag || m.skillCode || 'uncategorised';
    if (!clusterMap.has(key)) {
      const mc = m.misconceptionTag ? resolvers.getMisconception(m.misconceptionTag) : null;
      clusterMap.set(key, {
        key,
        misconceptionTag: m.misconceptionTag || '',
        name: mc?.label || m.misconceptionTag || (m.skillCode ? `Errors on ${resolvers.getSkillName(m.skillCode)}` : 'Uncategorised mistakes'),
        description: mc?.description || '',
        remediation: mc?.remediationExplanation || '',
        frequency: 0,
        affectedSkills: new Set(),
      });
    }
    const row = clusterMap.get(key);
    row.frequency += 1;
    if (m.skillCode) row.affectedSkills.add(resolvers.getSkillName(m.skillCode));
  });
  const mistakeClusters = [...clusterMap.values()]
    .map((c) => ({
      misconceptionTag: c.misconceptionTag,
      name: c.name,
      description: c.description,
      remediation: c.remediation,
      frequency: c.frequency,
      severity: severityFromFrequency(c.frequency),
      affectedSkills: [...c.affectedSkills],
    }))
    .sort((a, b) => b.frequency - a.frequency);

  // --- Intervention priorities --------------------------------------------
  const priorities = [];
  mistakeClusters.forEach((c) => {
    priorities.push({
      skillId: null,
      skillName: c.affectedSkills[0] || c.name,
      severity: c.severity,
      issueType: 'mistakeCluster',
      reason: `${c.name} — ${c.frequency} occurrence${c.frequency === 1 ? '' : 's'}.`,
      recommendedAction: 'reviewMistakePattern',
    });
  });
  rootCauses.forEach((r) => {
    priorities.push({
      skillId: r.weakSkillId,
      skillName: r.weakSkillName,
      severity: r.severity,
      issueType: 'rootCause',
      reason: r.suspectedRootCauseSkillId !== r.weakSkillId
        ? `Likely held back by ${r.suspectedRootCauseName}.`
        : `Weak on ${r.weakSkillName}.`,
      recommendedAction: r.recommendedIntervention,
    });
  });
  const interventionPriorities = priorities
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .map((p, i) => ({ priorityRank: i + 1, ...p }))
    .slice(0, 6);

  // --- Recommended focus + suggested assignments ---------------------------
  const top = interventionPriorities[0] || null;
  // Prefer a resolvable root-cause name; a suspected prerequisite can live in
  // another domain (e.g. Percentage → a Decimals skill) where the name doesn't
  // resolve and getSkillName returns the raw id — fall back to the weak skill.
  const topRoot = rootCauses[0];
  const rootNameResolved = topRoot && topRoot.suspectedRootCauseName !== topRoot.suspectedRootCauseSkillId;
  const focusSkill = (rootNameResolved ? topRoot.suspectedRootCauseName : null) || weakSkills[0]?.skillName || null;
  const recommendedFocus = top
    ? {
      primarySkillName: focusSkill || top.skillName,
      why: top.reason,
      recommendedAction: top.recommendedAction,
      suggestedAssignments: weakSkills.slice(0, 3).map((w) => ({
        assignmentType: w.severity === 'high' ? 'Reteach + guided practice' : 'Targeted practice',
        skillName: w.skillName,
        recommendedQuestionCount: w.severity === 'high' ? 8 : 5,
        reason: w.accuracy != null ? `Accuracy ${w.accuracy}% over ${w.attempts} attempt(s).` : 'Flagged weak with limited practice.',
      })),
    }
    : null;

  // --- Fluency bottlenecks (from persisted per-question attempts) ----------
  const fluencyBottlenecks = buildFluencyBottlenecks(attempts, resolvers);

  // --- Retention risks (stale-mastery heuristic from skill-state timestamps)
  const retentionRisks = buildRetentionRisks(states, resolvers, now);

  return {
    available: skillSummary.total > 0 || domainMistakes.length > 0 || fluencyBottlenecks.length > 0,
    domainKey,
    domainLabel,
    skillSummary,
    weakSkills,
    rootCauses,
    mistakeClusters,
    fluencyBottlenecks,
    retentionRisks,
    interventionPriorities,
    recommendedFocus,
  };
}

export default { buildCurriculumDomainDashboard };
