import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI } from '../services/api';
import { ArrowLeft, TrendingUp, Clock, BookOpen, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const UNDERSTANDING = {
  mastered: { label: 'Mastered', cls: 'bg-green-100 text-green-700' },
  ok: { label: 'On track', cls: 'bg-blue-100 text-blue-700' },
  struggling: { label: 'Struggling', cls: 'bg-red-100 text-red-700' }
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SessionDetail({ bookingId }) {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    bookingsAPI.getSessionNotes(bookingId)
      .then(res => { if (active) setNotes(res.data.booking.sessionNotes); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId]);

  if (loading) return <p className="text-sm text-gray-500 mt-3">Loading details...</p>;
  if (error || !notes) return <p className="text-sm text-gray-500 mt-3">No further details available.</p>;

  return (
    <div className="mt-3 pt-3 border-t space-y-3 text-sm">
      {notes.dueDate && (
        <div>
          <span className="font-medium text-gray-700">Homework due: </span>
          <span className="text-gray-600">{new Date(notes.dueDate).toLocaleDateString()}</span>
        </div>
      )}
      {notes.parentActionItems?.length > 0 && (
        <div>
          <p className="font-medium text-gray-700 mb-1">What you can reinforce</p>
          <ul className="list-disc list-inside text-gray-600 space-y-0.5">
            {notes.parentActionItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
      {notes.additionalNotes && (
        <div>
          <p className="font-medium text-gray-700 mb-1">Tutor's notes</p>
          <p className="text-gray-600">{notes.additionalNotes}</p>
        </div>
      )}
    </div>
  );
}

export default function ParentProgressPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const parentId = user?._id || user?.id;
    if (!parentId) {
      setLoading(false);
      return;
    }

    bookingsAPI.getParentProgress(parentId)
      .then(res => {
        setProgress(res.data.progress);
        setSessions(res.data.sessions || []);
      })
      .catch(error => console.error('Failed to load progress:', error))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading progress...</p>
          </div>
        ) : !progress || progress.totalSessions === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No completed sessions yet. Progress appears here once your tutor submits session notes.</p>
            <button
              onClick={() => navigate('/search')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Find a tutor →
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={TrendingUp}
                label="Average progress"
                value={`${progress.averageProgress}%`}
                accent="bg-purple-100 text-purple-600"
              />
              <StatCard
                icon={BookOpen}
                label="Sessions completed"
                value={progress.totalSessions}
                accent="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={Clock}
                label="Hours tutored"
                value={Number(progress.totalHours).toFixed(1)}
                accent="bg-green-100 text-green-600"
              />
            </div>

            {/* Mastery breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Understanding breakdown</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{progress.masterCount}</p>
                  <p className="text-sm text-gray-600">Mastered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{progress.okCount}</p>
                  <p className="text-sm text-gray-600">On track</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{progress.strugglingCount}</p>
                  <p className="text-sm text-gray-600">Struggling</p>
                </div>
              </div>
            </div>

            {/* Topics covered */}
            {progress.topicsCovered?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Topics covered ({progress.topicsCovered.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {progress.topicsCovered.map(topic => (
                    <span key={topic} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Session history */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Session history</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {sessions.map(session => {
                  const u = UNDERSTANDING[session.understanding] || { label: session.understanding, cls: 'bg-gray-100 text-gray-700' };
                  const isOpen = expanded[session._id];
                  return (
                    <div key={session._id} className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{session.tutor}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.cls}`}>
                          {u.label}
                        </span>
                      </div>

                      {session.topicsCovered?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {session.topicsCovered.map((topic, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {session.homework && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Homework: </span>
                          {session.homework}
                        </p>
                      )}

                      {session.redFlags?.length > 0 && (
                        <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{session.redFlags.join(', ')}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpanded(prev => ({ ...prev, [session._id]: !prev[session._id] }))}
                        className="mt-3 flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isOpen ? 'Hide details' : 'View details'}
                      </button>
                      {isOpen && <SessionDetail bookingId={session._id} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
