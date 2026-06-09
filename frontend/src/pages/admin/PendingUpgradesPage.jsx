import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { billingAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';

// Admin queue: parents who said they've paid by PayNow. Verify the payment in
// your bank, then Activate (grants a 12-month Premium Home period) or Reject.
export default function PendingUpgradesPage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError(false); setRows(null);
    billingAPI.pendingUpgrades().then((r) => setRows(r.data?.requests || [])).catch(() => setError(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (id, fn) => {
    setBusyId(id);
    try { await fn(id); load(); } finally { setBusyId(null); }
  };

  if (error) return <ErrorState message="Couldn't load pending upgrades. Admin access required." onRetry={load} />;
  if (!rows) return <Spinner label="Loading pending payments…" />;

  return (
    <>
      <PageHeader title="Pending payments" subtitle="Verify the PayNow payment landed, then activate 12 months of Premium Home." />
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} message="No payments waiting. You're all caught up." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink-700">{r.userName || r.userEmail || 'Parent'}</p>
                <p className="text-sm text-ink-500">{r.userEmail}</p>
                <p className="mt-1 text-xs text-ink-400">Ref <span className="font-mono text-ink-600">{r.reference}</span> · {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="navy">SGD {r.amountSgd}</Badge>
                {r.earlyRenewal ? <Badge tone="gold">Early renewal</Badge> : null}
                <Button size="s" icon={CheckCircle2} disabled={busyId === r._id} onClick={() => act(r._id, billingAPI.activateUpgrade)}>Activate</Button>
                <Button size="s" variant="secondary" icon={X} disabled={busyId === r._id} onClick={() => act(r._id, billingAPI.rejectUpgrade)}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
