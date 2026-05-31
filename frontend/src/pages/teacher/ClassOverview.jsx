import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, StatTile, Spinner, ErrorState, CollapsibleSection } from '../../components/ui';

export default function ClassOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useClass(id);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => { setLoadError(false); setData(null); teacherAPI.classOverview(id).then((r) => setData(r.data)).catch(() => setLoadError(true)); };
  useEffect(() => { load(); }, [id]);

  if (loadError) return <ErrorState message="Couldn't load class overview." onRetry={load} />;
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
        <div className="mt-2"><Button variant="secondary" onClick={() => navigate(`/teacher/classes/${id}/mathpath`)}>Open MathPath dashboard</Button></div>
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

      {data.science?.available && (
        <CollapsibleSection
          title="Science Adaptive Revision"
          summary={data.science.attemptedCount === 0 ? 'No students have started yet.' : `${data.science.attemptedCount}/${data.studentCount} students started`}
          className="mt-5"
        >
          {data.science.attemptedCount === 0 ? (
            <p className="text-sm text-ink-500">No students in this class have started Science Adaptive Revision yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-6">
                <StatTile label="Class mastery" value={data.science.overallMastery} suffix="%" />
                <StatTile label="Students started" value={`${data.science.attemptedCount} / ${data.studentCount}`} />
                <StatTile label="Need support" value={data.science.needsSupport.length} />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Top weak Science topics</h4>
                  {data.science.topWeakTopics.length === 0 ? <p className="text-sm text-ink-500">No data yet.</p> : (
                    <ul className="space-y-2">
                      {data.science.topWeakTopics.map((t) => (
                        <li key={t.topic} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-ink-700">{t.topic}</span>
                          <Badge tone={t.avg < 50 ? 'error' : 'navy'}>{t.avg}%</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Students needing Science support</h4>
                  {data.science.needsSupport.length === 0 ? <p className="text-sm text-ink-500">None right now.</p> : (
                    <ul className="space-y-2">
                      {data.science.needsSupport.map((s) => (
                        <li key={s.studentId}><Link to={`/teacher/students/${s.studentId}`} className="text-sm font-medium text-navy-700 hover:underline">{s.name}</Link></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </CollapsibleSection>
      )}
    </>
  );
}
