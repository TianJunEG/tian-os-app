import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { Card, Badge, StatusBadge, StatTile, PageHeader, Spinner } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

export default function TeacherStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { teacherAPI.student(id).then((r) => setData(r.data)).catch(() => setData(null)); }, [id]);

  if (!data) return <Spinner />;
  const { student, overallMastery, weakTopics, mistakes, assignments } = data;

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader title={student.name} subtitle={student.level} />

      <Card className="mb-5 p-5">
        <div className="flex items-center gap-6">
          <StatTile label="Overall mastery" value={overallMastery} suffix="%" />
          <StatTile label="Weak topics" value={weakTopics.length} />
          <StatTile label="Open mistakes" value={mistakes.length} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Weak topics</h3>
          {weakTopics.length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2">
              {weakTopics.map((w, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-700">{w.skillName} <span className="text-ink-400">· {w.topicName}</span></span>
                  <Badge tone={w.score < 40 ? 'error' : 'navy'}>{w.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Assignments</h3>
          {assignments.length === 0 ? <p className="text-sm text-ink-500">None.</p> : (
            <ul className="space-y-2">
              {assignments.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-700">{a.skillNames?.join(', ') || a.module}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {mistakes.length > 0 && (
        <Card className="mt-5 p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Recent mistakes</h3>
          <ul className="space-y-3">
            {mistakes.slice(0, 5).map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-medium text-ink-700">{m.skillName}</p>
                <p className="text-ink-500"><MathText text={m.questionStem} /></p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
