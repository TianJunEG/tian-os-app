import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Shared header + tabs for the tutor's per-student screens.
export default function TutorStudentNav({ studentId, name, level }) {
  const navigate = useNavigate();
  const base = `/tutor/students/${studentId}`;
  const tabs = [
    ['Profile', base],
    ['MathPath', `${base}/mathpath`],
    ['PSL', `${base}/psl`],
    ['Lesson prep', `${base}/lesson-prep`],
    ['Mistakes', `${base}/mistakes`],
    ['Lesson notes', `${base}/lesson-notes`],
    ['Rewards', `${base}/rewards`],
    ['Record', `${base}/record`],
    ['Assign homework', `${base}/assign-homework`],
  ];
  return (
    <div className="mb-5">
      <button onClick={() => navigate('/tutor/students')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Students
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
