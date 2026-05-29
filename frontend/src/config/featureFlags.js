// Centralized feature flags for v0.1 (MathPath student beta)
// Toggle values here control UI visibility and route guarding.
export const FEATURE_FLAGS = {
  // Core student features (enabled)
  mathpath: true,
  fluency: true,
  mistakes: true,
  progress: true,

  // Features shown as "Coming Soon" (still disabled but visible)
  worksheets: false,
  worksheetsComingSoon: true,
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
