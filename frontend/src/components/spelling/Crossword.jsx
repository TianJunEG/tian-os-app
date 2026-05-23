import React, { useMemo, useRef, useState } from 'react';
import { RotateCcw, Eye, CheckCircle2 } from 'lucide-react';
import { generateCrossword } from '../../utils/spellingGames';
import { playWin } from '../../utils/sound';
import { confettiBurst } from '../../utils/confetti';

// Builds a connected crossword from the list. Clues prefer the definition, then
// the example sentence with the answer blanked out.
const clueFor = (entry) => {
  if (entry.definition) return entry.definition;
  if (entry.sentence) {
    const re = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'ig');
    return entry.sentence.replace(re, '_____');
  }
  return `${entry.word.length} letters`;
};

export default function Crossword({ words, onAttempt }) {
  const [seed, setSeed] = useState(0);
  const puzzle = useMemo(
    () => generateCrossword(words.map((w) => ({ word: w.word, clue: clueFor(w) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, seed]
  );

  const [entries, setEntries] = useState({}); // "r,c" -> char
  const [dir, setDir] = useState('across');
  const [checked, setChecked] = useState(false);
  const inputs = useRef({});

  const key = (r, c) => `${r},${c}`;
  const cellAt = (r, c) => (puzzle.cells[r] ? puzzle.cells[r][c] : null);

  const focusCell = (r, c) => inputs.current[key(r, c)]?.focus();

  const advance = (r, c) => {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
    const nr = r + dr;
    const nc = c + dc;
    if (cellAt(nr, nc)) focusCell(nr, nc);
  };

  const handleType = (r, c, value) => {
    const ch = value.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
    setEntries((e) => ({ ...e, [key(r, c)]: ch }));
    setChecked(false);
    if (ch) advance(r, c);
  };

  const handleKey = (r, c, e) => {
    if (e.key === 'Backspace' && !entries[key(r, c)]) {
      const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0];
      if (cellAt(r - dr, c - dc)) focusCell(r - dr, c - dc);
    } else if (e.key === 'ArrowRight') focusCell(r, c + 1);
    else if (e.key === 'ArrowLeft') focusCell(r, c - 1);
    else if (e.key === 'ArrowUp') focusCell(r - 1, c);
    else if (e.key === 'ArrowDown') focusCell(r + 1, c);
  };

  const check = () => {
    setChecked(true);
    let solved = true;
    [...puzzle.across, ...puzzle.down].forEach((entry) => {
      const isAcross = puzzle.across.includes(entry);
      let correct = true;
      for (let i = 0; i < entry.word.length; i++) {
        const r = entry.row + (isAcross ? 0 : i);
        const c = entry.col + (isAcross ? i : 0);
        if ((entries[key(r, c)] || '') !== entry.word[i]) correct = false;
      }
      if (!correct) solved = false;
      onAttempt?.(entry.word, correct);
    });
    if (solved) {
      playWin();
      confettiBurst();
    }
  };

  const reveal = () => {
    const filled = {};
    puzzle.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell) filled[key(r, c)] = cell.solution;
      })
    );
    setEntries(filled);
    setChecked(true);
  };

  const reset = () => {
    setEntries({});
    setChecked(false);
    setSeed((s) => s + 1);
  };

  if (!puzzle.rows) {
    return <p className="text-center text-gray-500 py-8">Add a few more words to build a crossword.</p>;
  }

  const ClueList = ({ title, list, direction }) => (
    <div>
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <ol className="space-y-1 text-sm">
        {list.map((entry) => (
          <li key={`${direction}-${entry.number}`}>
            <button
              onClick={() => {
                setDir(direction);
                focusCell(entry.row, entry.col);
              }}
              className="text-left text-gray-600 hover:text-purple-600"
            >
              <span className="font-semibold text-gray-800">{entry.number}.</span> {entry.clue}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {['across', 'down'].map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={`px-3 py-1.5 capitalize ${dir === d ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-sm">
          <button onClick={reveal} className="text-gray-500 hover:underline inline-flex items-center gap-1">
            <Eye className="w-4 h-4" /> Reveal
          </button>
          <button onClick={reset} className="text-purple-600 hover:underline inline-flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="overflow-x-auto">
          <div
            className="grid gap-0.5 w-max bg-gray-300 p-0.5 rounded select-none"
            style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` }}
          >
            {puzzle.cells.map((row, r) =>
              row.map((cell, c) => {
                if (!cell) return <div key={key(r, c)} className="w-8 h-8 bg-gray-800" />;
                const val = entries[key(r, c)] || '';
                const wrong = checked && val && val !== cell.solution;
                const right = checked && val === cell.solution;
                return (
                  <div key={key(r, c)} className="relative w-8 h-8">
                    {cell.number && (
                      <span className="absolute top-0 left-0.5 text-[8px] leading-none text-gray-500 z-10">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => (inputs.current[key(r, c)] = el)}
                      value={val}
                      onChange={(e) => handleType(r, c, e.target.value)}
                      onKeyDown={(e) => handleKey(r, c, e)}
                      onFocus={(e) => e.target.select()}
                      maxLength={1}
                      autoComplete="off"
                      spellCheck={false}
                      className={`w-8 h-8 text-center text-sm font-bold uppercase outline-none rounded-sm ${
                        wrong ? 'bg-red-100 text-red-700' : right ? 'bg-green-100 text-green-700' : 'bg-white text-gray-800 focus:bg-purple-100'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
          <button
            onClick={check}
            className="mt-4 w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Check
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-6 lg:block lg:space-y-4">
          <ClueList title="Across" list={puzzle.across} direction="across" />
          <ClueList title="Down" list={puzzle.down} direction="down" />
        </div>
      </div>

      {puzzle.unplaced.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          {puzzle.unplaced.length} word(s) could not be linked into the grid.
        </p>
      )}
    </div>
  );
}
