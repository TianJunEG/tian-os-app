import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Spinner } from '../../components/ui';

// Status → mastery-scale colour (calm heatmap, not rainbow).
const SEG = [
  ['mastered', 'Mastered', 'bg-mastery-5'],
  ['learning', 'Learning', 'bg-mastery-3'],
  ['needs_support', 'Needs support', 'bg-error-500'],
  ['not_started', 'Not started', 'bg-mastery-1'],
];

export default function ClassMasteryMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [topics, setTopics] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { teacherAPI.classMastery(id).then((r) => setTopics(r.data.topics || [])).catch(() => setTopics([])); }, [id]);

  if (!topics) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-ink-500">
        {SEG.map(([k, label, cls]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${cls}`} />{label}</span>
        ))}
      </div>

      <div className="mb-6 space-y-2">
        {topics.map((t) => {
          const total = Object.values(t.counts).reduce((a, b) => a + b, 0) || 1;
          return (
            <Card key={t.topicId} className="p-4">
              <button onClick={() => setOpen(open === t.topicId ? null : t.topicId)} className="w-full text-left">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-ink-700">{t.name}</span>
                  {t.counts.needs_support > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-error-700"><Users className="h-3.5 w-3.5" />{t.counts.needs_support}</span>}
                </div>
                {/* stacked bar */}
                <div className="flex h-3 overflow-hidden rounded-full">
                  {SEG.map(([k, , cls]) => t.counts[k] > 0 && <span key={k} className={cls} style={{ width: `${(t.counts[k] / total) * 100}%` }} />)}
                </div>
              </button>
              {open === t.topicId && (
                <div className="mt-3 border-t border-hairline pt-3">
                  {t.affected.length === 0 ? <p className="text-sm text-ink-500">No students need support on this topic.</p> : (
                    <>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Needs support</p>
                      <div className="flex flex-wrap gap-2">
                        {t.affected.map((s) => <Link key={s.studentId} to={`/teacher/students/${s.studentId}`} className="rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-semibold text-error-700">{s.name}</Link>)}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button onClick={() => navigate(`/teacher/classes/${id}/groups`)}>Create groups</Button>
    </>
  );
}
