import React from 'react';
import { ArrowUpCircle, Clock } from 'lucide-react';
import { useEntitlements } from '../context/useEntitlements';
import { Button, Alert } from './ui';

// The upgrade path is now an annual PayNow flow on a dedicated page.
export function UpgradeButton({ size = 'm', variant = 'primary', label = 'Upgrade to Premium Home' }) {
  return (
    <Button size={size} variant={variant} icon={ArrowUpCircle} to="/parent/upgrade">{label}</Button>
  );
}

// Banner for trial accounts: days remaining, or an expiry prompt.
export function TrialBanner() {
  const { entitlements } = useEntitlements();
  const trial = entitlements?.trial;
  if (!trial) return null;

  if (trial.expired) {
    return (
      <Alert tone="warning" icon={Clock} className="mb-4">
        <span className="flex flex-wrap items-center gap-2">
          <span>Your free trial has ended. Upgrade to keep full access.</span>
          <UpgradeButton size="s" />
        </span>
      </Alert>
    );
  }
  return (
    <Alert tone="info" icon={Clock} className="mb-4">
      <span className="flex flex-wrap items-center gap-2">
        <span>{trial.daysLeft} {trial.daysLeft === 1 ? 'day' : 'days'} left in your free trial.</span>
        <UpgradeButton size="s" variant="secondary" />
      </span>
    </Alert>
  );
}

// Banner for paid annual accounts: reminds near expiry (with an early-renewal
// nudge) and prompts to renew once access has lapsed and been blocked.
export function RenewalBanner({ earlyWindowDays = 45 }) {
  const { entitlements } = useEntitlements();
  const renewal = entitlements?.renewal;
  if (!renewal) return null;

  if (renewal.expired) {
    return (
      <Alert tone="warning" icon={Clock} className="mb-4">
        <span className="flex flex-wrap items-center gap-2">
          <span>Your Premium Home access has ended and full features are locked.</span>
          <UpgradeButton size="s" label="Renew now" />
        </span>
      </Alert>
    );
  }
  if (renewal.daysLeft <= earlyWindowDays) {
    return (
      <Alert tone="info" icon={Clock} className="mb-4">
        <span className="flex flex-wrap items-center gap-2">
          <span>Premium Home renews in {renewal.daysLeft} {renewal.daysLeft === 1 ? 'day' : 'days'} — renew early for a discount.</span>
          <UpgradeButton size="s" variant="secondary" label="Renew early" />
        </span>
      </Alert>
    );
  }
  return null;
}

export default UpgradeButton;
