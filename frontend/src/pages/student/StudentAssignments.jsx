import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { assignmentsAPI, mathpathAPI, spellingPracticeAPI } from '../../services/api';
import { Card, Button, StatusBadge, PageHeader, Spinner, EmptyState, Alert } from '../../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : null);

// Student's assignments. Starting one launches the right module's session bound
// to the assignment; completing the session marks the assignment done (server-side).
export default function StudentAssignments() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    assignmentsAPI.list()
      .then((r) => setItems(r.data.assignments || []))
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
      if (a.module === 'Spelling Practice') {
        const { data } = await spellingPracticeAPI.startSession({ assignmentId: a.id });
        navigate(`/student/spelling/practice/${data.session_id}`, { state: { items: data.items, listTitle: data.listTitle } });
      } else if (a.module === 'Science Adaptive Revision') {
        // Science assignments share the practice/session backend but render in
        // the Science practice shell (open-ended answer entry, model-answer
        // reveal). The backend now also picks the right module from the
        // assignment, so the mastery delta is recorded as Science either way.
        const { data } = await mathpathAPI.startSession({ assignmentId: a.id, feature: 'Science Adaptive Revision', questionCount: a.questionCount || 10 });
        navigate(`/student/science/practice/${data.session_id}`, { state: { items: data.items } });
      } else {
        const { data } = await mathpathAPI.startSession({ assignmentId: a.id, questionCount: a.questionCount || 10 });
        navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
      }
    } catch (_) {
      setStartError('Couldn’t start this assignment. Please try again.');
      setStarting(false);
    }
  };

  if (!items && loading) return <Spinner />;
  const pending = (items || []).filter((a) => a.status === 'not_started' || a.status === 'in_progress' || a.status === 'overdue');
  const done = (items || []).filter((a) => a.status === 'completed');

  return (
    <>
      <PageHeader title="Your assignments" subtitle="Work set by a parent or teacher." />
      {loadError && <Alert tone="error" className="mb-4">Unable to load assignments right now. Please try again later.</Alert>}
      {startError && <Alert tone="error" className="mb-4">{startError}</Alert>}
      {items?.length === 0 ? (
        <EmptyState icon={ClipboardList} message="No assignments yet. When someone assigns practice, it shows up here." />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map((a) => (
                <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-700">{a.skillNames?.join(', ') || a.module}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{a.questionCount} questions{fmt(a.dueDate) ? ` · due ${fmt(a.dueDate)}` : ''}</p>
                  </div>
                  <Button size="s" disabled={starting} onClick={() => start(a)}>Start</Button>
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
                    <p className="truncate text-ink-700">{a.skillNames?.join(', ') || a.module}</p>
                    <div className="flex items-center gap-2">
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
