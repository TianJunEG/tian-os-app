import { useEffect, useState } from 'react';
import { tutorAPI } from '../../services/api';

// Light student meta (name/level) for the tutor's per-student screen headers.
// Backward-compatible: the returned object still carries the student fields
// (name/level/…) so existing `meta?.name` / `meta?.level` consumers keep working.
// Additionally exposes `loading` and `error` for callers that want to surface
// fetch/lookup state. `error` distinguishes a failed request ('fetch') from a
// successful request where the student simply wasn't found ('not_found').
export function useTutorStudent(studentId) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    tutorAPI.students()
      .then((r) => {
        if (!alive) return;
        const found = (r.data.students || []).find((s) => String(s.studentId) === String(studentId)) || null;
        setMeta(found);
        if (!found) setError('not_found');
      })
      .catch((e) => {
        console.warn("useTutorStudent: fetch failed", e);
        if (!alive) return;
        setMeta(null);
        setError('fetch');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [studentId]);

  // Spread the student fields (name/level/…) onto the returned object so the
  // legacy `meta?.name` shape is preserved, and attach the new loading/error.
  return { ...(meta || {}), loading, error };
}
