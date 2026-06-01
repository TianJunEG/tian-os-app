export const INTERVENTION_TYPES = {
  PRACTICE_PACK: 'practice_pack',
  WORKSHEET: 'worksheet',
  FLUENCY_DRILL: 'fluency_drill',
  RETENTION_REVIEW: 'retention_review',
  HEURISTICS_PACK: 'heuristics_pack',
  EXAM_TECHNIQUE_PACK: 'exam_technique_pack',
  LIFELAB_ACTIVITY: 'lifelab_activity',
  TUTOR_SESSION_RECOMMENDATION: 'tutor_session_recommendation',
  TEACHER_SMALL_GROUP_RECOMMENDATION: 'teacher_small_group_recommendation',
  PARENT_HOME_SUPPORT_ACTIVITY: 'parent_home_support_activity',
  MODEL_DRAWING_TRAINER: 'model_drawing_trainer',
  INTERVENTION_PACK: 'intervention_pack',
};

export const ASSIGNMENT_STATUSES = {
  NOT_STARTED: 'not_started',
  STARTED: 'started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  EXPIRED: 'expired',
  OVERDUE: 'overdue',
};

export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const ASSIGNMENT_SOURCES = {
  SYSTEM: 'system',
  PARENT: 'parent',
  TUTOR: 'tutor',
  TEACHER: 'teacher',
};

const STATUS_ORDER = [
  ASSIGNMENT_STATUSES.NOT_STARTED,
  ASSIGNMENT_STATUSES.STARTED,
  ASSIGNMENT_STATUSES.IN_PROGRESS,
  ASSIGNMENT_STATUSES.COMPLETED,
  ASSIGNMENT_STATUSES.SKIPPED,
  ASSIGNMENT_STATUSES.EXPIRED,
  ASSIGNMENT_STATUSES.OVERDUE,
];

function normalizeList(value = []) {
  if (value == null) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function stableId(prefix, parts = []) {
  const raw = parts.filter(Boolean).join('_').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return raw ? `${prefix}_${raw}` : `${prefix}_general`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const ASSIGNMENT_TEMPLATES = [
  {
    templateId: 'fractions_remediation_pack',
    title: 'Fractions Remediation Pack',
    interventionType: INTERVENTION_TYPES.INTERVENTION_PACK,
    linkedSkillIds: ['F001', 'F002', 'F003', 'F010', 'F020'],
    recommendedMinutes: 20,
    defaultQuestionCount: 8,
    components: ['visual_reteach', 'guided_practice', 'mistake_review', 'short_reassessment'],
  },
  {
    templateId: 'fraction_fluency_pack',
    title: 'Fraction Fluency Pack',
    interventionType: INTERVENTION_TYPES.FLUENCY_DRILL,
    linkedSkillIds: ['F010', 'F011', 'F012', 'F018'],
    recommendedMinutes: 10,
    defaultQuestionCount: 12,
    components: ['timed_retrieval', 'accuracy_check', 'speed_consistency_review'],
  },
  {
    templateId: 'word_problem_pack',
    title: 'Word Problem Pack',
    interventionType: INTERVENTION_TYPES.HEURISTICS_PACK,
    linkedSkillIds: ['F020', 'F023', 'F024'],
    recommendedMinutes: 25,
    defaultQuestionCount: 5,
    components: ['read_target_quantity', 'bar_model_choice', 'worked_example', 'independent_problem'],
  },
  {
    templateId: 'exam_technique_pack',
    title: 'Exam Technique Pack',
    interventionType: INTERVENTION_TYPES.EXAM_TECHNIQUE_PACK,
    linkedSkillIds: ['F020', 'F021', 'F023', 'F024'],
    recommendedMinutes: 20,
    defaultQuestionCount: 6,
    components: ['mark_analysis', 'working_quality_check', 'final_statement_with_units'],
  },
  {
    templateId: 'retention_review_pack',
    title: 'Retention Review Pack',
    interventionType: INTERVENTION_TYPES.RETENTION_REVIEW,
    linkedSkillIds: [],
    recommendedMinutes: 8,
    defaultQuestionCount: 6,
    components: ['spaced_review', 'mixed_recall', 'confidence_check'],
  },
];

export const INTERVENTION_PLAYBOOKS = [
  {
    playbookId: 'denominator_misconception',
    title: 'Denominator Misconception',
    linkedMisconceptions: ['M003', 'denominator_partition_error'],
    linkedSkillIds: ['F002', 'F003', 'F004'],
    workflow: ['visual_explanation', 'guided_practice', 'worksheet', 'reassessment', 'retention_review'],
    successCriteria: ['matches_denominator_to_equal_parts', 'identifies_unit_fraction', 'answers_visual_items_correctly'],
  },
  {
    playbookId: 'fraction_of_remainder',
    title: 'Fraction of Remainder',
    linkedMisconceptions: ['M008', 'remainder_reasoning', 'failure_to_treat_remainder_as_new_whole'],
    linkedSkillIds: ['F020', 'F023', 'F024'],
    workflow: ['model_drawing_trainer', 'guided_bar_model', 'word_problem_pack', 'reassessment', 'retention_review'],
    successCriteria: ['identifies_remainder', 'subdivides_remaining_region', 'states_final_fraction_with_units'],
  },
  {
    playbookId: 'fluency_deficit',
    title: 'Fraction Fluency Deficit',
    linkedMisconceptions: ['slow_retrieval', 'accurate_but_slow'],
    linkedSkillIds: ['F010', 'F011', 'F012', 'F018'],
    workflow: ['short_fluency_drill', 'accuracy_review', 'repeat_after_24h', 'weekly_retention_review'],
    successCriteria: ['accuracy_at_least_85', 'average_time_at_or_below_benchmark', 'low_skip_rate'],
  },
  {
    playbookId: 'exam_technique_gap',
    title: 'Exam Technique Gap',
    linkedMisconceptions: ['missing_units', 'weak_working_quality', 'wrong_target_quantity'],
    linkedSkillIds: ['F020', 'F023', 'F024'],
    workflow: ['worked_exam_example', 'method_mark_check', 'short_exam_pack', 'teacher_or_tutor_review'],
    successCriteria: ['shows_method_steps', 'labels_units', 'answers_target_quantity'],
  },
];

export function getAssignmentTemplates() {
  return ASSIGNMENT_TEMPLATES.map((template) => ({ ...template }));
}

export function getInterventionPlaybooks() {
  return INTERVENTION_PLAYBOOKS.map((playbook) => ({ ...playbook, workflow: [...playbook.workflow] }));
}

export function determineInterventionPriority(signal = {}) {
  const tags = normalizeList(signal.tags || signal.issueTags || signal.misconceptionTags).map((tag) => String(tag).toLowerCase());
  const severity = String(signal.severity || signal.severityProfile || '').toLowerCase();
  const accuracy = toNum(signal.accuracyRate ?? signal.masteryScore, null);
  const repetitions = toNum(signal.repetitionCount ?? signal.mistakeCount ?? signal.frequency, 0);

  if (
    severity === 'critical' ||
    signal.missingPrerequisiteSkill ||
    normalizeList(signal.rootCauseSkillIds).length > 0 && accuracy !== null && accuracy < 40 ||
    tags.some((tag) => tag.includes('prerequisite'))
  ) return PRIORITY_LEVELS.CRITICAL;

  if (
    severity === 'major' ||
    severity === 'high' ||
    repetitions >= 3 ||
    tags.some((tag) => tag.includes('persistent') || tag.includes('misconception'))
  ) return PRIORITY_LEVELS.HIGH;

  if (
    severity === 'moderate' ||
    signal.fluencyIssue ||
    signal.retentionFailure ||
    signal.examTechniqueIssue ||
    tags.some((tag) => tag.includes('fluency') || tag.includes('retention') || tag.includes('exam'))
  ) return PRIORITY_LEVELS.MEDIUM;

  return PRIORITY_LEVELS.LOW;
}

export function chooseInterventionType(insight = {}) {
  const tags = normalizeList(insight.tags || insight.issueTags || insight.misconceptionTags).map((tag) => String(tag).toLowerCase());
  const category = String(insight.category || insight.issueType || insight.rootCause || '').toLowerCase();
  const text = `${category} ${tags.join(' ')}`;

  if (/fraction_of_remainder|remainder|bar|model|diagram|visual|partition|shaded/.test(text)) return INTERVENTION_TYPES.MODEL_DRAWING_TRAINER;
  if (/fluency|fast|slow|automatic|speed/.test(text)) return INTERVENTION_TYPES.FLUENCY_DRILL;
  if (/retention|forgotten|spaced/.test(text)) return INTERVENTION_TYPES.RETENTION_REVIEW;
  if (/exam|method|mark|working|unit|target quantity/.test(text)) return INTERVENTION_TYPES.EXAM_TECHNIQUE_PACK;
  if (/heuristic|word problem|multi.step|remainder/.test(text)) return INTERVENTION_TYPES.HEURISTICS_PACK;
  if (/worksheet|home/.test(text)) return INTERVENTION_TYPES.WORKSHEET;
  return INTERVENTION_TYPES.PRACTICE_PACK;
}

export function selectPlaybookForInsight(insight = {}) {
  const tags = normalizeList(insight.tags || insight.issueTags || insight.misconceptionTags).map((tag) => String(tag).toLowerCase());
  const code = String(insight.misconceptionCode || insight.mistakeCode || '').toUpperCase();
  const text = `${code} ${insight.category || ''} ${insight.issueType || ''} ${tags.join(' ')}`.toLowerCase();

  if (/m003|denominator|partition/.test(text)) return INTERVENTION_PLAYBOOKS.find((p) => p.playbookId === 'denominator_misconception');
  if (/m008|remainder|new whole|bar model|model/.test(text)) return INTERVENTION_PLAYBOOKS.find((p) => p.playbookId === 'fraction_of_remainder');
  if (/fluency|slow|speed/.test(text)) return INTERVENTION_PLAYBOOKS.find((p) => p.playbookId === 'fluency_deficit');
  if (/exam|method|working|unit|target/.test(text)) return INTERVENTION_PLAYBOOKS.find((p) => p.playbookId === 'exam_technique_gap');
  return INTERVENTION_PLAYBOOKS[0];
}

export function buildInterventionFromInsight(insight = {}) {
  const linkedSkillIds = normalizeList(insight.linkedSkillIds || insight.skillIds || insight.skillId);
  const linkedMisconceptions = normalizeList(
    insight.linkedMisconceptions || insight.misconceptionTags || insight.misconceptionCode || insight.mistakeCode
  );
  const priority = determineInterventionPriority(insight);
  const interventionType = chooseInterventionType(insight);
  const playbook = selectPlaybookForInsight(insight);
  const template = ASSIGNMENT_TEMPLATES.find((row) => row.interventionType === interventionType) || ASSIGNMENT_TEMPLATES[0];

  return {
    interventionId: insight.interventionId || stableId('int', [
      insight.studentId,
      linkedSkillIds[0],
      linkedMisconceptions[0],
      interventionType,
    ]),
    type: interventionType,
    title: insight.title || template.title,
    linkedSkillIds,
    linkedMisconceptions,
    priority,
    status: 'recommended',
    source: insight.source || 'diagnostic',
    sourceId: insight.sourceId || insight.diagnosticSessionId || insight.mistakeId || null,
    templateId: template.templateId,
    playbookId: playbook?.playbookId || null,
    workflow: playbook?.workflow || template.components,
    nextAction: buildNextAction({ interventionType, priority, linkedSkillIds, template }),
    aiReadyContext: {
      rootCause: insight.rootCause || insight.category || '',
      evidence: insight.evidence || null,
      constraints: insight.constraints || [],
    },
  };
}

function buildNextAction({ interventionType, priority, linkedSkillIds, template }) {
  if (interventionType === INTERVENTION_TYPES.MODEL_DRAWING_TRAINER) return 'Practise with model drawing';
  if (interventionType === INTERVENTION_TYPES.FLUENCY_DRILL) return 'Assign a short fluency drill';
  if (interventionType === INTERVENTION_TYPES.RETENTION_REVIEW) return 'Schedule a retention review';
  if (priority === PRIORITY_LEVELS.CRITICAL) return 'Assign intervention pack and alert adult';
  return `Assign ${template.title}`;
}

export function buildOneClickAssignmentOptions(insight = {}) {
  const intervention = buildInterventionFromInsight(insight);
  const skillIds = intervention.linkedSkillIds;
  return [
    {
      actionId: 'assign_practice',
      label: 'Assign Practice',
      interventionType: INTERVENTION_TYPES.PRACTICE_PACK,
      module: 'MathPath',
      skillIds,
      questionCount: 8,
      priority: intervention.priority,
    },
    {
      actionId: 'assign_worksheet',
      label: 'Assign Worksheet',
      interventionType: INTERVENTION_TYPES.WORKSHEET,
      module: 'Mastery Worksheet',
      skillIds,
      questionCount: 10,
      priority: intervention.priority,
    },
    {
      actionId: 'assign_fluency_drill',
      label: 'Assign Fluency Drill',
      interventionType: INTERVENTION_TYPES.FLUENCY_DRILL,
      module: 'Fluency Practice',
      skillIds,
      questionCount: 12,
      priority: intervention.priority === PRIORITY_LEVELS.CRITICAL ? PRIORITY_LEVELS.HIGH : intervention.priority,
    },
    {
      actionId: 'assign_retention_review',
      label: 'Assign Retention Review',
      interventionType: INTERVENTION_TYPES.RETENTION_REVIEW,
      module: 'MathPath',
      skillIds,
      questionCount: 6,
      priority: PRIORITY_LEVELS.MEDIUM,
    },
    {
      actionId: 'assign_intervention_pack',
      label: 'Assign Intervention Pack',
      interventionType: intervention.type,
      module: intervention.type === INTERVENTION_TYPES.MODEL_DRAWING_TRAINER ? 'Mistake-to-Mastery' : 'MathPath',
      skillIds,
      questionCount: 8,
      priority: intervention.priority,
      templateId: intervention.templateId,
      playbookId: intervention.playbookId,
    },
  ];
}

export function buildAssignment({ intervention = {}, assignedBy = {}, assignedTo = {}, dueDate = null, schedule = null } = {}) {
  const now = new Date();
  const due = dueDate || addDays(now, intervention.priority === PRIORITY_LEVELS.CRITICAL ? 2 : 7).toISOString();
  return {
    assignmentId: stableId('asn', [assignedTo.studentId || assignedTo.id, intervention.interventionId, assignedBy.role]),
    interventionId: intervention.interventionId,
    interventionType: intervention.type,
    templateId: intervention.templateId || null,
    playbookId: intervention.playbookId || null,
    linkedSkillIds: normalizeList(intervention.linkedSkillIds),
    linkedMisconceptions: normalizeList(intervention.linkedMisconceptions),
    priority: intervention.priority || PRIORITY_LEVELS.MEDIUM,
    assignedByRole: assignedBy.role || ASSIGNMENT_SOURCES.SYSTEM,
    assignedByUserId: assignedBy.userId || null,
    assignedToType: assignedTo.type || 'student',
    assignedToId: assignedTo.id || assignedTo.studentId || null,
    assignedDate: now.toISOString(),
    dueDate: due,
    status: ASSIGNMENT_STATUSES.NOT_STARTED,
    completionDate: null,
    schedule,
    timestamps: {
      assignedAt: now.toISOString(),
      startedAt: null,
      inProgressAt: null,
      completedAt: null,
      skippedAt: null,
      expiredAt: null,
      overdueAt: null,
    },
  };
}

export function applyAutomatedAssignmentRules(signals = []) {
  return normalizeList(signals).flatMap((signal) => {
    const assignments = [];
    if (toNum(signal.masteryScore, 100) < 50 || signal.missingPrerequisiteSkill) {
      assignments.push(buildInterventionFromInsight({ ...signal, tags: [...normalizeList(signal.tags), 'missing_prerequisite'] }));
    }
    if (toNum(signal.repetitionCount || signal.mistakeCount, 0) >= 3) {
      assignments.push(buildInterventionFromInsight({ ...signal, tags: [...normalizeList(signal.tags), 'persistent_misconception'] }));
    }
    if (signal.retentionFailure || String(signal.retentionStatus || '').includes('forgotten')) {
      assignments.push(buildInterventionFromInsight({ ...signal, tags: [...normalizeList(signal.tags), 'retention_failure'] }));
    }
    if (signal.examTechniqueIssue || normalizeList(signal.tags).some((tag) => String(tag).includes('exam'))) {
      assignments.push(buildInterventionFromInsight({ ...signal, tags: [...normalizeList(signal.tags), 'exam_technique_issue'] }));
    }
    if (signal.confidenceMismatch || signal.helpRequested) {
      assignments.push(buildInterventionFromInsight({ ...signal, tags: [...normalizeList(signal.tags), signal.helpRequested ? 'help_request' : 'confidence_mismatch'] }));
    }
    return assignments;
  });
}

export function updateAssignmentCompletion(assignment = {}, event = {}) {
  const status = STATUS_ORDER.includes(event.status) ? event.status : assignment.status || ASSIGNMENT_STATUSES.NOT_STARTED;
  const now = event.timestamp || new Date().toISOString();
  const timestamps = { ...(assignment.timestamps || {}) };
  if (status === ASSIGNMENT_STATUSES.STARTED) timestamps.startedAt = timestamps.startedAt || now;
  if (status === ASSIGNMENT_STATUSES.IN_PROGRESS) timestamps.inProgressAt = timestamps.inProgressAt || now;
  if (status === ASSIGNMENT_STATUSES.COMPLETED) timestamps.completedAt = now;
  if (status === ASSIGNMENT_STATUSES.SKIPPED) timestamps.skippedAt = now;
  if (status === ASSIGNMENT_STATUSES.EXPIRED) timestamps.expiredAt = now;
  if (status === ASSIGNMENT_STATUSES.OVERDUE) timestamps.overdueAt = now;
  return {
    ...assignment,
    status,
    completionDate: status === ASSIGNMENT_STATUSES.COMPLETED ? now : assignment.completionDate || null,
    score: event.score ?? assignment.score ?? null,
    reassessmentOutcome: event.reassessmentOutcome || assignment.reassessmentOutcome || null,
    timestamps,
  };
}

export function measureInterventionEffectiveness({ intervention = {}, assignment = {}, before = {}, after = {} } = {}) {
  const masteryImprovement = toNum(after.masteryScore, 0) - toNum(before.masteryScore, 0);
  const fluencyImprovement = toNum(before.averageResponseTime, 0) - toNum(after.averageResponseTime, 0);
  const retentionImprovement = toNum(after.retentionScore, 0) - toNum(before.retentionScore, 0);
  const completed = assignment.status === ASSIGNMENT_STATUSES.COMPLETED;
  const reassessed = after.reassessmentScore !== undefined || assignment.reassessmentOutcome != null;
  const success = completed && (masteryImprovement >= 10 || retentionImprovement >= 10 || fluencyImprovement >= 5 || toNum(after.reassessmentScore, 0) >= 70);
  return {
    interventionId: intervention.interventionId || assignment.interventionId || null,
    interventionType: intervention.type || assignment.interventionType || null,
    completed,
    reassessed,
    masteryImprovement,
    fluencyImprovementSeconds: fluencyImprovement,
    retentionImprovement,
    success,
    successRateContribution: success ? 1 : 0,
  };
}

export function buildLearningJourneyMap(events = []) {
  return normalizeList(events)
    .map((event, index) => ({
      id: event.id || stableId('journey', [index, event.type, event.skillId]),
      order: index + 1,
      type: event.type,
      label: event.label || journeyLabel(event.type),
      timestamp: event.timestamp || event.createdAt || null,
      skillId: event.skillId || null,
      status: event.status || 'recorded',
      metadata: event.metadata || {},
    }))
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}

function journeyLabel(type = '') {
  return {
    diagnostic: 'Diagnostic',
    intervention: 'Intervention',
    worksheet: 'Worksheet',
    practice: 'Practice',
    reassessment: 'Reassessment',
    mastery: 'Mastery',
    retention: 'Retention',
  }[type] || 'Learning event';
}

export function buildNotificationEvents(assignments = [], now = new Date()) {
  const today = new Date(now);
  return normalizeList(assignments).flatMap((assignment) => {
    const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const events = [];
    if (assignment.status === ASSIGNMENT_STATUSES.NOT_STARTED) {
      events.push({ type: 'new_intervention_assigned', assignmentId: assignment.assignmentId || assignment.id, audience: ['student'] });
    }
    if (due) {
      const daysUntilDue = Math.ceil((due - today) / 86400000);
      if (daysUntilDue <= 1 && daysUntilDue >= 0 && assignment.status !== ASSIGNMENT_STATUSES.COMPLETED) {
        events.push({ type: 'assignment_due', assignmentId: assignment.assignmentId || assignment.id, audience: ['student', 'parent'] });
      }
      if (due < today && assignment.status !== ASSIGNMENT_STATUSES.COMPLETED) {
        events.push({ type: 'assignment_overdue', assignmentId: assignment.assignmentId || assignment.id, audience: ['student', 'parent', 'teacher', 'tutor'] });
      }
    }
    if (assignment.interventionType === INTERVENTION_TYPES.RETENTION_REVIEW) {
      events.push({ type: 'retention_review_due', assignmentId: assignment.assignmentId || assignment.id, audience: ['student'] });
    }
    if (assignment.status === ASSIGNMENT_STATUSES.COMPLETED) {
      events.push({ type: 'student_completed_assignment', assignmentId: assignment.assignmentId || assignment.id, audience: ['parent', 'teacher', 'tutor'] });
    }
    if (assignment.masteryAchieved) {
      events.push({ type: 'mastery_achieved', assignmentId: assignment.assignmentId || assignment.id, audience: ['student', 'parent', 'teacher', 'tutor'] });
    }
    return events;
  });
}

export function buildAssignmentCalendar(assignments = []) {
  const rows = normalizeList(assignments);
  const buckets = { daily: [], weekly: [], monthly: [], custom: [] };
  rows.forEach((assignment) => {
    const cadence = assignment.schedule?.cadence || assignment.cadence || 'custom';
    const key = buckets[cadence] ? cadence : 'custom';
    buckets[key].push(assignment);
  });
  return buckets;
}

export function buildTaskCentre(assignments = [], now = new Date()) {
  const today = new Date(now);
  const rows = normalizeList(assignments);
  const dueSoon = rows.filter((a) => a.dueDate && new Date(a.dueDate) >= today && new Date(a.dueDate) - today <= 3 * 86400000);
  const overdue = rows.filter((a) => a.dueDate && new Date(a.dueDate) < today && a.status !== ASSIGNMENT_STATUSES.COMPLETED);
  const completed = rows.filter((a) => a.status === ASSIGNMENT_STATUSES.COMPLETED);
  const active = rows.filter((a) => ![ASSIGNMENT_STATUSES.COMPLETED, ASSIGNMENT_STATUSES.SKIPPED, ASSIGNMENT_STATUSES.EXPIRED].includes(a.status));
  const suggestedNextActions = active
    .slice()
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 3)
    .map((a) => ({ assignmentId: a.assignmentId || a.id, label: a.nextAction || 'Continue assignment', priority: a.priority }));
  return { assignedTasks: active, dueSoon, overdue, completed, suggestedNextActions };
}

function priorityRank(priority = PRIORITY_LEVELS.MEDIUM) {
  return {
    [PRIORITY_LEVELS.CRITICAL]: 1,
    [PRIORITY_LEVELS.HIGH]: 2,
    [PRIORITY_LEVELS.MEDIUM]: 3,
    [PRIORITY_LEVELS.LOW]: 4,
  }[priority] || 3;
}

export function buildInterventionAnalytics({ assignments = [], effectiveness = [] } = {}) {
  const rows = normalizeList(assignments);
  const completed = rows.filter((a) => a.status === ASSIGNMENT_STATUSES.COMPLETED);
  const byType = new Map();
  rows.forEach((assignment) => {
    const type = assignment.interventionType || assignment.type || 'unknown';
    byType.set(type, (byType.get(type) || 0) + 1);
  });
  const successByType = new Map();
  normalizeList(effectiveness).forEach((row) => {
    const type = row.interventionType || 'unknown';
    if (!successByType.has(type)) successByType.set(type, { total: 0, success: 0 });
    successByType.get(type).total += 1;
    if (row.success) successByType.get(type).success += 1;
  });
  return {
    assignmentsIssued: rows.length,
    completionRate: pct(completed.length, rows.length),
    interventionSuccessRate: pct(normalizeList(effectiveness).filter((row) => row.success).length, normalizeList(effectiveness).length),
    mostCommonInterventionTypes: [...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    mostEffectiveInterventionTypes: [...successByType.entries()]
      .map(([type, row]) => ({ type, successRate: pct(row.success, row.total), sampleSize: row.total }))
      .sort((a, b) => b.successRate - a.successRate),
  };
}

export function handleHelpRequest(helpRequest = {}) {
  const intervention = buildInterventionFromInsight({
    ...helpRequest,
    source: 'help_request',
    helpRequested: true,
    tags: [...normalizeList(helpRequest.tags), 'help_request'],
  });
  return {
    intervention,
    adultNotifications: [
      { type: 'student_requested_help', audience: ['parent', 'tutor', 'teacher'], studentId: helpRequest.studentId || null },
      { type: 'new_intervention_assigned', audience: ['student'], studentId: helpRequest.studentId || null },
    ],
    followUpAction: intervention.nextAction,
  };
}

export function validateInterventionOperatingSystem() {
  const sampleInsight = {
    studentId: 'student_1',
    skillId: 'F020',
    misconceptionCode: 'M008',
    tags: ['fraction_of_remainder', 'persistent_misconception'],
    repetitionCount: 3,
    source: 'diagnostic',
  };
  const intervention = buildInterventionFromInsight(sampleInsight);
  const assignment = buildAssignment({
    intervention,
    assignedBy: { role: ASSIGNMENT_SOURCES.SYSTEM },
    assignedTo: { studentId: 'student_1' },
  });
  const completion = updateAssignmentCompletion(assignment, { status: ASSIGNMENT_STATUSES.COMPLETED, score: 80 });
  const effectiveness = measureInterventionEffectiveness({
    intervention,
    assignment: completion,
    before: { masteryScore: 30, averageResponseTime: 45, retentionScore: 40 },
    after: { masteryScore: 62, averageResponseTime: 30, retentionScore: 70, reassessmentScore: 75 },
  });

  return {
    completed: true,
    checks: {
      insightCreatesActionableIntervention: Boolean(intervention.interventionId && intervention.nextAction),
      priorityRulesApplied: intervention.priority === PRIORITY_LEVELS.HIGH,
      assignmentCarriesInterventionMetadata: assignment.interventionId === intervention.interventionId,
      completionTimestampsTracked: Boolean(completion.timestamps.completedAt),
      effectivenessMeasured: effectiveness.success === true,
      oneClickOptionsAvailable: buildOneClickAssignmentOptions(sampleInsight).length === 5,
      notificationsAvailable: buildNotificationEvents([assignment]).length > 0,
    },
  };
}

