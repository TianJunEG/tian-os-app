import React, { useEffect, useState } from 'react';
import { Users, CreditCard, Layers, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { agencyAPI } from '../../services/api';
import { Card, Button, Badge, StatTile, PageHeader, Spinner, EmptyState, ErrorState, Field, Input, Select, Alert } from '../../components/ui';

const TABS = [
  ['overview', 'Overview', BarChart3],
  ['tutors', 'Tutors', Users],
  ['plans', 'Plans', Layers],
  ['connect', 'Payouts', LinkIcon],
  ['billing', 'Billing', CreditCard],
];

// Agency admin console (Gap B). Owner/manager only — the backend enforces this;
// non-admins get 403 and see the error state.
export default function AgencyDashboard() {
  const [tab, setTab] = useState('overview');
  return (
    <>
      <PageHeader title="Agency console" subtitle="Seats, tutors, pricing and payouts." />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-hairline">
        {TABS.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === key ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500 hover:text-navy-700'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'tutors' && <Tutors />}
      {tab === 'plans' && <Plans />}
      {tab === 'connect' && <Connect />}
      {tab === 'billing' && <Billing />}
    </>
  );
}

function useLoader(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = () => { setError(null); setData(null); fn().then((r) => setData(r.data)).catch((e) => setError(e.response?.data?.error || 'Could not load.')); };
  useEffect(() => { load(); }, deps); // eslint-disable-line
  return { data, error, load };
}

function Overview() {
  const { data, error, load } = useLoader(agencyAPI.overview);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-6">
        <StatTile label="Seats used" value={`${data.seats.seatsUsed} / ${data.seats.seatsTotal}`} />
        <StatTile label="Remaining" value={data.seats.seatsRemaining} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-ink-500">Payouts:</span>
        <Badge tone={data.connect.status === 'active' ? 'success' : 'neutral'}>{data.connect.status}</Badge>
      </div>
      {data.seats.seatsRemaining === 0 && (
        <Alert tone="warning" className="mt-4">All seats are in use. Contact us to add another licence block before onboarding more tutors.</Alert>
      )}
    </Card>
  );
}

function Tutors() {
  const { data, error, load } = useLoader(agencyAPI.tutors);
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(null);
  useEffect(() => { agencyAPI.tutorPlans().then((r) => setPlans(r.data.plans || [])).catch((e) => console.warn("AgencyDashboard: fetch failed", e)); }, []);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  const grant = async (tutorUserId, planId) => {
    if (!planId) return;
    setBusy(tutorUserId);
    try { await agencyAPI.grantTrial(tutorUserId, planId); load(); }
    catch (e) { alert(e.response?.data?.error || 'Could not grant trial.'); }
    finally { setBusy(null); }
  };
  if (data.tutors.length === 0) return <EmptyState icon={Users} message="No tutors onboarded yet." />;
  return (
    <div className="space-y-2">
      {data.tutors.map((t) => (
        <Card key={t.userId} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium text-ink-700">{t.name || t.email}</p>
            <p className="text-sm text-ink-500">{t.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={t.subscriptionStatus === 'active' ? 'success' : t.subscriptionStatus === 'trial' ? 'gold' : 'neutral'}>{t.subscriptionStatus}</Badge>
            {t.subscriptionStatus !== 'active' && plans.length > 0 && (
              <Select disabled={busy === t.userId} defaultValue="" onChange={(e) => grant(t.userId, e.target.value)}>
                <option value="" disabled>Grant trial…</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Plans() {
  const { data, error, load } = useLoader(agencyAPI.tutorPlans);
  const [form, setForm] = useState({ name: '', priceToTutor: '', period: 'monthly', trialDays: 14 });
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await agencyAPI.createTutorPlan({ ...form, priceToTutor: Number(form.priceToTutor), trialDays: Number(form.trialDays) }); setForm({ name: '', priceToTutor: '', period: 'monthly', trialDays: 14 }); load(); }
    catch (e2) { alert(e2.response?.data?.error || 'Could not create plan.'); }
    finally { setBusy(false); }
  };
  return (
    <>
      <Card className="mb-4 p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-4">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Price to tutor"><Input type="number" value={form.priceToTutor} onChange={(e) => setForm((f) => ({ ...f, priceToTutor: e.target.value }))} /></Field>
          <Field label="Period"><Select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}><option value="monthly">Monthly</option><option value="annual">Annual</option></Select></Field>
          <Field label="Trial days"><Input type="number" value={form.trialDays} onChange={(e) => setForm((f) => ({ ...f, trialDays: e.target.value }))} /></Field>
          <div className="sm:col-span-4"><Button type="submit" disabled={busy || !form.name || form.priceToTutor === ''}>Add plan</Button></div>
        </form>
      </Card>
      {data.plans.length === 0 ? <EmptyState icon={Layers} message="No plans yet." /> : (
        <div className="space-y-2">
          {data.plans.map((p) => (
            <Card key={p._id} className="flex items-center justify-between gap-3 p-4">
              <div><p className="font-medium text-ink-700">{p.name}</p><p className="text-sm text-ink-500">{p.currency} {p.priceToTutor}/{p.period} · {p.trialDays}-day trial</p></div>
              <Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Connect() {
  const { data, error, load } = useLoader(agencyAPI.connectStatus);
  const [busy, setBusy] = useState(false);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  const onboard = async () => {
    setBusy(true);
    try { const r = await agencyAPI.connectOnboard(); if (r.data.url) window.location.href = r.data.url; }
    catch (e) { alert(e.response?.data?.error || 'Stripe is not configured on this deployment.'); }
    finally { setBusy(false); }
  };
  return (
    <Card className="p-5">
      <p className="mb-2 text-sm text-ink-500">Tutor payments settle directly to your own Stripe account. Connect it to start collecting.</p>
      <div className="mb-4 flex items-center gap-2"><span className="text-sm text-ink-500">Status:</span><Badge tone={data.status === 'active' ? 'success' : 'neutral'}>{data.status}</Badge></div>
      {data.status !== 'active' && <Button onClick={onboard} disabled={busy}>{busy ? 'Opening…' : 'Connect Stripe'}</Button>}
    </Card>
  );
}

function Billing() {
  const { data, error, load } = useLoader(agencyAPI.charges);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  if ((data.charges || []).length === 0) return <EmptyState icon={CreditCard} message="No tutor charges yet." />;
  return (
    <div className="space-y-2">
      {data.charges.map((c) => (
        <Card key={c._id} className="flex items-center justify-between gap-3 p-4">
          <div><p className="font-medium text-ink-700">{c.currency} {c.amount}</p><p className="text-sm text-ink-500">{new Date(c.createdAt).toLocaleDateString()}</p></div>
          <Badge tone={c.status === 'succeeded' ? 'success' : c.status === 'failed' ? 'error' : 'neutral'}>{c.status}</Badge>
        </Card>
      ))}
    </div>
  );
}
