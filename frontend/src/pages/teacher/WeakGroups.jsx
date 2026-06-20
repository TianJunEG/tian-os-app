import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Badge, Button, Card, ErrorState, Spinner } from '../../components/ui';

// Weak-group priority is high/medium/low. Show plain, human labels rather than
// mapping it onto unrelated learning-status enums (which read as "Learning" etc.).
const PRIORITY_LABELS = {
  high: ['error', 'High priority'],
  medium: ['gold', 'Medium priority'],
  low: ['neutral', 'Low priority'],
};

function PriorityBadge({ priority }) {
  const [tone, label] = PRIORITY_LABELS[priority] || PRIORITY_LABELS.low;
  return <Badge tone={tone}>{label}</Badge>;
}

export default function WeakGroups() {
  const { id } = useParams();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setError(false);
    setData(null);
    teacherAPI.weakGroups(id)
      .then((res) => setData(res.data))
      .catch(() => setError(true));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (key, fn, success) => {
    setBusyKey(key);
    setMessage('');
    try {
      const res = await fn();
      setMessage(success(res.data));
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Action could not be completed.');
    } finally {
      setBusyKey('');
    }
  };

  if (error) return <ErrorState message="Couldn't load weak groups." onRetry={load} />;
  if (!data) return <Spinner />;

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Weak groups</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-deep">{data.summary?.groupCount || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">High priority</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-deep">{data.summary?.highPriorityCount || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Students affected</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-deep">{data.summary?.affectedStudentCount || 0}</p>
        </Card>
      </div>

      {message && <Card className="mb-4 border-l-4 border-emerald-bright p-4 text-sm text-ink-700">{message}</Card>}

      {(data.groups || []).length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No MathPath weak groups are ready yet. They will appear after diagnostics, practice mistakes, paper analysis, or recovery pack evidence.</Card>
      ) : (
        <div className="space-y-4">
          {data.groups.map((group) => (
            <Card key={group.skillId} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-emerald-deep">{group.skillName}</h2>
                    <PriorityBadge priority={group.priority} />
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{group.evidenceSummary}</p>
                  <p className="mt-2 text-sm font-medium text-ink-700">{group.recommendedAction}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="s" disabled={busyKey === `${group.skillId}:recovery`} onClick={() => act(
                    `${group.skillId}:recovery`,
                    () => teacherAPI.assignWeakGroupRecovery(id, group.skillId),
                    (res) => `Assigned ${res.assigned || 0} recovery pack${res.assigned === 1 ? '' : 's'}.`
                  )}>Assign Recovery Pack</Button>
                  <Button size="s" variant="secondary" disabled={busyKey === `${group.skillId}:worksheet`} onClick={() => act(
                    `${group.skillId}:worksheet`,
                    () => teacherAPI.generateWeakGroupWorksheet(id, group.skillId),
                    (res) => `Generated worksheet: ${res.worksheet?.title || group.skillName}.`
                  )}>Generate Worksheet</Button>
                  <Button size="s" variant="secondary" disabled={busyKey === `${group.skillId}:recheck`} onClick={() => act(
                    `${group.skillId}:recheck`,
                    () => teacherAPI.assignWeakGroupRecheck(id, group.skillId),
                    (res) => `Created ${res.created || 0} recheck${res.created === 1 ? '' : 's'}.`
                  )}>Assign Recheck</Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Students</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(group.students || []).map((student) => (
                      <span key={student.studentId} className="rounded-full bg-emerald-tint px-3 py-1 text-sm font-semibold text-emerald-deep">{student.name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Evidence</p>
                  <ul className="mt-2 space-y-1 text-sm text-ink-600">
                    {(group.evidence || []).slice(0, 4).map((item, index) => (
                      <li key={`${item.studentId}-${item.type}-${index}`}>{item.studentName}: {item.summary}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
