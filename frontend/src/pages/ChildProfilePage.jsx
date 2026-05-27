import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { learningAPI } from '../services/api';
import LearningProfile from '../components/LearningProfile';

// Tian OS — a single child's unified profile, opened from the Parent dashboard.
export default function ChildProfilePage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    setLoading(true);
    learningAPI.getChildProfile(childId)
      .then((res) => { if (on) setData(res.data); })
      .catch((e) => { if (on) setError(e.response?.data?.error || 'Could not load this child’s profile.'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [childId]);

  const profile = data?.profile;
  const subjects = profile?.subjects || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/children')} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-gold-600">Learning profile</div>
            <h1 className="text-3xl font-serif font-medium text-navy-900 leading-tight">{data?.child?.name || 'Child'}</h1>
            <p className="text-gray-500 text-sm">{data?.child?.level || 'Progress across every learning app'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading && <div className="text-center text-gray-500 py-16">Loading…</div>}
        {!loading && error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}
        {!loading && !error && subjects.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-navy-100 text-navy-700 grid place-items-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900">No progress yet</h3>
            <p className="text-gray-600 text-sm mt-1 max-w-sm mx-auto">Once {data?.child?.name || 'your child'} practises in the learning apps, their mastery and weak topics show here.</p>
          </div>
        )}
        {!loading && !error && subjects.length > 0 && <LearningProfile profile={profile} />}
      </main>
    </div>
  );
}
