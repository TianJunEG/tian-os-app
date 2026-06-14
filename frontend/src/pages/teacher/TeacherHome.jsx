import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Card, Button, Badge, StatTile, PageHeader, Spinner, ErrorState } from '../../components/ui';

// Teacher home — quick scan of classes + what needs attention today.
export default function TeacherHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setData(null);
    teacherAPI.home().then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  if (loadError) return <ErrorState message="Couldn't load Teacher dashboard." onRetry={load} />;
  if (!data) return <Spinner />;
  const first = data.attention[0];

  return (
    <>
      <PageHeader title="Good day" subtitle="Your classes and what needs attention." />
      <Card className="mb-4 p-4 sm:mb-6 sm:p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <StatTile label="Classes" value={data.classCount} />
          <StatTile label="Active interventions" value={data.activeInterventions} />
          <StatTile label="Need attention" value={data.attention.length} />
        </div>
        {first && (
          <div className="mt-4">
            <Button icon={ArrowRight} onClick={() => navigate(`/teacher/classes/${first.classId}/weak-groups`)}>Review intervention groups</Button>
          </div>
        )}
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Classes needing attention</h3>
      {data.attention.length === 0 ? (
        <Card className="p-6 text-sm text-ink-500">No urgent class needs today.</Card>
      ) : (
        <div className="space-y-2">
          {data.attention.map((c) => (
            <Link key={c.classId} to={`/teacher/classes/${c.classId}/weak-groups`} className="block">
              <Card interactive className="flex items-center justify-between gap-3 p-4">
                <div><p className="font-medium text-ink-700">{c.name}</p><p className="text-sm text-ink-500">{c.flagged} student{c.flagged > 1 ? 's' : ''} need support</p></div>
                <Badge tone="error">Review</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
