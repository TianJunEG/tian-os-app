import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, Sparkles, Play } from 'lucide-react';
import { learningAPI } from '../services/api';

// Education OS — Student learning dashboard. Reads the ONE unified profile
// (GET /api/learning/profile) that every learning app feeds, and shows it by subject.
// Only English/Chinese have an in-app route today (the Spelling app); the others appear once
// their apps are wired into the React frontend.
const APP_ROUTE = { eng: '/spelling', chi: '/spelling' };

const bandStyles = {
  'on track': 'bg-green-100 text-green-800',
  building: 'bg-amber-100 text-amber-800',
  'at risk': 'bg-red-100 text-red-800',
};
const barColor = (band) => (band === 'on track' ? 'bg-green-500' : band === 'building' ? 'bg-amber-500' : 'bg-red-500');

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    learningAPI.getProfile()
      .then((res) => { if (on) setProfile(res.data.profile); })
      .catch((e) => { if (on) setError(e.response?.data?.error || 'Could not load your learning profile.'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const subjects = profile?.subjects || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
            <p className="text-gray-600">Your progress across every app, {user?.name?.split(' ')[0]}.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading && <div className="text-center text-gray-500 py-16">Loading your profile…</div>}
        {!loading && error && (
          <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        {!loading && !error && subjects.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 grid place-items-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No progress yet</h3>
            <p className="text-gray-600 text-sm mt-1 mb-5 max-w-sm mx-auto">
              Practise in the learning apps and your mastery, weak topics and revision will appear here automatically.
            </p>
            <button onClick={() => navigate('/spelling')} className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
              <Play className="w-4 h-4" /> Start revising
            </button>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <>
            {/* Overall readiness */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 mb-6 flex items-center justify-between">
              <div>
                <div className="text-white/80 text-sm">Overall readiness</div>
                <div className="text-4xl font-extrabold leading-tight">{profile.overall}%</div>
                <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[profile.band] || 'bg-white/20'}`}>{profile.band}</span>
              </div>
              <TrendingUp className="w-10 h-10 text-white/70" />
            </div>

            {/* Subjects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((s) => (
                <div key={s.subjectId} className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{s.subject}</h3>
                      <div className="text-xs text-gray-400">{s.masteryPct}% mastered · {s.accuracy}% accuracy</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[s.band] || 'bg-gray-100 text-gray-700'}`}>{s.band}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className={`h-full ${barColor(s.band)}`} style={{ width: `${s.masteryPct}%` }} />
                  </div>
                  {s.weak?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mb-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Needs work
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.weak.slice(0, 4).map((w, i) => (
                          <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md">{w.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {APP_ROUTE[s.subjectId] ? (
                    <button onClick={() => navigate(APP_ROUTE[s.subjectId])} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                      <Play className="w-4 h-4" /> Revise {s.subject}
                    </button>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-1.5">Practise app coming to the web app</div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Fed by {profile.sources?.join(' · ') || 'your learning apps'} · updated {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
