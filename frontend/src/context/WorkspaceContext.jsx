import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { contextAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Tian OS role + workspace state for the unified shell.
//   Role     → which features/nav are available.
//   Workspace→ which students/records are visible (enforced server-side).
// The active workspace id is persisted and sent as X-Workspace-Id on every API
// call (see services/api.js), which is how school vs. tutor data stay isolated.
const WorkspaceContext = createContext(null);
const WS_KEY = 'tianos.workspaceId';
const ROLE_KEY = 'tianos.role';

export function WorkspaceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [roles, setRoles] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(localStorage.getItem(WS_KEY) || null);
  const [activeRole, setActiveRole] = useState(localStorage.getItem(ROLE_KEY) || null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const { data } = await contextAPI.get();
      const resolvedRoles = data.user?.roles?.length ? data.user.roles : (data.user?.role ? [data.user.role] : ['student']);
      setRoles(resolvedRoles);
      setWorkspaces(data.workspaces || []);
      // Choose an active workspace: persisted (if still valid) → default → first.
      const valid = (data.workspaces || []).map((w) => String(w.id));
      const wsId = (activeWorkspaceId && valid.includes(String(activeWorkspaceId)))
        ? activeWorkspaceId
        : (data.defaultWorkspaceId || (data.workspaces[0] && data.workspaces[0].id) || null);
      applyWorkspace(wsId, data.workspaces || [], resolvedRoles);
    } catch (err) {
      // Graceful fallback (e.g. backend not seeded yet): derive from the user
      // object so the shell still renders in development.
      const fallbackRoles = user?.roles?.length ? user.roles : (user?.role ? [user.role] : ['student']);
      setRoles(fallbackRoles);
      setWorkspaces([]);
      setActiveRole((prev) => prev || fallbackRoles[0]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function resolveRoleForWorkspace(wsRole, candidateRoles) {
    if (wsRole && candidateRoles.includes(wsRole)) return wsRole;
    if (activeRole && candidateRoles.includes(activeRole)) return activeRole;
    return candidateRoles[0] || 'student';
  }

  function applyWorkspace(wsId, wsList, candidateRoles = roles) {
    const ws = (wsList || workspaces).find((w) => String(w.id) === String(wsId));
    setActiveWorkspaceId(wsId || null);
    if (wsId) localStorage.setItem(WS_KEY, wsId); else localStorage.removeItem(WS_KEY);
    const nextRole = resolveRoleForWorkspace(ws?.role, candidateRoles || ['student']);
    setActiveRole(nextRole);
    localStorage.setItem(ROLE_KEY, nextRole);
  }

  const switchWorkspace = useCallback(async (workspaceId) => {
    try { await contextAPI.switch(workspaceId); } catch (_) { /* still apply locally */ }
    applyWorkspace(workspaceId, workspaces, roles);
  }, [workspaces]);

  // Switching role jumps to the first workspace matching that role.
  const switchRole = useCallback((role) => {
    const ws = workspaces.find((w) => w.role === role);
    if (ws) { switchWorkspace(ws.id); }
    else { setActiveRole(role); localStorage.setItem(ROLE_KEY, role); }
  }, [workspaces, switchWorkspace]);

  const activeWorkspace = workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || null;
  const effectiveRole = activeRole || activeWorkspace?.role || roles[0] || 'student';

  const value = {
    loading, roles, workspaces, activeWorkspace, activeWorkspaceId,
    role: effectiveRole, switchWorkspace, switchRole,
    hasMultipleRoles: roles.length > 1,
    hasMultipleWorkspaces: workspaces.length > 1,
    reload: load,
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
