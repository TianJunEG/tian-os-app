import React, { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { studentCareAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function tone(priority) {
  if (priority === 'high') return 'gold';
  if (priority === 'medium') return 'navy';
  return 'neutral';
}

function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}%` : '-';
}

export default function StudentCareDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    studentCareAPI.dashboard()
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load Student Care dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner label="Loading Student Care dashboard..." />;
  if (error) return <EmptyState message={error} />;

  const attention = data?.attentionQueue || [];
  const recovery = data?.recoveryPacks || [];
  const rechecks = data?.recheckQueue || [];
  const homework = data?.homeworkQueue || [];
  const parentUpdates = data?.parentUpdatesNeeded || [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Student Care Dashboard" subtitle="Who needs help today, what to do, and what to tell parents." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card tone="lavender" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Students Supported</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-navy-700">{data?.metrics?.studentsSupported || 0}</p>
        </Card>
        <Card tone="mint" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Recovery Packs Completed</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-navy-700">{data?.metrics?.recoveryPacksCompleted || 0}</p>
        </Card>
        <Card tone="sky" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Average Improvement</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-navy-700">{pct(data?.metrics?.averageReadinessImprovement)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Students Needing Attention</p>
          {attention.length ? (
            <div className="mt-3 space-y-2">
              {attention.slice(0, 8).map((item) => (
                <div key={`${item.studentId}-${item.type}`} className="rounded-2xl bg-white px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-800">{item.studentName}</p>
                    <Badge tone={tone(item.priority)}>{item.priority}</Badge>
                  </div>
                  <p className="mt-1 text-ink-500">{item.reason}</p>
                  <p className="mt-1 font-semibold text-navy-700">{item.action}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-ink-500">No urgent attention queue right now.</p>}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recheck Ready</p>
          {rechecks.length ? (
            <div className="mt-3 space-y-2">
              {rechecks.slice(0, 8).map((item) => (
                <div key={item.assignmentId} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink-800">{item.studentName}</p>
                    <p className="text-ink-500">{item.assignmentTitle}</p>
                  </div>
                  <Badge tone={item.overdue ? 'gold' : 'success'}>{item.overdue ? 'Overdue' : item.status.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-ink-500">No rechecks are waiting.</p>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card tone="yellow" className="p-5">
          <p className="text-sm font-semibold text-ink-700">Homework Queue</p>
          <p className="mt-1 text-sm text-ink-500">{homework.length} uploaded papers awaiting review.</p>
          <Button className="mt-3" size="s" variant="secondary" icon={ArrowRight} to="/student-care/homework">Open Homework</Button>
        </Card>
        <Card tone="mint" className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recovery Packs</p>
          <p className="mt-1 text-sm text-ink-500">{recovery.length} packs in monitoring.</p>
        </Card>
        <Card tone="rose" className="p-5">
          <p className="text-sm font-semibold text-ink-700">Parent Updates Needed</p>
          <p className="mt-1 text-sm text-ink-500">{parentUpdates.length} students may need a parent update.</p>
          <Button className="mt-3" size="s" variant="secondary" icon={RefreshCw} to="/student-care/reports">Open Reports</Button>
        </Card>
      </div>
    </div>
  );
}
