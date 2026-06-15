import React from 'react';

export default function PlanTableSetup({ scaffoldStep, response, onChange }) {
  const expected = scaffoldStep?.expectedResponse || {};
  const columns = expected.columns || ['Position', 'Value'];
  const knownRows = expected.knownRows || [];

  const selectedColumns = response?.columns || [];

  const toggleColumn = (col) => {
    const next = selectedColumns.includes(col)
      ? selectedColumns.filter((c) => c !== col)
      : [...selectedColumns, col];
    onChange({ columns: next });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        Set up a table to find the pattern. Which columns do you need?
      </p>

      <div className="flex flex-wrap gap-2">
        {columns.map((col) => {
          const active = selectedColumns.includes(col);
          return (
            <button
              key={col}
              onClick={() => toggleColumn(col)}
              className={`rounded-lg border-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium transition-all ${
                active
                  ? 'border-teal-400 bg-emerald-tint text-emerald-deep'
                  : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
              }`}
            >
              {col}
            </button>
          );
        })}
      </div>

      {knownRows.length > 0 && (
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Known values
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  {columns.map((col) => (
                    <th key={col} className="px-2 sm:px-3 py-1 text-left font-medium text-ink-500 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {knownRows.map((row, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-0">
                    {columns.map((col, j) => (
                      <td key={j} className="px-2 sm:px-3 py-1 text-ink-700">
                        {row[j] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-400">
        Select {expected.requiredCount || columns.length} column{(expected.requiredCount || columns.length) > 1 ? 's' : ''} to continue.
      </p>
    </div>
  );
}
