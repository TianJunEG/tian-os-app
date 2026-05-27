import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, StatTile, Spinner } from '../../components/ui';

export default function ClassOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [data, setData] = useState(null);

  useEffect(() => { teacherAPI.classOverview(id).then((r) => setData(r.data)).catch(() => setData(null)); }, [id]);

  if (!data) return <Spinner />;
  return (
    <>
      <ClassNav classId={id} name={meta?.name || data.class.name} level={meta?.level || data.class.level} />
      <Card className="mb-5 p-5">
        <div className="flex items-center gap-6">
          <StatTile label="Overall mastery" value={data.overallMastery} suffix="%" />
          <StatTile label="Students" value={data.studentCount} />
          <StatTile label="Need support" value={data.studentsNeedingSupport.length} />
        </div>
        <div className="mt-4"><Button icon={ArrowRight} onClick={() => navigate(`/teacher/classes/${id}/mastery`)}>View mastery map</Button></div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Top weak topics</h3>
          {data.topWeakTopics.length === 0 ? <p className="text-sm text-ink-500">No data yet.</p> : (
            <ul className="space-y-2">
              {data.topWeakTopics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-700">{t.topic}</span><Badge tone={t.avg < 50 ? 'error' : 'navy'}>{t.avg}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Students needing support</h3>
          {data.studentsNeedingSupport.length === 0 ? <p className="text-sm text-ink-500">None right now.</p> : (
            <ul className="space-y-2">
              {data.studentsNeedingSupport.map((s) => (
                <li key={s.studentId}><Link to={`/teacher/students/${s.studentId}`} className="text-sm font-medium text-navy-700 hover:underline">{s.name}</Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
