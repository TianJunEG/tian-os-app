import { resolveEntitlements, hasCapability } from '../services/billing/entitlements.js';

// Attaches req.entitlements for the current user. Must run after `protect`.
// Resolves by the user's own subscription (ownerType 'user'); school-level
// (partner) subscriptions can be layered in later by passing ownerType/ownerId.
export async function loadEntitlements(req, res, next) {
  try {
    req.entitlements = await resolveEntitlements({
      ownerType: 'user',
      ownerId: req.user?.id || '',
      role: req.user?.role || '',
    });
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve entitlements.' });
  }
}

// Gate a route on a product capability (e.g. 'schoolAdminConsole',
// 'parentAssignPractice', 'exportableReports'). Loads entitlements if not
// already present so it can be used standalone after `protect`.
export function requireEntitlement(capabilityKey) {
  return async (req, res, next) => {
    try {
      if (!req.entitlements) {
        req.entitlements = await resolveEntitlements({
          ownerType: 'user',
          ownerId: req.user?.id || '',
          role: req.user?.role || '',
        });
      }
      if (!hasCapability(req.entitlements, capabilityKey)) {
        return res.status(403).json({
          error: 'Your plan does not include this feature.',
          capability: capabilityKey,
          tier: req.entitlements.tier,
          planType: req.entitlements.planType,
          upgrade: true,
        });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Failed to check entitlements.' });
    }
  };
}

export default { loadEntitlements, requireEntitlement };
