import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useClass } from './useClass';
import ClassNav from './ClassNav';
import { Card, Button, Badge, StatTile, Spinner, ErrorState } from '../../components/ui';

const TYPES = [
  ['class_progress', 'Class progress'],
  ['intervention_summary', 'Intervention summary'],
  ['parent_friendly', 'Parent-friendly summary'],
];

// Simple on-screen report preview (export/share is a placeholder for MVP).
export default function Reports() {
  const { id } = useParams();
  const meta = useClass(id);
  const [type, setType] = useState('class_progress');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState(false);

  const generate = (t) => {
    setReportError(false);
    setLoading(true);
    teacherAPI.report(id, { type: t }).then((r) => setReport(r.data)).catch(() => { setReport(null); setReportError(true); }).finally(() => setLoading(false));
  };
  useEffect(() => { generate('class_progress'); }, [id]); // eslint-disable-line

  return (
    <>
      <ClassNav classId={id} name={meta?.name || 'Class'} level={meta?.level} />
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map(([k, label]) => (
          <button key={k} onClick={() => { setType(k); generate(k); }}
            className={`rounded-full border px-3 py-1.5 text-sm ${type === k ? 'border-navy-500 bg-navy-50 font-semibold text-navy-700' : 'border-hairline text-ink-700'}`}>{label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : reportError ? <ErrorState message="Couldn't generate report." onRetry={() => generate(type)} /> : !report ? <Card className="p-5 text-sm text-ink-500">No report available.</Card> : (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-ink-300" /><h3 className="font-semibold text-ink-700">{TYPES.find(([k]) => k === type)?.[1]}</h3></div>
            <span className="text-xs text-ink-300">{new Date(report.generatedAt).toLocaleDateString()}</span>
          </div>
          <div className="mb-4 flex items-center gap-6">
            <StatTile label="Overall mastery" value={report.overallMastery} suffix="%" />
            <StatTile label="Students" value={report.studentCount} />
            <StatTile label="Completion" value={report.assignmentCompletion} suffix="%" />
          </div>
          <h4 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">By topic</h4>
          <ul className="space-y-1.5">
            {report.topics.map((t) => (
              <li key={t.topic} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-700">{t.topic}</span><Badge tone={t.avg < 50 ? 'error' : 'navy'}>{t.avg}%</Badge>
              </li>
            ))}
          </ul>
          <div className="mt-5"><Button variant="secondary" size="s" disabled>Export / share (coming soon)</Button></div>
        </Card>
      )}
    </>
  );
}
