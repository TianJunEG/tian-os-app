import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function PrerequisiteGate({ blockers = [] }) {
  if (!blockers.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Prerequisites needed</p>
          <p className="mt-1 text-sm text-amber-600">
            Master these skills first before starting this problem-solving practice:
          </p>
          <ul className="mt-2 space-y-1">
            {blockers.map((b) => (
              <li key={b.code} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="font-medium">{b.name}</span>
                <span className="text-xs text-ink-400">
                  ({b.type === 'mathpath' ? 'MathPath' : 'PSL'} — {b.score || 0}%)
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/student/mathpath"
            className="mt-3 inline-block rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
          >
            Go to MathPath
          </Link>
        </div>
      </div>
    </div>
  );
}
