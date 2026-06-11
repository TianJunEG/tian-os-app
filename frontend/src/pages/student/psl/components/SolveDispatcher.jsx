import React from 'react';
import SolvePanel from './SolvePanel';
import SolveReverseChain from './SolveReverseChain';
import SolveFindRule from './SolveFindRule';
import SolveGuessTable from './SolveGuessTable';
import SolveListCheck from './SolveListCheck';
import SolveEliminate from './SolveEliminate';

function PlaceholderSolve({ type, response, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Solve step: <strong>{type.replace(/_/g, ' ')}</strong>
      </p>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-ink-600">Answer:</label>
        <input
          type="number"
          inputMode="decimal"
          value={response?.answer ?? ''}
          onChange={(e) => onChange({ answer: e.target.value })}
          className="w-32 rounded-lg border border-ink-200 px-3 py-2 text-sm"
          placeholder="Your answer"
        />
      </div>
    </div>
  );
}

export default function SolveDispatcher({ type, twoStep, response, onChange, scaffoldStep }) {
  const solveType = type || scaffoldStep?.type || (twoStep ? 'twoStep' : 'expression');

  if (solveType === 'expression' || solveType === 'twoStep') {
    return (
      <SolvePanel
        twoStep={solveType === 'twoStep'}
        value={response || {}}
        onChange={onChange}
      />
    );
  }

  if (solveType === 'reverse_chain') {
    return <SolveReverseChain scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (solveType === 'find_rule') {
    return <SolveFindRule scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (solveType === 'guess_table') {
    return <SolveGuessTable scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (solveType === 'list_check') {
    return <SolveListCheck scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (solveType === 'eliminate') {
    return <SolveEliminate scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  return <PlaceholderSolve type={solveType} response={response} onChange={onChange} />;
}
