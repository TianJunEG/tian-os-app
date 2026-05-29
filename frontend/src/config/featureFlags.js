// Centralized feature flags for v0.1 (MathPath student beta)
// Toggle values here control UI visibility and route guarding.
const envTrue = (v) => String(v || '').toLowerCase() === 'true' || String(v || '') === '1';
const WORKSHEETS_ENABLED = envTrue(import.meta.env.VITE_ENABLE_WORKSHEETS) || envTrue(import.meta.env.ENABLE_WORKSHEETS);

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
  lifelab: false,
  science: false,
  mechanisms: false,
  spelling: false,
  tutor: false,
  teacher: false,
  admin: false,
  payments: false,
  tutorMarketplace: false,
  certification: false,
};

export default FEATURE_FLAGS;
