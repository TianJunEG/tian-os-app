// graph.js — the MathPath adaptive skill graph.
//
// Scope: adaptive math mastery + fluency only (multiplication/division fluency + the first
// fraction concepts). No heuristics, Olympiad, science, spelling, etc. Each node carries the
// fields the engines reason over; learner *state* lives in MongoDB, the graph lives in code.

export const DOMAINS = {
  md: 'Multiplication & Division',
  fr: 'Fractions',
};

export const MASTERY_ACCURACY = 0.9;
export const REMEDIATION_ACCURACY = 0.7;
export const QUESTIONS_PER_SESSION = 8;
// A mastered skill becomes "due for review" once it hasn't been practised in this long.
export const SPACED_REVIEW_DAYS = 3;

// Session shaping: the recommendation mode decides how long/dense a session is.
// Fluency drills want more, quick reps; remediation/review want short, focused sets.
const SESSION_LENGTHS = {
  fluency: 12, remediate: 6, misconception: 6, prerequisite: 6, review: 5,
  independent: 8, advance: 8, start: 8, continue: 8, maintain: 6,
};
export function sessionLengthFor(mode) {
  return SESSION_LENGTHS[mode] || QUESTIONS_PER_SESSION;
}

// Each skill declares its `prerequisites` inline; `extends_to` and the `EDGES` list are derived
// from them at load time, so there's a single place to edit relationships. `example` is a
// KaTeX-renderable worked instance shown on skill cards.
const RAW_SKILLS = [
  {
    skill_id: 'mul-fluency', domain: 'md', skill_name: 'Multiplication fluency', level_tag: 'P3',
    gen: 'mul', mastery_type: 'fluency', fluency_type: 'fact_recall',
    expected_time_seconds: 4, mastery_threshold: { accuracy: 0.9, speed_grace: 1.25 },
    prerequisites: [], example: '7 \\times 8 = 56',
  },
  {
    skill_id: 'div-fluency', domain: 'md', skill_name: 'Division fluency', level_tag: 'P3',
    gen: 'div', mastery_type: 'fluency', fluency_type: 'fact_recall',
    expected_time_seconds: 5, mastery_threshold: { accuracy: 0.9, speed_grace: 1.25 },
    prerequisites: ['mul-fluency'], example: '56 \\div 7 = 8',
  },
  {
    skill_id: 'frac-meaning', domain: 'fr', skill_name: 'Fraction meaning', level_tag: 'P3',
    gen: 'fracMeaning', mastery_type: 'concept', fluency_type: 'conceptual',
    expected_time_seconds: 10, mastery_threshold: { accuracy: 0.9, speed_grace: 2.0 },
    prerequisites: ['div-fluency'], example: '\\tfrac{3}{4}\\ \\text{shaded}',
  },
  {
    skill_id: 'frac-equiv', domain: 'fr', skill_name: 'Equivalent fractions', level_tag: 'P4',
    gen: 'fracEquiv', mastery_type: 'concept', fluency_type: 'procedural',
    expected_time_seconds: 12, mastery_threshold: { accuracy: 0.9, speed_grace: 2.0 },
    prerequisites: ['frac-meaning', 'mul-fluency'], example: '\\frac{1}{2} = \\frac{2}{4}',
  },
  {
    skill_id: 'frac-simplify', domain: 'fr', skill_name: 'Simplifying fractions', level_tag: 'P4',
    gen: 'fracSimplify', mastery_type: 'concept', fluency_type: 'procedural',
    expected_time_seconds: 12, mastery_threshold: { accuracy: 0.9, speed_grace: 2.0 },
    prerequisites: ['frac-equiv', 'div-fluency'], example: '\\frac{6}{8} = \\frac{3}{4}',
  },
  {
    skill_id: 'frac-compare', domain: 'fr', skill_name: 'Comparing fractions', level_tag: 'P4',
    gen: 'fracCompare', mastery_type: 'concept', fluency_type: 'procedural',
    expected_time_seconds: 12, mastery_threshold: { accuracy: 0.9, speed_grace: 2.0 },
    prerequisites: ['frac-equiv'], example: '\\frac{2}{3} > \\frac{3}{5}',
  },
  {
    skill_id: 'frac-add', domain: 'fr', skill_name: 'Adding fractions', level_tag: 'P4',
    gen: 'fracAdd', mastery_type: 'concept', fluency_type: 'procedural',
    expected_time_seconds: 14, mastery_threshold: { accuracy: 0.9, speed_grace: 2.0 },
    prerequisites: ['frac-equiv', 'frac-compare'], example: '\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}',
  },
];

// Derive extends_to (reverse edges) onto each skill.
export const SKILLS = RAW_SKILLS.map((s) => ({
  ...s,
  extends_to: RAW_SKILLS.filter((t) => t.prerequisites.includes(s.skill_id)).map((t) => t.skill_id),
}));

// Flat directed edge list (source must be mastered before target), derived from prerequisites.
export const EDGES = SKILLS.flatMap((s) => s.prerequisites.map((source) => ({ source, target: s.skill_id })));

export const SKILL_ORDER = SKILLS.map((s) => s.skill_id);

export function getSkill(id) {
  return SKILLS.find((s) => s.skill_id === id) || null;
}
export function prerequisitesOf(id) {
  return getSkill(id)?.prerequisites || [];
}
export function extendsTo(id) {
  return getSkill(id)?.extends_to || [];
}
export function domainName(id) {
  return DOMAINS[getSkill(id)?.domain] || '';
}
