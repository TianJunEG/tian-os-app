import axios from 'axios';
import { SERVER_ORIGIN } from './api';

// A SEPARATE axios client for the unauthenticated in-class kiosk. It must NOT use
// the main api.js client, which attaches the logged-in user's Bearer token and
// redirects to /login on 401 — neither of which is right on a logged-out iPad.
const kioskClient = axios.create({
  baseURL: `${SERVER_ORIGIN}/api/kiosk`,
  headers: { 'Content-Type': 'application/json' },
});

// The attempt token authorises one student's attempt. Kept in memory and mirrored
// to sessionStorage so a mid-attempt refresh on the iPad survives.
const TOKEN_KEY = 'tian:kiosk:attemptToken';
let attemptToken = '';

export function setAttemptToken(token) {
  attemptToken = token || '';
  try {
    if (attemptToken) sessionStorage.setItem(TOKEN_KEY, attemptToken);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode — in-memory only */ }
}

export function getAttemptToken() {
  if (attemptToken) return attemptToken;
  try { attemptToken = sessionStorage.getItem(TOKEN_KEY) || ''; } catch { /* ignore */ }
  return attemptToken;
}

export function clearAttempt() { setAttemptToken(''); }

kioskClient.interceptors.request.use((config) => {
  const token = getAttemptToken();
  if (token) config.headers['X-Attempt-Token'] = token;
  return config;
});

// Do NOT redirect on 401 — just reject so the caller can show a "return to teacher"
// message. (The main client redirects to /login, which would be wrong here.)
kioskClient.interceptors.response.use((res) => res, (err) => Promise.reject(err));

export const kioskAPI = {
  getSession: (code) => kioskClient.get(`/sessions/${encodeURIComponent(code)}`),
  begin: (code, ref) => kioskClient.post(`/sessions/${encodeURIComponent(code)}/begin`, { ref }),
  answer: (sessionId, body) => kioskClient.post(`/diagnostics/${sessionId}/answer`, body),
  finish: (sessionId) => kioskClient.post(`/diagnostics/${sessionId}/finish`, {}),
};

export default kioskAPI;
