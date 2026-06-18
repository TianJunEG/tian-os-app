import fractionsDiagnosticDomain from './domains/fractionsDiagnosticDomain.js';
import decimalsDiagnosticDomain from './domains/decimalsDiagnosticDomain.js';
import wholeNumbersDiagnosticDomain from './domains/wholeNumbersDiagnosticDomain.js';
import fourOperationsDiagnosticDomain from './domains/fourOperationsDiagnosticDomain.js';
import percentageDiagnosticDomain from './domains/percentageDiagnosticDomain.js';
import ratioDiagnosticDomain from './domains/ratioDiagnosticDomain.js';
import rateDiagnosticDomain from './domains/rateDiagnosticDomain.js';
import moneyDiagnosticDomain from './domains/moneyDiagnosticDomain.js';
import timeDiagnosticDomain from './domains/timeDiagnosticDomain.js';
import areaPerimeterDiagnosticDomain from './domains/areaPerimeterDiagnosticDomain.js';
import volumeDiagnosticDomain from './domains/volumeDiagnosticDomain.js';
import circlesDiagnosticDomain from './domains/circlesDiagnosticDomain.js';
import numberSenseDiagnosticDomain from './domains/numberSenseDiagnosticDomain.js';
import measurementDiagnosticDomain from './domains/measurementDiagnosticDomain.js';
import geometryDiagnosticDomain from './domains/geometryDiagnosticDomain.js';
import statisticsDiagnosticDomain from './domains/statisticsDiagnosticDomain.js';
import algebraDiagnosticDomain from './domains/algebraDiagnosticDomain.js';
import { canonicalDomainId } from '../../utils/skillSlugDomain.js';

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
  const domain = domains.get(keyFor({ subjectId, domainId }))
    || domains.get(keyFor({ subjectId, domainId: canonicalDomainId(domainId) }));
  if (!domain) {
    const err = new Error(`Diagnostic domain is not registered: ${subjectId}/${domainId}`);
    err.status = 404;
    err.code = 'DIAGNOSTIC_DOMAIN_NOT_FOUND';
    throw err;
  }
  return domain;
}

export function hasDiagnosticDomain({ subjectId = 'math', domainId = 'fractions' } = {}) {
  return domains.has(keyFor({ subjectId, domainId }))
    || domains.has(keyFor({ subjectId, domainId: canonicalDomainId(domainId) }));
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

// ── Step 0–1 (arithmetic core) ────────────────────────────────────────────────
registerDiagnosticDomain(fractionsDiagnosticDomain);
registerDiagnosticDomain(decimalsDiagnosticDomain);
// ── Step 2 (engine_ready via genericDiagnosticAdapterFactory) ─────────────────
registerDiagnosticDomain(wholeNumbersDiagnosticDomain);
registerDiagnosticDomain(fourOperationsDiagnosticDomain);
registerDiagnosticDomain(percentageDiagnosticDomain);
// ── Step 4 (domain expansion) ─────────────────────────────────────────────────
registerDiagnosticDomain(ratioDiagnosticDomain);
registerDiagnosticDomain(rateDiagnosticDomain);
registerDiagnosticDomain(moneyDiagnosticDomain);
registerDiagnosticDomain(timeDiagnosticDomain);
registerDiagnosticDomain(areaPerimeterDiagnosticDomain);
registerDiagnosticDomain(volumeDiagnosticDomain);
registerDiagnosticDomain(circlesDiagnosticDomain);
// ── Step 5 (curriculum expansion) ─────────────────────────────────────────────
registerDiagnosticDomain(numberSenseDiagnosticDomain);
registerDiagnosticDomain(measurementDiagnosticDomain);
registerDiagnosticDomain(geometryDiagnosticDomain);
registerDiagnosticDomain(statisticsDiagnosticDomain);
registerDiagnosticDomain(algebraDiagnosticDomain);

export default {
  getDiagnosticDomain,
  listDiagnosticDomains,
  hasDiagnosticDomain,
  registerDiagnosticDomain,
};
