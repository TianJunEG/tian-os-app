import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowRight } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Card, Badge, PageHeader, Spinner, EmptyState } from '../../components/ui';

// Teacher LifeLab landing — pick a class to assign and review LifeLab activities.
// The per-class LifeLab tab lives at /teacher/classes/:id/lifelab.
export default function LifeLabHome() {
  const [classes, setClasses] = useState(null);
  useEffect(() => { teacherAPI.classes().then((r) => setClasses(r.data.classes || [])).catch(() => setClasses([])); }, []);

  if (!classes) return <Spinner />;
  return (
    <>
      <PageHeader title="LifeLab" subtitle="Assign real-life Math & Science activities and review your students' responses." />
      {classes.length === 0 ? (
        <EmptyState icon={Sprout} message="No classes yet. Once you have a class, you can assign LifeLab activities to it." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link key={c.classId} to={`/teacher/classes/${c.classId}/lifelab`} className="block focus-visible:outline-none">
              <Card interactive className="flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-success-100 text-success-700"><Sprout className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-ink-700">{c.name}</h3>
                    <p className="text-sm text-ink-500">{c.level} · {c.studentCount} students</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-ink-300" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
