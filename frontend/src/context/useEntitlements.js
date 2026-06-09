import { useEffect, useState } from 'react';
import { contextAPI } from '../services/api';

// Module-level cache so the entitlements call is made once per session and
// shared across every component that asks. Cleared on logout via clearEntitlements().
let cached = null;
let inflight = null;

export function clearEntitlements() {
  cached = null;
  inflight = null;
}

async function fetchEntitlements() {
  if (cached) return cached;
  if (!inflight) {
    inflight = contextAPI.entitlements()
      .then((res) => {
        cached = res?.data?.entitlements || null;
        return cached;
      })
      .catch(() => null)
      .finally(() => { inflight = null; });
  }
  return inflight;
}

// useEntitlements() → { entitlements, tier, can, parentDashboard, loading }
//   can('schoolAdminConsole')           → boolean
//   can('parentAssignPractice')         → boolean
//   parentDashboard                     → 'full' | 'view_only' | 'preview' | 'none'
export function useEntitlements() {
  const [entitlements, setEntitlements] = useState(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    if (cached) { setEntitlements(cached); setLoading(false); return; }
    fetchEntitlements().then((value) => {
      if (!active) return;
      setEntitlements(value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const can = (capabilityKey) => {
    const cap = entitlements?.capabilities || {};
    if (capabilityKey === 'parentDashboard') {
      return Boolean(cap.parentDashboard && cap.parentDashboard !== 'none');
    }
    return Boolean(cap[capabilityKey]);
  };

  return {
    entitlements,
    tier: entitlements?.tier || null,
    parentDashboard: entitlements?.capabilities?.parentDashboard || 'none',
    can,
    loading,
  };
}

export default useEntitlements;
