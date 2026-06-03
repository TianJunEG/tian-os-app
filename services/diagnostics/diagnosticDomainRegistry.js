import fractionsDiagnosticDomain from './domains/fractionsDiagnosticDomain.js';

const domains = new Map();

function keyFor({ subjectId = '', domainId = '' } = {}) {
  return `${String(subjectId || '').toLowerCase()}:${String(domainId || '').toLowerCase()}`;
}

export function registerDiagnosticDomain(domain) {
  if (!domain?.subjectId || !domain?.domainId) {
    throw new Error('Diagnostic domain requires subjectId and domainId.');
  }
  domains.set(keyFor(domain), domain);
  return domain;
}

export function getDiagnosticDomain({ subjectId = 'math', domainId = 'fractions' } = {}) {
  const domain = domains.get(keyFor({ subjectId, domainId }));
  if (!domain) {
    const err = new Error(`Diagnostic domain is not registered: ${subjectId}/${domainId}`);
    err.status = 404;
    err.code = 'DIAGNOSTIC_DOMAIN_NOT_FOUND';
    throw err;
  }
  return domain;
}

export function hasDiagnosticDomain({ subjectId = 'math', domainId = 'fractions' } = {}) {
  return domains.has(keyFor({ subjectId, domainId }));
}

export function listDiagnosticDomains() {
  return [...domains.values()].map((domain) => ({
    subjectId: domain.subjectId,
    domainId: domain.domainId,
    domainVersion: domain.domainVersion || '',
    displayName: domain.displayName || domain.domainId,
  }));
}

export function clearDiagnosticDomainsForTest() {
  domains.clear();
}

registerDiagnosticDomain(fractionsDiagnosticDomain);

export default {
  getDiagnosticDomain,
  listDiagnosticDomains,
  hasDiagnosticDomain,
  registerDiagnosticDomain,
};
