import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Spinner, EmptyState, ErrorState } from '../../components/ui';
import MistakeCard from './MistakeCard';

// Read-only mistake history for the parent, with a one-tap route to assign
// targeted practice on the same skill. Honours ?skill=<id> so a WeakTopics
// "Review mistakes" link lands filtered to that skill (previously it opened
// the unfiltered list, which was a mild bait-and-switch).
//
// Also honours ?highlight=<mistakeId> from notification deep-links so the
// relevant card scrolls into view and gets a brief gold ring.
export default function MistakeHistory() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const child = useChild(studentId);
  const [mistakes, setMistakes] = useState(null);
  const [error, setError] = useState(null);

  const skillFilter = params.get('skill') || '';
  const highlightId = params.get('highlight') || '';

  // Scroll-to-highlight refs
  const highlightRef = useRef(null);
  const didScroll = useRef(false);

  const load = useCallback(() => {
    setError(null); setMistakes(null);
    mathpathAPI.mistakes({ studentId }).then((r) => setMistakes(r.data.mistakes || [])).catch((e) => setError(e));
  }, [studentId]);
  useEffect(() => { load(); }, [load]);

  // Scroll to highlighted mistake once the list renders
  useEffect(() => {
    if (highlightId && highlightRef.current && !didScroll.current) {
      didScroll.current = true;
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, mistakes]);

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
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-deep hover:bg-emerald-tint"
          >
            <X className="h-3.5 w-3.5" /> Show all
          </button>
        </Card>
      )}

      {error ? <ErrorState message="Couldn't load mistakes." onRetry={load} /> : !visible ? <Spinner label="Loading…" /> : visible.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          message={skillFilter ? 'No recent mistakes for this skill.' : 'No recent mistakes. Great consistency.'}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((m) => {
            const isHighlighted = highlightId && String(m.id) === String(highlightId);
            return (
              <div
                key={m.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={isHighlighted ? 'rounded-2xl ring-2 ring-gold animate-pulse-once' : ''}
              >
                <MistakeCard
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
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
