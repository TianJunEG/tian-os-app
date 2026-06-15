import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, TrendingDown, BookOpen, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { assignmentsAPI, mathpathAPI, worksheetGenAPI } from '../../services/api';
import { Card, Button, StatusBadge, PageHeader, Spinner, EmptyState, Alert, Badge } from '../../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : null);

// Student Mastery Worksheets — the worksheets a parent/teacher generated and
// assigned. Doing one runs its exact questions through the shared practice
// engine (graded server-side); completing it marks the assignment done. The
// backend resolves the worksheet's questions from the assignment (see
// routes/practice.js), so this just lists and launches.
export default function StudentWorksheets() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [generated, setGenerated] = useState([]);
  const [weakSkill, setWeakSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    Promise.all([
      assignmentsAPI.list(),
      worksheetGenAPI.list(),
      mathpathAPI.mastery(),
    ])
      .then(([a, w, m]) => {
        setItems((a.data.assignments || []).filter((x) => x.module === 'Mastery Worksheet'));
        setGenerated(w.data.worksheets || []);
        setWeakSkill(m.data.recommended || null);
      })
      .catch(() => {
        setLoadError(true);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const start = async (a) => {
    if (starting) return;
    setStartError('');
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ assignmentId: a.id, questionCount: a.questionCount || 10 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
    } catch (_) {
      setStartError('Couldn’t start this worksheet. Please try again.');
      setStarting(false);
    }
  };

  if (!items && loading) return <Spinner label="Loading worksheets…" />;
  const pending = items.filter((a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue');
  const done = items.filter((a) => a.status === 'completed');

  return (
    <>
      <PageHeader title="Worksheet Generator" subtitle="Create short practice from weak skills, diagnostic results, selected skills, or mistake types." />
      {startError && <Alert tone="error" className="mb-4">{startError}</Alert>}
      {loadError && <Alert tone="error" className="mb-4">Unable to load worksheets right now. Please try again later.</Alert>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/student/worksheets/new?mode=weak_skills" className="focus-visible:outline-none">
          <Card interactive className="flex items-start gap-3 p-4">
            <TrendingDown className="mt-1 h-4 w-4 text-emerald-deep" />
            <div>
              <p className="font-semibold text-ink-800">Use Weak Skill</p>
              <p className="text-xs text-ink-500">{weakSkill?.skillName || 'Generate from your current recommended skill.'}</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/worksheets/new?mode=selected_topic" className="focus-visible:outline-none">
          <Card interactive className="flex items-start gap-3 p-4">
            <BookOpen className="mt-1 h-4 w-4 text-emerald-deep" />
            <div>
              <p className="font-semibold text-ink-800">Choose Skill</p>
              <p className="text-xs text-ink-500">Pick a specific MathPath skill.</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/worksheets/new?mode=diagnostic_results" className="focus-visible:outline-none">
          <Card interactive className="flex items-start gap-3 p-4">
            <ClipboardCheck className="mt-1 h-4 w-4 text-emerald-deep" />
            <div>
              <p className="font-semibold text-ink-800">Use Diagnostic</p>
              <p className="text-xs text-ink-500">Practise gaps from your latest diagnostic.</p>
            </div>
          </Card>
        </Link>
        <Link to="/student/worksheets/new?mode=recent_mistakes" className="focus-visible:outline-none">
          <Card interactive className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-1 h-4 w-4 text-emerald-deep" />
            <div>
              <p className="font-semibold text-ink-800">Use Mistake Type</p>
              <p className="text-xs text-ink-500">Target recent misconception patterns.</p>
            </div>
          </Card>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent Generated</h3>
          {generated.length === 0 ? (
            <Card className="p-4 text-sm text-ink-500">No generated worksheets yet.</Card>
          ) : (
            <div className="space-y-2">
              {generated.slice(0, 8).map((w) => (
                <Link key={w.id} to={`/student/worksheets/${w.id}`} className="block focus-visible:outline-none">
                  <Card interactive className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-700">{w.title}</p>
                      <p className="mt-0.5 text-sm text-ink-500">{w.questionCount} questions · {w.difficulty}</p>
                    </div>
                    <Badge tone={w.assignedStatus === 'assigned' ? 'success' : 'neutral'}>{w.assignedStatus}</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState icon={FileText} message="No assigned worksheets yet. Generated worksheets appear above; assigned ones can be started below when available." />
        ) : (
          <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Assigned To You</h3>
              {pending.map((a) => (
                <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-700">{a.skillNames?.join(', ') || 'Mastery Worksheet'}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{a.questionCount} questions{fmt(a.dueDate) ? ` · due ${fmt(a.dueDate)}` : ''}</p>
                  </div>
                  <Button size="s" icon={ArrowRight} disabled={starting} onClick={() => start(a)} className="shrink-0">Start</Button>
                </Card>
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div>
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Completed</h3>
              <div className="space-y-2">
                {done.map((a) => (
                  <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                    <p className="min-w-0 truncate text-ink-700">{a.skillNames?.join(', ') || 'Mastery Worksheet'}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.score != null && <span className="font-mono text-sm tabular-nums text-ink-500">{a.score}%</span>}
                      <StatusBadge status={a.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </>
  );
}
