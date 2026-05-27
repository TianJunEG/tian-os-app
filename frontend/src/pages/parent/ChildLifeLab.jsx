import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sprout, CheckCircle2 } from 'lucide-react';
import { lifelabAPI } from '../../services/api';
import { useChild } from './useChild';
import ChildNav from './ChildNav';
import { Card, StatusBadge, Spinner, EmptyState } from '../../components/ui';
import E21ccTags from '../../components/LifeLab/E21ccTags';
import CompetencyGrowth from '../../components/LifeLab/CompetencyGrowth';

// Read-only LifeLab view for a parent: the child's competency growth plus the
// status of each assigned real-life activity.
export default function ChildLifeLab() {
  const { studentId } = useParams();
  const child = useChild(studentId);
  const [subs, setSubs] = useState(null);
  const [comps, setComps] = useState([]);

  useEffect(() => {
    lifelabAPI.child(studentId)
      .then((r) => { setSubs(r.data.submissions || []); setComps(r.data.competencies || []); })
      .catch(() => setSubs([]));
  }, [studentId]);

  const firstName = (child?.name || 'Your child').split(' ')[0];

  return (
    <>
      <ChildNav studentId={studentId} name={child?.name || 'Child'} level={child?.level} />
      {!subs ? <Spinner /> : (
        <>
          <CompetencyGrowth competencies={comps} title={`Competencies ${firstName} is building`} className="mb-6" />

          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Activities</h3>
          {subs.length === 0 ? (
            <EmptyState icon={Sprout} message="No LifeLab activities assigned yet." />
          ) : (
            <div className="space-y-3">
              {subs.map((s) => {
                const a = s.activity || {};
                return (
                  <Card key={s.id} className="p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-medium text-ink-700">{a.title}</p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm text-ink-500">{a.subject} · {a.topic}</p>
                    <E21ccTags primary={a.primaryE21cc} secondary={a.secondaryE21cc} className="mt-2" />
                    {s.reflectionResponse && (
                      <p className="mt-2 text-sm text-ink-700"><span className="text-ink-400">Reflection:</span> {s.reflectionResponse}</p>
                    )}
                    {s.status === 'reviewed' && s.teacherFeedback && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-success-700"><CheckCircle2 className="h-4 w-4" /> Teacher: {s.teacherFeedback}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
