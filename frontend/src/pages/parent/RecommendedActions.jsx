import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { familyAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';

const PRIORITY_TONE = { high: 'error', medium: 'gold', low: 'success' };

// Routes each recommendation to the right screen.
function destination(studentId, rec) {
  const base = `/parent/children/${studentId}`;
  switch (rec.actionType) {
    case 'assign_practice':
    case 'restart_practice':
      return `${base}/assign-practice${rec.relatedSkillId ? `?skill=${rec.relatedSkillId}` : ''}`;
    case 'review_mistakes': return `${base}/mistakes`;
    case 'follow_up_assignment': return `${base}/assignments`;
    case 'celebrate': return `${base}/progress`;
    default: return base;
  }
}

export default function RecommendedActions() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const child = useChild(studentId);
  const [recs, setRecs] = useState(null);

  useEffect(() => {
    familyAPI.recommendations(studentId).then((r) => setRecs(r.data.recommendations || [])).catch(() => setRecs([]));
  }, [studentId]);

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!recs ? <Spinner /> : recs.length === 0 ? (
        <EmptyState icon={Sparkles} message={`Nothing urgent for ${child?.name || 'your child'} right now.`} />
      ) : (
        <div className="space-y-3">
          {recs.map((rec, i) => (
            <Card key={i} className="p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge tone={PRIORITY_TONE[rec.priority]}>{rec.priority}</Badge>
                {rec.relatedSkillName && <span className="text-sm text-ink-500">{rec.relatedSkillName}</span>}
              </div>
              <p className="font-semibold text-ink-700">{rec.action}</p>
              <p className="mt-0.5 text-sm text-ink-500">{rec.reason}</p>
              <div className="mt-3">
                <Button size="s" onClick={() => navigate(destination(studentId, rec))}>{rec.action}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
