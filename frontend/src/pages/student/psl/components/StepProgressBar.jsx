import React from 'react';

const STEPS = [
  { id: 'understand', label: 'Read' },
  { id: 'identify_info', label: 'Clues' },
  { id: 'identify_question', label: 'Goal' },
  { id: 'plan', label: 'Plan' },
  { id: 'solve', label: 'Solve' },
  { id: 'check', label: 'Check' },
];

export default function StepProgressBar({ currentStepIdx = 0, completedSteps = {} }) {
  return (
    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
      {STEPS.map((step, i) => {
        const done = i < currentStepIdx || completedSteps[step.id];
        const isFinalDone = i === STEPS.length - 1 && done;
        let bg = '#e4e7ec';
        if (isFinalDone) bg = '#1f9d57';
        else if (done) bg = '#d9892e';
        else if (i === currentStepIdx) bg = '#d9892e';

        return (
          <span
            key={step.id}
            style={{
              flex: 1, height: 7, borderRadius: 4,
              background: bg, transition: 'background .25s ease',
            }}
          />
        );
      })}
    </div>
  );
}
