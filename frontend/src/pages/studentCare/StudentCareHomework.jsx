import React, { useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { studentCareAPI } from '../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';

function statusText(value = '') {
  return String(value || '').replace(/_/g, ' ');
}

export default function StudentCareHomework() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    studentCareAPI.homework()
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load homework support.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner label="Loading homework support..." />;
  if (error) return <EmptyState message={error} />;

  const papers = data?.homeworkQueue || [];
  const recovery = data?.recoveryPacks || [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Homework Support"
        subtitle="Upload, review and route school work into MathPath recovery."
        action={<Button icon={UploadCloud} to="/parent/mathpath/analyse-paper">Upload Paper</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Uploaded Papers Awaiting Review</p>
          {papers.length ? (
            <div className="mt-3 space-y-2">
              {papers.map((paper) => (
                <div key={paper.paperAnalysisId} className="rounded-2xl bg-white px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-800">{paper.title}</p>
                    <Badge tone="gold">{statusText(paper.status)}</Badge>
                  </div>
                  <p className="mt-1 text-ink-500">Weak skills: {(paper.weakSkillIds || []).join(', ') || 'Needs review'}</p>
                  <Button className="mt-3" size="s" variant="secondary" to={`/parent/mathpath/analyse-paper?analysis=${paper.paperAnalysisId}`}>Review Paper</Button>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-ink-500">No uploaded papers are waiting for review.</p>}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-ink-700">Recovery Pack Monitor</p>
          {recovery.length ? (
            <div className="mt-3 space-y-2">
              {recovery.map((item) => (
                <div key={item.assignmentId} className="rounded-2xl bg-white px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-800">{item.studentName}</p>
                    <Badge tone={item.status === 'recheck_ready' ? 'success' : 'navy'}>{statusText(item.status)}</Badge>
                  </div>
                  <p className="mt-1 text-ink-500">{item.assignmentTitle}</p>
                  <p className="mt-1 font-mono text-ink-700">{item.progress.attempted}/{item.progress.target || '-'} · {item.accuracy}% accuracy</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-ink-500">No Recovery Packs are active.</p>}
        </Card>
      </div>
    </div>
  );
}
