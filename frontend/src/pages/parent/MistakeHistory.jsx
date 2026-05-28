import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import MistakeCard from './MistakeCard';

// Read-only mistake history for the parent, with a one-tap route to assign
// targeted practice on the same skill. Honours ?skill=<id> so a WeakTopics
// "Review mistakes" link lands filtered to that skill (previously it opened
// the unfiltered list, which was a mild bait-and-switch).
export default function MistakeHistory() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const child = useChild(studentId);
  const [mistakes, setMistakes] = useState(null);

  const skillFilter = params.get('skill') || '';

  useEffect(() => {
    mathpathAPI.mistakes({ studentId }).then((r) => setMistakes(r.data.mistakes || [])).catch(() => setMistakes([]));
  }, [studentId]);

  const visible = useMemo(() => {
    if (!mistakes) return null;
    if (!skillFilter) return mistakes;
    return mistakes.filter((m) => String(m.skillId) === String(skillFilter));
  }, [mistakes, skillFilter]);

  const filterChip = skillFilter && visible?.length ? visible[0].skillName : null;

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />

      {filterChip && (
        <Card className="mb-3 flex items-center justify-between gap-3 p-3">
          <span className="text-sm text-ink-600">
            Showing mistakes for <span className="font-semibold text-ink-800">{filterChip}</span>
            {visible.length > 0 && <span className="text-ink-400"> · {visible.length}</span>}
          </span>
          <button
            onClick={() => navigate(`/parent/children/${studentId}/mistakes`)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50"
          >
            <X className="h-3.5 w-3.5" /> Show all
          </button>
        </Card>
      )}

      {!visible ? <Spinner label="Loading…" /> : visible.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          message={skillFilter ? 'No recent mistakes for this skill.' : 'No recent mistakes. Great consistency.'}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((m) => (
            <MistakeCard
              key={m.id}
              mistake={m}
              formula
              action={
                <Button
                  size="s"
                  variant="secondary"
                  onClick={() => navigate(`/parent/children/${studentId}/assign-practice?skill=${m.skillId}`)}
                >
                  Assign practice
                </Button>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
