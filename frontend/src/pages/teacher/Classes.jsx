import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Card, Badge, ProgressBar, PageHeader, Spinner, EmptyState } from '../../components/ui';

// All classes assigned to the teacher.
export default function Classes() {
  const [classes, setClasses] = useState(null);
  useEffect(() => { teacherAPI.classes().then((r) => setClasses(r.data.classes || [])).catch(() => setClasses([])); }, []);

  if (!classes) return <Spinner />;
  return (
    <>
      <PageHeader title="Classes" subtitle="Tap a class to see mastery and group students." />
      {classes.length === 0 ? (
        <EmptyState icon={LayoutGrid} message="No classes assigned yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.classId} to={`/teacher/classes/${c.classId}`} className="block">
              <Card interactive className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <div><h3 className="font-semibold text-ink-700">{c.name}</h3><p className="text-sm text-ink-500">{c.level} · {c.studentCount} students</p></div>
                  <Badge tone="navy">{c.overallMastery}%</Badge>
                </div>
                <ProgressBar value={c.overallMastery} />
                <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
                  <span>Completion {c.completionRate}%</span>
                  {c.weakestTopic && <span>Weakest: {c.weakestTopic}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
