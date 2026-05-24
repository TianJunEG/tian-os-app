import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Play } from 'lucide-react';

// Shared renderer for a unified learning profile (used by the Student dashboard and by each
// child in the Parent dashboard). Assumes profile.subjects is non-empty; callers handle empty.
const APP_ROUTE = { eng: '/spelling', chi: '/spelling' };
const bandStyles = {
  'on track': 'bg-green-100 text-green-800',
  building: 'bg-amber-100 text-amber-800',
  'at risk': 'bg-red-100 text-red-800',
};
const barColor = (band) => (band === 'on track' ? 'bg-green-500' : band === 'building' ? 'bg-amber-500' : 'bg-red-500');

export default function LearningProfile({ profile }) {
  const navigate = useNavigate();
  const subjects = profile?.subjects || [];

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <div className="text-white/80 text-sm">Overall readiness</div>
          <div className="text-4xl font-extrabold leading-tight">{profile.overall}%</div>
          <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[profile.band] || 'bg-white/20'}`}>{profile.band}</span>
        </div>
        <TrendingUp className="w-10 h-10 text-white/70" />
      </div>

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
        Fed by {profile.sources?.join(' · ') || 'your learning apps'}
        {profile.updatedAt ? ` · updated ${new Date(profile.updatedAt).toLocaleDateString()}` : ''}
      </p>
    </>
  );
}
