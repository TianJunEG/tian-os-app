import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Play } from 'lucide-react';
import { learningAPI } from '../services/api';
import LearningProfile from '../components/LearningProfile';

// Education OS — Student learning dashboard. Reads the ONE unified profile
// (GET /api/learning/profile) that every learning app feeds, rendered via <LearningProfile/>.
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
        {!loading && error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

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

        {!loading && !error && subjects.length > 0 && <LearningProfile profile={profile} />}
      </main>
    </div>
  );
}
