import React from 'react';

export default function SolveGuessTable({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const columns = expected.columns || ['Guess', 'Check', 'Result'];
  const maxGuesses = expected.maxGuesses || 5;

  const guesses = response?.guesses || [{}];
  const answer = response?.answer ?? '';

  const handleCellChange = (rowIdx, colIdx, val) => {
    const next = guesses.map((row, i) => {
      if (i !== rowIdx) return row;
      return { ...row, [colIdx]: val };
    });
    onChange({ guesses: next, answer });
  };

  const addRow = () => {
    if (guesses.length < maxGuesses) {
      onChange({ guesses: [...guesses, {}], answer });
    }
  };

  const handleAnswerChange = (val) => {
    onChange({ guesses, answer: val });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Make guesses and check each one. Adjust your guess based on the result.
      </p>

      <div className="overflow-x-auto rounded-xl border border-ink-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50">
              <th className="w-10 px-2 py-2 text-center text-xs font-medium text-ink-400">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-ink-600">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guesses.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t border-ink-100">
                <td className="px-2 py-1.5 text-center text-xs font-bold text-ink-400">
                  {rowIdx + 1}
                </td>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-1 py-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row[colIdx] ?? ''}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      className="w-full rounded border border-ink-200 px-2 py-1.5 text-sm"
                      placeholder={colIdx === 0 ? 'Your guess' : ''}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guesses.length < maxGuesses && (
        <button
          onClick={addRow}
          className="rounded-lg border border-dashed border-ink-300 px-4 py-2 text-sm text-ink-500 hover:border-ink-400 hover:text-ink-600"
        >
          + Add another guess
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border-2 border-coral-200 bg-coral-50 p-3">
        <span className="text-sm font-semibold text-coral-700">Answer =</span>
        <input
          type="number"
          inputMode="decimal"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full sm:w-28 min-h-[44px] rounded-lg border border-coral-300 px-3 py-2 text-sm font-bold text-coral-800"
          placeholder="?"
        />
      </div>
    </div>
  );
}
