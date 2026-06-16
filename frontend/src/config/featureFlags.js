// Centralized feature flags for v0.1 (MathPath student beta)
// Toggle values here control UI visibility and route guarding.
const envTrue = (v) => String(v || '').toLowerCase() === 'true' || String(v || '') === '1';
const flagEnabled = (name, fallback = false) => {
  const viteValue = import.meta.env[`VITE_ENABLE_${name}`];
  const rawValue = import.meta.env[`ENABLE_${name}`];
  if (viteValue !== undefined || rawValue !== undefined) return envTrue(viteValue) || envTrue(rawValue);
  return fallback;
};
const WORKSHEETS_ENABLED = flagEnabled('WORKSHEETS', true);
const FLUENCY_ENABLED = flagEnabled('FLUENCY_PILOT', false);
const ASSESSMENTS_ENABLED = flagEnabled('ASSESSMENTS_PILOT', false);
const MODEL_TRAINER_ENABLED = flagEnabled('MODEL_TRAINER_PILOT', false);
const WORKING_MATH_INSERTS_ENABLED = flagEnabled('WORKING_MATH_INSERTS_PILOT', false);

export const FEATURE_FLAGS = {
  // Core student features (enabled)
  mathpath: true,
  fluency: FLUENCY_ENABLED,
  mistakes: true,
  progress: true,
  // Mascot-narrated parent progress update (Chelya) on the parent dashboard.
  // Prototype — default off; enable with VITE_ENABLE_PARENT_NARRATION=true.
  parentNarration: flagEnabled('PARENT_NARRATION', false),
  // Metacognition: prompt students to explain why a correct answer worked
  // (self-explanation effect). Prototype — default off; enable with
  // VITE_ENABLE_SELF_EXPLANATION=true.
  selfExplanation: flagEnabled('SELF_EXPLANATION', false),
  // After a wrong answer, Talia names the likely misconception for that skill
  // and what to do about it. Prototype — default off; enable with
  // VITE_ENABLE_MISCONCEPTION_FEEDBACK=true.
  misconceptionFeedback: flagEnabled('MISCONCEPTION_FEEDBACK', false),
  assessments: ASSESSMENTS_ENABLED,
  modelTrainer: MODEL_TRAINER_ENABLED,
  workingMathInserts: WORKING_MATH_INSERTS_ENABLED,

  // Features shown as "Coming Soon" (still disabled but visible)
  worksheets: WORKSHEETS_ENABLED,
  worksheetsComingSoon: false,
  parent: flagEnabled('PARENT', true),
  parentComingSoon: false,

  // Disabled for v0.1 (hidden)
  lifelab: flagEnabled('LIFELAB', true),
  science: flagEnabled('SCIENCE'),
  mechanisms: flagEnabled('MECHANISMS'),
  spelling: flagEnabled('SPELLING', true),
  psl: flagEnabled('PSL', true),
  tutor: flagEnabled('TUTOR', true),
  teacher: flagEnabled('TEACHER', true),
  admin: flagEnabled('ADMIN', true),
  payments: flagEnabled('PAYMENTS'),
  tutorMarketplace: flagEnabled('TUTOR_MARKETPLACE'),
  certification: flagEnabled('CERTIFICATION'),
  fractionsStoryMode: flagEnabled('FRACTIONS_STORY_MODE'),
};

export const isFractionsStoryModeEnabled = () => FEATURE_FLAGS.fractionsStoryMode;

export default FEATURE_FLAGS;
