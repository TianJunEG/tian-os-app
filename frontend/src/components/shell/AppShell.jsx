import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Check, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NAV } from '../../config/nav';
import { notificationsAPI } from '../../services/api';
import { Spinner } from '../ui';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../design-os/studentVisualMode';

// The single Tian OS shell every role-dashboard renders inside:
//   desktop/tablet → top navigation
//   mobile         → topbar + floating bottom nav
// Nav items come from one role-keyed config; the topbar holds the workspace
// switcher (data scope) and, for multi-role users, a role switcher (features).

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg font-mono text-sm font-extrabold text-navy-900"
        style={{ background: 'radial-gradient(circle at 30% 30%, #ffe8a0, #C9A23C 60%, #a8852b)' }}>T</span>
      <span className="font-display text-lg font-semibold text-navy-700">Tian<span className="text-gold-500">OS</span></span>
    </span>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, hasMultipleWorkspaces, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  if (!activeWorkspace && !hasMultipleWorkspaces) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-hairline bg-paper px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
        <span className="max-w-[10rem] truncate">{activeWorkspace?.name || 'Workspace'}</span>
        {hasMultipleWorkspaces && <ChevronDown className="h-4 w-4 text-ink-300" />}
      </button>
      {open && hasMultipleWorkspaces && (
        <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border border-hairline bg-paper shadow-active">
          {workspaces.map((w) => (
            <button key={w.id} onClick={() => { switchWorkspace(w.id); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-navy-50">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-700">{w.name}</span>
                <span className="block text-xs uppercase tracking-wide text-ink-300">{w.role} · {w.type}</span>
              </span>
              {String(w.id) === String(activeWorkspace?.id) && <Check className="h-4 w-4 text-success-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleSwitcher() {
  const { roles, role, hasMultipleRoles, switchRole } = useWorkspace();
  if (!hasMultipleRoles) return null;
  return (
    <div className="flex rounded-xl border border-hairline bg-paper p-0.5">
      {roles.map((r) => (
        <button key={r} onClick={() => switchRole(r)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${role === r ? 'bg-navy-700 text-white' : 'text-ink-500 hover:text-navy-700'}`}>
          {r}
        </button>
      ))}
    </div>
  );
}

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-navy-50 text-navy-700' : 'text-ink-500 hover:bg-navy-50 hover:text-navy-700'}`;

// In-app notification bell with unread badge. Polls on mount, on route change,
// and every 60s. Links to the parent feed.
function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () => notificationsAPI.unreadCount()
      .then((r) => { if (active) setCount(r.data.count || 0); })
      .catch(() => {});
    refresh();
    const t = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(t); };
  }, [location.pathname]);

  return (
    <button onClick={() => navigate('/parent/notifications')} aria-label="Notifications"
      className="relative flex items-center rounded-lg px-2.5 py-2 text-ink-500 hover:bg-navy-50 hover:text-navy-700">
      <Bell className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold leading-[18px] text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default function AppShell({ children }) {
  const { loading, role } = useWorkspace();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const set = NAV[role] || NAV.student;
  const activityShell = /^\/student\/mathpath\/(?:diagnostic\/session|practice\/|assessment\/session|fractions\/similar-practice)|^\/student\/psl\/session\//.test(location.pathname);
  const isStudentShell = role === 'student' || location.pathname.startsWith('/student');
  const visualMode = resolveStudentVisualMode(user || {});
  const visualStyles = getVisualModeStyles(visualMode);
  const shellBg = isStudentShell ? visualStyles.shell : 'bg-ivory';
  const headerClass = isStudentShell ? visualStyles.header : 'border-hairline bg-paper/90';
  const activeNavClass = isStudentShell ? visualStyles.navActive : 'bg-navy-50 text-navy-700';
  const idleNavClass = isStudentShell ? visualStyles.navIdle : 'text-ink-500 hover:bg-navy-50 hover:text-navy-700';

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="min-h-screen bg-ivory"><Spinner /></div>;

  return (
    <div className={`min-h-screen font-ui text-ink-700 ${shellBg}`}>
      {/* Main column */}
      <div>
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6 ${headerClass}`}>
          <div><Wordmark /></div>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
            {set.sidebar.map((entry) => (
              entry.items ? null : (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  end={entry.end !== false}
                  className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? activeNavClass : idleNavClass}`}
                >
                  <entry.icon className="h-[17px] w-[17px]" />{entry.label}
                </NavLink>
              )
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {role === 'parent' && <NotificationBell />}
            <RoleSwitcher />
            <WorkspaceSwitcher />
            <button onClick={handleLogout} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-navy-50 md:flex">
              <LogOut className="h-[17px] w-[17px]" />Sign out
            </button>
          </div>
        </header>

        <main className={`mx-auto px-4 pb-28 pt-6 sm:px-6 md:pb-10 ${activityShell ? 'max-w-[96rem]' : 'max-w-6xl'}`}>{children}</main>
      </div>

      {/* Bottom nav — mobile (hidden during immersive activities) */}
      {!activityShell && (
        <nav className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl border px-2 shadow-active backdrop-blur md:hidden ${isStudentShell ? 'border-white/80 bg-white/90' : 'border-hairline bg-paper/90'}`}
          style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {set.bottom.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end !== false}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition ${isActive ? activeNavClass : 'text-ink-300'}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
