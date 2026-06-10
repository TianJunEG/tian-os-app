import React from 'react';

const STEPS = [
  { id: 'understand', label: 'Understand' },
  { id: 'identify_info', label: 'Info' },
  { id: 'identify_question', label: 'Question' },
  { id: 'plan', label: 'Plan' },
  { id: 'solve', label: 'Solve' },
  { id: 'check', label: 'Check' },
];

export default function StepProgressBar({ currentStepIdx = 0, completedSteps = {} }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((step, i) => {
        const result = completedSteps[step.id];
        const isCurrent = i === currentStepIdx;
        let dotColor = 'bg-ink-200';
        if (result?.correct) dotColor = 'bg-emerald-400';
        else if (result?.partial) dotColor = 'bg-amber-400';
        else if (result && !result.correct) dotColor = 'bg-red-400';
        if (isCurrent && !result) dotColor = 'bg-gold-400 ring-2 ring-gold-200';

        return (
          <div key={step.id} className="flex flex-col items-center gap-1">
            <div className={`h-3 w-3 rounded-full transition-colors ${dotColor}`} />
            <span className={`text-[10px] leading-tight ${isCurrent ? 'font-semibold text-ink-700' : 'text-ink-400'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
