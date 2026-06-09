import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { billingAPI } from '../services/api';
import { clearEntitlements } from '../context/useEntitlements';
import { Alert, Button, Card, Spinner } from '../components/ui';

// Stripe redirects here after checkout. We confirm the session server-side
// (which activates the subscription) so activation works without a webhook.
export default function BillingSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState('confirming'); // confirming | done | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) { setState('error'); setError('Missing checkout session.'); return; }
    let alive = true;
    billingAPI.confirmCheckout(sessionId)
      .then(() => { if (alive) { clearEntitlements(); setState('done'); } })
      .catch((e) => { if (alive) { setState('error'); setError(e?.response?.data?.error || 'Could not confirm your upgrade.'); } });
    return () => { alive = false; };
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-md py-8">
      <Card className="p-6 text-center">
        {state === 'confirming' && <Spinner label="Confirming your upgrade…" />}
        {state === 'done' && (
          <div className="space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success-500" />
            <h2 className="text-lg font-semibold text-ink-700">You're on Premium Home</h2>
            <p className="text-sm text-ink-500">Full dashboard and assign-practice are now unlocked.</p>
            <Button to="/parent">Go to your dashboard</Button>
          </div>
        )}
        {state === 'error' && (
          <div className="space-y-3">
            <Alert tone="error">{error}</Alert>
            <Button to="/parent" variant="secondary">Back to dashboard</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
