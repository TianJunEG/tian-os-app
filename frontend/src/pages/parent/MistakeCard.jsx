import React, { lazy, Suspense, useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Clock, ChevronDown } from 'lucide-react';
import { Card, Badge } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';
import { mathpathAPI } from '../../services/api';
import { describeMistakeForParent } from '../../mathpath/insights/parentMisconceptionExplanations.js';

const StrokeReplayPlayer = lazy(() => import('../../components/learning/StrokeReplayPlayer'));

const LEARNING_STATUS_LABEL = {
  new: 'New mistake',
  acknowledged: 'Student reviewed this mistake',
  correction_attempted: 'Student tried to correct — not yet right',
  corrected: 'Student successfully corrected this mistake',
  understood: 'Student showed understanding',
  mastered: 'Student demonstrated mastery',
};

const LEARNING_STATUS_TONE = {
  new: 'gold',
  acknowledged: 'navy',
  correction_attempted: 'gold',
  corrected: 'navy',
  understood: 'navy',
  mastered: 'success',
};

const QUALITY_BAND_TONE = {
  EXCELLENT: 'success',
  GOOD: 'navy',
  PARTIAL: 'gold',
  INSUFFICIENT: 'error',
};

function formatTimeTaken(seconds) {
  if (!seconds && seconds !== 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function MistakeCard({ mistake: m, formula = false, action = null }) {
  const Stem = formula ? MathText : PlainText;
  const Ans = formula ? MathText : PlainText;
  const learningStatus = m.learningStatus || 'new';

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

  const timeLabel = formatTimeTaken(m.timeTaken);
  const hasMetadata = timeLabel || m.confidence || (m.skillCode && m.skillName && m.skillName !== m.skillCode) || m.workingQualityBand;
  // Translate the machine misconception tag into a plain-English explanation plus a
  // concrete at-home tip. Parents see meaning, not codes like "frac/add-denominators".
  const parentExplanation = m.misconceptionTag ? describeMistakeForParent(m) : null;

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-700">{m.skillName}</span>
        <div className="flex flex-wrap justify-end gap-2">
          {m.topicName && <Badge tone="neutral">{m.topicName}</Badge>}
          <Badge tone={LEARNING_STATUS_TONE[learningStatus] || 'neutral'}>
            {LEARNING_STATUS_LABEL[learningStatus] || learningStatus}
          </Badge>
        </div>
      </div>
      {m.reviewedAt && (
        <p className="mt-1 text-[11px] text-ink-400">
          Last action: {new Date(m.reviewedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {learningStatus === 'new' && m.occurredAt && (Date.now() - new Date(m.occurredAt).getTime()) > 86400000 && (
        <p className="mt-1 text-[11px] font-semibold text-amber-600">Needs attention — open for over 24 hours</p>
      )}
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

      {hasMetadata && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {timeLabel && (
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Clock className="h-3 w-3" /> {timeLabel}
            </span>
          )}
          {m.confidence && (
            <Badge tone={m.confidence >= 4 ? 'success' : m.confidence >= 2 ? 'gold' : 'error'}>
              Confidence {m.confidence}/5
            </Badge>
          )}
          {m.skillCode && m.skillName && m.skillName !== m.skillCode && (
            <span className="text-xs text-ink-400">{m.skillName}</span>
          )}
          {m.workingQualityBand && (
            <Badge tone={QUALITY_BAND_TONE[m.workingQualityBand] || 'neutral'}>
              Working: {m.workingQualityBand.charAt(0) + m.workingQualityBand.slice(1).toLowerCase()}
            </Badge>
          )}
        </div>
      )}

      {parentExplanation && (
        <div className="mt-3 rounded-xl border border-gold-tint bg-gold-tint/40 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold-label">
            What this means
          </div>
          <p className="text-sm text-ink-700">{parentExplanation.plainExplanation}</p>
          <p className="mt-2 text-sm text-ink-600">
            <span className="font-semibold text-gold-label">Try at home: </span>
            {parentExplanation.atHomeTip}
          </p>
          {m.misconceptionTag && (
            <p className="mt-2 text-[10px] text-ink-400">Reference: {m.misconceptionTag}</p>
          )}
        </div>
      )}

      {m.workedSolution && (
        <p className="mt-3 text-sm text-ink-500"><Stem text={m.workedSolution} /></p>
      )}

      {(m.workingImage || m.workingStrokes?.length > 0 || m.workingInsight) && (
        <WorkingEvidence
          workingImage={m.workingImage}
          workingStrokes={m.workingStrokes}
          workingInsight={m.workingInsight}
        />
      )}

      {m.tutorExplanation?.strokes?.length > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-tint bg-emerald-tint/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-deep">
              Tutor explanation
            </p>
            {m.tutorExplanation.hasAudio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-tint px-1.5 py-0.5 text-[10px] font-semibold text-emerald">
                <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current"><path d="M8 1a2 2 0 0 0-2 2v5a2 2 0 1 0 4 0V3a2 2 0 0 0-2-2ZM4 7a1 1 0 0 0-2 0 6 6 0 0 0 5 5.91V14H5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9v-1.09A6 6 0 0 0 14 7a1 1 0 1 0-2 0 4 4 0 0 1-8 0Z" /></svg>
                Voice
              </span>
            )}
          </div>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-emerald-tint" />}>
            <StrokeReplayPlayer
              strokes={m.tutorExplanation.strokes}
              background="ruled"
              compact
              autoPlay={false}
              audioSrc={m.explanationAudioUrl || undefined}
            />
          </Suspense>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-ink-400">Was this helpful?</span>
            <button
              onClick={() => submitFeedback('helpful')}
              disabled={feedbackBusy}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
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
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
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

function WorkingEvidence({ workingImage, workingStrokes, workingInsight }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          Student working
        </p>
        <ChevronDown className={`h-4 w-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {workingImage && (
            <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
              <img
                src={workingImage}
                alt="Student working"
                className="max-h-80 w-full object-contain"
              />
            </div>
          )}
          {!workingImage && workingStrokes?.length > 0 && (
            <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-ink-100" />}>
              <StrokeReplayPlayer
                strokes={workingStrokes}
                background="ruled"
                compact
                autoPlay={false}
              />
            </Suspense>
          )}
          {workingInsight && (
            <div className="space-y-1 text-xs text-ink-500">
              {workingInsight.detectedMethod && (
                <p><span className="font-semibold text-ink-600">Method:</span> {workingInsight.detectedMethod}</p>
              )}
              {workingInsight.issue && (
                <p><span className="font-semibold text-ink-600">Issue:</span> {workingInsight.issue}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlainText({ text }) { return <>{text}</>; }
