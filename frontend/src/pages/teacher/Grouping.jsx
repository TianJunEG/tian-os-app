import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle2 } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';

// Rule-suggested remediation groups; teacher saves a group then assigns to it.
export default function Grouping() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [savedIds, setSavedIds] = useState({});

  const load = () => teacherAPI.groups(id).then((r) => setData(r.data)).catch(() => setData({ suggested: [], saved: [] }));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const saveGroup = async (g) => {
    const { data: res } = await teacherAPI.saveGroup(id, {
      name: g.name, basis: g.basis, targetSkillId: g.targetSkillId, studentIds: g.students.map((s) => s.studentId),
    });
    setSavedIds((m) => ({ ...m, [g.targetSkillId]: res.group._id }));
    load();
  };

  if (!data) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Suggested groups</h3>
      {data.suggested.length === 0 ? (
        <EmptyState icon={Users} message="No grouping suggestions yet. Run a diagnostic or assign practice first." />
      ) : (
        <div className="mb-6 space-y-3">
          {data.suggested.map((g) => (
            <Card key={g.targetSkillId} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-ink-700">{g.name}</p>
                <Badge tone="navy">{g.students.length}</Badge>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {g.students.map((s) => <span key={s.studentId} className="rounded-full bg-bone px-2.5 py-0.5 text-xs text-ink-700">{s.name}</span>)}
              </div>
              {savedIds[g.targetSkillId] ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Saved</span>
              ) : (
                <Button size="s" variant="secondary" onClick={() => saveGroup(g)}>Save group</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {data.saved.length > 0 && (
        <>
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Saved groups</h3>
          <div className="space-y-2">
            {data.saved.map((g) => (
              <Card key={g._id} className="flex items-center justify-between gap-3 p-4">
                <div><p className="font-medium text-ink-700">{g.name}</p><p className="text-sm text-ink-500">{g.studentIds.length} students</p></div>
                <Button size="s" onClick={() => navigate(`/teacher/classes/${id}/assign?group=${g._id}`)}>Assign group practice</Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
