import { FLAGS, TIANOS_VERSION } from '../config/featureFlags.js';

const vnum = (v) => parseFloat(String(v).replace(/^v/, '')) || 0;

export function featureGate(options = {}) {
  // options: { feature: 'worksheets', minVersion: 'v0.2', comingSoon: false }
  const { feature, minVersion = 'v0.0', comingSoon = false } = options;
  const minV = vnum(minVersion);
  const curV = vnum(TIANOS_VERSION);

  return (req, res, next) => {
    // If no feature specified, allow through
    if (!feature) return next();

    const flagEnabled = Boolean(FLAGS[feature]);
    const meetsVersion = curV >= minV;

    if (flagEnabled || meetsVersion) return next();

    // Block access to disabled endpoints. Return 404 to hide endpoints by default.
    if (comingSoon) return res.status(403).json({ error: 'feature_coming_soon', feature });
    return res.status(404).json({ error: 'not_available', feature });
  };
}

export default featureGate;
