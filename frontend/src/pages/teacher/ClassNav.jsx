import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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

  // Overflow discoverability: the tab strip can hold up to 13 tabs, which
  // overflows horizontally on narrow viewports (iPad/phone). Show a right-edge
  // fade + chevron cue when there is more to scroll, and keep the active tab in
  // view so the user can tell hidden tabs exist.
  const scrollerRef = React.useRef(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateOverflow = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px tolerance to avoid sub-pixel rounding leaving the cue stuck on.
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
  }, []);

  React.useEffect(() => {
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateOverflow, { passive: true });
    window.addEventListener('resize', updateOverflow);
    return () => {
      el.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [updateOverflow]);

  // Scroll the active tab into view (and refresh the overflow cue) whenever the
  // tab set changes or the route activates a different tab. NavLink sets
  // aria-current="page" on the active link, which is a reliable selector.
  React.useEffect(() => {
    const active = scrollerRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    updateOverflow();
  }, [tabs.length, updateOverflow]);

  return (
    <div className="mb-5">
      <button onClick={() => navigate('/teacher/classes')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Classes
      </button>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">{name}</h1>
      {level && <p className="mt-0.5 text-sm text-ink-500">{level}</p>}
      <div className="relative mt-4 border-b border-line-soft">
        <div ref={scrollerRef} className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(([label, to]) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-emerald-deep text-emerald-deep' : 'border-transparent text-ink-500 hover:text-emerald-deep'}`}>
              {label}
            </NavLink>
          ))}
        </div>
        {/* Discoverability cue: only shown while more tabs remain to the right,
            so trailing tabs (Assessments, Intervention, Worksheets, Reports)
            don't silently disappear on iPad/phone. Matches the ChildNav fade. */}
        {canScrollRight && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end pr-0.5 bg-gradient-to-l from-white to-transparent">
            <ChevronRight className="h-4 w-4 text-ink-500" />
          </div>
        )}
      </div>
    </div>
  );
}
