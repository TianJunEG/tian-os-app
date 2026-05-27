import { useEffect, useState } from 'react';
import { teacherAPI } from '../../services/api';

// Resolve a class's name/level for the per-class screen headers.
export function useClass(classId) {
  const [klass, setKlass] = useState(null);
  useEffect(() => {
    let alive = true;
    teacherAPI.classes()
      .then((r) => { if (alive) setKlass((r.data.classes || []).find((c) => String(c.classId) === String(classId)) || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [classId]);
  return klass;
}
