// ELPath Comprehension Cloze — client-side progress store with optional server sync.
// When a user is logged in, state is persisted to the server via elpathAPI;
// localStorage remains the immediate cache and offline fallback.
import { initClozeState } from '../../../../../shared/englishpath/cloze/index.js';
import { elpathAPI } from '../../../services/api';

const STORAGE_KEY = 'tianos.englishpath.cloze.v1';

function keyFor(studentId) {
  return studentId ? `${STORAGE_KEY}.${studentId}` : STORAGE_KEY;
}

function readLocal(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(studentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.passages !== 'object') return null;
    return { passages: parsed.passages };
  } catch (_) {
    return null;
  }
}

function writeLocal(studentId, state) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(keyFor(studentId), JSON.stringify(state));
  } catch (_) {
    /* quota / serialization issues are non-fatal for practice */
  }
}

function isLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export async function loadClozeState(studentId) {
  const local = readLocal(studentId);
  if (isLoggedIn()) {
    try {
      const { data } = await elpathAPI.getProgress('cloze');
      if (data.state) {
        writeLocal(studentId, data.state);
        return data.state;
      }
      if (local) {
        elpathAPI.saveProgress('cloze', local).catch(() => {});
        return local;
      }
    } catch (_) {
      // server unreachable — fall through to local
    }
  }
  return local || initClozeState();
}

export function loadClozeStateSync(studentId) {
  return readLocal(studentId) || initClozeState();
}

export function saveClozeState(studentId, state) {
  writeLocal(studentId, state);
  if (isLoggedIn()) {
    elpathAPI.saveProgress('cloze', state).catch(() => {});
  }
}

export function resetClozeState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(keyFor(studentId));
  } catch (_) {
    /* ignore */
  }
  if (isLoggedIn()) {
    elpathAPI.saveProgress('cloze', null).catch(() => {});
  }
}

const LEVEL_KEY = 'tianos.englishpath.cloze.level';
export function loadClozeLevel(studentId, fallback = 'P6') {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    return window.localStorage.getItem(`${LEVEL_KEY}.${studentId || ''}`) || fallback;
  } catch (_) {
    return fallback;
  }
}

export function saveClozeLevel(studentId, level) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(`${LEVEL_KEY}.${studentId || ''}`, level);
  } catch (_) {
    /* ignore */
  }
}
