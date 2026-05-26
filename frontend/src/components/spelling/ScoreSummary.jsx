import React, { useEffect } from 'react';
import { Star, RotateCcw } from 'lucide-react';
import { playWin } from '../../utils/sound';
import { confettiBurst } from '../../utils/confetti';

export const starsForPct = (pct) => (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0);
const messageFor = (pct) =>
  pct >= 90 ? 'Amazing!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort!' : 'Keep practising!';

// Shared celebratory results screen for quiz-style activities.
export default function ScoreSummary({ correct, total, onRestart, restartLabel = 'Try again', unit = 'correct' }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const stars = starsForPct(pct);

  useEffect(() => {
    if (stars >= 1) {
      playWin();
      confettiBurst({ count: stars >= 3 ? 180 : 110 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center py-8">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={`w-12 h-12 transition ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <div className="text-5xl font-extrabold text-navy-600 mb-1">{pct}%</div>
      <p className="text-lg font-semibold text-gray-800 mb-1">{messageFor(pct)}</p>
      <p className="text-gray-500 mb-6">
        {correct} of {total} {unit}
      </p>
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium inline-flex items-center gap-2"
      >
        <RotateCcw className="w-5 h-5" /> {restartLabel}
      </button>
    </div>
  );
}
