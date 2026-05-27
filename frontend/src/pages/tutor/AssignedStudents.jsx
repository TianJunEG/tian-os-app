import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, Badge, ProgressBar, PageHeader, Spinner, EmptyState } from '../../components/ui';

// Tutor's assigned students (tutor-workspace scope only).
export default function AssignedStudents() {
  const [students, setStudents] = useState(null);
  useEffect(() => { tutorAPI.students().then((r) => setStudents(r.data.students || [])).catch(() => setStudents([])); }, []);

  if (!students) return <Spinner />;
  return (
    <>
      <PageHeader title="Assigned students" subtitle="Private students in this workspace." />
      {students.length === 0 ? (
        <EmptyState icon={Users} message="No students assigned yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {students.map((s) => (
            <Card key={s.studentId} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <div><h3 className="font-semibold text-ink-700">{s.name}</h3><p className="text-sm text-ink-500">{s.level} · {s.focusArea}</p></div>
                <Badge tone="navy">{s.overallMastery}%</Badge>
              </div>
              {s.weakestSkill && <p className="text-sm text-error-700">Weakest: {s.weakestSkill}</p>}
              <p className="mt-2 text-xs uppercase tracking-wide text-ink-300">Homework completion</p>
              <ProgressBar value={s.homeworkCompletion} className="mt-1" />
              <div className="mt-4"><Button size="s" to={`/tutor/students/${s.studentId}`}>View student</Button></div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
