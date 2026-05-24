import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight, GraduationCap } from 'lucide-react';
import { learningAPI } from '../services/api';

// Education OS — Parent dashboard. Overview of every child, each with a headline readiness.
// Tap a child for their full cross-app profile. Reads GET /api/learning/children.
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
            <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
            <p className="text-gray-600">Each child's progress across every learning app.</p>
          </div>
          <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Level (optional)</label>
              <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Primary 5" />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </form>
        )}

        {loading && <div className="text-center text-gray-500 py-16">Loading…</div>}
        {!loading && error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        {!loading && !error && children.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 grid place-items-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Add your first child</h3>
            <p className="text-gray-600 text-sm mt-1 mb-5 max-w-sm mx-auto">Add a child to track their progress across the learning apps in one place.</p>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add child
            </button>
          </div>
        )}

        {!loading && !error && children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <button key={c.id} onClick={() => navigate(`/children/${c.id}`)} className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-lg transition flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold text-lg">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.level || '—'} · {c.subjects} subject{c.subjects === 1 ? '' : 's'}</div>
                  <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[c.band] || 'bg-gray-100 text-gray-700'}`}>{c.overall}% · {c.band}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
