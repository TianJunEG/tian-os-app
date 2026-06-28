import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Award, ChevronRight, Loader2 } from 'lucide-react';
import { testPapersAPI } from '../../../services/api';

// Landing page for the Test Papers section: pick a paper, then sit it.
// Distinct from MathPath (skill practice) and PSL (guided heuristics) — this is
// exam simulation, marked at the end.
export default function TestPapersHome() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    testPapersAPI.list()
      .then((res) => { if (alive) setPapers(res.data?.papers || []); })
      .catch(() => { if (alive) setError('Could not load papers. Please try again.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function startPaper(paperCode) {
    setStarting(paperCode);
    setError('');
    try {
      const res = await testPapersAPI.startSession(paperCode);
      const session = res.data;
      navigate(`/student/test-papers/${session.sessionId}/run`, { state: { session } });
    } catch {
      setError('Could not start the paper. Please try again.');
      setStarting(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <FileText size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Test Papers</h1>
          <p className="text-sm text-slate-500">Sit a full paper under exam conditions, then see your marks.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : papers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
          No papers are available yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map((p) => (
            <div key={p.paperCode} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {p.level && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">{p.level}</span>}
                    <h2 className="truncate font-semibold text-slate-900">{p.title}</h2>
                  </div>
                  {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><FileText size={13} /> {p.questionCount} questions</span>
                    <span className="inline-flex items-center gap-1"><Award size={13} /> {p.totalMarks} marks</span>
                    {p.durationMinutes > 0 && <span className="inline-flex items-center gap-1"><Clock size={13} /> {p.durationMinutes} min</span>}
                    {p.bestScorePct != null && <span className="font-semibold text-emerald-600">Best: {p.bestScorePct}%</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startPaper(p.paperCode)}
                  disabled={starting === p.paperCode}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {starting === p.paperCode ? <Loader2 size={16} className="animate-spin" /> : <>Start <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
