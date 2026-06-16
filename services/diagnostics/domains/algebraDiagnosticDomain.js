import algebra from '../../../scripts/domains/algebra.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'algebra',
  displayName:          'Algebra',
  subjectId:            'math',
  skills:               algebra.skills,
  fallbackSkillId:      'alg.unknown-arith',
  defaultStartSkillIds: ['alg.unknown-arith'],
  domainVersion:        'v0.1',
});
