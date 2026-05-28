import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, StatusBadge, Spinner, EmptyState } from '../../components/ui';

// Weak-skill cards with the two parent actions: assign practice / review mistakes.
export default function WeakTopics() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [weak, setWeak] = useState(null);
  const [mistakeCounts, setMistakeCounts] = useState({});

  useEffect(() => {
    mathpathAPI.mastery({ studentId }).then((r) => setWeak(r.data.weakSkills || [])).catch(() => setWeak([]));
    mathpathAPI.mistakes({ studentId }).then((r) => {
      const map = {};
      (r.data.weakSkills || []).forEach((w) => { map[String(w.skillId)] = w.count; });
      setMistakeCounts(map);
    }).catch(() => {});
  }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!weak ? <Spinner label="Loading…" /> : weak.length === 0 ? (
        <EmptyState icon={CheckCircle2} message="No weak topics right now. Nicely on track." />
      ) : (
        <div className="space-y-3">
          {weak.map((w) => (
            <Card key={w.skillId} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink-700">{w.skillName}</p>
                  <p className="text-sm text-ink-500">{w.topicName}</p>
                </div>
                <StatusBadge status={w.status} />
              </div>
              <p className="mt-2 text-sm text-ink-500">
                {mistakeCounts[String(w.skillId)] ? `${mistakeCounts[String(w.skillId)]} recent mistakes · ` : ''}
                Suggested: short targeted practice.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="s" onClick={() => navigate(`/parent/children/${studentId}/assign-practice?skill=${w.skillId}`)}>Assign practice</Button>
                <Button size="s" variant="secondary" onClick={() => navigate(`/parent/children/${studentId}/mistakes`)}>Review mistakes</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
