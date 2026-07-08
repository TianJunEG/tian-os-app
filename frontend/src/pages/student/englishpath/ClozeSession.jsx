import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import { Card, Button } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import {
  clozePassages,
  gradePassage,
  recordAttempt,
  selectNextPassageId,
} from '../../../../../shared/englishpath/cloze/index.js';
import { loadClozeState, saveClozeState, loadClozeLevel } from './clozeStore';

// One comprehension-cloze passage: type a word into each blank, Check to grade
// against the multi-answer accept-sets, then the attempt is recorded (per-skill
// accuracy + spaced-review box) before moving to the results screen.
export default function ClozeSession() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id || user?._id;

  const stateRef = useRef(null);
  const [passage, setPassage] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    const st = loadClozeState(studentId);
    stateRef.current = st;
    const level = loadClozeLevel(studentId);
    const pool = clozePassages.filter((p) => p.level === level);
    const usePool = pool.length ? pool : clozePassages;
    const nextId = selectNextPassageId(st, { passages: usePool });
    setPassage(usePool.find((p) => p.id === nextId) || usePool[0] || null);
    setAnswers({});
    setResult(null);
  }, [studentId]);

  const verdictByN = useMemo(() => {
    const m = {};
    if (result) for (const r of result.perBlank) m[r.n] = r.verdict;
    return m;
  }, [result]);

  if (!passage) return null;

  const graded = !!result;
  const setAnswer = (n, v) => setAnswers((a) => ({ ...a, [n]: v }));

  const check = () => {
    const res = gradePassage(answers, passage);
    setResult(res);
    const next = recordAttempt(stateRef.current, passage.id, {
      score: res.score,
      total: res.total,
      bySkill: res.bySkill,
    });
    stateRef.current = next;
    saveClozeState(studentId, next);
  };

  const reveal = () => {
    const filled = {};
    for (const b of passage.blanks) filled[b.n] = b.accept[0];
    setAnswers(filled);
  };

  const seeResults = () => {
    navigate('/student/english/cloze/results', {
      state: {
        passageId: passage.id,
        title: passage.title,
        score: result.score,
        total: result.total,
        bySkill: result.bySkill,
        perBlank: result.perBlank,
      },
      replace: true,
    });
  };

  const blankClass = (n) => {
    const base =
      'mx-0.5 inline-block w-28 max-w-[38vw] rounded-md border-b-2 bg-transparent px-1.5 py-0.5 text-center align-baseline focus:outline-none';
    const v = verdictByN[n];
    if (!graded) return `${base} border-ink-400 focus:border-emerald focus:bg-emerald-tint`;
    if (v === 'correct') return `${base} border-emerald bg-success-100 text-emerald-deep`;
    if (v === 'typo') return `${base} border-gold bg-gold-tint text-gold-deep`;
    return `${base} border-error-400 bg-error-100 text-error-700`;
  };

  const pct = graded && result.total ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate('/student/english/cloze')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Comprehension Cloze
      </button>

      <Card className="mb-5 p-6">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-deep">Open cloze · 15 blanks</div>
        <h2 className="mb-4 font-display text-xl font-semibold text-emerald-deep">{passage.title}</h2>

        <div className="cloze-passage text-[17px] leading-[2.4] text-ink-900">
          {passage.text.split('\n\n').map((para, pi) => (
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
                    <sup className="ml-0.5 text-[11px] text-ink-400">{part}</sup>
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
            <p className="text-sm text-ink-500">{pct}% · green is spot-on, amber is a spelling slip, red is one to review.</p>
          </div>
          <Button size="l" icon={ArrowRight} className="w-full" onClick={seeResults}>See results</Button>
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
