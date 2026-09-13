import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { learningAPI, integrationsAPI } from '../services/api';

export default function BrightdeskAuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const callback = params.get('callback');
  const state = params.get('state');

  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selected, setSelected] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    learningAPI.getChildren()
      .then(res => setChildren(res.data.children || []))
      .catch(() => setErr('Could not load your children. Please refresh.'))
      .finally(() => setLoadingChildren(false));
  }, [user]);

  const authorize = async () => {
    if (!selected || !callback || !state) return;
    setAuthorizing(true); setErr('');
    try {
      const res = await integrationsAPI.authorizeBrightdesk({ studentId: selected, callback, state });
      window.location.href = res.data.redirectUrl;
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not authorize. Please try again.');
      setAuthorizing(false);
    }
  };

  const selectedChild = children.find(c => c.id === selected);

  const authorizeLabel = () => {
    if (authorizing) return 'Sharing…';
    if (selectedChild) return `Share ${selectedChild.name}'s progress`;
    return 'Select a child above';
  };

  if (authLoading || !user) return null;

  if (!callback || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm space-y-4">
          <p className="text-lg font-bold text-gray-800">Invalid request</p>
          <p className="text-sm text-gray-500">This link is missing required parameters. Please go back to BrightDesk and try again.</p>
          <button onClick={() => navigate('/')} className="text-sm text-emerald-700 font-semibold underline">Go to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 grid place-items-center text-lg font-black text-emerald-700">T</div>
            <div className="text-gray-300 text-xl">→</div>
            <div className="w-11 h-11 rounded-xl bg-purple-100 grid place-items-center text-lg font-black text-purple-700">B</div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Share progress with BrightDesk</h1>
            <p className="text-sm text-gray-500 mt-1">
              BrightDesk will be able to view your child's maths mastery — skill levels and gap areas only.
              No question text, answers, or personal details are shared.
            </p>
          </div>
        </div>

        {/* Child picker */}
        {loadingChildren ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-emerald-600 animate-spin" />
            Loading your children…
          </div>
        ) : children.length === 0 ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-sm text-gray-500">No children found in your TianOS account.</p>
            <button onClick={() => navigate('/children')} className="text-sm text-emerald-700 font-semibold underline">Add a child first</button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Choose which child's progress to share:</p>
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  selected === c.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/40'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold text-sm shrink-0">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.level || '—'}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition-all ${
                  selected === c.id ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                }`}>
                  {selected === c.id && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={authorize}
            disabled={!selected || authorizing || loadingChildren}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {authorizeLabel()}
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">
          You can disconnect at any time from BrightDesk → Progress → Disconnect.
        </p>
      </div>
    </div>
  );
}
