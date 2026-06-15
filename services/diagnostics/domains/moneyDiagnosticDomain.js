import money from '../../../scripts/domains/money.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'money',
  displayName:          'Money',
  subjectId:            'math',
  skills:               money.skills,
  fallbackSkillId:      'mon.coins-notes',
  defaultStartSkillIds: ['mon.coins-notes'],
  domainVersion:        'v0.1',
});
