import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GraduationCap } from 'lucide-react';
import { learningAPI } from '../services/api';
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Progress intelligence</div>
            <h1 className="text-3xl font-serif font-medium text-navy-900 leading-tight">My Children</h1>
            <p className="text-gray-500 text-sm">Each child's progress across every learning app.</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy-700 text-white rounded-lg text-sm font-semibold hover:bg-navy-600 transition">
            <Plus className="w-4 h-4" /> Add child
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
            <button type="submit" disabled={saving} className="px-5 py-2 bg-navy-700 text-white rounded-lg font-semibold hover:bg-navy-600 disabled:opacity-60 transition">{saving ? 'Saving…' : 'Save'}</button>
          </form>
        )}

        {loading && <div className="text-center text-gray-500 py-16">Loading…</div>}
        {!loading && error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        {!loading && !error && children.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-navy-100 text-navy-700 grid place-items-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900">Add your first child</h3>
            <p className="text-gray-600 text-sm mt-1 mb-5 max-w-sm mx-auto">Add a child to track their progress across the learning apps in one place.</p>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-5 py-3 bg-navy-700 text-white rounded-xl font-semibold hover:bg-navy-600 transition">
              <Plus className="w-4 h-4" /> Add child
            </button>
          </div>
        )}

        {!loading && !error && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <button key={c.id} onClick={() => navigate(`/children/${c.id}`)} className="bg-white border border-navy-100 rounded-2xl shadow-sm p-5 text-left hover:shadow-lg hover:border-navy-200 transition flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-700 grid place-items-center font-bold text-lg">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-900 truncate">{c.name}</div>
                  <div className="text-xs text-navy-400">{c.level || '—'} · {c.subjects} subject{c.subjects === 1 ? '' : 's'}</div>
                  <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[c.band] || 'bg-gray-100 text-gray-700'}`}>{c.band}</span>
                </div>
                <div className="text-navy-900 shrink-0">
                  <ProgressRing value={c.overall} size={56} stroke={6} trackClass="stroke-navy-100" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
