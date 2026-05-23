import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Footprints, Compass, Zap, Brain, Trophy, Flame, CalendarCheck,
  Share2, BookOpen, Target, Star, Lock, Award
} from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';
import { confettiBurst } from '../../utils/confetti';
import { playWin } from '../../utils/sound';

// Map the backend's icon strings to lucide components.
const ICONS = { Footprints, Compass, Zap, Brain, Trophy, Flame, CalendarCheck, Share2, BookOpen, Target };

const SEEN_KEY = 'spellingBadgesSeen';

export default function SpellingAchievementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spellingAPI
      .getGamification()
      .then((r) => {
        setData(r.data);
        // Celebrate any newly-earned badges since the last visit.
        const earned = (r.data.badges || []).filter((b) => b.earned).map((b) => b.id);
        let seen = [];
        try {
          seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
        } catch {
          seen = [];
        }
        const fresh = earned.filter((id) => !seen.includes(id));
        if (fresh.length > 0 && seen.length >= 0) {
          playWin();
          confettiBurst({ count: 160 });
        }
        try {
          localStorage.setItem(SEEN_KEY, JSON.stringify(earned));
        } catch {
          /* ignore */
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const earnedCount = data?.badges?.filter((b) => b.earned).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="Achievements" subtitle="Level up as you practise" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : !data ? (
          <p className="text-center text-gray-500 py-10">Couldn't load achievements.</p>
        ) : (
          <>
            {/* Level + streak banner */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl p-6 mb-6 shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm opacity-80">Level</div>
                  <div className="text-4xl font-extrabold leading-none">{data.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">XP</div>
                  <div className="text-2xl font-bold">{data.xp}</div>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(data.levelProgress.into / data.levelProgress.perLevel) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="opacity-80">
                  {data.levelProgress.into}/{data.levelProgress.perLevel} XP to level {data.level + 1}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Flame className="w-4 h-4" /> {data.dayStreak}-day streak
                </span>
              </div>
            </div>

            {/* Quick totals */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{data.totals.correct}</div>
                <div className="text-xs text-gray-500">words correct</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{data.totals.mastered}</div>
                <div className="text-xs text-gray-500">mastered</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{data.totals.accuracy}%</div>
                <div className="text-xs text-gray-500">accuracy</div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Badges
                <span className="text-sm font-normal text-gray-400">({earnedCount}/{data.badges.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.badges.map((b) => {
                  const Icon = ICONS[b.icon] || Star;
                  const pct = Math.round((b.progress.value / b.progress.target) * 100);
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl p-4 border text-center ${
                        b.earned ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          b.earned ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {b.earned ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className={`text-sm font-semibold ${b.earned ? 'text-gray-900' : 'text-gray-500'}`}>{b.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{b.description}</div>
                      {!b.earned && (
                        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-purple-400" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              Earn XP for every word you spell correctly. Practise daily to grow your streak!
            </p>
          </>
        )}
      </main>
    </div>
  );
}
