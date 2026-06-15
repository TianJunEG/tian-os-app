import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FEATURE_FLAGS } from '../../config/featureFlags';

// Shared header + tabs for the teacher's per-class screens.
export default function ClassNav({ classId, name, level }) {
  const navigate = useNavigate();
  const base = `/teacher/classes/${classId}`;
  const tabs = [
    ['Overview', base],
    ['MathPath', `${base}/mathpath`],
    FEATURE_FLAGS.psl && ['Problem Solving', `${base}/psl`],
    ['Mastery map', `${base}/mastery`],
    ['Students', `${base}/students`],
    ['Groups', `${base}/groups`],
    ['Weak groups', `${base}/weak-groups`],
    ['Assign', `${base}/assign`],
    ['Assessments', `${base}/assessments`],
    ['Intervention', `${base}/interventions`],
    ['Worksheets', `${base}/worksheets`],
    FEATURE_FLAGS.lifelab && ['LifeLab', `${base}/lifelab`],
    ['Reports', `${base}/reports`],
  ].filter(Boolean);
  return (
    <div className="mb-5">
      <button onClick={() => navigate('/teacher/classes')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Classes
      </button>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">{name}</h1>
      {level && <p className="mt-0.5 text-sm text-ink-500">{level}</p>}
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-line-soft">
        {tabs.map(([label, to]) => (
          <NavLink key={to} to={to} end
            className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-emerald-deep text-emerald-deep' : 'border-transparent text-ink-500 hover:text-emerald-deep'}`}>
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
