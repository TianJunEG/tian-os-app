import statistics from '../../../scripts/domains/statistics.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'statistics',
  displayName:          'Statistics',
  subjectId:            'math',
  skills:               statistics.skills,
  fallbackSkillId:      'stat.tables',
  defaultStartSkillIds: ['stat.tables'],
  domainVersion:        'v0.1',
});
