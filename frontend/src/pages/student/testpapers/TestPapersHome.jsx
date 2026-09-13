import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Award, Brain } from 'lucide-react';
import { testPapersAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, Alert } from '../../../components/ui';
import { MascotBubble } from '../../../components/MascotAvatar';

// Landing page for the Test Papers section: pick a paper, then sit it.
// Distinct from MathPath (skill practice) and PSL (guided heuristics) — this is
// exam simulation, marked at the end. Uses the shared Tian OS design system
// (PageHeader + mascot + Card/Button + tokens) so it matches the other modules.
export default function TestPapersHome() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [studentLevel, setStudentLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    testPapersAPI.list()
      .then((res) => { if (alive) { setPapers(res.data?.papers || []); setStudentLevel(res.data?.studentLevel || ''); } })
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

  const mocks = papers.filter((p) => p.category !== 'challenge');
  const challenges = papers.filter((p) => p.category === 'challenge');

  const renderCard = (p) => (
    <Card key={p.paperCode} className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {p.level && <Badge tone="sky">{p.level}</Badge>}
            {p.category === 'challenge' && p.topic && <Badge tone="gold">{p.topic}</Badge>}
            {p.forYourLevel && <Badge tone="emerald">For your level</Badge>}
            <h2 className="truncate font-semibold text-ink">{p.title}</h2>
          </div>
          {p.description && <p className="mt-1 text-sm text-body-muted">{p.description}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-body-muted">
            <span className="inline-flex items-center gap-1"><FileText size={13} /> {p.questionCount} questions</span>
            <span className="inline-flex items-center gap-1"><Award size={13} /> {p.totalMarks} marks</span>
            <span className="inline-flex items-center gap-1"><Clock size={13} /> {p.durationMinutes > 0 ? `${p.durationMinutes} min` : 'Untimed'}</span>
            {p.bestScorePct != null && <span className="font-semibold text-emerald">Best: {p.bestScorePct}%</span>}
          </div>
        </div>
        <Button
          size="s"
          onClick={() => startPaper(p.paperCode)}
          disabled={starting === p.paperCode}
          className="shrink-0"
        >
          {starting === p.paperCode ? 'Starting…' : 'Start'}
        </Button>
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader title="Test Papers" subtitle="Sit a full paper under exam conditions, then see your marks." />
      <MascotBubble
        name="kylo"
        message={`Ready for a paper? Take your time — you'll get your marks at the end.${studentLevel ? ` Showing ${studentLevel} papers first.` : ''}`}
        size="sm"
        className="mb-5"
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <Spinner label="Loading papers…" />
      ) : papers.length === 0 ? (
        <EmptyState icon={FileText} message="No papers are available yet. Check back soon." />
      ) : (
        <div className="space-y-8">
          {mocks.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-body-muted">Full papers</h2>
              <div className="space-y-3">{mocks.map(renderCard)}</div>
            </section>
          )}
          {challenges.length > 0 && (
            <section>
              <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-body-muted"><Brain size={14} /> Topic challenges</h2>
              <p className="mb-3 text-xs text-body-faint">Tougher problems on a single topic. Stuck on the method? The Problem Solving Lab can teach it.</p>
              <div className="space-y-3">{challenges.map(renderCard)}</div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
