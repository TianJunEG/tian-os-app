import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { billingAPI } from '../../services/api';
import { Alert, Button, Card, PageHeader, Spinner } from '../../components/ui';

const POLL_MS = 3000;

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line-soft py-2 first:border-t-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-700">{value}</span>
    </div>
  );
}

function useCountdown(expiresAt) {
  const [secsLeft, setSecsLeft] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSecsLeft(Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return secsLeft;
}

function QrPanel({ qr, onExpired, onPaid }) {
  const secsLeft = useCountdown(qr.expiresAt);
  const pollRef = useRef(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await billingAPI.paynowStatus(qr.paymentIntentId);
        const { piStatus, entitlements } = res.data;
        if (piStatus === 'succeeded' || entitlements?.tier === 'premium_home') {
          stopPoll();
          onPaid();
        }
        if (piStatus === 'canceled') { stopPoll(); onExpired(); }
      } catch { /* network blip — keep polling */ }
    }, POLL_MS);
    return stopPoll;
  }, [qr.paymentIntentId, onPaid, onExpired, stopPoll]);

  useEffect(() => {
    if (secsLeft === 0) { stopPoll(); onExpired(); }
  }, [secsLeft, onExpired, stopPoll]);

  const mins = secsLeft != null ? Math.floor(secsLeft / 60) : null;
  const secs = secsLeft != null ? String(secsLeft % 60).padStart(2, '0') : null;
  const urgency = secsLeft != null && secsLeft < 60;

  return (
    <Card className="p-6">
      <p className="mb-4 text-sm text-ink-600">
        Open your banking app, tap <strong>PayNow → Scan QR</strong>, and scan the code below. Access activates the moment payment clears.
      </p>
      <div className="flex justify-center">
        <img src={qr.qrImageUrl} alt="PayNow QR code" className="h-52 w-52 rounded-lg border border-border-subtle" />
      </div>
      <div className="mt-4">
        <Row label="Amount" value={`${qr.currency} ${qr.amountSgd}`} />
        {secsLeft != null && (
          <Row label="QR expires in" value={
            <span className={urgency ? 'text-error-600' : undefined}>
              {mins}:{secs}
            </span>
          } />
        )}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-ink-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Waiting for payment…
      </p>
    </Card>
  );
}

function SuccessPanel() {
  const navigate = useNavigate();
  return (
    <Card className="p-6 text-center">
      <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success-500" />
      <h2 className="text-xl font-semibold text-ink-700">You're on Premium Home!</h2>
      <p className="mt-2 text-sm text-ink-500">Your access is now active for 12 months. Enjoy the full dashboard.</p>
      <Button className="mt-5 w-full" onClick={() => navigate('/parent')}>Go to dashboard</Button>
    </Card>
  );
}

export default function PremiumHomeUpgradePage() {
  const [offer, setOffer] = useState(null);
  const [offerError, setOfferError] = useState('');
  const [qr, setQr] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expired, setExpired] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    billingAPI.premiumHomeOffer()
      .then((r) => setOffer(r.data))
      .catch(() => setOfferError('Could not load the upgrade offer. Please refresh.'));
  }, []);

  const startPayNow = async () => {
    setCreating(true); setCreateError(''); setExpired(false); setQr(null);
    try {
      const res = await billingAPI.paynowCreate();
      setQr(res.data);
    } catch (e) {
      setCreateError(e?.response?.data?.error || 'Could not generate the PayNow QR code. Please try again.');
    } finally { setCreating(false); }
  };

  const handleExpired = useCallback(() => { setQr(null); setExpired(true); }, []);
  const handlePaid = useCallback(() => { setQr(null); setPaid(true); }, []);

  if (offerError) return <Alert tone="error">{offerError}</Alert>;
  if (!offer) return <Spinner label="Loading upgrade…" />;
  if (paid) return <div className="mx-auto max-w-lg"><SuccessPanel /></div>;

  const { pricing, amountSgd, earlyRenewalEligible } = offer;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Upgrade to Premium Home"
        subtitle="Pay once by PayNow — 12 months of full dashboard access."
      />

      {pricing.isPlaceholder && (
        <Alert tone="warning" className="mb-4">Pricing is a placeholder — set PREMIUM_HOME_ANNUAL_SGD before launch.</Alert>
      )}

      {qr ? (
        <QrPanel qr={qr} onExpired={handleExpired} onPaid={handlePaid} />
      ) : (
        <Card className="p-6">
          {expired && (
            <Alert tone="warning" className="mb-4" icon={AlertCircle}>
              QR code expired. Generate a new one to try again.
            </Alert>
          )}
          {createError && <Alert tone="error" className="mb-4">{createError}</Alert>}

          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <p className="text-sm text-ink-500">Annual access</p>
              <p className="font-display text-3xl font-semibold text-emerald-deep">
                {pricing.currency} {amountSgd}
                <span className="text-base font-normal text-ink-400">/year</span>
              </p>
            </div>
          </div>

          {earlyRenewalEligible && (
            <Alert tone="info" className="mb-4">Early-renewal price applied — renewing before your access ends.</Alert>
          )}

          <ul className="mb-5 space-y-1.5 text-sm text-ink-600">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Full progress dashboard with per-skill detail</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Assign practice and worksheets at home</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Exportable reports</li>
          </ul>

          <Button className="w-full" onClick={startPayNow} disabled={creating}>
            {creating ? 'Generating QR…' : `Pay ${pricing.currency} ${amountSgd} by PayNow`}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-400">
            A QR code will appear. Scan it in your banking app — access activates instantly.
          </p>
        </Card>
      )}
    </div>
  );
}
