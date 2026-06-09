import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { agencyAPI } from '../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, ErrorState, Alert } from '../../components/ui';

// Tutor self-service (Gap B): see your agency plan / trial status and pay to
// convert from trial to active. The charge settles to the agency.
export default function AgencyMembership() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null); setData(null);
    agencyAPI.membership().then((r) => setData(r.data.membership)).catch((e) => setError(e.response?.data?.error || 'Could not load.'));
  };
  useEffect(() => { load(); }, []);

  const pay = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await agencyAPI.pay();
      if (r.data.stripeConfigured === false) setMsg({ tone: 'info', text: 'Recorded. Live payment is not enabled on this deployment yet.' });
      else setMsg({ tone: 'success', text: 'Payment started. Your subscription is now active.' });
      load();
    } catch (e) { setMsg({ tone: 'error', text: e.response?.data?.error || 'Payment failed.' }); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (data === null && !error) return <Spinner />;
  if (!data) return (<><PageHeader title="My subscription" /><EmptyState icon={CreditCard} message="You're not on an agency plan." /></>);

  return (
    <>
      <PageHeader title="My subscription" subtitle={data.organisation} />
      {msg && <Alert tone={msg.tone} className="mb-4">{msg.text}</Alert>}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={data.status === 'active' ? 'success' : data.status === 'trial' ? 'gold' : 'neutral'}>{data.status}</Badge>
          {data.status === 'trial' && data.daysLeft != null && (
            <span className="text-sm text-ink-500">{data.daysLeft} day{data.daysLeft === 1 ? '' : 's'} left in trial</span>
          )}
        </div>
        {data.price != null && <p className="text-sm text-ink-600">Plan: {data.currency} {data.price}/{data.period}</p>}
        {data.status !== 'active' && (
          <Button className="mt-4" icon={CreditCard} onClick={pay} disabled={busy}>{busy ? 'Processing…' : `Subscribe (${data.currency} ${data.price}/${data.period})`}</Button>
        )}
      </Card>
    </>
  );
}
