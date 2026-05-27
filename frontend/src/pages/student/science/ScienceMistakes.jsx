import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, AlertTriangle } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Science mistakes — recent incorrect/partial Science answers with the model
// answer, scoped to module = Science Adaptive Revision.
export default function ScienceMistakes() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState(null);
  const [error, setError] = useState(null);

  const load = () => mathpathAPI.mistakes({ module: 'Science Adaptive Revision' })
    .then((r) => setMistakes(r.data.mistakes || []))
    .catch((e) => setError(e.response?.data?.error || 'Could not load mistakes.'));
  useEffect(() => { load(); }, []);

  const practise = async (m) => {
    const { data } = await mathpathAPI.startSession({ feature: 'Science Adaptive Revision', skillId: m.skillId, questionCount: 5 });
    navigate(`/student/science/practice/${data.session_id}`, {
      state: { items: data.items, resultsBase: '/student/science', homeBase: '/student/science' },
    });
  };

  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!mistakes) return <Spinner label="Loading mistakes…" />;

  return (
    <>
      <PageHeader title="Science mistakes" subtitle="Review and practise where you slipped." />
      {mistakes.length === 0 ? (
        <EmptyState icon={AlertTriangle} message="No Science mistakes to review yet." />
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{m.topicName ? `${m.topicName} · ` : ''}{m.skillName}</span>
                <Badge tone="gold">Review</Badge>
              </div>
              <div className="text-ink-900">{m.questionStem}</div>
              <div className="mt-2 text-sm">
                <span className="text-error-700">Your answer: {m.studentAnswer || '—'}</span>
              </div>
              {m.correctAnswer && (
                <div className="mt-1 rounded-xl bg-success-100 p-3 text-sm text-success-700">
                  <span className="font-semibold">Model answer:</span> {m.correctAnswer}
                </div>
              )}
              <div className="mt-3">
                <Button size="s" icon={Dumbbell} onClick={() => practise(m)}>Practise similar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
