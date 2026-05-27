import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

// Read-only mistake history for the parent, with a one-tap route to assign
// targeted practice on the same skill.
export default function MistakeHistory() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [mistakes, setMistakes] = useState(null);

  useEffect(() => {
    mathpathAPI.mistakes({ studentId }).then((r) => setMistakes(r.data.mistakes || [])).catch(() => setMistakes([]));
  }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!mistakes ? <Spinner /> : mistakes.length === 0 ? (
        <EmptyState icon={CheckCircle2} message="No recent mistakes. Great consistency." />
      ) : (
        <div className="space-y-4">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
                <Badge tone="neutral">{m.topicName}</Badge>
              </div>
              <div className="text-ink-900"><MathText text={m.questionStem} /></div>
              <div className="mt-2 text-sm">
                <span className="text-error-700">Answered: <MathText text={m.studentAnswer} className="font-mono" /></span>
                <span className="mx-2 text-ink-300">·</span>
                <span className="text-success-700">Correct: <MathText text={m.correctAnswer} className="font-mono" /></span>
              </div>
              {m.workedSolution && <p className="mt-2 text-sm text-ink-500"><MathText text={m.workedSolution} /></p>}
              <div className="mt-4">
                <Button size="s" variant="secondary" onClick={() => navigate(`/parent/children/${studentId}/assign-practice?skill=${m.skillId}`)}>Assign similar practice</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
