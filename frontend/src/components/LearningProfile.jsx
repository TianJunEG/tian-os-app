import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Play, Sparkles } from 'lucide-react';
import ProgressRing from './ProgressRing';

// Shared renderer for a unified learning profile (used by the Student dashboard and by each
// child in the Parent dashboard). Tian OS look: deep-navy hero, soft-gold accents, glass cards,
// progress rings. Assumes profile.subjects is non-empty; callers handle the empty state.
const APP_ROUTE = { eng: '/spelling', chi: '/spelling' };
const bandStyles = {
  'on track': 'bg-green-100 text-green-800',
  building: 'bg-amber-100 text-amber-800',
  'at risk': 'bg-red-100 text-red-800',
};
const barColor = (band) => (band === 'on track' ? 'bg-green-500' : band === 'building' ? 'bg-amber-500' : 'bg-gold-400');

export default function LearningProfile({ profile }) {
  const navigate = useNavigate();
  const subjects = profile?.subjects || [];

  return (
    <>
      {/* Hero: overall readiness with progress ring */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-600 text-white rounded-3xl p-6 sm:p-8 mb-6 flex items-center justify-between shadow-xl">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-gold-400/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" /> Progress intelligence
          </div>
          <div className="text-white/70 text-sm mt-2">Overall readiness</div>
          <div className="mt-1">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${bandStyles[profile.band] || 'bg-white/15 text-white'}`}>{profile.band}</span>
          </div>
        </div>
        <div className="relative text-white">
          <ProgressRing value={profile.overall} size={108} stroke={9} />
        </div>
      </div>

      {/* Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((s) => (
          <div key={s.subjectId} className="bg-white border border-emerald-tint rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-emerald-deep">{s.subject}</h3>
                <div className="text-xs text-emerald-bright">{s.masteryPct}% mastered · {s.accuracy}% accuracy</div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bandStyles[s.band] || 'bg-gray-100 text-gray-700'}`}>{s.band}</span>
            </div>
            <div className="h-2 bg-emerald-tint rounded-full overflow-hidden mb-3">
              <div className={`h-full ${barColor(s.band)}`} style={{ width: `${s.masteryPct}%` }} />
            </div>
            {s.weak?.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 text-xs font-semibold text-gold-600 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Needs work
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.weak.slice(0, 4).map((w, i) => (
                    <span key={i} className="text-xs bg-gold-50 text-gold-700 px-2 py-1 rounded-md">{w.label}</span>
                  ))}
                </div>
              </div>
            )}
            {APP_ROUTE[s.subjectId] ? (
              <button onClick={() => navigate(APP_ROUTE[s.subjectId])} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-deep text-white rounded-xl text-sm font-semibold hover:bg-emerald transition">
                <Play className="w-4 h-4" /> Revise {s.subject}
              </button>
            ) : (
              <div className="text-xs text-emerald-border text-center py-1.5">Practise app coming to the web app</div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-emerald-border mt-6">
        Fed by {profile.sources?.join(' · ') || 'your learning apps'}
        {profile.updatedAt ? ` · updated ${new Date(profile.updatedAt).toLocaleDateString()}` : ''}
      </p>
    </>
  );
}
