import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NAV } from '../../config/nav';
import { Spinner } from '../ui';

// The single Tian OS shell every role-dashboard renders inside:
//   desktop/tablet → left sidebar + topbar
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

export default function AppShell({ children }) {
  const { loading, role } = useWorkspace();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const set = NAV[role] || NAV.student;

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="min-h-screen bg-ivory"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-ivory font-ui text-ink-700">
      {/* Sidebar — desktop/tablet */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-hairline bg-paper px-4 py-5 md:flex">
        <div className="px-2"><Wordmark /></div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {set.sidebar.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navItemClass}>
              <item.icon className="h-[18px] w-[18px]" />{item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 hover:bg-navy-50">
          <LogOut className="h-[18px] w-[18px]" />Sign out
        </button>
      </aside>

      {/* Main column */}
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-hairline bg-paper/90 px-4 backdrop-blur sm:px-6">
          <div className="md:hidden"><Wordmark /></div>
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher />
            <WorkspaceSwitcher />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl border border-hairline bg-paper/90 px-2 shadow-active backdrop-blur md:hidden"
        style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {set.bottom.map((item) => (
          <NavLink key={item.to} to={item.to} end
            className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition ${isActive ? 'bg-navy-50 text-navy-700' : 'text-ink-300'}`}>
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
