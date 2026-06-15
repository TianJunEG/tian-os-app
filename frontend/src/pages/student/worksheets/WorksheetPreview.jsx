import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Printer, Send } from 'lucide-react';
import { worksheetGenAPI } from '../../../services/api';
import { Card, EmptyState, PageHeader, Spinner, Button, Alert } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';

function VisualTable({ visual }) {
  const headers = Array.isArray(visual?.payload?.headers) ? visual.payload.headers : [];
  const rows = Array.isArray(visual?.payload?.rows) ? visual.payload.rows : [];
  if (!headers.length || !rows.length) return <p className="text-sm text-ink-500">Visual unavailable.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-line-soft">
      <table className="min-w-full border-collapse text-left text-sm text-ink-700">
        <thead className="bg-emerald-tint">
          <tr>{headers.map((h, i) => <th key={i} className="border-b border-line-soft px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="odd:bg-surface-white even:bg-surface-raised">
              {Array.isArray(row) ? row.map((cell, cIdx) => <td key={cIdx} className="border-b border-line-soft px-3 py-2">{cell}</td>) : null}
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
  const [answers, setAnswers] = useState({});
  const [workingSubmitted, setWorkingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
  const personalization = c.personalization || w.personalization || null;
  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        workingSubmitted,
        answers: questions
          .map((q) => ({ questionId: q.questionId, n: q.n, answer: answers[q.n] || '', workingSubmitted }))
          .filter((row) => row.answer.trim()),
      };
      const { data } = await worksheetGenAPI.submit(worksheetId, payload);
      setResult(data);
      setView('answers');
    } catch (e) {
      setError(e.response?.data?.error || 'Couldn’t submit worksheet.');
    } finally {
      setSubmitting(false);
    }
  };

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
        {personalization?.sourceSummary && (
          <p className="mt-3 rounded-xl bg-emerald-tint p-3 text-emerald-deep">
            <span className="font-semibold">{personalization.sourceLabel || 'Personalised worksheet'}:</span> {personalization.sourceSummary}
          </p>
        )}
      </Card>

      {unsupportedVisualCount > 0 && (
        <Alert tone="warning" className="mb-4">
          {unsupportedVisualCount} question(s) use unsupported visual type and are shown as “Visual unavailable.”
        </Alert>
      )}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setView('worksheet')} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${view === 'worksheet' ? 'border-emerald-deep bg-emerald-deep text-paper' : 'border-line-soft bg-surface-white text-emerald-deep'}`}>Worksheet</button>
        <button onClick={() => setView('answers')} className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${view === 'answers' ? 'border-emerald-deep bg-emerald-deep text-paper' : 'border-line-soft bg-surface-white text-emerald-deep'}`}>Answer Key</button>
      </div>

      <Card className="p-5">
        {view === 'worksheet' ? (
          <ol className="space-y-4">
            {questions.map((q) => (
              <li key={q.n} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-deep text-xs text-paper">{q.n}</span>
                <div className="flex-1">
                  <div className="text-lg text-ink-900"><MathText text={q.stem} /></div>
                  {q.visual?.type === 'table' && <VisualTable visual={q.visual} />}
                  {q.visual?.type && q.visual.type !== 'table' && <p className="mt-2 text-sm text-ink-500">Visual unavailable.</p>}
                  {q.type === 'mcq' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(q.choices || []).map((ch, i) => <span key={i} className="rounded-lg border border-line-soft px-3 py-1 text-sm"><MathText text={String(ch)} /></span>)}
                    </div>
                  )}
                  <div className="mt-2 h-8 border-b border-dashed border-line-soft" />
                  <input
                    value={answers[q.n] || ''}
                    onChange={(event) => setAnswers((prev) => ({ ...prev, [q.n]: event.target.value }))}
                    className="mt-3 h-11 w-full rounded-xl border border-line-soft px-3 text-sm outline-none focus:border-emerald"
                    placeholder="Type your answer"
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-3">
            <ol className="space-y-2">
              {questions.map((q) => (
                <li key={q.n} className="text-sm text-ink-700">
                  <span className="font-semibold text-emerald-deep">{q.n}.</span>{' '}
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

      {result && (
        <Card className="mt-4 border-l-4 border-l-success-500 p-4 text-sm text-ink-700">
          <div className="flex items-center gap-2 font-semibold text-success-700">
            <CheckCircle2 className="h-4 w-4" /> Submitted · {result.accuracy}% accuracy
          </div>
          <p className="mt-1">{result.correctAnswers}/{result.totalAnswered} answered correctly.</p>
        </Card>
      )}

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
        <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-soft bg-surface-white px-4 py-3 text-sm font-semibold text-emerald-deep">
          <input type="checkbox" checked={workingSubmitted} onChange={(event) => setWorkingSubmitted(event.target.checked)} />
          Working submitted
        </label>
        <Button icon={Send} disabled={submitting || !Object.values(answers).some((value) => String(value || '').trim())} onClick={submit}>
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
        <Button as={Link} to="/student/worksheets/new">Generate Another</Button>
      </div>
    </>
  );
}
