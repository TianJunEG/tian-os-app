import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Pencil, ThumbsDown, ThumbsUp } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import TutorStudentNav from './TutorStudentNav';
import { Card, StatusBadge, Button, Spinner, ErrorState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

const STATUS_LABEL = {
  new: 'New mistake',
  acknowledged: 'Reviewed',
  correction_attempted: 'Retry needed',
  corrected: 'Corrected',
  understood: 'Understood',
  mastered: 'Mastered',
};

export default function TutorMistakesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setData(null);
    tutorAPI.student(id).then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn't load mistakes." onRetry={load} />;
  if (!data) return <Spinner />;

  const { student, mistakes } = data;

  return (
    <>
      <TutorStudentNav studentId={id} name={student.name} level={student.level} />

      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink-700">Recent mistakes</h2>
        <p className="text-sm text-ink-500">Up to 10 most recent unresolved mistakes</p>
      </div>

      {mistakes.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-500">No unresolved mistakes recorded.</Card>
      ) : (
        <ul className="space-y-3">
          {mistakes.map((m) => (
            <li key={m.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-700">{m.skillName}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{STATUS_LABEL[m.learningStatus] || 'Learning'}</p>
                  </div>
                  <StatusBadge status={m.learningStatus || 'new'} />
                </div>

                <div className="mt-2 text-sm text-ink-600">
                  <MathText text={m.questionStem} />
                </div>

                {m.studentAnswer != null && (
                  <p className="mt-1 text-xs text-ink-500">
                    Student answered: <span className="font-medium text-rose-600">{m.studentAnswer}</span>
                    {m.correctAnswer != null && (
                      <> · Correct: <span className="font-medium text-emerald-700">{m.correctAnswer}</span></>
                    )}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="s"
                    variant="secondary"
                    icon={m.hasTutorExplanation ? CheckCircle2 : Pencil}
                    onClick={() => navigate(`/tutor/students/${id}/mistakes/${m.id}/explain`)}
                  >
                    {m.hasTutorExplanation ? 'Edit explanation' : 'Record explanation'}
                  </Button>

                  {m.explanationFeedback === 'helpful' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-700">
                      <ThumbsUp className="h-3 w-3" /> Parent found this helpful
                    </span>
                  )}
                  {m.explanationFeedback === 'not_helpful' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <ThumbsDown className="h-3 w-3" /> Parent requested a new explanation
                    </span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
