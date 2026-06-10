import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, StatusBadge, PageHeader, Spinner, ErrorState, EmptyState } from '../../components/ui';

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

// All homework this tutor has assigned, across students.
export default function TutorHomework() {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const load = () => {
    setLoadError(false);
    setItems(null);
    tutorAPI.homework().then((r) => setItems(r.data.homework || [])).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  if (loadError) return <ErrorState message="Couldn’t load homework." onRetry={load} />;
  if (!items) return <Spinner />;
  return (
    <>
      <PageHeader title="Homework" subtitle="Everything you've assigned." />
      {items.length === 0 ? (
        <EmptyState icon={ClipboardList} message="No homework assigned yet. Open a student to assign targeted practice." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-700">
                  <Link to={`/tutor/students/${a.studentId}`} className="hover:text-navy-700">{a.studentName}</Link>
                  <span className="text-ink-400"> · {a.skillNames?.join(', ') || a.module}</span>
                </p>
                <p className="mt-0.5 text-sm text-ink-500">{a.module} · due {fmt(a.dueDate)}{a.score != null ? ` · ${a.score}%` : ''}</p>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
