import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GraduationCap, Link2 } from 'lucide-react';
import { learningAPI, integrationsAPI } from '../services/api';
import ProgressRing from '../components/ProgressRing';

// Tian OS — Parent dashboard. Overview of every child, each with a headline readiness.
// Tap a child for their full cross-app profile. Reads GET /api/learning/children.
const STUDENT_LEVELS = [
  { value: 'P1', label: 'Primary 1' },
  { value: 'P2', label: 'Primary 2' },
  { value: 'P3', label: 'Primary 3' },
  { value: 'P4', label: 'Primary 4' },
  { value: 'P5', label: 'Primary 5' },
  { value: 'P6', label: 'Primary 6' },
  { value: 'S1', label: 'Secondary 1' },
  { value: 'S2', label: 'Secondary 2' },
  { value: 'S3', label: 'Secondary 3' },
  { value: 'S4', label: 'Secondary 4' },
  { value: 'S5', label: 'Secondary 5' },
];

const bandStyles = {
  'on track': 'bg-green-100 text-green-800',
  building: 'bg-amber-100 text-amber-800',
  'at risk': 'bg-red-100 text-red-800',
};

function BrightdeskShareButton({ child }) {
  const [token, setToken] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setGenerating(true); setErr(''); setToken('');
    try {
      const res = await integrationsAPI.generateBrightdeskToken(child.id);
      setToken(res.data.token);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not generate token.');
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(token).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); generate(); }}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
      >
        <Link2 className="w-3.5 h-3.5" /> Share with BrightDesk
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs text-gray-600 font-medium">Paste this token into BrightDesk → Progress → Link TianOS:</p>
      {generating && <p className="text-xs text-gray-400">Generating…</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
      {token && (
        <div className="flex gap-2 items-center">
          <input readOnly value={token} className="flex-1 min-w-0 text-xs border border-gray-300 rounded-lg px-2 py-1.5 font-mono bg-gray-50" />
          <button onClick={copy} className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-deep text-white hover:bg-emerald transition">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <p className="text-[10px] text-gray-400">Valid for 30 days. Generate a new one anytime.</p>
      <button onClick={() => { setOpen(false); setToken(''); }} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
    </div>
  );
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', level: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    learningAPI.getChildren()
      .then((res) => setChildren(res.data.children || []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load your children.'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await learningAPI.addChild({ name: form.name.trim(), level: form.level.trim() });
      setForm({ name: '', level: '' });
      setAdding(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add child.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-deep">Progress intelligence</div>
            <h1 className="text-3xl font-serif font-medium text-emerald-deep leading-tight">My Children</h1>
            <p className="text-gray-500 text-sm">Each child's progress across every learning app.</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-deep text-white rounded-lg text-sm font-semibold hover:bg-emerald transition">
            <Plus className="w-4 h-4" /> Add child
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-8">
        {adding && (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow p-5 mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Child's name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Ethan" autoFocus />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Select level</option>
                {STUDENT_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-deep text-white rounded-lg font-semibold hover:bg-emerald disabled:opacity-60 transition">{saving ? 'Saving…' : 'Save'}</button>
          </form>
        )}

        {loading && <div className="text-center text-gray-500 py-16">Loading…</div>}
        {!loading && error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        {!loading && !error && children.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-tint text-emerald-deep grid place-items-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-deep">Add your first child</h3>
            <p className="text-gray-600 text-sm mt-1 mb-5 max-w-sm mx-auto">Add a child to track their progress across the learning apps in one place.</p>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-deep text-white rounded-xl font-semibold hover:bg-emerald transition">
              <Plus className="w-4 h-4" /> Add child
            </button>
          </div>
        )}

        {!loading && !error && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <div key={c.id} className="bg-white border border-emerald-tint rounded-2xl shadow-sm p-5 hover:shadow-lg hover:border-emerald-border transition">
                <button onClick={() => navigate(`/children/${c.id}`)} className="w-full text-left flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-tint text-emerald-deep grid place-items-center font-bold text-lg shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-emerald-deep truncate">{c.name}</div>
                    <div className="text-xs text-emerald-bright">{c.level || '—'} · {c.subjects} subject{c.subjects === 1 ? '' : 's'}</div>
                    <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[c.band] || 'bg-gray-100 text-gray-700'}`}>{c.band}</span>
                  </div>
                  <div className="text-emerald-deep shrink-0">
                    <ProgressRing value={c.overall} size={56} stroke={6} trackClass="stroke-navy-100" />
                  </div>
                </button>
                <BrightdeskShareButton child={c} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
