import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { familyAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';

const PRIORITY_TONE = { high: 'error', medium: 'gold', low: 'success' };

// Contextual button verbs by actionType. Avoids the prior duplication where
// the card title (the full recommendation) and the button label said the same
// thing; the button should say what *kind* of action we're taking.
const BUTTON_LABEL = {
  assign_practice: 'Assign',
  restart_practice: 'Assign',
  review_mistakes: 'Review',
  follow_up_assignment: 'Open',
  celebrate: 'View progress',
};

// Routes each recommendation to the right screen, honouring its module so a
// Spelling action lands on the Spelling assign flow (word list) rather than the
// MathPath one (skill).
function assignPractice(base, rec) {
  const p = new URLSearchParams();
  const mod = rec.module || 'MathPath';
  p.set('module', mod);
  if (rec.relatedSkillId) p.set(mod === 'Spelling Practice' ? 'list' : 'skill', rec.relatedSkillId);
  return `${base}/assign-practice?${p.toString()}`;
}

function destination(studentId, rec) {
  const base = `/parent/children/${studentId}`;
  switch (rec.actionType) {
    case 'assign_practice':
    case 'restart_practice':
      return assignPractice(base, rec);
    // Route review by module: Science → its parent surface, Spelling → assign
    // targeted practice on the word list, MathPath → the parent mistakes view.
    case 'review_mistakes':
      if (rec.module === 'Science Adaptive Revision') return `${base}/science`;
      return rec.module === 'Spelling Practice' ? assignPractice(base, rec) : `${base}/mistakes`;
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
      {!recs ? <Spinner label="Loading…" /> : recs.length === 0 ? (
        <EmptyState icon={Sparkles} message={`Nothing urgent for ${child?.name || 'your child'} right now.`} />
      ) : (
        <div className="space-y-3">
          {recs.map((rec, i) => (
            <Card key={i} className="p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge tone={PRIORITY_TONE[rec.priority]}>{rec.priority}</Badge>
                {rec.module && <Badge tone="outline">{rec.module}</Badge>}
                {rec.relatedSkillName && <span className="text-sm text-ink-500">{rec.relatedSkillName}</span>}
              </div>
              <p className="font-semibold text-ink-700">{rec.action}</p>
              <p className="mt-0.5 text-sm text-ink-500">{rec.reason}</p>
              <div className="mt-3">
                <Button size="s" onClick={() => navigate(destination(studentId, rec))}>{BUTTON_LABEL[rec.actionType] || 'Open'}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
