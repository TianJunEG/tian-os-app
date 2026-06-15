import { useEffect, useState } from 'react';
import { tutorAPI } from '../../services/api';

// Light student meta (name/level) for the tutor's per-student screen headers.
export function useTutorStudent(studentId) {
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    let alive = true;
    tutorAPI.students()
      .then((r) => { if (alive) setMeta((r.data.students || []).find((s) => String(s.studentId) === String(studentId)) || null); })
      .catch((e) => console.warn("useTutorStudent: fetch failed", e));
    return () => { alive = false; };
  }, [studentId]);
  return meta;
}
