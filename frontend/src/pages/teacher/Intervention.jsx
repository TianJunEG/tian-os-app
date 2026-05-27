import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, StatusBadge, Spinner, EmptyState } from '../../components/ui';

const STATUSES = ['needs_support', 'improving', 'stable', 'mastered'];

// Intervention tracker: list + inline status update.
export default function Intervention() {
  const { id } = useParams();
  const meta = useClass(id);
  const [items, setItems] = useState(null);

  const load = () => teacherAPI.interventions(id).then((r) => setItems(r.data.interventions || [])).catch(() => setItems([]));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const update = async (iid, status) => { await teacherAPI.updateIntervention(iid, { status }); load(); };

  if (!items) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      {items.length === 0 ? (
        <EmptyState message="No active interventions yet. Flag a student from the mastery map or student detail." />
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <Card key={i.id} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div><p className="font-medium text-ink-700">{i.studentName}</p>{i.targetSkill && <p className="text-sm text-ink-500">Target: {i.targetSkill}</p>}</div>
                <StatusBadge status={i.status} />
              </div>
              {i.notes && <p className="text-sm text-ink-500">{i.notes}</p>}
              {i.nextAction && <p className="mt-1 text-sm text-ink-700">Next: {i.nextAction}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => update(i.id, s)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${i.status === s ? 'border-navy-500 bg-navy-050 text-navy-700' : 'border-hairline text-ink-500 hover:text-navy-700'}`}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
