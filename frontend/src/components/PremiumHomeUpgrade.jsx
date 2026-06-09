import React, { useState } from 'react';
import { ArrowUpCircle, Clock } from 'lucide-react';
import { billingAPI } from '../services/api';
import { clearEntitlements, useEntitlements } from '../context/useEntitlements';
import { Button, Alert } from './ui';

// Kicks off Premium Home checkout. Redirects to Stripe when configured; in a
// dev environment with no Stripe keys it falls back to the dev activation
// shortcut so the flow is exercisable end to end.
async function startUpgrade({ setBusy, setError }) {
  setBusy(true); setError('');
  try {
    const res = await billingAPI.checkoutPremiumHome('monthly');
    if (res.data?.url) { window.location.href = res.data.url; return; }
  } catch (e) {
    if (e?.response?.status === 503) {
      try {
        await billingAPI.devActivatePremiumHome();
        clearEntitlements();
        window.location.reload();
        return;
      } catch (_) {
        setError('Billing isn’t set up on this server yet.');
      }
    } else {
      setError(e?.response?.data?.error || 'Could not start the upgrade.');
    }
  } finally {
    setBusy(false);
  }
}

export function UpgradeButton({ size = 'm', variant = 'primary', label = 'Upgrade to Premium Home' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <span>
      <Button size={size} variant={variant} icon={ArrowUpCircle} disabled={busy} onClick={() => startUpgrade({ setBusy, setError })}>
        {busy ? 'Starting…' : label}
      </Button>
      {error ? <span className="ml-2 text-xs text-error-700">{error}</span> : null}
    </span>
  );
}

// A slim banner for trial accounts: shows days remaining, or an expiry prompt.
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

export default UpgradeButton;
