import React from 'react';

export default function SolveFindRule({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const columns = expected.columns || ['Position', 'Value'];
  const knownRows = expected.knownRows || [];
  const targetPosition = expected.targetPosition;

  const filledRows = response?.rows || [];
  const rule = response?.rule || '';
  const answer = response?.answer ?? '';

  const handleRowChange = (rowIdx, colIdx, val) => {
    const nextRows = [...filledRows];
    if (!nextRows[rowIdx]) nextRows[rowIdx] = [];
    nextRows[rowIdx] = [...(nextRows[rowIdx] || [])];
    nextRows[rowIdx][colIdx] = val;
    onChange({ rows: nextRows, rule, answer });
  };

  const handleRuleChange = (val) => {
    onChange({ rows: filledRows, rule: val, answer });
  };

  const handleAnswerChange = (val) => {
    onChange({ rows: filledRows, rule, answer: val });
  };

  const totalRows = Math.max(knownRows.length + 2, 5);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Complete the table, find the pattern rule, and answer the question.
      </p>

      <div className="overflow-x-auto rounded-xl border border-ink-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50">
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-ink-600">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRows }).map((_, rowIdx) => {
              const known = knownRows[rowIdx];
              return (
                <tr key={rowIdx} className="border-t border-ink-100">
                  {columns.map((_, colIdx) => {
                    const knownVal = known?.[colIdx];
                    if (knownVal !== undefined && knownVal !== null) {
                      return (
                        <td key={colIdx} className="px-3 py-1.5 text-ink-700 font-medium">
                          {knownVal}
                        </td>
                      );
                    }
                    return (
                      <td key={colIdx} className="px-1 py-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={filledRows[rowIdx]?.[colIdx] ?? ''}
                          onChange={(e) => handleRowChange(rowIdx, colIdx, e.target.value)}
                          className="w-full rounded border border-ink-200 px-2 py-1 text-sm"
                          placeholder="?"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600">
            Pattern rule (describe in words or formula):
          </label>
          <input
            type="text"
            value={rule}
            onChange={(e) => handleRuleChange(e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            placeholder='e.g. "add 3 each time" or "3n + 1"'
          />
        </div>

        {targetPosition !== undefined && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border-2 border-teal-200 bg-teal-50 p-3">
            <span className="text-sm font-semibold text-teal-700">
              Value at position {targetPosition} =
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="w-full sm:w-28 min-h-[44px] rounded-lg border border-teal-300 px-3 py-2 text-sm font-bold text-teal-800"
              placeholder="?"
            />
          </div>
        )}
      </div>
    </div>
  );
}
