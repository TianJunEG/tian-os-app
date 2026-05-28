import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { assignmentsAPI, mathpathAPI } from '../../services/api';
import { Card, Button, StatusBadge, PageHeader, Spinner, EmptyState } from '../../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : null);

// Student Mastery Worksheets — the worksheets a parent/teacher generated and
// assigned. Doing one runs its exact questions through the shared practice
// engine (graded server-side); completing it marks the assignment done. The
// backend resolves the worksheet's questions from the assignment (see
// routes/practice.js), so this just lists and launches.
export default function StudentWorksheets() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    assignmentsAPI.list()
      .then((r) => setItems((r.data.assignments || []).filter((a) => a.module === 'Mastery Worksheet')))
      .catch(() => setItems([]));
  }, []);

  const start = async (a) => {
    if (starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ assignmentId: a.id, questionCount: a.questionCount || 10 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
    } catch (_) { setStarting(false); }
  };

  if (!items) return <Spinner label="Loading worksheets…" />;
  const pending = items.filter((a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue');
  const done = items.filter((a) => a.status === 'completed');

  return (
    <>
      <PageHeader title="Mastery Worksheets" subtitle="Targeted practice sets from your weak skills and recent mistakes." />
      {items.length === 0 ? (
        <EmptyState icon={FileText} message="No worksheets yet. When a parent or teacher assigns one, it shows up here." />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
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
    </>
  );
}
