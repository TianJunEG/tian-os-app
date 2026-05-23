import React, { useMemo, useState } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { generateWordSearch, normalizeSpelling } from '../../utils/spellingGames';
import { playCorrect, playWin } from '../../utils/sound';
import { confettiBurst } from '../../utils/confetti';

const cellsBetween = (a, b) => {
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const lenR = Math.abs(b.r - a.r);
  const lenC = Math.abs(b.c - a.c);
  // Must be a straight line: horizontal, vertical or 45° diagonal.
  if (!((dr === 0 && dc !== 0) || (dc === 0 && dr !== 0) || lenR === lenC)) return null;
  const len = Math.max(lenR, lenC);
  const out = [];
  for (let i = 0; i <= len; i++) out.push({ r: a.r + dr * i, c: a.c + dc * i });
  return out;
};

export default function WordSearch({ words, onAttempt }) {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(
    () => generateWordSearch(words.map((w) => w.word)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, seed]
  );

  const [start, setStart] = useState(null);
  const [foundKeys, setFoundKeys] = useState(new Set());
  const [foundWords, setFoundWords] = useState(new Set());

  const targetWords = puzzle.placements.map((p) => p.word);
  const allFound = foundWords.size === targetWords.length && targetWords.length > 0;

  const handleCell = (r, c) => {
    if (!start) {
      setStart({ r, c });
      return;
    }
    const line = cellsBetween(start, { r, c });
    setStart(null);
    if (!line) return;

    const str = line.map((cell) => puzzle.grid[cell.r][cell.c]).join('');
    const rev = str.split('').reverse().join('');
    const match = targetWords.find(
      (w) => !foundWords.has(w) && (normalizeSpelling(w) === normalizeSpelling(str) || normalizeSpelling(w) === normalizeSpelling(rev))
    );
    if (match) {
      setFoundKeys((prev) => {
        const nx = new Set(prev);
        line.forEach((cell) => nx.add(`${cell.r},${cell.c}`));
        return nx;
      });
      setFoundWords((prev) => new Set(prev).add(match));
      onAttempt?.(match, true);
      const completes = foundWords.size + 1 >= targetWords.length;
      if (completes) {
        playWin();
        confettiBurst();
      } else {
        playCorrect();
      }
    }
  };

  const regenerate = () => {
    setFoundKeys(new Set());
    setFoundWords(new Set());
    setStart(null);
    setSeed((s) => s + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Found {foundWords.size} of {targetWords.length}. Tap the first and last letter of a word.
        </p>
        <button onClick={regenerate} className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1">
          <RotateCcw className="w-4 h-4" /> New puzzle
        </button>
      </div>

      {allFound && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg flex items-center gap-2 font-medium">
          <Trophy className="w-5 h-5" /> You found every word!
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-0.5 mx-auto w-max select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
        >
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r},${c}`;
              const found = foundKeys.has(key);
              const isStart = start && start.r === r && start.c === c;
              return (
                <button
                  key={key}
                  onClick={() => handleCell(r, c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-bold uppercase rounded transition ${
                    found
                      ? 'bg-green-500 text-white'
                      : isStart
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {targetWords.map((w) => (
          <span
            key={w}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              foundWords.has(w) ? 'bg-green-100 text-green-700 line-through' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      {puzzle.unplaced.length > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          {puzzle.unplaced.length} word(s) were too long for the grid and left out.
        </p>
      )}
    </div>
  );
}
