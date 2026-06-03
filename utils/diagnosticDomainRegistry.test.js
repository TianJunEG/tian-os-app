import { describe, expect, it } from 'vitest';
import {
  getDiagnosticDomain,
  hasDiagnosticDomain,
  listDiagnosticDomains,
  registerDiagnosticDomain,
} from '../services/diagnostics/diagnosticDomainRegistry.js';

function fakeDomain(subjectId, domainId) {
  return {
    subjectId,
    domainId,
    displayName: `${subjectId} ${domainId}`,
    skillGraph: [],
    questionBank: [],
    validators: {},
    scoringConfig: {},
    defaultStartSkillIds: [`${domainId.toUpperCase()}001`],
    fallbackSkillId: `${domainId.toUpperCase()}001`,
    normaliseQuestion: (question) => question,
    scoreAnswer: () => false,
    detectErrorTags: () => [],
    buildResult: () => ({}),
    getSupportiveCopy: () => 'This helps us find what to practise next.',
  };
}

describe('diagnostic domain registry', () => {
  it('lists registered domains', () => {
    const domains = listDiagnosticDomains();
    expect(domains.some((domain) => domain.subjectId === 'math' && domain.domainId === 'fractions')).toBe(true);
  });

  it('resolves Fractions domain', () => {
    const domain = getDiagnosticDomain({ subjectId: 'math', domainId: 'fractions' });
    expect(domain).toMatchObject({ subjectId: 'math', domainId: 'fractions', displayName: 'Fractions' });
    expect(typeof domain.loadSkills).toBe('function');
  });

  it('resolves fake science domain', () => {
    registerDiagnosticDomain(fakeDomain('science', 'forces'));
    const domain = getDiagnosticDomain({ subjectId: 'science', domainId: 'forces' });
    expect(domain.defaultStartSkillIds).toEqual(['FORCES001']);
  });

  it('resolves fake grammar domain', () => {
    registerDiagnosticDomain(fakeDomain('english', 'grammar'));
    expect(hasDiagnosticDomain({ subjectId: 'english', domainId: 'grammar' })).toBe(true);
  });

  it('returns a clean error for unknown domains', () => {
    expect(() => getDiagnosticDomain({ subjectId: 'science', domainId: 'not_registered' }))
      .toThrow(/Diagnostic domain is not registered/);
    try {
      getDiagnosticDomain({ subjectId: 'science', domainId: 'not_registered' });
    } catch (err) {
      expect(err.status).toBe(404);
      expect(err.code).toBe('DIAGNOSTIC_DOMAIN_NOT_FOUND');
    }
  });
});
