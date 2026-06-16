import numberSense from '../../../scripts/domains/numberSense.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'number_sense',
  displayName:          'Number Sense',
  subjectId:            'math',
  skills:               numberSense.skills,
  fallbackSkillId:      'ns.count.to-20',
  defaultStartSkillIds: ['ns.count.to-20'],
  domainVersion:        'v0.1',
});
