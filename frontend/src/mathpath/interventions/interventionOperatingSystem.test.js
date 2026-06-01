import { describe, expect, it } from 'vitest';
import {
  ASSIGNMENT_SOURCES,
  ASSIGNMENT_STATUSES,
  INTERVENTION_TYPES,
  PRIORITY_LEVELS,
  applyAutomatedAssignmentRules,
  buildAssignment,
  buildInterventionAnalytics,
  buildInterventionFromInsight,
  buildLearningJourneyMap,
  buildNotificationEvents,
  buildOneClickAssignmentOptions,
  buildTaskCentre,
  determineInterventionPriority,
  getAssignmentTemplates,
  getInterventionPlaybooks,
  handleHelpRequest,
  measureInterventionEffectiveness,
  updateAssignmentCompletion,
  validateInterventionOperatingSystem,
} from './interventionOperatingSystem.js';

describe('interventionOperatingSystem', () => {
  it('creates reusable assignment templates and playbooks', () => {
    expect(getAssignmentTemplates().map((t) => t.templateId)).toEqual(expect.arrayContaining([
      'fractions_remediation_pack',
      'fraction_fluency_pack',
      'word_problem_pack',
      'exam_technique_pack',
      'retention_review_pack',
    ]));
    expect(getInterventionPlaybooks().map((p) => p.playbookId)).toEqual(expect.arrayContaining([
      'denominator_misconception',
      'fraction_of_remainder',
    ]));
  });

  it('prioritises prerequisite gaps and persistent misconceptions', () => {
    expect(determineInterventionPriority({ missingPrerequisiteSkill: true })).toBe(PRIORITY_LEVELS.CRITICAL);
    expect(determineInterventionPriority({ repetitionCount: 3, tags: ['persistent_misconception'] })).toBe(PRIORITY_LEVELS.HIGH);
    expect(determineInterventionPriority({ fluencyIssue: true })).toBe(PRIORITY_LEVELS.MEDIUM);
    expect(determineInterventionPriority({ category: 'careless' })).toBe(PRIORITY_LEVELS.LOW);
  });

  it('turns diagnostic insights into model-drawing interventions', () => {
    const intervention = buildInterventionFromInsight({
      studentId: 's1',
      skillId: 'F020',
      misconceptionCode: 'M008',
      tags: ['fraction_of_remainder', 'persistent_misconception'],
      repetitionCount: 3,
    });

    expect(intervention.type).toBe(INTERVENTION_TYPES.MODEL_DRAWING_TRAINER);
    expect(intervention.priority).toBe(PRIORITY_LEVELS.HIGH);
    expect(intervention.playbookId).toBe('fraction_of_remainder');
    expect(intervention.nextAction).toBe('Practise with model drawing');
  });

  it('offers one-click assignments from an insight', () => {
    const options = buildOneClickAssignmentOptions({ skillId: 'F010', tags: ['fluency'] });

    expect(options).toHaveLength(5);
    expect(options.map((o) => o.actionId)).toEqual([
      'assign_practice',
      'assign_worksheet',
      'assign_fluency_drill',
      'assign_retention_review',
      'assign_intervention_pack',
    ]);
  });

  it('builds assignment records with role, due date, status, and timestamps', () => {
    const intervention = buildInterventionFromInsight({ studentId: 's1', skillId: 'F003', missingPrerequisiteSkill: true });
    const assignment = buildAssignment({
      intervention,
      assignedBy: { role: ASSIGNMENT_SOURCES.TEACHER, userId: 'u1' },
      assignedTo: { studentId: 's1' },
    });

    expect(assignment.status).toBe(ASSIGNMENT_STATUSES.NOT_STARTED);
    expect(assignment.priority).toBe(PRIORITY_LEVELS.CRITICAL);
    expect(assignment.assignedByRole).toBe(ASSIGNMENT_SOURCES.TEACHER);
    expect(assignment.timestamps.assignedAt).toBeTruthy();
    expect(assignment.dueDate).toBeTruthy();
  });

  it('applies automated assignment rules for weak signals', () => {
    const interventions = applyAutomatedAssignmentRules([
      { studentId: 's1', skillId: 'F010', masteryScore: 35 },
      { studentId: 's1', skillId: 'F011', retentionFailure: true },
      { studentId: 's1', skillId: 'F020', helpRequested: true },
    ]);

    expect(interventions.length).toBeGreaterThanOrEqual(3);
    expect(interventions.some((i) => i.priority === PRIORITY_LEVELS.CRITICAL)).toBe(true);
    expect(interventions.some((i) => i.type === INTERVENTION_TYPES.RETENTION_REVIEW)).toBe(true);
  });

  it('tracks completion timestamps and intervention effectiveness', () => {
    const intervention = buildInterventionFromInsight({ studentId: 's1', skillId: 'F010' });
    const assignment = buildAssignment({ intervention, assignedBy: { role: 'system' }, assignedTo: { studentId: 's1' } });
    const completed = updateAssignmentCompletion(assignment, { status: ASSIGNMENT_STATUSES.COMPLETED, score: 82, timestamp: '2026-06-01T08:00:00.000Z' });
    const effectiveness = measureInterventionEffectiveness({
      intervention,
      assignment: completed,
      before: { masteryScore: 45, averageResponseTime: 40, retentionScore: 50 },
      after: { masteryScore: 70, averageResponseTime: 30, retentionScore: 65, reassessmentScore: 78 },
    });

    expect(completed.completionDate).toBe('2026-06-01T08:00:00.000Z');
    expect(effectiveness.success).toBe(true);
    expect(effectiveness.masteryImprovement).toBe(25);
  });

  it('builds task centres, notifications, journey map, and analytics', () => {
    const today = new Date('2026-06-01T00:00:00.000Z');
    const assignments = [
      { assignmentId: 'a1', status: ASSIGNMENT_STATUSES.NOT_STARTED, priority: PRIORITY_LEVELS.HIGH, dueDate: '2026-06-01T12:00:00.000Z', interventionType: INTERVENTION_TYPES.PRACTICE_PACK },
      { assignmentId: 'a2', status: ASSIGNMENT_STATUSES.COMPLETED, priority: PRIORITY_LEVELS.LOW, dueDate: '2026-05-30T12:00:00.000Z', interventionType: INTERVENTION_TYPES.RETENTION_REVIEW, masteryAchieved: true },
    ];

    expect(buildTaskCentre(assignments, today).dueSoon).toHaveLength(1);
    expect(buildNotificationEvents(assignments, today).map((n) => n.type)).toEqual(expect.arrayContaining([
      'assignment_due',
      'student_completed_assignment',
      'mastery_achieved',
    ]));
    expect(buildLearningJourneyMap([
      { type: 'mastery', timestamp: '2026-06-03T00:00:00.000Z' },
      { type: 'diagnostic', timestamp: '2026-06-01T00:00:00.000Z' },
    ])[0].type).toBe('diagnostic');
    expect(buildInterventionAnalytics({ assignments, effectiveness: [{ interventionType: INTERVENTION_TYPES.PRACTICE_PACK, success: true }] }).completionRate).toBe(50);
  });

  it('integrates help requests with adult notifications', () => {
    const result = handleHelpRequest({ studentId: 's1', skillId: 'F020', tags: ['remainder'] });

    expect(result.intervention.source).toBe('help_request');
    expect(result.adultNotifications[0].audience).toEqual(expect.arrayContaining(['parent', 'tutor', 'teacher']));
    expect(result.followUpAction).toBeTruthy();
  });

  it('passes the built-in operating-system validator', () => {
    const validation = validateInterventionOperatingSystem();

    expect(validation.completed).toBe(true);
    expect(Object.values(validation.checks).every(Boolean)).toBe(true);
  });
});

