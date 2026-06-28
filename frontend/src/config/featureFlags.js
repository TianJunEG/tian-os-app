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
const FLUENCY_ENABLED = flagEnabled('FLUENCY_PILOT', true);
const ASSESSMENTS_ENABLED = flagEnabled('ASSESSMENTS_PILOT', true);
const MODEL_TRAINER_ENABLED = flagEnabled('MODEL_TRAINER_PILOT', false);
const WORKING_MATH_INSERTS_ENABLED = flagEnabled('WORKING_MATH_INSERTS_PILOT', true);

export const FEATURE_FLAGS = {
  // Core student features (enabled)
  mathpath: true,
  decimals: flagEnabled('DECIMALS', true),
  percentages: flagEnabled('PERCENTAGES', true),
  ratioRate: flagEnabled('RATIO_RATE', true),
  operations: flagEnabled('OPERATIONS', true),
  numberSense: flagEnabled('NUMBER_SENSE', true),
  money: flagEnabled('MONEY', true),
  time: flagEnabled('TIME_DOMAIN', true),
  measurement: flagEnabled('MEASUREMENT', true),
  geometry: flagEnabled('GEOMETRY', true),
  areaPerimeter: flagEnabled('AREA_PERIMETER', true),
  circles: flagEnabled('CIRCLES', true),
  volume: flagEnabled('VOLUME', true),
  statistics: flagEnabled('STATISTICS', true),
  algebra: flagEnabled('ALGEBRA', true),
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
  // Spoken self-explanation: mic button on the self-explanation prompt lets
  // students speak their reasoning aloud (Web Speech API, transcribed + stored).
  // Phase 1: free-form transcription only, no answer parsing. Default off; enable
  // with VITE_ENABLE_SPOKEN_INPUT=true. Requires parental consent before enabling
  // for under-13 students in production (COPPA / SG PDPA).
  spokenInput: flagEnabled('SPOKEN_INPUT', false),
  assessments: ASSESSMENTS_ENABLED,
  modelTrainer: MODEL_TRAINER_ENABLED,
  workingMathInserts: WORKING_MATH_INSERTS_ENABLED,

  // Features shown as "Coming Soon" (still disabled but visible)
  worksheets: WORKSHEETS_ENABLED,
  parent: flagEnabled('PARENT', true),
  parentComingSoon: false,

  // Disabled for v0.1 (hidden)
  lifelab: flagEnabled('LIFELAB', true),
  science: flagEnabled('SCIENCE'),
  mechanisms: flagEnabled('MECHANISMS'),
  spelling: flagEnabled('SPELLING', true),
  comics: flagEnabled('COMICS', true),
  psl: flagEnabled('PSL', true),
  // Test Papers (exam-style timed papers) — OFF until Phase 1 launch. Set
  // VITE_ENABLE_TEST_PAPERS=1 to show the nav + section.
  testPapers: flagEnabled('TEST_PAPERS', false),
  tutor: flagEnabled('TUTOR', true),
  teacher: flagEnabled('TEACHER', true),
  admin: flagEnabled('ADMIN', true),
  payments: flagEnabled('PAYMENTS'),
  tutorMarketplace: flagEnabled('TUTOR_MARKETPLACE'),
  certification: flagEnabled('CERTIFICATION'),
  fractionsStoryMode: flagEnabled('FRACTIONS_STORY_MODE'),
  // Self-serve registration gate. Off by default until the company is
  // registered and pricing confirmed. Set VITE_ENABLE_OPEN_REGISTRATION=1.
  openRegistration: flagEnabled('OPEN_REGISTRATION'),
};

export const isFractionsStoryModeEnabled = () => FEATURE_FLAGS.fractionsStoryMode;

export default FEATURE_FLAGS;
