import ratioRate from '../../../scripts/domains/ratioRate.js';
import { createDiagnosticDomain } from '../genericDiagnosticAdapterFactory.js';

const RATE_SLUGS = new Set(['rr.rate', 'rr.rate-tiered', 'rr.speed', 'rr.speed-avg']);

export default createDiagnosticDomain({
  domainId:             'rate',
  displayName:          'Rate',
  subjectId:            'math',
  skills:               ratioRate.skills.filter((s) => RATE_SLUGS.has(s.slug)),
  fallbackSkillId:      'rr.rate',
  defaultStartSkillIds: ['rr.rate'],
  domainVersion:        'v0.1',
});
