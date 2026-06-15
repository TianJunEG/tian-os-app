import { useEffect, useState } from 'react';
import { familyAPI } from '../../services/api';

// Resolve one child (name/level/summary) from the parent's children list.
export function useChild(studentId) {
  const [child, setChild] = useState(null);
  useEffect(() => {
    let alive = true;
    familyAPI.children()
      .then((r) => { if (alive) setChild((r.data.children || []).find((c) => String(c.studentId) === String(studentId)) || null); })
      .catch((e) => console.warn("useChild: fetch failed", e));
    return () => { alive = false; };
  }, [studentId]);
  return child;
}
