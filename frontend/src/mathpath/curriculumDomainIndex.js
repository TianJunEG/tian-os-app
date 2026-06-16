// Curriculum domain config and unified skill lookup for the tutor domain selector.
// Maps display domain names → primary-level domainIds + skill lookup functions.

import { getSkill as p1MoneySkill } from './primary/p1MoneySkillGraph.js';
import { getSkill as p2MoneySkill } from './primary/p2MoneySkillGraph.js';
import { getSkill as p3MoneySkill } from './primary/p3MoneySkillGraph.js';
import { getSkill as p2TimeSkill } from './primary/p2TimeSkillGraph.js';
import { getSkill as p3MeasTimeSkill } from './primary/p3MeasTimeSkillGraph.js';
import { getSkill as p3AreaPerimSkill } from './primary/p3AreaPerimSkillGraph.js';
import { getSkill as p5AreaVolSkill } from './primary/p5AreaVolSkillGraph.js';
import { getSkill as p6AreaVolSkill } from './primary/p6AreaVolSkillGraph.js';
import { getSkill as p6CirclesSkill } from './primary/p6CirclesSkillGraph.js';
import { getSkill as p5RatioSkill } from './primary/p5RatioSkillGraph.js';
import { getSkill as p6RatioSkill } from './primary/p6RatioSkillGraph.js';
import { getSkill as p6SpeedSkill } from './primary/p6SpeedSkillGraph.js';
import { getSkill as p5PercentageSkill } from './primary/p5PercentageSkillGraph.js';
import { getSkill as p6PercentageSkill } from './primary/p6PercentageSkillGraph.js';
import { getSkill as p6AlgebraSkill } from './primary/p6AlgebraSkillGraph.js';

const DOMAIN_GETTERS = {
  'p1-money': p1MoneySkill,
  'p2-money': p2MoneySkill,
  'p3-money': p3MoneySkill,
  'p2-time': p2TimeSkill,
  'p3-meas-time': p3MeasTimeSkill,
  'p3-area-perimeter': p3AreaPerimSkill,
  'p5-areavol': p5AreaVolSkill,
  'p6-area-volume': p6AreaVolSkill,
  'p6-circles': p6CirclesSkill,
  'p5-ratio': p5RatioSkill,
  'p6-ratio': p6RatioSkill,
  'p6-speed': p6SpeedSkill,
  'p5-percentage': p5PercentageSkill,
  'p6-percentage': p6PercentageSkill,
  'p6-algebra': p6AlgebraSkill,
};

export function getSkillFromDomain(domainId, skillId) {
  return DOMAIN_GETTERS[domainId]?.(skillId) ?? null;
}

// The 7 curriculum area domains shown in the tutor domain selector.
export const CURRICULUM_DOMAINS = [
  { key: 'money', label: 'Money', domainIds: ['p1-money', 'p2-money', 'p3-money'] },
  { key: 'time', label: 'Time', domainIds: ['p2-time', 'p3-meas-time'] },
  { key: 'area-perimeter', label: 'Area & Perimeter', domainIds: ['p3-area-perimeter'] },
  { key: 'volume', label: 'Volume', domainIds: ['p5-areavol', 'p6-area-volume'] },
  { key: 'circles', label: 'Circles', domainIds: ['p6-circles'] },
  { key: 'ratio', label: 'Ratio', domainIds: ['p5-ratio', 'p6-ratio'] },
  { key: 'rate', label: 'Rate', domainIds: ['p6-speed'] },
  { key: 'percentage', label: 'Percentage', domainIds: ['p5-percentage', 'p6-percentage'] },
  { key: 'algebra', label: 'Algebra', domainIds: ['p6-algebra'] },
];
