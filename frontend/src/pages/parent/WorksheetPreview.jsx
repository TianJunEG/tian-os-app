import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Printer, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { worksheetGenAPI } from '../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

// Parent › Worksheet Generator › preview. Clean printable layout + assign/print/regenerate.
export default function WorksheetPreview() {
  const { studentId, worksheetId } = useParams();
  const navigate = useNavigate();
  const [w, setW] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const load = () => worksheetGenAPI.get(worksheetId).then((r) => setW(r.data.worksheet)).catch((e) => setError(e.response?.data?.error || 'Could not load worksheet.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, [worksheetId]);

  const assign = async () => {
    setAssigning(true);
    try { await worksheetGenAPI.assign(worksheetId, { studentId }); await load(); }
    catch (e) { setError(e.response?.data?.error || 'Could not assign.'); }
    finally { setAssigning(false); }
  };

  if (loading) return <Spinner label="Loading worksheet…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!w) return <EmptyState icon={AlertTriangle} message="Worksheet not found." />;

  const c = w.content || {};
  const assigned = w.assignedStatus === 'assigned';

  return (
    <>
      <PageHeader title="Worksheet preview" subtitle={(c.skillNames || []).join(', ')} />

      <Card className="p-6 print:border-0 print:shadow-none">
        <div className="mb-4 border-b border-hairline pb-3">
          <h2 className="font-display text-2xl font-semibold text-navy-700">{c.title}</h2>
          <div className="mt-1 text-sm text-ink-500">{c.studentName ? `${c.studentName} · ` : ''}{w.difficulty}</div>
        </div>

        {c.reviewSection?.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Review your recent mistakes</div>
            <div className="space-y-2">
              {c.reviewSection.map((r, i) => (
                <div key={i} className="rounded-xl bg-gold-100 p-3 text-sm">
                  <div className="text-navy-900"><MathText text={r.stem} /></div>
                  <div className="mt-1 text-ink-600">You wrote <span className="font-semibold text-error-700">{r.yourAnswer || '—'}</span> · correct is <MathText text={String(r.correctAnswer)} className="font-semibold text-success-700" /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ol className="space-y-4">
          {(c.questions || []).map((q) => (
            <li key={q.n} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-700 text-xs text-paper">{q.n}</span>
              <div className="flex-1">
                <div className="text-lg text-ink-900"><MathText text={q.stem} /></div>
                {q.type === 'mcq' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.choices.map((ch, k) => <span key={k} className="rounded-lg border border-hairline px-3 py-1 text-sm"><MathText text={String(ch)} /></span>)}
                  </div>
                )}
                <div className="mt-2 h-8 border-b border-dashed border-hairline" />
              </div>
            </li>
          ))}
        </ol>

        {w.includesSolutions && (
          <div className="mt-6 border-t border-hairline pt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Answers &amp; worked solutions</div>
            <ol className="space-y-1.5 text-sm text-ink-700">
              {(c.questions || []).map((q) => (
                <li key={q.n} className="flex gap-2"><span className="font-semibold text-navy-700">{q.n}.</span>
                  <span><MathText text={String(q.answer)} className="font-semibold" />{q.workedSolution ? <span className="text-ink-500"> — <MathText text={q.workedSolution} /></span> : null}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        {assigned
          ? <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-success-100 px-5 py-3 font-semibold text-success-700"><Check className="h-4 w-4" /> Worksheet assigned</span>
          : <Button icon={Send} disabled={assigning} onClick={assign} className="flex-1">{assigning ? 'Assigning…' : 'Assign worksheet'}</Button>}
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print / Export</Button>
        <Button variant="secondary" icon={RotateCcw} onClick={() => navigate(`/parent/children/${studentId}/worksheets/new?${regenParams(w)}`)}>Regenerate</Button>
      </div>
      <p className="mt-2 text-xs text-ink-500 print:hidden">PDF export uses your browser's print dialog for now — native download is planned.</p>
    </>
  );
}

// Roundtrip the worksheet's choices into the Regenerate link so the setup page
// pre-fills with the same options. Without this, every tweak meant re-picking
// the topic, count, difficulty, and toggles from scratch.
function regenParams(w) {
  const p = new URLSearchParams();
  if (w.sourceMode) p.set('mode', w.sourceMode);
  if (w.difficulty) p.set('difficulty', w.difficulty);
  if (w.questionCount) p.set('count', String(w.questionCount));
  const firstSkill = Array.isArray(w.content?.skillIds) ? w.content.skillIds[0] : (w.skillIds?.[0]);
  if (firstSkill) p.set('skill', String(firstSkill));
  if (w.includesSolutions === false) p.set('solutions', '0');
  if (w.includesMistakeReview) p.set('review', '1');
  return p.toString();
}
