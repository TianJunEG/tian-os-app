// Centralized feature flags for v0.1 (MathPath student beta)
// Toggle values here control UI visibility and route guarding.
const envTrue = (v) => String(v || '').toLowerCase() === 'true' || String(v || '') === '1';
const WORKSHEETS_ENABLED = envTrue(import.meta.env.VITE_ENABLE_WORKSHEETS) || envTrue(import.meta.env.ENABLE_WORKSHEETS);
const flagEnabled = (name, fallback = false) => {
  const viteValue = import.meta.env[`VITE_ENABLE_${name}`];
  const rawValue = import.meta.env[`ENABLE_${name}`];
  if (viteValue !== undefined || rawValue !== undefined) return envTrue(viteValue) || envTrue(rawValue);
  return fallback;
};

export const FEATURE_FLAGS = {
  // Core student features (enabled)
  mathpath: true,
  fluency: true,
  mistakes: true,
  progress: true,

  // Features shown as "Coming Soon" (still disabled but visible)
  worksheets: WORKSHEETS_ENABLED,
  worksheetsComingSoon: false,
  parent: false,
  parentComingSoon: true,

  // Disabled for v0.1 (hidden)
  lifelab: flagEnabled('LIFELAB'),
  science: flagEnabled('SCIENCE'),
  mechanisms: flagEnabled('MECHANISMS'),
  spelling: flagEnabled('SPELLING'),
  tutor: flagEnabled('TUTOR'),
  teacher: flagEnabled('TEACHER'),
  admin: flagEnabled('ADMIN'),
  payments: flagEnabled('PAYMENTS'),
  tutorMarketplace: flagEnabled('TUTOR_MARKETPLACE'),
  certification: flagEnabled('CERTIFICATION'),
  fractionsStoryMode: flagEnabled('FRACTIONS_STORY_MODE'),
};

export const isFractionsStoryModeEnabled = () => FEATURE_FLAGS.fractionsStoryMode;

export default FEATURE_FLAGS;
