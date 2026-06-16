// Curriculum domain config and unified skill / misconception lookup for the
// tutor domain selector and the generic curriculum-domain intelligence engine.
// Maps display domain names → primary-level domainIds + resolver functions.

import * as p1Money from './primary/p1MoneySkillGraph.js';
import * as p2Money from './primary/p2MoneySkillGraph.js';
import * as p3Money from './primary/p3MoneySkillGraph.js';
import * as p2Time from './primary/p2TimeSkillGraph.js';
import * as p3MeasTime from './primary/p3MeasTimeSkillGraph.js';
import * as p3AreaPerim from './primary/p3AreaPerimSkillGraph.js';
import * as p5AreaVol from './primary/p5AreaVolSkillGraph.js';
import * as p6AreaVol from './primary/p6AreaVolSkillGraph.js';
import * as p6Circles from './primary/p6CirclesSkillGraph.js';
import * as p5Ratio from './primary/p5RatioSkillGraph.js';
import * as p6Ratio from './primary/p6RatioSkillGraph.js';
import * as p6Speed from './primary/p6SpeedSkillGraph.js';
import * as p5Percentage from './primary/p5PercentageSkillGraph.js';
import * as p6Percentage from './primary/p6PercentageSkillGraph.js';
import * as p6Algebra from './primary/p6AlgebraSkillGraph.js';

import * as p1MoneyMc from './primary/p1MoneyMisconceptionMap.js';
import * as p2MoneyMc from './primary/p2MoneyMisconceptionMap.js';
import * as p3MoneyMc from './primary/p3MoneyMisconceptionMap.js';
import * as p2TimeMc from './primary/p2TimeMisconceptionMap.js';
import * as p3MeasTimeMc from './primary/p3MeasTimeMisconceptionMap.js';
import * as p3AreaPerimMc from './primary/p3AreaPerimMisconceptionMap.js';
import * as p5AreaVolMc from './primary/p5AreaVolMisconceptionMap.js';
import * as p6AreaVolMc from './primary/p6AreaVolMisconceptionMap.js';
import * as p6CirclesMc from './primary/p6CirclesMisconceptionMap.js';
import * as p5RatioMc from './primary/p5RatioMisconceptionMap.js';
import * as p6RatioMc from './primary/p6RatioMisconceptionMap.js';
import * as p6SpeedMc from './primary/p6SpeedMisconceptionMap.js';
import * as p5PercentageMc from './primary/p5PercentageMisconceptionMap.js';
import * as p6PercentageMc from './primary/p6PercentageMisconceptionMap.js';
import * as p6AlgebraMc from './primary/p6AlgebraMisconceptionMap.js';

import * as p1MoneyFam from './primary/p1MoneyQuestionFamilies.js';
import * as p2MoneyFam from './primary/p2MoneyQuestionFamilies.js';
import * as p3MoneyFam from './primary/p3MoneyQuestionFamilies.js';
import * as p2TimeFam from './primary/p2TimeQuestionFamilies.js';
import * as p3MeasTimeFam from './primary/p3MeasTimeQuestionFamilies.js';
import * as p3AreaPerimFam from './primary/p3AreaPerimQuestionFamilies.js';
import * as p5AreaVolFam from './primary/p5AreaVolQuestionFamilies.js';
import * as p6AreaVolFam from './primary/p6AreaVolQuestionFamilies.js';
import * as p6CirclesFam from './primary/p6CirclesQuestionFamilies.js';
import * as p5RatioFam from './primary/p5RatioQuestionFamilies.js';
import * as p6RatioFam from './primary/p6RatioQuestionFamilies.js';
import * as p6SpeedFam from './primary/p6SpeedQuestionFamilies.js';
import * as p5PercentageFam from './primary/p5PercentageQuestionFamilies.js';
import * as p6PercentageFam from './primary/p6PercentageQuestionFamilies.js';
import * as p6AlgebraFam from './primary/p6AlgebraQuestionFamilies.js';

// Per-domainId skill graph modules (each exposes getSkill / getPrerequisites /
// getRemediationTargets / getAllSkills with a uniform signature).
const DOMAIN_GRAPHS = {
  'p1-money': p1Money,
  'p2-money': p2Money,
  'p3-money': p3Money,
  'p2-time': p2Time,
  'p3-meas-time': p3MeasTime,
  'p3-area-perimeter': p3AreaPerim,
  'p5-areavol': p5AreaVol,
  'p6-area-volume': p6AreaVol,
  'p6-circles': p6Circles,
  'p5-ratio': p5Ratio,
  'p6-ratio': p6Ratio,
  'p6-speed': p6Speed,
  'p5-percentage': p5Percentage,
  'p6-percentage': p6Percentage,
  'p6-algebra': p6Algebra,
};

// Per-domainId misconception maps (each exposes getMisconception /
// getMisconceptionsForSkill returning objects with { tag, label, description,
// remediationExplanation, relatedSkills }).
const DOMAIN_MISCONCEPTIONS = {
  'p1-money': p1MoneyMc,
  'p2-money': p2MoneyMc,
  'p3-money': p3MoneyMc,
  'p2-time': p2TimeMc,
  'p3-meas-time': p3MeasTimeMc,
  'p3-area-perimeter': p3AreaPerimMc,
  'p5-areavol': p5AreaVolMc,
  'p6-area-volume': p6AreaVolMc,
  'p6-circles': p6CirclesMc,
  'p5-ratio': p5RatioMc,
  'p6-ratio': p6RatioMc,
  'p6-speed': p6SpeedMc,
  'p5-percentage': p5PercentageMc,
  'p6-percentage': p6PercentageMc,
  'p6-algebra': p6AlgebraMc,
};

// Per-domainId question-family registries (each exposes getQuestionFamily /
// getQuestionFamiliesBySkill / getAllQuestionFamilies; family objects carry
// fluencyTargetSeconds + fluencyBenchmarks for client-side fluency scoring).
const DOMAIN_FAMILIES = {
  'p1-money': p1MoneyFam,
  'p2-money': p2MoneyFam,
  'p3-money': p3MoneyFam,
  'p2-time': p2TimeFam,
  'p3-meas-time': p3MeasTimeFam,
  'p3-area-perimeter': p3AreaPerimFam,
  'p5-areavol': p5AreaVolFam,
  'p6-area-volume': p6AreaVolFam,
  'p6-circles': p6CirclesFam,
  'p5-ratio': p5RatioFam,
  'p6-ratio': p6RatioFam,
  'p6-speed': p6SpeedFam,
  'p5-percentage': p5PercentageFam,
  'p6-percentage': p6PercentageFam,
  'p6-algebra': p6AlgebraFam,
};

export function getSkillFromDomain(domainId, skillId) {
  return DOMAIN_GRAPHS[domainId]?.getSkill?.(skillId) ?? null;
}

// The curriculum area domains shown in the tutor domain selector.
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

function findInDomains(domainIds, fnName, arg) {
  for (const domainId of domainIds) {
    const result = DOMAIN_GRAPHS[domainId]?.[fnName]?.(arg);
    if (result != null && (!Array.isArray(result) || result.length)) return result;
  }
  return null;
}

// Builds a domain-agnostic resolver bundle for a curriculum domain key
// (e.g. 'percentage' spans p5-percentage + p6-percentage). Injected into the
// generic curriculum-domain tutor engine so it stays pure and testable.
export function getDomainResolvers(domainKey) {
  const domain = CURRICULUM_DOMAINS.find((d) => d.key === domainKey);
  if (!domain) return null;
  const { domainIds, label } = domain;

  return {
    domainKey,
    domainLabel: label,
    domainIds,
    getSkill: (skillId) => findInDomains(domainIds, 'getSkill', skillId),
    getSkillName: (skillId) => findInDomains(domainIds, 'getSkill', skillId)?.name || skillId,
    getPrerequisites: (skillId) => findInDomains(domainIds, 'getPrerequisites', skillId) || [],
    getRemediationTargets: (skillId) => findInDomains(domainIds, 'getRemediationTargets', skillId) || [],
    getAllSkillIds: () => domainIds.flatMap((id) => (DOMAIN_GRAPHS[id]?.getAllSkills?.() || []).map((s) => s.id)),
    getMisconception: (tag) => {
      for (const domainId of domainIds) {
        const m = DOMAIN_MISCONCEPTIONS[domainId]?.getMisconception?.(tag);
        if (m) return m;
      }
      return null;
    },
    getQuestionFamily: (familyId) => {
      for (const domainId of domainIds) {
        const f = DOMAIN_FAMILIES[domainId]?.getQuestionFamily?.(familyId);
        if (f) return f;
      }
      return null;
    },
  };
}
