import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Target, TrendingUp, BarChart3, ChevronRight } from 'lucide-react';
import SpellingHeader from '../../components/spelling/SpellingHeader';
import { spellingAPI } from '../../services/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
    <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </span>
    <div>
      <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  </div>
);

export default function SpellingProgressPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spellingAPI
      .getStats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const mastery = stats?.mastery || { mastered: 0, learning: 0, weak: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <SpellingHeader title="My progress" subtitle="How your spelling is coming along" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading…</p>
        ) : !stats || stats.total === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No practice yet. Take a test or play a game to start tracking progress.</p>
            <button onClick={() => navigate('/spelling/lists')} className="px-5 py-2.5 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium">
              Go to my lists
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard icon={TrendingUp} label="Accuracy" value={`${stats.accuracy}%`} color="bg-emerald" />
              <StatCard icon={BarChart3} label="Words tried" value={stats.total} color="bg-blue-500" />
              <StatCard icon={Star} label="Mastered" value={mastery.mastered} color="bg-green-600" />
              <StatCard icon={Target} label="To revise" value={mastery.weak} color="bg-danger" />
            </div>

            {/* Mastery bar */}
            {stats.uniqueWords > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">{stats.uniqueWords} unique words</h2>
                  <span className="text-sm text-gray-500">{mastery.mastered} mastered</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex">
                  <div className="bg-green-500" style={{ width: `${(mastery.mastered / stats.uniqueWords) * 100}%` }} title="Mastered" />
                  <div className="bg-amber-400" style={{ width: `${(mastery.learning / stats.uniqueWords) * 100}%` }} title="Learning" />
                  <div className="bg-danger" style={{ width: `${(mastery.weak / stats.uniqueWords) * 100}%` }} title="To revise" />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Mastered {mastery.mastered}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Learning {mastery.learning}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> To revise {mastery.weak}</span>
                </div>
              </div>
            )}

            {/* Weak words */}
            {stats.weakWords?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 inline-flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-500" /> Words to revise
                  </h2>
                  <button onClick={() => navigate('/spelling/revision')} className="text-sm text-emerald hover:underline inline-flex items-center gap-1">
                    Revise now <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.weakWords.map((w) => (
                    <span key={w.word} className="px-3 py-1 bg-danger-tint text-danger-deep rounded-full text-sm">
                      {w.word} <span className="text-rose-400">·{w.misses}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mastered words */}
            {stats.masteredWords?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 inline-flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-green-500" /> Mastered words
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stats.masteredWords.map((w) => (
                    <span key={w} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-green-500 text-green-500" /> {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
