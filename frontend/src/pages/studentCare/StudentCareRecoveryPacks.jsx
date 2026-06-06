import React, { useEffect, useState } from 'react';
import { Bell, FileText, RefreshCw } from 'lucide-react';
import { studentCareAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function statusText(value = '') {
  return String(value || '').replace(/_/g, ' ');
}

function tone(status = '') {
  if (status === 'completed' || status === 'recheck_ready') return 'success';
  if (status === 'in_progress') return 'navy';
  return 'gold';
}

export default function StudentCareRecoveryPacks() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    studentCareAPI.recoveryPacks()
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load recovery packs.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner label="Loading recovery pack monitor..." />;
  if (error) return <EmptyState message={error} />;

  const packs = data?.recoveryPacks || [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Recovery Pack Monitor" subtitle="Track intervention practice, accuracy and recheck readiness." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card tone="lavender" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Assigned</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-navy-700">{data?.metrics?.recoveryPacksAssigned || 0}</p>
        </Card>
        <Card tone="mint" className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Completed</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-navy-700">{data?.metrics?.recoveryPacksCompleted || 0}</p>
        </Card>
      </div>

      {packs.length ? (
        <div className="space-y-3">
          {packs.map((pack) => (
            <Card key={pack.assignmentId} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-navy-700">{pack.studentName}</h2>
                    <Badge tone={tone(pack.status)}>{statusText(pack.status)}</Badge>
                  </div>
                  <p className="mt-1 font-semibold text-ink-800">{pack.assignmentTitle}</p>
                  <p className="mt-1 text-sm text-ink-500">Assignment ID: {pack.assignmentId}</p>
                </div>
                <div className="rounded-2xl bg-paper px-4 py-3 text-sm text-ink-700">
                  <p className="font-mono">{pack.progress?.attempted || 0}/{pack.progress?.target || '-'} questions</p>
                  <p className="font-mono">{Number(pack.accuracy || 0)}% accuracy</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="s" variant="secondary" icon={FileText} disabled>View Assignment</Button>
                <Button size="s" variant="ghost" icon={Bell} disabled>Mark Parent Update</Button>
                {pack.status === 'recheck_ready' && <Button size="s" icon={RefreshCw} to="/student-care/rechecks">Open Recheck Centre</Button>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="No Recovery Packs are active yet." />
      )}
    </div>
  );
}
