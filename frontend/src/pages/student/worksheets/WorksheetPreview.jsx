import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { worksheetGenAPI } from '../../../services/api';
import { Card, EmptyState, PageHeader, Spinner, Button, Alert } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';

function VisualTable({ visual }) {
  const headers = Array.isArray(visual?.payload?.headers) ? visual.payload.headers : [];
  const rows = Array.isArray(visual?.payload?.rows) ? visual.payload.rows : [];
  if (!headers.length || !rows.length) return <p className="text-sm text-ink-500">Visual unavailable.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-hairline">
      <table className="min-w-full border-collapse text-left text-sm text-ink-700">
        <thead className="bg-navy-50">
          <tr>{headers.map((h, i) => <th key={i} className="border-b border-hairline px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="odd:bg-paper even:bg-slate-50">
              {Array.isArray(row) ? row.map((cell, cIdx) => <td key={cIdx} className="border-b border-hairline px-3 py-2">{cell}</td>) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorksheetPreview() {
  const { worksheetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [w, setW] = useState(null);
  const [view, setView] = useState('worksheet');

  useEffect(() => {
    worksheetGenAPI.get(worksheetId)
      .then((r) => setW(r.data.worksheet))
      .catch((e) => setError(e.response?.data?.error || 'Couldn’t load worksheet preview.'))
      .finally(() => setLoading(false));
  }, [worksheetId]);

  if (loading) return <Spinner label="Loading worksheet…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!w) return <EmptyState icon={AlertTriangle} message="Worksheet not found." />;

  const c = w.content || {};
  const questions = c.questions || [];
  const unsupportedVisualCount = questions.filter((q) => q.visual?.type && q.visual.type !== 'table').length;
  const studentLevel = c.studentLevel || questions.find((q) => q.moeLevel)?.moeLevel || '';
  const skillLabel = (c.skillNames || []).join(', ');
  const topicLabel = (c.topicNames || []).join(', ') || [...new Set(questions.map((q) => q.topicName).filter(Boolean))].join(', ');

  return (
    <>
      <PageHeader
        title="Worksheet Preview"
        subtitle={`${c.title || 'Worksheet'}${studentLevel ? ` · ${studentLevel}` : ''}`}
        action={<Button size="s" variant="secondary" icon={ArrowLeft} onClick={() => navigate('/student/worksheets')}>Back</Button>}
      />

      <Card className="mb-4 p-4 text-sm text-ink-700">
        <p><span className="font-semibold">Level:</span> {studentLevel || 'Not specified'}</p>
        <p><span className="font-semibold">Skills:</span> {skillLabel || '—'}</p>
        <p><span className="font-semibold">Topics:</span> {topicLabel || '—'}</p>
      </Card>

      {unsupportedVisualCount > 0 && (
        <Alert tone="warning" className="mb-4">
          {unsupportedVisualCount} question(s) use unsupported visual type and are shown as “Visual unavailable.”
        </Alert>
      )}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setView('worksheet')} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${view === 'worksheet' ? 'border-navy-700 bg-navy-700 text-paper' : 'border-hairline bg-paper text-navy-700'}`}>Worksheet</button>
        <button onClick={() => setView('answers')} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${view === 'answers' ? 'border-navy-700 bg-navy-700 text-paper' : 'border-hairline bg-paper text-navy-700'}`}>Answer Key</button>
      </div>

      <Card className="p-5">
        {view === 'worksheet' ? (
          <ol className="space-y-4">
            {questions.map((q) => (
              <li key={q.n} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-700 text-xs text-paper">{q.n}</span>
                <div className="flex-1">
                  <div className="text-lg text-ink-900"><MathText text={q.stem} /></div>
                  {q.visual?.type === 'table' && <VisualTable visual={q.visual} />}
                  {q.visual?.type && q.visual.type !== 'table' && <p className="mt-2 text-sm text-ink-500">Visual unavailable.</p>}
                  {q.type === 'mcq' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(q.choices || []).map((ch, i) => <span key={i} className="rounded-lg border border-hairline px-3 py-1 text-sm"><MathText text={String(ch)} /></span>)}
                    </div>
                  )}
                  <div className="mt-2 h-8 border-b border-dashed border-hairline" />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-3">
            <ol className="space-y-2">
              {questions.map((q) => (
                <li key={q.n} className="text-sm text-ink-700">
                  <span className="font-semibold text-navy-700">{q.n}.</span>{' '}
                  <MathText text={String(q.answer)} className="font-semibold" />
                  {q.workedSolution ? <span className="text-ink-500"> — <MathText text={q.workedSolution} /></span> : null}
                </li>
              ))}
            </ol>
            {c.reviewSection?.length > 0 && (
              <Card className="border-l-4 border-l-gold-500 p-3 text-sm text-ink-700">
                <p className="mb-1 font-semibold text-gold-700">Remediation Notes</p>
                <ul className="list-disc pl-4">
                  {c.reviewSection.map((r, i) => (
                    <li key={i}><MathText text={r.stem} />: <MathText text={String(r.correctAnswer)} /></li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </Card>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
        <Button as={Link} to="/student/worksheets/new">Generate Another</Button>
      </div>
    </>
  );
}
