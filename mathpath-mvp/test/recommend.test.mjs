// recommend.test.mjs — behavioural tests for the recommendation engine (v2).
// Run: npm test   (node, no framework). chooseRecommendation is pure over profiles.

import { chooseRecommendation } from '../src/lib/recommend.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  → got '${got}', want '${want}'`}`);
  ok ? pass++ : fail++;
}

// Build a mastery profile with sensible defaults.
const P = (skill_id, o = {}) => ({
  skill_id, mastery_status: 'not_started', accuracy: 0, median_first_try_seconds: null,
  first_try_attempts: 0, misconceptions: {}, score: 0, last_practiced_at: null, ...o,
});
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// 1. Fresh learner → start the first skill.
check('fresh → start mul-fluency', chooseRecommendation([]).mode, 'start');
check('fresh → skill is mul-fluency', chooseRecommendation([]).recommended_skill_id, 'mul-fluency');

// 2. Accuracy < 70% (with enough attempts) → remediate.
check('low accuracy → remediate',
  chooseRecommendation([P('mul-fluency', { mastery_status: 'developing', accuracy: 0.5, first_try_attempts: 8, median_first_try_seconds: 5 })]).mode,
  'remediate');

// 3. Accuracy 70–89% → independent practice.
check('mid accuracy → independent',
  chooseRecommendation([P('mul-fluency', { mastery_status: 'practising', accuracy: 0.8, first_try_attempts: 8, median_first_try_seconds: 5 })]).mode,
  'independent');

// 4. Accuracy ≥ 90% but slow → fluency drills.
check('high accuracy + slow → fluency',
  chooseRecommendation([P('mul-fluency', { mastery_status: 'fluent', accuracy: 0.95, first_try_attempts: 8, median_first_try_seconds: 9 })]).mode,
  'fluency');

// 5. Accuracy ≥ 90% and fast → advance to the next skill.
{
  const rec = chooseRecommendation([P('mul-fluency', { mastery_status: 'fluent', accuracy: 0.95, first_try_attempts: 8, median_first_try_seconds: 3 })]);
  check('high accuracy + fast → advance', rec.mode, 'advance');
  check('advance → unlocks div-fluency', rec.recommended_skill_id, 'div-fluency');
}

// 6. Repeated misconception → prerequisite reinforcement (takes precedence over accuracy band).
check('repeated misconception → misconception mode',
  chooseRecommendation([P('mul-fluency', { mastery_status: 'developing', accuracy: 0.5, first_try_attempts: 8, median_first_try_seconds: 5, misconceptions: { 'mult/adds': 3, 'mult/recall': 1 } })]).mode,
  'misconception');

// 7. Unmastered prerequisite → reroute to it before the new skill.
{
  // mul + div mastered, frac-meaning mastered, but mul-fluency NOT mastered should gate frac-equiv.
  const profiles = [
    P('mul-fluency', { mastery_status: 'practising', accuracy: 0.8, first_try_attempts: 8 }),
  ];
  const rec = chooseRecommendation(profiles);
  check('prereq gate → works on first unmastered (mul)', rec.recommended_skill_id, 'mul-fluency');
}

// 8. Spaced review → resurface a stale mastered skill when progressing calmly.
{
  const profiles = [
    P('mul-fluency', { mastery_status: 'mastered', accuracy: 0.95, median_first_try_seconds: 3, first_try_attempts: 10, last_practiced_at: daysAgo(5), score: 0.95 }),
    P('div-fluency', { mastery_status: 'not_started' }),
  ];
  const rec = chooseRecommendation(profiles);
  check('stale mastered skill → review mode', rec.mode, 'review');
  check('review targets the stale skill', rec.recommended_skill_id, 'mul-fluency');
}

// 9. Spaced review does NOT pre-empt urgent remediation.
{
  const profiles = [
    P('mul-fluency', { mastery_status: 'mastered', accuracy: 0.95, median_first_try_seconds: 3, first_try_attempts: 10, last_practiced_at: daysAgo(5), score: 0.95 }),
    P('div-fluency', { mastery_status: 'developing', accuracy: 0.4, first_try_attempts: 8, median_first_try_seconds: 6 }),
  ];
  check('urgent remediation beats review', chooseRecommendation(profiles).mode, 'remediate');
}

// 10. All mastered → maintain.
{
  const all = ['mul-fluency', 'div-fluency', 'frac-meaning', 'frac-equiv', 'frac-simplify', 'frac-compare', 'frac-add']
    .map((id) => P(id, { mastery_status: 'mastered', accuracy: 0.95, median_first_try_seconds: 3, first_try_attempts: 10, last_practiced_at: daysAgo(0), score: 0.95 }));
  check('all mastered → maintain', chooseRecommendation(all).mode, 'maintain');
}

console.log(`\n${pass}/${pass + fail} passed${fail ? `, ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
