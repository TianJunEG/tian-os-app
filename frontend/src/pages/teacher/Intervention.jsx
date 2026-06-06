import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, StatusBadge, Spinner, ErrorState } from '../../components/ui';

const STATUSES = ['needs_support', 'improving', 'stable', 'mastered'];

// Intervention tracker: list + inline status update.
export default function Intervention() {
  const { id } = useParams();
  const meta = useClass(id);
  const [items, setItems] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const load = () => {
    setLoadError(false);
    setItems(null);
    setOverview(null);
    Promise.all([
      teacherAPI.interventions(id),
      teacherAPI.interventionOverview(id).catch(() => ({ data: null })),
    ])
      .then(([interventionsRes, overviewRes]) => {
        setItems(interventionsRes.data.interventions || []);
        setOverview(overviewRes.data);
      })
      .catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const update = async (iid, status) => { setUpdateError(null); try { await teacherAPI.updateIntervention(iid, { status }); load(); } catch (e) { setUpdateError("Couldn't update intervention status."); } };

  if (loadError) return <ErrorState message="Couldn't load interventions." onRetry={load} />;
  if (!items) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      {overview && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Need attention</p>
            <p className="mt-1 text-2xl font-semibold text-navy-700">{overview.studentsNeedingAttention?.length || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Weak groups</p>
            <p className="mt-1 text-2xl font-semibold text-navy-700">{overview.weakSkillGroups?.length || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recovery packs</p>
            <p className="mt-1 text-2xl font-semibold text-navy-700">{overview.recoveryPacksInProgress || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Recheck ready</p>
            <p className="mt-1 text-2xl font-semibold text-navy-700">{overview.recheckReady?.length || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Worksheets</p>
            <p className="mt-1 text-2xl font-semibold text-navy-700">{overview.worksheetsGenerated || 0}</p>
          </Card>
        </div>
      )}
      {overview?.weakSkillGroups?.length > 0 && (
        <Card className="mb-5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-navy-700">Group to teach today</p>
              <p className="mt-1 text-sm text-ink-500">{overview.weakSkillGroups[0].skillName}: {overview.weakSkillGroups[0].evidenceSummary}</p>
            </div>
            <Button size="s" to={`/teacher/classes/${id}/weak-groups`}>Open Weak Groups</Button>
          </div>
        </Card>
      )}
      {items.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No active interventions yet. Flag a student from the mastery map or student detail.</Card>
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
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${i.status === s ? 'border-navy-500 bg-navy-50 text-navy-700' : 'border-hairline text-ink-500 hover:text-navy-700'}`}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {updateError && <p className="text-sm text-error-700">{updateError}</p>}
    </>
  );
}
