import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { FEATURE_FLAGS } from '../../config/featureFlags';

// Shared header + tabs for the teacher's per-class screens.
//
// The class workspace has up to 13 destinations, which used to live in one
// horizontally-scrolling strip — trailing tabs silently scrolled off-screen on
// iPad/phone. We now surface the five everyday tabs and tuck the rest under a
// "More" overflow menu (mirroring the AppShell mobile-nav pattern), so the
// whole workspace stays reachable without sideways scrolling.
export default function ClassNav({ classId, name, level }) {
  const navigate = useNavigate();
  const location = useLocation();
  const base = `/teacher/classes/${classId}`;

  const primaryTabs = [
    ['Overview', base],
    ['MathPath', `${base}/mathpath`],
    ['Students', `${base}/students`],
    ['Corrections', `${base}/corrections`],
    ['Assign work', `${base}/assign`],
    ['Tests', `${base}/assessments`],
  ];
  const moreTabs = [
    FEATURE_FLAGS.psl && ['Problem Solving', `${base}/psl`],
    ['Quick Mark', `${base}/quickmark`],
    ['Class check-in', `${base}/kiosk`],
    ['Mastery map', `${base}/mastery`],
    ['Groups', `${base}/groups`],
    ['Weak groups', `${base}/weak-groups`],
    ['Intervention', `${base}/interventions`],
    ['Worksheets', `${base}/worksheets`],
    ['Reports', `${base}/reports`],
    FEATURE_FLAGS.lifelab && ['LifeLab', `${base}/lifelab`],
  ].filter(Boolean);

  const [moreOpen, setMoreOpen] = React.useState(false);
  const moreRef = React.useRef(null);
  // Close the menu on navigation or an outside tap (same as AppShell's More).
  React.useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  React.useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointer = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [moreOpen]);

  // Keep the More trigger highlighted while the active route lives inside it, so
  // the selected-tab indicator never disappears on a demoted screen.
  const moreActive = moreTabs.some(([, to]) => location.pathname === to || location.pathname.startsWith(`${to}/`));

  const tabClass = (isActive) => `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${isActive ? 'border-emerald-deep text-emerald-deep' : 'border-transparent text-ink-500 hover:text-emerald-deep'}`;

  return (
    <div className="mb-5">
      <button onClick={() => navigate('/teacher/classes')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> Classes
      </button>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-deep">{name}</h1>
      {level && <p className="mt-0.5 text-sm text-ink-500">{level}</p>}
      <div className="mt-4 flex items-center gap-1 border-b border-line-soft">
        {/* Primary tabs scroll only as a last resort (5 items rarely overflow);
            the More menu sits outside this scroller so its dropdown is never clipped. */}
        <div className="flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {primaryTabs.map(([label, to]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => tabClass(isActive)}>
              {label}
            </NavLink>
          ))}
        </div>
        <div ref={moreRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={`inline-flex items-center gap-1 ${tabClass(moreActive)}`}
          >
            More <MoreHorizontal className="h-4 w-4" />
          </button>
          {moreOpen && (
            <div role="menu" className="absolute right-0 top-full z-40 mt-1 min-w-44 overflow-hidden rounded-dash border border-line-soft bg-white shadow-card">
              {moreTabs.map(([label, to]) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => `block px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-emerald-tint text-emerald-deep' : 'text-ink-500 hover:bg-line-soft hover:text-emerald-deep'}`}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
