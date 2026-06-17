import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { mathpathAPI } from '../../../services/api';
import { Button, Spinner } from '../../../components/ui';
import { buildDecimalsLearningPathView } from '../../../mathpath/decimals/decimalsLearningPathModel';
import DomainSkillMap from './components/DomainSkillMap';

// Decimals is the one enriched domain skill map: alongside the shared themed
// DomainSkillMap it has real diagnostic, fluency (Speed Drill) and assessment
// routes, surfaced via the footerSlot. All status / locking / recommended-next
// logic lives in the pure buildDecimalsLearningPathView() model.
export default function DecimalsLearningPathPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [assessment, setAssessment] = useState(null);

  const startPractice = (skillId) => navigate(`/student/mathpath/decimals/practice?skill=${skillId}`);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [statesRes, readinessRes] = await Promise.all([
          mathpathAPI.decimalsSkillStates(),
          mathpathAPI.decimalsAssessmentReadiness().catch(() => null),
        ]);
        const all = Array.isArray(statesRes?.data?.records) ? statesRes.data.records : [];
        const decimalRecords = all.filter((r) => /^D0\d\d$/.test(String(r.skillId || '')));
        if (active) {
          setRecords(decimalRecords);
          setAssessment(readinessRes?.data || null);
        }
      } catch {
        if (active) setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const view = useMemo(() => buildDecimalsLearningPathView({ masteryRecords: records }), [records]);

  if (loading) return <div className="grid place-items-center py-20"><Spinner /></div>;

  const footerSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => navigate('/student/mathpath/decimals/diagnostic')}
        className="text-sm font-semibold text-emerald-deep hover:underline"
      >
        Not sure where to start? Take a quick check-in →
      </button>
      <Button size="s" variant="secondary" icon={Zap} onClick={() => navigate(`/student/mathpath/decimals/fluency?skill=${view.recommendedNext.skillId}`)}>
        Speed Drill
      </Button>
      {assessment?.ready ? (
        <Button size="s" variant="secondary" icon={GraduationCap} className="ml-auto" onClick={() => navigate('/student/mathpath/decimals/assessment')}>
          Take Assessment
        </Button>
      ) : assessment ? (
        <span className="ml-auto flex items-center gap-1 text-xs text-ink-400">
          <Lock className="h-3.5 w-3.5" /> {assessment.message}
        </span>
      ) : null}
    </div>
  );

  return (
    <DomainSkillMap
      domain="decimals"
      view={view}
      onPractise={startPractice}
      subtitle="Place value through operations, conversion and measurement (P4–P6)."
      footerSlot={footerSlot}
    />
  );
}
