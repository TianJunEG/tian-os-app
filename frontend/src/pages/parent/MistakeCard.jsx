import React, { lazy, Suspense, useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, Badge } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';
import { mathpathAPI } from '../../services/api';

const StrokeReplayPlayer = lazy(() => import('../../components/learning/StrokeReplayPlayer'));

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
const LEARNING_STATUS_LABEL = {
  new: 'New mistake',
  acknowledged: 'Student reviewed this mistake',
  corrected: 'Student successfully corrected this mistake',
  understood: 'Student showed understanding',
  mastered: 'Student demonstrated mastery',
};

export default function MistakeCard({ mistake: m, formula = false, action = null }) {
  const Stem = formula ? MathText : PlainText;
  const Ans = formula ? MathText : PlainText;
  const learningStatus = m.learningStatus || 'new';

  // ── Explanation feedback state ──
  const [feedback, setFeedback] = useState(m.tutorExplanation?.feedback || null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const submitFeedback = useCallback(async (value) => {
    if (feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      await mathpathAPI.explanationFeedback(m.id || m._id, value);
      setFeedback(value);
    } catch { /* silent — non-critical */ }
    finally { setFeedbackBusy(false); }
  }, [m.id, m._id, feedbackBusy]);

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
        <div className="flex flex-wrap justify-end gap-2">
          {m.topicName && <Badge tone="neutral">{m.topicName}</Badge>}
          <Badge tone={learningStatus === 'mastered' ? 'success' : learningStatus === 'new' ? 'gold' : 'navy'}>
            {LEARNING_STATUS_LABEL[learningStatus] || 'Mistake learning'}
          </Badge>
        </div>
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
      {m.tutorExplanation?.strokes?.length > 0 && (
        <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700">
              Tutor explanation
            </p>
            {m.tutorExplanation.hasAudio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-semibold text-navy-600">
                <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current"><path d="M8 1a2 2 0 0 0-2 2v5a2 2 0 1 0 4 0V3a2 2 0 0 0-2-2ZM4 7a1 1 0 0 0-2 0 6 6 0 0 0 5 5.91V14H5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9v-1.09A6 6 0 0 0 14 7a1 1 0 1 0-2 0 4 4 0 0 1-8 0Z" /></svg>
                Voice
              </span>
            )}
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-navy-100" />}>
            <StrokeReplayPlayer
              strokes={m.tutorExplanation.strokes}
              background="ruled"
              compact
              autoPlay={false}
              audioSrc={m.explanationAudioUrl || undefined}
            />
          </Suspense>
          {/* Feedback buttons */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-ink-400">Was this helpful?</span>
            <button
              onClick={() => submitFeedback('helpful')}
              disabled={feedbackBusy}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                feedback === 'helpful'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-white text-ink-400 hover:bg-success-50 hover:text-success-600'
              }`}
            >
              <ThumbsUp className="h-3 w-3" /> Yes
            </button>
            <button
              onClick={() => submitFeedback('not_helpful')}
              disabled={feedbackBusy}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                feedback === 'not_helpful'
                  ? 'bg-error-100 text-error-700'
                  : 'bg-white text-ink-400 hover:bg-error-50 hover:text-error-600'
              }`}
            >
              <ThumbsDown className="h-3 w-3" /> No
            </button>
            {feedback && (
              <span className="text-[11px] text-ink-400">
                {feedback === 'helpful' ? 'Thanks for the feedback!' : "We'll let the tutor know."}
              </span>
            )}
          </div>
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

// Tiny adapter so we can use the same `<X text={...} />` shape whether or not
// we're routing through <MathText>.
function PlainText({ text }) { return <>{text}</>; }
