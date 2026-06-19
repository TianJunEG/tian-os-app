import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, X, Eye, EyeOff } from 'lucide-react';
import { familyAPI } from '../../services/api';
import { Card, ProgressBar, Badge, PageHeader, Spinner, EmptyState, ErrorState, Button } from '../../components/ui';

const LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Sec1'];

function AddChildModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', level: 'P3' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await familyAPI.createChild({ name: form.name, email: form.email, password: form.password, level: form.level });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-700">Add a child</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Child's name</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Mei Xin"
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Login email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="e.g. meixinlearns@gmail.com"
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Password</label>
            <div className="relative">
              <input
                required
                minLength={6}
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-border-subtle px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">Level</label>
            <select
              value={form.level}
              onChange={set('level')}
              className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {error && <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" size="m" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" size="m" className="flex-1" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ParentChildren() {
  const [children, setChildren] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setChildren(null);
    familyAPI.children().then((r) => setChildren(r.data.children || [])).catch((e) => setError(e));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleCreated = () => {
    setShowModal(false);
    load();
  };

  if (error) return <ErrorState message="Couldn't load your children." onRetry={load} />;
  if (!children) return <Spinner label="Loading…" />;

  return (
    <>
      <PageHeader
        title="Your children"
        subtitle="Tap a child to see progress and assign practice."
        action={
          <Button size="s" onClick={() => setShowModal(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add child
          </Button>
        }
      />
      {children.length === 0 ? (
        <EmptyState icon={Users} message="No children linked yet.">
          <Button size="s" onClick={() => setShowModal(true)}><Plus className="mr-1 h-4 w-4" /> Add your first child</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <Link key={c.studentId} to={`/parent/children/${c.studentId}/progress`} className="block">
              <Card interactive className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-ink-700">{c.name}</h3>
                  <Badge tone="navy">{c.level}</Badge>
                </div>
                <p className="text-sm text-ink-500">Overall mastery {c.overallMastery}% · {c.masteredCount} mastered</p>
                <ProgressBar value={c.overallMastery} className="mt-3" />
                {c.weakestSkill && <p className="mt-2 text-xs text-error-700">Weak: {c.weakestSkill}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
      {showModal && <AddChildModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
