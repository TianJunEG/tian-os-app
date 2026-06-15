import time from '../../../scripts/domains/time.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

export default createDiagnosticDomain({
  domainId:             'time',
  displayName:          'Time',
  subjectId:            'math',
  skills:               time.skills,
  fallbackSkillId:      'tim.tell-hour',
  defaultStartSkillIds: ['tim.tell-hour'],
  domainVersion:        'v0.1',
});
