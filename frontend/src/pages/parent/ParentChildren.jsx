import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { familyAPI } from '../../services/api';
import { Card, ProgressBar, Badge, PageHeader, Spinner, EmptyState } from '../../components/ui';

// List of the parent's children — each links into the per-child screens.
export default function ParentChildren() {
  const [children, setChildren] = useState(null);
  useEffect(() => { familyAPI.children().then((r) => setChildren(r.data.children || [])).catch(() => setChildren([])); }, []);

  if (!children) return <Spinner label="Loading…" />;
  return (
    <>
      <PageHeader title="Your children" subtitle="Tap a child to see progress and assign practice." />
      {children.length === 0 ? (
        <EmptyState icon={Users} message="No children linked yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <Link key={c.studentId} to={`/parent/children/${c.studentId}/progress`} className="block">
              <Card interactive className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-ink-700">{c.name}</h3>
                  <Badge tone="navy">{c.level}</Badge>
                </div>
                <p className="text-sm text-ink-500">Overall mastery {c.overallMastery}% · {c.masteredCount} mastered</p>
                <ProgressBar value={c.overallMastery} className="mt-3" />
                {c.weakestSkill && <p className="mt-2 text-xs text-error-700">Weak: {c.weakestSkill}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
