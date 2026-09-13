import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Button, Card, ErrorState, Spinner, StatusBadge } from '../../components/ui';

export default function TeacherWorksheets() {
  const { id } = useParams();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [busySkill, setBusySkill] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setError(false);
    setData(null);
    teacherAPI.weakGroups(id)
      .then((res) => setData(res.data))
      .catch(() => setError(true));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async (group) => {
    setBusySkill(group.skillId);
    setMessage('');
    try {
      const res = await teacherAPI.generateWeakGroupWorksheet(id, group.skillId);
      setMessage(`Generated ${res.data.worksheet?.title || group.skillName} for ${group.students?.length || 0} student${(group.students?.length || 0) === 1 ? '' : 's'}.`);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Worksheet could not be generated for this group.');
    } finally {
      setBusySkill('');
    }
  };

  if (error) return <ErrorState message="Couldn't load worksheet recommendations." onRetry={load} />;
  if (!data) return <Spinner />;

  const groups = data.groups || [];

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <Card className="mb-4 p-5">
        <h1 className="font-display text-xl font-semibold text-emerald-deep">Class Worksheets</h1>
        <p className="mt-1 text-sm text-ink-500">Generate focused worksheets from current MathPath weak-group evidence.</p>
      </Card>
      {message && <Card className="mb-4 border-l-4 border-emerald-bright p-4 text-sm text-ink-700">{message}</Card>}
      {groups.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No weak-group worksheet recommendations yet. Ask students to complete diagnostics or practice first.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.skillId} className="flex h-full flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-emerald-deep">{group.skillName}</h2>
                  <p className="mt-1 text-sm text-ink-500">{group.evidenceSummary}</p>
                </div>
                <StatusBadge status={group.priority === 'high' ? 'needs_support' : 'learning'} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(group.students || []).slice(0, 5).map((student) => (
                  <span key={student.studentId} className="rounded-full bg-emerald-tint px-2.5 py-1 text-xs font-semibold text-emerald-deep">{student.name}</span>
                ))}
                {(group.students || []).length > 5 && <span className="text-xs font-semibold text-ink-400">+{group.students.length - 5} more</span>}
              </div>
              <div className="mt-auto pt-4">
                <Button size="s" disabled={busySkill === group.skillId} onClick={() => generate(group)}>
                  Generate Worksheet
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
