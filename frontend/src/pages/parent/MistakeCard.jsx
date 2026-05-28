import React from 'react';
import { Card, Badge } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';

// Shared mistake card. Previously Math and Science rendered the same data
// (a question, the student's answer, the correct answer) in two very
// different layouts — Math as a pipe-separated single line, Science as
// paired coloured boxes. The boxed layout wins on scannability, so it's
// the one shared here.
//
// Props:
//   mistake.{skillName,topicName,questionStem,studentAnswer,correctAnswer,workedSolution}
//   formula  — if true, render the stem/answers through <MathText>
//              (Math worksheets carry LaTeX-ish fragments; Science is plain prose).
//   action   — optional bottom-right button slot (e.g. "Assign practice").
export default function MistakeCard({ mistake: m, formula = false, action = null }) {
  const Stem = formula ? MathText : PlainText;
  const Ans = formula ? MathText : PlainText;
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
        {m.topicName && <Badge tone="neutral">{m.topicName}</Badge>}
      </div>
      <div className="text-ink-900"><Stem text={m.questionStem} /></div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-error-100 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-error-700">Answered</div>
          <div className="text-ink-900"><Ans text={m.studentAnswer || '—'} /></div>
        </div>
        {m.correctAnswer && (
          <div className="rounded-xl bg-success-100 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-success-700">{formula ? 'Correct' : 'Model answer'}</div>
            <div className="text-ink-900"><Ans text={String(m.correctAnswer)} /></div>
          </div>
        )}
      </div>
      {m.workedSolution && (
        <p className="mt-3 text-sm text-ink-500"><Stem text={m.workedSolution} /></p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

// Tiny adapter so we can use the same `<X text={...} />` shape whether or not
// we're routing through <MathText>.
function PlainText({ text }) { return <>{text}</>; }
