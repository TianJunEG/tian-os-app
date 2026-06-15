import diagnosticsRegistry from '../diagnostics/diagnosticDomainRegistry.js';

const domains = new Map();

function keyFor({ subjectId = '', domainId = '' } = {}) {
  return `${String(subjectId || '').toLowerCase()}:${String(domainId || '').toLowerCase()}`;
}

function assertAdapterShape(domain = {}) {
  if (!domain.subjectId || !domain.domainId || !domain.displayName) {
    throw new Error('Domain registration requires subjectId, domainId, and displayName.');
  }
  const adapterNames = [
    'diagnosticAdapter',
    'assignmentAdapter',
    'worksheetAdapter',
    'paperAnalysisAdapter',
    'interventionAdapter',
  ];
  adapterNames.forEach((name) => {
    if (domain[name] && typeof domain[name] !== 'object') {
      throw new Error(`${name} must be an adapter object.`);
    }
  });
}

function capabilityFor(adapter = null) {
  if (!adapter) return { enabled: false, status: 'not_registered' };
  return {
    enabled: adapter.enabled !== false,
    status: adapter.status || (adapter.enabled === false ? 'disabled' : 'available'),
    notes: adapter.notes || '',
  };
}

function shapeDomain(domain = {}) {
  return {
    subjectId: domain.subjectId,
    domainId: domain.domainId,
    displayName: domain.displayName,
    domainVersion: domain.domainVersion || '',
    capabilities: {
      diagnostics: capabilityFor(domain.diagnosticAdapter),
      assignments: capabilityFor(domain.assignmentAdapter),
      worksheets: capabilityFor(domain.worksheetAdapter),
      paperAnalysis: capabilityFor(domain.paperAnalysisAdapter),
      interventions: capabilityFor(domain.interventionAdapter),
    },
    skillGraph: {
      enabled: Boolean(domain.skillGraphAdapter),
      status: domain.skillGraphAdapter?.status || (domain.skillGraphAdapter ? 'available' : 'not_registered'),
      notes: domain.skillGraphAdapter?.notes || '',
    },
  };
}

export function registerDomain(domain) {
  assertAdapterShape(domain);
  domains.set(keyFor(domain), Object.freeze({ ...domain }));
  return domain;
}

export function getDomain({ subjectId = 'math', domainId = 'fractions' } = {}) {
  const domain = domains.get(keyFor({ subjectId, domainId }));
  if (!domain) {
    const err = new Error(`Domain is not registered: ${subjectId}/${domainId}`);
    err.status = 404;
    err.code = 'DOMAIN_NOT_FOUND';
    throw err;
  }
  return domain;
}

export function hasDomain({ subjectId = 'math', domainId = 'fractions' } = {}) {
  return domains.has(keyFor({ subjectId, domainId }));
}

export function listDomains() {
  return [...domains.values()].map(shapeDomain);
}

export function getDomainHealthReport() {
  const registeredDomains = listDomains();
  return {
    generatedAt: new Date().toISOString(),
    registeredDomainCount: registeredDomains.length,
    registeredDomains,
    platformContracts: {
      diagnosticAdapter: {
        required: ['normaliseQuestion', 'scoreAnswer', 'detectErrorTags', 'buildResult', 'getSupportiveCopy'],
        status: 'defined',
      },
      assignmentAdapter: {
        required: ['assignFromDiagnostic', 'assignFromPaperAnalysis', 'assignFromSkills'],
        status: 'defined',
      },
      worksheetAdapter: {
        required: ['generateFromSkills', 'generateFromDiagnostic', 'generateFromPaperAnalysis'],
        status: 'defined',
      },
      paperAnalysisAdapter: {
        required: ['mapQuestionToSkills', 'detectMisconceptions', 'buildRecommendations'],
        status: 'defined',
      },
      interventionAdapter: {
        required: ['recommendIntervention', 'evaluateRecheckReadiness', 'advanceAfterCompletion'],
        status: 'defined',
      },
    },
  };
}

export function clearDomainsForTest() {
  domains.clear();
}

export function registerDefaultDomains() {
  if (hasDomain({ subjectId: 'math', domainId: 'fractions' })) return;
  const diagnosticAdapter = diagnosticsRegistry.getDiagnosticDomain({ subjectId: 'math', domainId: 'fractions' });
  registerDomain({
    subjectId: 'math',
    domainId: 'fractions',
    displayName: 'MathPath Fractions',
    domainVersion: diagnosticAdapter.domainVersion || 'fractions-diagnostic-v1',
    diagnosticAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Registry-backed adaptive diagnostic domain.',
      provider: diagnosticAdapter,
    },
    assignmentAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Uses MathPath Recovery Pack assignment service.',
      serviceModule: 'services/mathpath/mathPathAssignmentService.js',
    },
    worksheetAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Uses MathPath worksheet generation engine.',
      serviceModule: 'services/mathpath/worksheetGenerationEngine.js',
    },
    paperAnalysisAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Uses MathPath paper analysis pipeline and Fractions skill mapper.',
      serviceModule: 'services/mathpath/paperAnalysisSkillMapper.js',
    },
    interventionAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Uses MathPath remediation, recommendation, and recheck services.',
      serviceModule: 'services/mathpath/recheckRecommendationService.js',
    },
    skillGraphAdapter: {
      status: 'available',
      notes: 'Skill graph is supplied by MathPath/Fractions diagnostic domain metadata.',
    },
  });

  // MathPath Decimals — second math domain (P4→P6). Content, progression, and a
  // persisted practice loop are live; the adaptive diagnostic domain is
  // registered and engine-validated (`engine_ready`) with its DB session runtime
  // + UI still pending; the remaining platform adapters are `planned`.
  registerDomain({
    subjectId: 'math',
    domainId: 'decimals',
    displayName: 'MathPath Decimals',
    domainVersion: 'decimals-v0.1',
    diagnosticAdapter: {
      enabled: true,
      status: 'available',
      notes: 'DB-free adaptive diagnostic driven by the generic runtime; questions generated on-the-fly from the rule-based engine.',
      provider: diagnosticsRegistry.getDiagnosticDomain({ subjectId: 'math', domainId: 'decimals' }),
    },
    assignmentAdapter: { enabled: false, status: 'planned', notes: 'Will reuse the MathPath assignment service once diagnostics land.' },
    worksheetAdapter: { enabled: false, status: 'planned' },
    paperAnalysisAdapter: { enabled: false, status: 'planned' },
    interventionAdapter: { enabled: false, status: 'planned' },
    // Custom capability beyond the five platform adapters: the runnable content
    // + progression layer shipped in increments 1–2.
    practiceAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Rule-based question generator + prerequisite-gated practice/progression engine.',
      serviceModule: 'shared/mathpath/decimals/decimalsPracticeEngine.js',
    },
    fluencyAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Timed fluency drills scored into bronze→platinum bands; persists fluencyLevel.',
      serviceModule: 'services/mathpath/decimalsFluencyService.js',
    },
    assessmentAdapter: {
      enabled: true,
      status: 'available',
      notes: 'Mastery-gated summative assessment with a transparent knowledge/fluency/retention readiness score.',
      serviceModule: 'services/mathpath/decimalsAssessmentService.js',
    },
    skillGraphAdapter: {
      status: 'available',
      notes: '14-skill Decimals graph (D001–D014) in shared/mathpath/decimals/decimalsSkillGraph.js.',
    },
  });
}

registerDefaultDomains();

// Problem Solving Lab — guided heuristic word-problem reasoning (bar models).
// PSL uses the shared mastery engine (module: 'PSL') and Mistake model; it does
// not need diagnostic/assignment/worksheet adapters — its session lifecycle is
// self-contained in services/psl/.
if (!hasDomain({ subjectId: 'math', domainId: 'psl' })) {
  registerDomain({
    subjectId: 'math',
    domainId: 'psl',
    displayName: 'Problem Solving Lab',
    domainVersion: 'psl-v0.1',
    diagnosticAdapter: null,
    assignmentAdapter: null,
    worksheetAdapter: null,
    paperAnalysisAdapter: null,
    interventionAdapter: null,
    skillGraphAdapter: {
      status: 'available',
      notes: 'PSL skill graph defined in scripts/seedPSLSkills.js with prerequisite chains.',
    },
  });
}

export default {
  registerDomain,
  getDomain,
  hasDomain,
  listDomains,
  getDomainHealthReport,
};
