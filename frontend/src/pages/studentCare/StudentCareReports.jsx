import React, { useEffect, useState } from 'react';
import { studentCareAPI } from '../../services/api';
import { Badge, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}%` : '-';
}

function statusText(value = '') {
  return String(value || '').replace(/_/g, ' ');
}

export default function StudentCareReports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    studentCareAPI.reports()
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load Student Care reports.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner label="Loading Student Care reports..." />;
  if (error) return <EmptyState message={error} />;

  const metrics = data?.metrics || {};
  const recovery = data?.recoveryPacks || [];
  const rechecks = data?.recheckQueue || [];
  const papers = data?.papersReviewed || [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Student Care Reports" subtitle="Simple operational metrics for support and parent communication." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ['Students', metrics.studentsSupported],
          ['Packs assigned', metrics.recoveryPacksAssigned],
          ['Packs completed', metrics.recoveryPacksCompleted],
          ['Rechecks', metrics.rechecksCompleted],
          ['Improvement', pct(metrics.averageReadinessImprovement)],
          ['Papers uploaded', metrics.papersUploaded],
        ].map(([label, value]) => (
          <Card key={label} className="p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-emerald-deep">{value ?? 0}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Papers Reviewed</p>
          <div className="mt-3 space-y-2">
            {papers.length ? papers.map((paper) => (
              <div key={paper.paperAnalysisId} className="rounded-2xl bg-white px-3 py-2 text-sm">
                <p className="font-semibold text-ink-800">{paper.title}</p>
                <p className="text-ink-500">{(paper.weakSkillIds || []).join(', ') || 'No weak skills confirmed'}</p>
              </div>
            )) : <p className="text-sm text-ink-500">No reviewed papers yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recovery Packs</p>
          <div className="mt-3 space-y-2">
            {recovery.length ? recovery.slice(0, 8).map((item) => (
              <div key={item.assignmentId} className="rounded-2xl bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink-800">{item.studentName}</p>
                  <Badge tone={item.status === 'recheck_ready' ? 'success' : 'navy'}>{statusText(item.status)}</Badge>
                </div>
                <p className="text-ink-500">{item.assignmentTitle}</p>
              </div>
            )) : <p className="text-sm text-ink-500">No Recovery Packs yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recheck Centre</p>
          <div className="mt-3 space-y-2">
            {rechecks.length ? rechecks.map((item) => (
              <div key={item.assignmentId} className="rounded-2xl bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink-800">{item.studentName}</p>
                  <Badge tone={item.overdue ? 'gold' : 'success'}>{item.overdue ? 'Overdue' : statusText(item.status)}</Badge>
                </div>
                <p className="text-ink-500">{item.assignmentTitle}</p>
              </div>
            )) : <p className="text-sm text-ink-500">No rechecks waiting.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
