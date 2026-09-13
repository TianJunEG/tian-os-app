import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { Card, Button, EmptyState } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  clozePassages,
  gradePassage,
  buildFocusPassage,
  recordFocusResult,
} from '../../../../../shared/englishpath/cloze/index.js';
import { loadClozeState, saveClozeState } from './clozeStore';

// A focused review of just the blanks the student keeps getting wrong, pulled
// from across every passage they've attempted (not a fresh 15-blank passage).
// Each item is its own sentence with the surrounding blanks pre-filled so it
// still reads naturally. Getting one right here clears it from the tricky list
// the same way getting it right on a full passage replay would.
export default function ClozeFocusSession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const stateRef = useRef(null);
  const [focus, setFocus] = useState(undefined); // undefined = loading, null = nothing weak
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    const st = loadClozeState(studentId);
    stateRef.current = st;
    setFocus(buildFocusPassage(st, { passages: clozePassages }));
    setAnswers({});
    setResult(null);
  }, [studentId]);

  const verdictByN = useMemo(() => {
    const m = {};
    if (result) for (const r of result.perBlank) m[r.n] = r.verdict;
    return m;
  }, [result]);

  if (focus === undefined) return null;

  if (focus === null) {
    return (
      <div className="mx-auto max-w-xl">
        <BackLink navigate={navigate} />
        <EmptyState icon={CheckCircle2} message="Nothing tricky right now — every blank you've tried is on track!">
          <Button to="/student/english/cloze" variant="secondary" size="s">Back to Cloze</Button>
        </EmptyState>
      </div>
    );
  }

  const graded = !!result;
  const setAnswer = (n, v) => setAnswers((a) => ({ ...a, [n]: v }));

  const check = () => {
    const res = gradePassage(answers, focus);
    setResult(res);
    const next = recordFocusResult(stateRef.current, focus.mapping, res.perBlank);
    stateRef.current = next;
    saveClozeState(studentId, next);
  };

  const reveal = () => {
    const filled = {};
    for (const b of focus.blanks) filled[b.n] = b.accept[0];
    setAnswers(filled);
  };

  const finish = () => navigate('/student/english/cloze', { replace: true });

  const blankClass = (n) => {
    const base =
      'mx-0.5 inline-block w-28 max-w-[38vw] rounded-md border-b-2 bg-transparent px-1.5 py-0.5 text-center align-baseline focus:outline-none';
    const v = verdictByN[n];
    if (!graded) return `${base} border-ink-400 focus:border-emerald focus:bg-emerald-tint`;
    if (v === 'correct') return `${base} border-emerald bg-success-100 text-emerald-deep`;
    return `${base} border-error-400 bg-error-100 text-error-700`;
  };

  const pct = graded && result.total ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink navigate={navigate} />

      <Card className="mb-5 p-6">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">
          Focus review · {focus.blanks.length} blank{focus.blanks.length > 1 ? 's' : ''}
        </div>
        <h2 className="mb-4 font-display text-xl font-semibold text-emerald-deep">Tricky blanks</h2>

        <div className="cloze-passage text-[17px] leading-[2.4] text-ink-900">
          {focus.text.split('\n\n').map((para, pi) => (
            <p key={pi} className="mb-3.5">
              {para.split(/\{(\d+)\}/).map((part, i) =>
                i % 2 === 0 ? (
                  <span key={i}>{part}</span>
                ) : (
                  <span key={i} className="whitespace-nowrap">
                    <input
                      aria-label={`Blank ${part}`}
                      value={answers[Number(part)] || ''}
                      onChange={(e) => setAnswer(Number(part), e.target.value)}
                      readOnly={graded}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className={blankClass(Number(part))}
                    />
                  </span>
                )
              )}
            </p>
          ))}
        </div>
      </Card>

      {graded ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-ink-100 p-4 text-center">
            <p className="font-display text-2xl font-semibold text-emerald-deep">
              {result.score}<span className="text-lg text-ink-400"> / {result.total}</span>
            </p>
            <p className="text-sm text-ink-500">{pct}% · get one right and it drops off your tricky list.</p>
          </div>
          <Button size="l" icon={ArrowRight} className="w-full" onClick={finish}>Done</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="l" className="flex-1" onClick={check}>Check answers</Button>
          <Button size="l" variant="secondary" icon={Eye} className="flex-1" onClick={reveal}>Reveal answers</Button>
        </div>
      )}
    </div>
  );
}

function BackLink({ navigate }) {
  return (
    <button
      onClick={() => navigate('/student/english/cloze')}
      className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Comprehension Cloze
    </button>
  );
}
