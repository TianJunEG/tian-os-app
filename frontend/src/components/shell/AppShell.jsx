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

function LogoTile() {
  return (
    <span
      className="grid h-8 w-8 place-items-center rounded-chip font-mono text-sm font-extrabold text-white"
      style={{ background: 'linear-gradient(150deg, #e3a64f, #d2812c)', boxShadow: '0 2px 6px rgba(210,129,44,0.4)' }}
    >T</span>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoTile />
      <span className="font-sans text-[18px] font-extrabold text-ink">Tian<span className="text-gold">OS</span></span>
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
        className="flex items-center gap-2 rounded-btn border border-line-soft bg-surface-white px-3 py-2 text-sm font-semibold text-ink hover:bg-line-soft">
        <span className="max-w-[10rem] truncate">{activeWorkspace?.name || 'Workspace'}</span>
        {hasMultipleWorkspaces && <ChevronDown className="h-4 w-4 text-body-faint" />}
      </button>
      {open && hasMultipleWorkspaces && (
        <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-shell border border-line bg-surface-white shadow-card">
          {workspaces.map((w) => (
            <button key={w.id} onClick={() => { switchWorkspace(w.id); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-raised">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{w.name}</span>
                <span className="block text-xs uppercase tracking-wide text-body-muted">{w.role} · {w.type}</span>
              </span>
              {String(w.id) === String(activeWorkspace?.id) && <Check className="h-4 w-4 text-emerald" />}
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
    <div className="flex rounded-btn border border-line bg-surface-white p-0.5">
      {roles.map((r) => (
        <button key={r} onClick={() => switchRole(r)}
          className={`rounded-chip px-3 py-1.5 text-xs font-semibold capitalize transition ${role === r ? 'bg-ink text-dark-text' : 'text-body-muted hover:text-ink'}`}>
          {r}
        </button>
      ))}
    </div>
  );
}

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
      .catch((e) => console.warn('AppShell: notification refresh failed', e));
    refresh();
    const t = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(t); };
  }, [location.pathname]);

  return (
    <button onClick={() => navigate('/parent/notifications')} aria-label="Notifications"
      className="relative flex items-center rounded-btn px-2.5 py-2 text-body-muted hover:bg-line hover:text-ink">
      <Bell className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-white">
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
  const shellBg = isStudentShell ? visualStyles.shell : 'bg-surface-app';
  const headerClass = isStudentShell ? visualStyles.header : 'border-line-soft bg-surface-white/95';
  const activeNavClass = isStudentShell ? visualStyles.navActive : 'bg-line-soft text-ink';
  const idleNavClass = isStudentShell ? visualStyles.navIdle : 'text-body-muted hover:bg-line hover:text-body';

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="min-h-screen bg-surface-app"><Spinner /></div>;

  return (
    <div className={`min-h-screen font-sans text-ink ${shellBg}`}>
      <div>
        <header
          className={`sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6 ${headerClass}`}
          style={{ height: isStudentShell ? 'var(--nav-h)' : 'var(--nav-h-staff)' }}
        >
          <div><Wordmark /></div>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
            {set.sidebar.map((entry) => (
              entry.items ? null : (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  end={entry.end !== false}
                  className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold transition ${isActive ? activeNavClass : idleNavClass}`}
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
            <button onClick={handleLogout} className="hidden items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold text-body-muted hover:bg-line md:flex">
              <LogOut className="h-[17px] w-[17px]" />Sign out
            </button>
          </div>
        </header>
        <main className={`mx-auto px-4 pb-20 pt-5 sm:px-6 md:pb-10 ${activityShell ? 'max-w-[96rem]' : 'max-w-app'}`}>{children}</main>
      </div>
      {!activityShell && (
        <nav className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-dash border px-2 shadow-card backdrop-blur md:hidden ${isStudentShell ? 'border-white/80 bg-white/90' : 'border-line bg-surface-white/90'}`}
          style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {set.bottom.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end !== false}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-shell py-2 transition ${isActive ? activeNavClass : 'text-body-faint'}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
