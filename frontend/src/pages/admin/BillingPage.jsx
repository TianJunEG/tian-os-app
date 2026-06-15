import React, { useEffect, useState } from 'react';
import { CreditCard, Gauge, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

const PLAN_TYPES = ['free', 'parent_basic', 'parent_plus', 'tutor_pro', 'student_care_pilot', 'centre_pro', 'school_pilot', 'internal_admin'];
const OVERRIDES = ['', 'internal_pilot', 'free_pilot', 'paid_pilot', 'extended_trial'];

function label(value = '') {
  return String(value || '').replace(/_/g, ' ');
}

function Metric({ icon: Icon, label: title, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-tint text-emerald-deep"><Icon className="h-5 w-5" /></span>
        <div>
          <p className="font-mono text-2xl font-semibold text-ink-900">{value || 0}</p>
          <p className="text-sm font-semibold text-ink-500">{title}</p>
        </div>
      </div>
    </Card>
  );
}

function UsagePills({ rows = [] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.slice(0, 5).map((row) => (
        <Badge key={row.key} tone={row.withinLimit ? 'navy' : 'error'}>
          {label(row.key)} {row.used}/{row.limit ?? '∞'}
        </Badge>
      ))}
    </div>
  );
}

export default function BillingPage() {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setState({ loading: true, error: '', data: null });
    adminAPI.getBilling()
      .then((res) => setState({ loading: false, error: '', data: res.data }))
      .catch((err) => setState({ loading: false, error: err?.response?.data?.error || 'Could not load billing.', data: null }));
  };

  useEffect(() => { load(); }, []);

  const updatePlan = async (row, patch) => {
    setSavingId(row.ownerId);
    setMessage('');
    try {
      await adminAPI.upsertBillingSubscription({
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        planType: patch.planType || row.plan.planType,
        status: patch.status || row.subscription?.status || 'trial',
        pilotOverride: patch.pilotOverride || row.subscription?.pilotOverride || {},
      });
      setMessage('Billing subscription updated.');
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not update subscription.');
    } finally {
      setSavingId('');
    }
  };

  if (state.loading) return <Spinner label="Loading billing readiness..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const data = state.data || {};
  const summary = data.summary || {};
  const rows = data.rows || [];

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader title="Billing Readiness" subtitle="Plans, pilot overrides, usage limits and subscription placeholders for paid pilots." />
      {message && <Card className="mb-4 border-l-4 border-l-navy-400 p-4 text-sm text-ink-700">{message}</Card>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Owners Tracked" value={summary.owners} />
        <Metric icon={CreditCard} label="Active Subscriptions" value={summary.active} />
        <Metric icon={ShieldCheck} label="Pilot Overrides" value={summary.pilotOverrides} />
        <Metric icon={Gauge} label="Over Limit" value={summary.overLimit} />
      </section>

      <Card className="mt-5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink-900">Plans</h2>
          <Button size="s" variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(data.plans || []).map((plan) => (
            <div key={plan.planType} className="rounded-2xl border border-line-soft p-3 text-sm">
              <p className="font-semibold capitalize text-ink-900">{label(plan.planType)}</p>
              <p className="text-ink-500">${plan.monthlyPrice}/mo · ${plan.yearlyPrice}/yr</p>
              <p className="mt-1 text-ink-500">Students: {plan.limits?.students ?? '∞'} · Staff: {plan.limits?.staff ?? '∞'}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="font-semibold text-ink-900">Users and Partners</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-ink-500">
              <tr>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Plan</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Usage</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.ownerType}-${row.ownerId}`} className="border-t border-line-soft">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-ink-800">{row.name || row.ownerId}</p>
                    <p className="text-xs text-ink-500">{row.ownerType} · {label(row.role)}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      className="rounded-lg border border-line-soft px-2 py-1 text-sm"
                      value={row.plan.planType}
                      disabled={savingId === row.ownerId}
                      onChange={(event) => updatePlan(row, { planType: event.target.value })}
                    >
                      {PLAN_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="space-y-1">
                      <Badge tone={row.subscription?.status === 'active' ? 'success' : row.subscription?.status === 'trial' ? 'yellow' : 'neutral'}>
                        {row.subscription?.status || row.plan.source}
                      </Badge>
                      {row.pilotOverrideActive && <Badge tone="navy">{label(row.subscription?.pilotOverride?.type)}</Badge>}
                    </div>
                  </td>
                  <td className="py-3 pr-4"><UsagePills rows={row.usageLimits || []} /></td>
                  <td className="py-3">
                    <select
                      className="rounded-lg border border-line-soft px-2 py-1 text-sm"
                      value={row.subscription?.pilotOverride?.type || ''}
                      disabled={savingId === row.ownerId}
                      onChange={(event) => updatePlan(row, {
                        pilotOverride: {
                          type: event.target.value,
                          reason: event.target.value ? 'Admin billing readiness override.' : '',
                        },
                      })}
                    >
                      {OVERRIDES.map((type) => <option key={type || 'none'} value={type}>{type ? label(type) : 'No override'}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="py-6 text-ink-500" colSpan={5}>No users or partners available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
