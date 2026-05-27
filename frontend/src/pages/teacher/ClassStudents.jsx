import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, StatusBadge, Spinner, EmptyState } from '../../components/ui';

export default function ClassStudents() {
  const { id } = useParams();
  const meta = useClass(id);
  const [students, setStudents] = useState(null);
  useEffect(() => { teacherAPI.classStudents(id).then((r) => setStudents(r.data.students || [])).catch(() => setStudents([])); }, [id]);

  if (!students) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      {students.length === 0 ? <EmptyState message="No students added to this class yet." /> : (
        <div className="space-y-2">
          {students.map((s) => (
            <Card key={s.studentId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-ink-700">{s.name}</p>
                <p className="text-sm text-ink-500">{s.level} · {s.overallMastery}%{s.weakestSkill ? ` · weak: ${s.weakestSkill}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.interventionStatus && <StatusBadge status={s.interventionStatus} />}
                <Button size="s" variant="secondary" to={`/teacher/students/${s.studentId}`}>View</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
