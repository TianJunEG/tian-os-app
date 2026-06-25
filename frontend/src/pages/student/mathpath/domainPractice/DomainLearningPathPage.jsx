import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button, Spinner } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import FEATURE_FLAGS from '../../../../config/featureFlags';
import DomainSkillMap from '../components/DomainSkillMap';
import { getDomainConfig } from './core';

// Generic, registry-driven learning-path (skill map) for the domains that have
// no extra surfaces of their own. Replaces 11 near-identical grey clones; the
// per-domain skill-states API, skill-id pattern, view builder and subtitle all
// come from DOMAIN_PRACTICE_CONFIG. Presentation is the shared, themed
// DomainSkillMap. Domains with extra features (Decimals/Percentages/Ratio keep
// their own page passing a footerSlot).
export default function DomainLearningPathPage({ domain }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const config = getDomainConfig(domain);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  const startPractice = (skillId) => navigate(`/student/mathpath/${domain}/practice?skill=${skillId}`);

  useEffect(() => {
    // Wait for auth to finish before fetching — otherwise the first call fires
    // with no token (user still null), gets a 401, and the page briefly shows
    // an empty skill map before the second call (with the real token) succeeds.
    if (authLoading) return;
    let active = true;
    (async () => {
      try {
        const res = await config?.skillStates?.();
        const all = Array.isArray(res?.data?.records) ? res.data.records : [];
        const filtered = config?.pattern ? all.filter((r) => config.pattern.test(String(r.skillId || ''))) : all;
        if (active) setRecords(filtered);
      } catch {
        if (active) setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [domain, user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => config?.buildView?.({ masteryRecords: records }) || { strands: [], progress: { mastered: 0, total: 0, inProgress: 0, percentageMastered: 0 }, recommendedNext: { skillId: '', skillName: '' } }, [config, records]);

  if (loading) return <div className="grid place-items-center py-20"><Spinner /></div>;

  // Diagnostic check-in entry point (generic /:domainId/diagnostic route). Keeps
  // the per-domain "quick check-in" that the fluency PRs added to every simple
  // learning-path page, now surfaced through the shared footer slot.
  // Gentle domains (K2 Early Numeracy) have no diagnostic adapter wired yet
  // (EarlyNumeracy skills use questionFamilies, not the questionStructures
  // shape the generic factory consumes). Pass null so we don't double up the
  // inline "Practise" button on the recommended-next card with a redundant
  // footer "Let's Practise" button.
  const footerSlot = config?.gentle ? null : (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() => navigate(`/student/mathpath/${domain}/diagnostic`)}
      >
        Start Check-in
      </Button>
      {config?.startFluency && FEATURE_FLAGS.fluency && view.recommendedNext?.skillId && (
        <Button size="s" variant="secondary" icon={Zap} onClick={() => navigate(`/student/mathpath/${domain}/fluency?skill=${view.recommendedNext.skillId}`)}>
          Speed Drill
        </Button>
      )}
    </div>
  );

  return <DomainSkillMap domain={domain} view={view} onPractise={startPractice} subtitle={config?.subtitle || ''} footerSlot={footerSlot} />;
}
