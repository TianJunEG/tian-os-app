import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Copy, QrCode } from 'lucide-react';
import { billingAPI } from '../../services/api';
import { Alert, Button, Card, PageHeader, Spinner } from '../../components/ui';

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-soft py-2 first:border-t-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className={`text-sm font-medium text-ink-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

// Parent-facing annual upgrade. Shows PayNow details + the exact amount and a
// reference to quote; submitting records a pending request that an admin
// activates the next business day. No card, no recurring billing.
export default function PremiumHomeUpgradePage() {
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    billingAPI.premiumHomeOffer().then((r) => setOffer(r.data)).catch(() => setError('Could not load the upgrade offer.'));
  }, []);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await billingAPI.requestUpgrade();
      setRequest(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not start the upgrade.');
    } finally { setBusy(false); }
  };

  const copy = (text) => navigator.clipboard?.writeText(text);

  if (error && !offer) return <Alert tone="error">{error}</Alert>;
  if (!offer) return <Spinner label="Loading upgrade…" />;

  const { pricing, payNow, amountSgd, earlyRenewalEligible } = offer;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Upgrade to Premium Home" subtitle="One annual fee, paid by PayNow. Full dashboard and assign-practice for 12 months." />

      {pricing.isPlaceholder ? (
        <Alert tone="warning" className="mb-4">Pricing shown is a placeholder — confirm the real amount before launch.</Alert>
      ) : null}

      {request ? (
        <Card className="p-5">
          <Alert tone="success" icon={CheckCircle2} className="mb-4">{request.message}</Alert>
          <h3 className="text-sm font-semibold text-ink-700">Pay {pricing.currency} {request.amountSgd} via PayNow</h3>
          <div className="mt-3">
            <Row label="Payee" value={payNow.payeeName} />
            {payNow.uen ? <Row label="UEN" value={payNow.uen} mono /> : null}
            {payNow.mobile ? <Row label="Mobile" value={payNow.mobile} mono /> : null}
            <Row label="Amount" value={`${pricing.currency} ${request.amountSgd}`} mono />
            <Row label="Reference (put in comments)" value={request.reference} mono />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="s" variant="secondary" icon={Copy} onClick={() => copy(request.reference)}>Copy reference</Button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-500"><Clock className="h-4 w-4" /> We verify payments the next business day, then your access switches on automatically.</p>
          <p className="mt-2 text-xs text-ink-400">{payNow.instructions}</p>
        </Card>
      ) : (
        <Card className="p-5">
          {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-ink-500">Annual access</p>
              <p className="font-display text-3xl font-semibold text-emerald-deep">{pricing.currency} {amountSgd}<span className="text-base font-normal text-ink-400">/year</span></p>
            </div>
            <QrCode className="h-8 w-8 text-ink-300" />
          </div>
          {earlyRenewalEligible ? (
            <Alert tone="info" className="mt-3">Early-renewal price applied — you’re renewing before your access ends.</Alert>
          ) : null}
          <ul className="mt-4 space-y-1.5 text-sm text-ink-600">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Full progress dashboard with per-skill detail</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Assign practice and worksheets at home</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Exportable reports</li>
          </ul>
          <Button className="mt-5 w-full" onClick={submit} disabled={busy}>{busy ? 'Preparing…' : `Pay ${pricing.currency} ${amountSgd} by PayNow`}</Button>
          <p className="mt-2 text-center text-xs text-ink-400">You’ll get PayNow details and a reference on the next step.</p>
        </Card>
      )}
    </div>
  );
}
