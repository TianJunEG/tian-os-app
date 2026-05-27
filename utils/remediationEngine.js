// MathPath remediation engine. When a learner repeatedly struggles on a skill,
// this builds a CALM, progressively-disclosed plan rather than a wall of text:
//   1. reassure  2. one-line hint aimed at the likely misconception
//   3. (optionally) a quick prerequisite warm-up  4. one worked example
//   5. a guided near-identical problem to replicate  6. a fresh try
// Steps are returned in order with revealOneAtATime:true so the UI shows ONE at a
// time (progressive disclosure, low cognitive load). The ordering/emphasis is
// driven by the skill's remediation.onRepeatedFail strategy and the misconception
// actually seen in the recent attempts. Worked/guided items reuse the rule-based
// generator so the numbers are real and the working is correct.
import { generateQuestionsForSkill } from './questionTemplates.js';
import Skill from '../models/Skill.js';

// A short, warm, single-sentence hint. Prefer a misconception-specific nudge;
// otherwise fall back to the skill's remediation strategy.
function hintFor(misconception, strategy) {
  if (misconception?.label) {
    // Turn the misconception statement into a gentle "watch-out" without naming the error harshly.
    return `Quick check: ${strategy || 'look carefully at this step'} — that’s the part this question is testing.`;
  }
  return strategy || 'Let’s take it one small step at a time.';
}

// Order the plan by the skill's preferred strategy on repeated failure.
function orderSteps({ reassure, hint, reinforce, worked, guided, retry }, strategy) {
  const base = [reassure, hint];
  if (strategy === 'reinforce-prerequisite' || strategy === 'slow-accuracy-first') {
    return [...base, reinforce, worked, guided, retry].filter(Boolean);
  }
  if (strategy === 'guided-replication') {
    return [...base, worked, guided, reinforce, retry].filter(Boolean);
  }
  // default: worked-example first
  return [...base, worked, reinforce, guided, retry].filter(Boolean);
}

// Pure core. `skill` is a Skill doc (with metadata); `recentAttempts` the failing
// attempts [{ correct, misconceptionTag }]; `prereqSkills` resolved prereq docs.
export function buildRemediationPlan({ skill, recentAttempts = [], prereqSkills = [] }) {
  const md = skill.metadata || {};
  // 1) Likely misconception: most frequent tag seen, else the skill's primary one.
  const counts = {};
  for (const a of recentAttempts) if (!a.correct && a.misconceptionTag) counts[a.misconceptionTag] = (counts[a.misconceptionTag] || 0) + 1;
  const topTag = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const misconception = (md.misconceptions || []).find((m) => m.tag === topTag) || (md.misconceptions || [])[0] || null;

  // 2) Prerequisite reinforcement (skill's declared reinforcement, else its prereqs).
  const reinforceSlugs = (md.remediation?.reinforce?.length ? md.remediation.reinforce : prereqSkills.map((p) => p.slug)) || [];
  const strategy = md.remediation?.onRepeatedFail || 'worked-example';

  // 3) Concrete worked example + a guided clone, from the rule-based generator
  // when one exists; otherwise fall back to the skill's question-structure stem.
  const gen = generateQuestionsForSkill(skill.name, 2);
  const stub = md.questionStructures?.[0] || null;
  const worked = gen[0]
    ? { type: 'worked-example', stem: gen[0].stem, solution: gen[0].workedSolution, answer: gen[0].answer }
    : (stub ? { type: 'worked-example', stem: stub.stem, solution: md.remediation?.strategy || '', answer: null } : null);
  const guided = gen[1]
    ? { type: 'guided-replication', stem: gen[1].stem, answer: gen[1].answer, reveal: 'step-by-step',
        prompt: 'Try the same steps on this one — I’ll reveal each step only if you need it.' }
    : (stub ? { type: 'guided-replication', stem: stub.stem, answer: null, reveal: 'step-by-step' } : null);

  const steps = orderSteps({
    reassure: { type: 'reassure', text: 'No worries — let’s look at this one together.' },
    hint: { type: 'hint', text: hintFor(misconception, md.remediation?.strategy) },
    reinforce: reinforceSlugs.length
      ? { type: 'reinforce-prerequisite', skills: reinforceSlugs, text: 'Let’s warm up the building block first.' } : null,
    worked,
    guided,
    retry: { type: 'retry', text: 'Now you’re ready — try a fresh one on your own.' },
  }, strategy);

  return {
    skill: skill.slug,
    misconception,
    strategy,
    tone: 'calm',
    disclosure: 'progressive',
    revealOneAtATime: true,
    steps,
  };
}

// DB wrapper: resolve the skill (by slug) and its prerequisites, then build the plan.
export async function buildRemediation(skillSlug, recentAttempts = []) {
  const skill = await Skill.findOne({ slug: skillSlug });
  if (!skill) return null;
  const prereqSkills = await Skill.find({ _id: { $in: skill.prerequisiteSkillIds || [] } });
  return buildRemediationPlan({ skill, recentAttempts, prereqSkills });
}
