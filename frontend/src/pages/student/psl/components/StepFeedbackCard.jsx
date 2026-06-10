import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function StepFeedbackCard({ correct, partial, feedback, misconceptionTag, onContinue }) {
  let icon, bgColor, borderColor, textColor;
  if (correct) {
    icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-200'; textColor = 'text-emerald-700';
  } else if (partial) {
    icon = <AlertCircle className="h-5 w-5 text-amber-500" />;
    bgColor = 'bg-amber-50'; borderColor = 'border-amber-200'; textColor = 'text-amber-700';
  } else {
    icon = <XCircle className="h-5 w-5 text-red-500" />;
    bgColor = 'bg-red-50'; borderColor = 'border-red-200'; textColor = 'text-red-700';
  }

  const MISCONCEPTION_TIPS = {
    'psl/missed-number': 'Read the story again carefully — look for all the numbers mentioned.',
    'psl/included-irrelevant': 'One of the numbers you picked isn\'t needed for this problem.',
    'psl/confused-question': 'Re-read the last sentence — it tells you what to find.',
    'psl/misread-unknown': 'Check which quantity is unknown in this problem.',
    'psl/wrong-model-type': 'Think about whether the parts make up a whole, or we\'re comparing two things.',
    'psl/wrong-unknown-position': 'The question mark should go where the unknown quantity is.',
    'psl/wrong-operation': 'Think again: should you add, subtract, multiply, or divide?',
    'psl/used-wrong-numbers': 'Check you\'re using the right numbers from the story.',
    'psl/arithmetic-error': 'Your method is right, but check your calculation.',
    'psl/skipped-check': 'Always check if your answer makes sense in the story.',
  };

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{feedback}</p>
          {misconceptionTag && MISCONCEPTION_TIPS[misconceptionTag] && (
            <p className="mt-1 text-xs text-ink-500">{MISCONCEPTION_TIPS[misconceptionTag]}</p>
          )}
        </div>
      </div>
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="mt-3 w-full rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-500"
        >
          Continue
        </button>
      )}
    </div>
  );
}
