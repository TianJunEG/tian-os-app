import { describe, expect, it } from 'vitest';
import diagnosticsRegistry from '../services/diagnostics/diagnosticDomainRegistry.js';
import {
  clearDomainsForTest,
  getDomain,
  getDomainHealthReport,
  hasDomain,
  listDomains,
  registerDefaultDomains,
  registerDomain,
} from '../services/domains/domainRegistry.js';
import { DIAGNOSTIC_DECISIONS, decideNextDiagnosticStep } from './adaptiveDiagnosticDecisionEngine.js';
import { selectNextDiagnosticQuestion } from './selectNextDiagnosticQuestion.js';

function resetRegistry() {
  clearDomainsForTest();
  registerDefaultDomains();
}

describe('platform domain registry', () => {
  it('registers MathPath Fractions as the first live domain', () => {
    resetRegistry();
    const domain = getDomain({ subjectId: 'math', domainId: 'fractions' });
    expect(domain.displayName).toBe('MathPath Fractions');
    expect(domain.diagnosticAdapter.enabled).toBe(true);
    expect(domain.assignmentAdapter.enabled).toBe(true);
    expect(domain.worksheetAdapter.enabled).toBe(true);
    expect(domain.paperAnalysisAdapter.enabled).toBe(true);
    expect(domain.interventionAdapter.enabled).toBe(true);
  });

  it('registers MathPath Decimals with live content and planned platform adapters', () => {
    resetRegistry();
    expect(hasDomain({ subjectId: 'math', domainId: 'decimals' })).toBe(true);
    const domain = getDomain({ subjectId: 'math', domainId: 'decimals' });
    expect(domain.displayName).toBe('MathPath Decimals');
    // content + progression are live
    expect(domain.practiceAdapter.enabled).toBe(true);
    expect(domain.skillGraphAdapter.status).toBe('available');
    // platform adapters are not yet built
    expect(domain.diagnosticAdapter.enabled).toBe(false);
    expect(domain.diagnosticAdapter.status).toBe('planned');
    expect(domain.worksheetAdapter.enabled).toBe(false);
  });

  it('keeps the existing diagnostic registry compatible', () => {
    resetRegistry();
    expect(diagnosticsRegistry.hasDiagnosticDomain({ subjectId: 'math', domainId: 'fractions' })).toBe(true);
    expect(hasDomain({ subjectId: 'math', domainId: 'fractions' })).toBe(true);
  });

  it('supports fake science and English domains through the same adapter contract', () => {
    resetRegistry();
    registerDomain({
      subjectId: 'science',
      domainId: 'cycles',
      displayName: 'SciencePath Cycles',
      diagnosticAdapter: { enabled: true, status: 'available' },
      assignmentAdapter: { enabled: true, status: 'planned' },
      worksheetAdapter: { enabled: false, status: 'not_ready' },
      paperAnalysisAdapter: { enabled: true, status: 'planned' },
      interventionAdapter: { enabled: true, status: 'planned' },
    });
    registerDomain({
      subjectId: 'english',
      domainId: 'grammar',
      displayName: 'EnglishPath Grammar',
      diagnosticAdapter: { enabled: true, status: 'available' },
      assignmentAdapter: { enabled: true, status: 'planned' },
      worksheetAdapter: { enabled: true, status: 'planned' },
      paperAnalysisAdapter: { enabled: true, status: 'planned' },
      interventionAdapter: { enabled: true, status: 'planned' },
    });

    const domains = listDomains();
    expect(domains.map((domain) => `${domain.subjectId}:${domain.domainId}`)).toEqual(
      expect.arrayContaining(['math:fractions', 'science:cycles', 'english:grammar'])
    );
  });

  it('returns a clean error for unknown domains', () => {
    resetRegistry();
    expect(() => getDomain({ subjectId: 'science', domainId: 'matter' })).toThrow(/not registered/i);
  });

  it('exposes health report capabilities and contracts', () => {
    resetRegistry();
    const report = getDomainHealthReport();
    expect(report.registeredDomainCount).toBeGreaterThanOrEqual(1);
    expect(report.registeredDomains[0].capabilities).toHaveProperty('diagnostics');
    expect(report.platformContracts.paperAnalysisAdapter.required).toContain('mapQuestionToSkills');
    expect(report.platformContracts.interventionAdapter.required).toContain('recommendIntervention');
  });
});

describe('generic engines remain domain agnostic', () => {
  it('uses science prerequisite metadata without topic-specific branching', () => {
    const skillGraph = [
      { skillId: 'SCI001', subjectId: 'science', domainId: 'matter', difficulty: 1, prerequisiteSkillIds: [] },
      { skillId: 'SCI002', subjectId: 'science', domainId: 'matter', difficulty: 2, prerequisiteSkillIds: ['SCI001'] },
    ];
    const decision = decideNextDiagnosticStep({
      currentSkill: skillGraph[1],
      currentQuestion: { questionId: 'science-q2', skillId: 'SCI002', difficulty: 2 },
      response: { correct: false, confidence: 'not_sure' },
      skillGraph,
      questionBank: [],
      sessionState: {},
    });
    expect(decision.decisionType).toBe(DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE);
    expect(decision.nextSkillId).toBe('SCI001');
  });

  it('selects English next questions using metadata only', () => {
    const decision = {
      decisionType: DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE,
      nextSkillId: 'ENG001',
      currentQuestionId: 'english-q2',
    };
    const next = selectNextDiagnosticQuestion({
      decision,
      questionBank: [
        { questionId: 'english-q1', skillId: 'ENG001', difficulty: 1, subjectId: 'english', domainId: 'grammar' },
      ],
      sessionState: { attemptedQuestionIds: ['english-q2'] },
    });
    expect(next.questionId).toBe('english-q1');
  });
});
