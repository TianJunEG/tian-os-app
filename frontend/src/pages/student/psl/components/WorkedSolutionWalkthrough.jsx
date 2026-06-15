import React, { useState } from 'react';
import { BookOpen, ChevronRight, RotateCcw } from 'lucide-react';
import SolutionVisual from './SolutionVisual';
import MascotBubble from './MascotBubble';
import { getVoiceScripts } from '../utils/voiceScripts';

function parseSteps(text) {
  if (!text) return [];
  const lines = text.split('\n').filter((l) => l.trim());
  const steps = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const stepMatch = trimmed.match(/^Step\s+(\d+)\s*:\s*(.+)/i);
    const answerMatch = trimmed.match(/^Answer\s*:\s*(.+)/i);
    if (stepMatch) {
      steps.push({ type: 'step', number: parseInt(stepMatch[1], 10), text: stepMatch[2] });
    } else if (answerMatch) {
      steps.push({ type: 'answer', text: answerMatch[1] });
    } else {
      steps.push({ type: 'step', number: steps.length + 1, text: trimmed });
    }
  }
  return steps;
}

export default function WorkedSolutionWalkthrough({ solutionText, visualSpec, heuristic, structure, unknownPosition, operation }) {
  const steps = parseSteps(solutionText);
  const [revealed, setRevealed] = useState(0);
  const scripts = getVoiceScripts(heuristic, structure, unknownPosition, operation);

  if (steps.length === 0) return null;

  const allRevealed = revealed >= steps.length;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <BookOpen className="h-4 w-4 text-sky-600" />
        <span className="text-xs font-semibold text-sky-700">Worked Solution</span>
      </div>

      {revealed > 0 && visualSpec && (
        <div className="transition-all duration-300 ease-out opacity-100 translate-y-0 mb-3">
          <SolutionVisual visualSpec={visualSpec} revealedSteps={revealed} />
        </div>
      )}

      <div className="space-y-2">
        {(() => { let stepIdx = 0; return steps.map((step, i) => {
          const visible = i < revealed;
          return (
            <div
              key={i}
              className={`transition-all duration-300 ease-out ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2 h-0 overflow-hidden'
              }`}
              style={visible ? { transitionDelay: `${50}ms` } : {}}
            >
              {step.type === 'answer' ? (
                <div>
                  <MascotBubble text={scripts.answer} />
                  <div className="rounded-lg bg-sky-100 border border-sky-300 px-3 py-2 mt-1">
                    <span className="text-sm font-semibold text-sky-800">Answer: </span>
                    <span className="text-sm text-sky-800">{step.text}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <MascotBubble text={scripts.steps[stepIdx++] || null} />
                  <div className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-200 text-[10px] font-bold text-sky-700 mt-0.5">
                      {step.number}
                    </span>
                    <p className="text-sm text-sky-800 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              )}
            </div>
          );
        }); })()}
      </div>

      <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
        {!allRevealed ? (
          <button
            type="button"
            onClick={() => setRevealed((r) => r + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-600"
          >
            {revealed === 0 ? 'Show first step' : 'Next step'}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(0)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Replay
          </button>
        )}
        {!allRevealed && revealed > 0 && (
          <button
            type="button"
            onClick={() => setRevealed(steps.length)}
            className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-200"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  );
}
