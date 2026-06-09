import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminLicenceAPI } from '../../services/api';
import { Card, Button, Badge, StatTile, PageHeader, Spinner, EmptyState, ErrorState, Field, Input, Select } from '../../components/ui';

// Platform-admin: manage an agency's wholesale licence blocks (Gap B).
export default function PartnerLicencePage() {
  const { pid } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ seatCount: '', lumpSumAmount: '', period: 'annual', currency: 'SGD' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null); setData(null);
    adminLicenceAPI.list(pid).then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.error || 'Could not load.'));
  };
  useEffect(() => { load(); }, [pid]); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminLicenceAPI.add(pid, { ...form, seatCount: Number(form.seatCount), lumpSumAmount: Number(form.lumpSumAmount) });
      setForm({ seatCount: '', lumpSumAmount: '', period: 'annual', currency: 'SGD' });
      load();
    } catch (e2) { alert(e2.response?.data?.error || 'Could not add licence.'); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader title="Agency licence" subtitle="Seat blocks sold to this organisation." />
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center gap-6">
          <StatTile label="Seats used" value={`${data.seats.seatsUsed} / ${data.seats.seatsTotal}`} />
          <StatTile label="Remaining" value={data.seats.seatsRemaining} />
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-700">Add a licence block</h3>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-4">
          <Field label="Seats"><Input type="number" value={form.seatCount} onChange={(e) => setForm((f) => ({ ...f, seatCount: e.target.value }))} /></Field>
          <Field label="Lump sum"><Input type="number" value={form.lumpSumAmount} onChange={(e) => setForm((f) => ({ ...f, lumpSumAmount: e.target.value }))} /></Field>
          <Field label="Period"><Select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}><option value="monthly">Monthly</option><option value="annual">Annual</option></Select></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} /></Field>
          <div className="sm:col-span-4"><Button type="submit" disabled={busy || !form.seatCount || form.lumpSumAmount === ''}>Add block</Button></div>
        </form>
      </Card>

      {(data.licences || []).length === 0 ? <EmptyState message="No licence blocks yet." /> : (
        <div className="space-y-2">
          {data.licences.map((l) => (
            <Card key={l._id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-ink-700">{l.seatCount} seats · {l.currency} {l.lumpSumAmount}/{l.period}</p>
                <p className="text-sm text-ink-500">From {new Date(l.effectiveFrom).toLocaleDateString()} · payment {l.paymentStatus}</p>
              </div>
              <Badge tone={l.status === 'active' ? 'success' : 'neutral'}>{l.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
