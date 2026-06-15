import React, { useEffect, useState } from 'react';
import { FileText, MessageSquare, RefreshCw } from 'lucide-react';
import { mathpathAPI, studentCareAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function statusText(value = '') {
  return String(value || '').replace(/_/g, ' ');
}

function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}%` : '-';
}

export default function StudentCareRechecks() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    studentCareAPI.rechecks()
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load rechecks.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner label="Loading recheck centre..." />;
  if (error) return <EmptyState message={error} />;

  const rechecks = data?.recheckQueue || [];
  const readyPacks = data?.recoveryPacks || [];

  const assignRecheck = async (assignmentId) => {
    setMessage('');
    setError('');
    try {
      const { data: result } = await mathpathAPI.createAssignmentRecheck(assignmentId);
      setMessage(result.created ? 'Recheck assigned.' : (result.message || 'Recheck already exists.'));
      const refreshed = await studentCareAPI.rechecks();
      setData(refreshed.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not assign recheck yet.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Recheck Centre" subtitle="See who is ready, overdue, assigned, or completed for recheck." />
      {message && <Card className="mb-4 p-3 text-sm font-semibold text-success-700">{message}</Card>}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card tone="sky" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Recheck Queue</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-deep">{rechecks.length}</p>
        </Card>
        <Card tone="mint" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Completed</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-deep">{data?.metrics?.rechecksCompleted || 0}</p>
        </Card>
        <Card tone="lavender" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Average Improvement</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-deep">{pct(data?.metrics?.averageReadinessImprovement)}</p>
        </Card>
      </div>

      {rechecks.length ? (
        <div className="space-y-3">
          {rechecks.map((item) => (
            <Card key={item.assignmentId} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-emerald-deep">{item.studentName}</h2>
                    <Badge tone={item.overdue ? 'gold' : 'success'}>{item.overdue ? 'Overdue' : statusText(item.status)}</Badge>
                  </div>
                  <p className="mt-1 font-semibold text-ink-800">{item.assignmentTitle}</p>
                  {item.diagnosticSessionId && <p className="mt-1 text-sm text-ink-500">Diagnostic: {item.diagnosticSessionId}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!item.diagnosticSessionId && <Button size="s" icon={RefreshCw} onClick={() => assignRecheck(item.assignmentId)}>Assign Recheck</Button>}
                  <Button size="s" variant="secondary" icon={FileText} disabled>View Growth</Button>
                  <Button size="s" variant="ghost" icon={MessageSquare} disabled>Prepare Parent Summary</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message={readyPacks.length ? 'Recovery Packs are ready, but no recheck queue is available yet.' : 'No rechecks are waiting.'} />
      )}
    </div>
  );
}
