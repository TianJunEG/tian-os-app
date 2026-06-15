import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, TrendingUp, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Badge, Button, Card, ErrorState, PageHeader, Spinner } from '../../components/ui';

const TYPES = ['student_care', 'tuition_centre', 'school', 'pilot_partner', 'internal'];
const STATUSES = ['prospect', 'pilot', 'active', 'paused', 'archived'];

function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

function Metric({ icon: Icon, label: title, value }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-600">
      <Icon className="h-4 w-4 text-emerald" />
      <span>{title}: <strong className="text-ink-900">{value || 0}</strong></span>
    </div>
  );
}

export default function PartnersPage() {
  const [state, setState] = useState({ loading: true, error: '', partners: [] });
  const [form, setForm] = useState({ name: '', type: 'pilot_partner', status: 'prospect', contactEmail: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setState({ loading: true, error: '', partners: [] });
    adminAPI.listPartners()
      .then((res) => setState({ loading: false, error: '', partners: res.data.partners || [] }))
      .catch((err) => setState({ loading: false, error: err?.response?.data?.error || 'Could not load partners.', partners: [] }));
  };

  useEffect(() => { load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await adminAPI.createPartner(form);
      setForm({ name: '', type: 'pilot_partner', status: 'prospect', contactEmail: '' });
      setMessage('Partner created.');
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not create partner.');
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) return <Spinner label="Loading partners…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  return (
    <main className="mx-auto max-w-7xl pb-8">
      <PageHeader title="Partner Centres" subtitle="Pilot organisations, student care centres, tuition centres, and school partners." />

      <Card className="mb-5 p-5">
        <h2 className="font-semibold text-ink-900">Create Partner</h2>
        <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <input className="rounded-xl border border-line-soft px-3 py-2 text-sm" placeholder="Partner name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          <select className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
            {TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
          </select>
          <select className="rounded-xl border border-line-soft px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
            {STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <input className="rounded-xl border border-line-soft px-3 py-2 text-sm" placeholder="Contact email" value={form.contactEmail} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} />
          <Button size="s" disabled={saving}>Create</Button>
        </form>
        {message && <p className="mt-3 text-sm text-ink-600">{message}</p>}
      </Card>

      {state.partners.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No partner organisations yet.</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.partners.map((partner) => (
            <Card key={partner.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald" />
                    <h2 className="truncate font-display text-lg font-semibold text-emerald-deep">{partner.name}</h2>
                  </div>
                  <p className="mt-1 text-sm capitalize text-ink-500">{label(partner.type)}</p>
                </div>
                <Badge tone={partner.status === 'active' || partner.status === 'pilot' ? 'success' : 'neutral'}>{label(partner.status)}</Badge>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Metric icon={Users} label="Students" value={partner.metrics?.totalStudents} />
                <Metric icon={Users} label="Staff" value={partner.metrics?.staffCount} />
                <Metric icon={CheckCircle2} label="Recovery completed" value={partner.metrics?.recoveryPacksCompleted} />
                <Metric icon={TrendingUp} label="Avg improvement" value={`${partner.metrics?.averageReadinessImprovement || 0}`} />
                <Metric icon={FileText} label="Papers uploaded" value={partner.metrics?.papersUploaded} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="s" to={`/admin/partners/${partner.id}`}>Open Partner</Button>
                <Button size="s" variant="secondary" to={`/admin/partners/${partner.id}`}>Impact Evidence</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
