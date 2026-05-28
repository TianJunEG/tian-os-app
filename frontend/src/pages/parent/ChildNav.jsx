import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui';

// Shared header + tab strip for the parent's per-child screens. Keeps the child
// context visible and navigation consistent across progress / weak topics /
// actions / mistakes / assignments.
export default function ChildNav({ studentId, name, level, showAssign = true }) {
  const navigate = useNavigate();
  const base = `/parent/children/${studentId}`;
  const tabs = [
    ['Progress', `${base}/progress`],
    ['Weak topics', `${base}/weak-topics`],
    ['Science', `${base}/science`],
    ['LifeLab', `${base}/lifelab`],
    ['Actions', `${base}/actions`],
    ['Mistakes', `${base}/mistakes`],
    ['Assignments', `${base}/assignments`],
  ];
  return (
    <div className="mb-5">
      <button onClick={() => navigate('/parent')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700">
        <ArrowLeft className="h-4 w-4" /> All children
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-700">{name}</h1>
          {level && <p className="mt-0.5 text-sm text-ink-500">{level}</p>}
        </div>
        {showAssign && (
          <Button size="m" icon={BookOpen} to={`${base}/assign-practice`}>Assign practice</Button>
        )}
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-hairline">
        {tabs.map(([label, to]) => (
          <NavLink key={to} to={to} end
            className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-500 hover:text-navy-700'}`}>
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
