import { describe, expect, it } from 'vitest';
import {
  buildAdultActionCentre,
  buildClassGroupingSuggestions,
  buildTutorInterventionQueue,
  buildUnifiedAdultIntelligenceModel,
  validateAdultIntelligenceEngine,
} from './adultIntelligenceEngine.js';
import { validateParentMathPathDashboardEngine } from './parentMathPathDashboardEngine.js';
import { validateTeacherMathPathDashboardEngine } from './teacherMathPathDashboardEngine.js';
import { validateTutorMathPathDashboardEngine } from './tutorMathPathDashboardEngine.js';

describe('adult intelligence engine', () => {
  it('builds one shared model answering what, why, and next action', () => {
    const model = buildUnifiedAdultIntelligenceModel({
      studentId: 's1',
      audience: 'parent',
      diagnosticResult: { weakSkillIds: ['F010'], masteredSkillIds: ['F001'] },
      practiceState: { currentSkillId: 'F010', weakSkillIds: ['F010'], masteredSkillIds: ['F001', 'F002'] },
      retentionState: { skillsDueForReview: ['F003'] },
      mistakePlans: [{
        studentId: 's1',
        focusMistakes: [{ mistakeCode: 'M001', count: 3, highestSeverityLevel: 'major' }],
        rootCauseSkillIds: ['F010'],
        worksheetMappings: [{ worksheet_id: 'WS_FRA_M001' }],
      }],
      workingAnalysisSummary: { missingWorkingCount: 2, averageWorkingQuality: 55 },
      helpRequests: [{ studentId: 's1', skillId: 'F010', count: 1 }],
    });

    expect(model.whatIsHappening).toContain('Current focus');
    expect(model.whyItIsHappening).toContain('Whole-Number Thinking');
    expect(model.whatShouldHappenNext).toBeTruthy();
    expect(model.alerts.length).toBeGreaterThan(0);
    expect(model.reportFoundation.pdfReady).toBe(true);
  });

  it('creates adult action centre capabilities', () => {
    const model = buildUnifiedAdultIntelligenceModel({
      studentId: 's1',
      practiceState: { currentSkillId: 'F010' },
      mistakePlans: [{
        studentId: 's1',
        focusMistakes: [{ mistakeCode: 'M001', count: 2, highestSeverityLevel: 'major' }],
        rootCauseSkillIds: ['F010'],
        worksheetMappings: [{ worksheet_id: 'WS_FRA_M001' }],
      }],
    });
    const actionCentre = buildAdultActionCentre(model);

    expect(actionCentre.actions.length).toBeGreaterThan(0);
    expect(actionCentre.actions.some((action) => action.canAssignActivity)).toBe(true);
  });

  it('suggests class groups for mastery, misconception, fluency, and retention issues', () => {
    const groups = buildClassGroupingSuggestions({
      studentProgressStates: [{ studentId: 's1', skillStatuses: { F010: 'weak' } }],
      mistakePlans: [{ studentId: 's1', focusMistakes: [{ mistakeCode: 'M001', count: 2 }], rootCauseSkillIds: ['F010'] }],
      fluencyStates: [{ studentId: 's1', questionFamilyResults: [{ skillId: 'F018', status: 'accurateButSlow' }] }],
      retentionStates: [{ studentId: 's1', skillsNeedingRefresh: ['F010'] }],
    });

    expect(groups.map((group) => group.category)).toEqual(expect.arrayContaining(['skill_mastery', 'conceptual_misconception', 'fluency_deficit', 'retention']));
  });

  it('builds tutor intervention queues from adult models', () => {
    const model = buildUnifiedAdultIntelligenceModel({
      studentId: 's1',
      practiceState: { currentSkillId: 'F010' },
      helpRequests: [{ studentId: 's1', skillId: 'F010', count: 3 }],
    });
    const queue = buildTutorInterventionQueue([model]);

    expect(queue[0]).toMatchObject({ studentId: 's1', flagType: 'student_help_request' });
  });

  it('passes adult and role dashboard validators', () => {
    expect(validateAdultIntelligenceEngine().isValid).toBe(true);
    expect(validateParentMathPathDashboardEngine().isValid).toBe(true);
    expect(validateTutorMathPathDashboardEngine().isValid).toBe(true);
    expect(validateTeacherMathPathDashboardEngine().isValid).toBe(true);
  });
});
