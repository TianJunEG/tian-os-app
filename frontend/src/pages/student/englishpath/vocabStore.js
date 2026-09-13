// ELPath Vocabulary — client-side progress store with optional server sync.
// When a user is logged in, state is persisted to the server via elpathAPI;
// localStorage remains the immediate cache and offline fallback.
import { initState } from '../../../../../shared/englishpath/vocabulary/index.js';
import { elpathAPI } from '../../../services/api';

const STORAGE_KEY = 'tianos.englishpath.vocab.v1';

function keyFor(studentId) {
  return studentId ? `${STORAGE_KEY}.${studentId}` : STORAGE_KEY;
}

function readLocal(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(studentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.words) return null;
    return { ...initState(parsed.config), words: parsed.words };
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

export async function loadVocabState(studentId) {
  const local = readLocal(studentId);
  if (isLoggedIn()) {
    try {
      const { data } = await elpathAPI.getProgress('vocab');
      if (data.state) {
        writeLocal(studentId, data.state);
        return data.state;
      }
      if (local) {
        elpathAPI.saveProgress('vocab', local).catch(() => {});
        return local;
      }
    } catch (_) {
      // server unreachable — fall through to local
    }
  }
  return local || initState();
}

export function loadVocabStateSync(studentId) {
  return readLocal(studentId) || initState();
}

export function saveVocabState(studentId, state) {
  writeLocal(studentId, state);
  if (isLoggedIn()) {
    elpathAPI.saveProgress('vocab', state).catch(() => {});
  }
}

export function resetVocabState(studentId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(keyFor(studentId));
  } catch (_) {
    /* ignore */
  }
  if (isLoggedIn()) {
    elpathAPI.saveProgress('vocab', null).catch(() => {});
  }
}
