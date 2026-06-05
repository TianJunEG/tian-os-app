import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui';

export function resolveWorkingRequirementLevel(question = {}, sessionType = 'practice') {
  const explicit = String(question.workingRequirementLevel || question.workingLevel || '').toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH'].includes(explicit)) return explicit;

  const text = [
    question.prompt,
    question.stem,
    question.questionText,
    question.skillName,
    question.questionFamilyId,
    question.questionType,
    question.type,
    question.workingType,
  ].filter(Boolean).join(' ').toLowerCase();
  const session = String(sessionType || '').toLowerCase();

  if (
    session === 'assessment'
    || session === 'mastery_check'
    || /word|multi[- ]?step|equivalent|operation|ratio|algebra|geometry|reason|remainder|convert|add|subtract|multiply|divide/.test(text)
  ) {
    return 'HIGH';
  }

  if (/what fraction|shaded|identify|recognition|count objects|count the|multiple choice recall/.test(text)) {
    return 'LOW';
  }

  if (/calculate|simplify|compare|number line|single[- ]?step|arithmetic|fraction/.test(text)) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export function hasWorkingDecision(working = {}) {
  return Boolean(working.workingSubmitted || working.workingOnPaper || working.workingNotNeeded);
}

export default function WorkingEvidenceDecision({
  working = {},
  requirementLevel = 'MEDIUM',
  disabled = false,
  onDeclareOnPaper,
  onDeclareNotNeeded,
}) {
  const submitted = Boolean(working.workingSubmitted);
  const onPaper = Boolean(working.workingOnPaper);
  const notNeeded = Boolean(working.workingNotNeeded);
  const levelTone = requirementLevel === 'HIGH' ? 'error' : requirementLevel === 'MEDIUM' ? 'gold' : 'neutral';

  return (
    <div className="rounded-xl border border-hairline bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-700">Working Evidence</p>
          <p className="mt-1 text-xs text-ink-500">Choose how you solved this before submitting.</p>
        </div>
        <Badge tone={levelTone}>{requirementLevel}</Badge>
      </div>

      <div className="mt-3 space-y-2">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${submitted ? 'border-success-200 bg-success-100 text-success-700' : 'border-hairline bg-slate-50 text-ink-500'}`}>
          <CheckCircle2 className={`h-4 w-4 ${submitted ? 'text-success-700' : 'text-ink-300'}`} />
          <span className="font-semibold">Working submitted</span>
        </div>

        {!submitted && (
          <label className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${onPaper ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-hairline text-ink-700 hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-hairline text-navy-700"
              checked={onPaper}
              disabled={disabled}
              onChange={(event) => onDeclareOnPaper?.(event.target.checked)}
            />
            <span className="font-semibold">I did my working on paper</span>
          </label>
        )}

        {!submitted && (
          <label className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${notNeeded ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-700 hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-hairline text-navy-700"
              checked={notNeeded}
              disabled={disabled}
              onChange={(event) => onDeclareNotNeeded?.(event.target.checked)}
            />
            <span className="font-semibold">I did not need working for this question</span>
          </label>
        )}

        {submitted && (
          <p className="text-xs text-ink-500">Because working has been submitted, the declaration is locked.</p>
        )}
      </div>
    </div>
  );
}
