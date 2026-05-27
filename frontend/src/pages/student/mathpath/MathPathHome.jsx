import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, StatusBadge, ProgressBar, StatTile, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// MathPath home — current standing + the single recommended next action, then
// the topic map. "One bright thing in the room": Start recommended practice.
export default function MathPathHome() {
  const navigate = useNavigate();
  const [mastery, setMastery] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, map] = await Promise.all([mathpathAPI.mastery(), mathpathAPI.map()]);
        setMastery(m.data);
        setTopics(map.data.topics || []);
      } catch (e) {
        setError(e.response?.data?.error || 'Could not load MathPath.');
      } finally { setLoading(false); }
    })();
  }, []);

  const startPractice = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ skillId, questionCount: 10 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not start practice.');
      setStarting(false);
    }
  };

  if (loading) return <Spinner label="Loading MathPath…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const records = mastery?.records || [];
  const mastered = records.filter((r) => r.status === 'mastered');
  const learning = records.filter((r) => r.status === 'learning');
  const recommended = mastery?.recommended;
  const weak = mastery?.weakSkills || [];

  return (
    <>
      <PageHeader title="MathPath" subtitle="Your adaptive maths pathway." />

      {/* Recommended next action */}
      <Card className="mb-6 p-5">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</div>
        {recommended ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-navy-700">{recommended.skillName}</h2>
              <p className="mt-1 text-sm text-ink-500">{recommended.topicName} · <StatusBadge status={recommended.masteryState || recommended.status} /></p>
              {recommended.reason && <p className="mt-1 text-sm text-ink-600">{recommended.reason}</p>}
            </div>
            <Button size="l" icon={ArrowRight} disabled={starting} onClick={() => startPractice(recommended.skillId)} className="shrink-0">
              {starting ? 'Starting…' : 'Start recommended practice'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Pick a topic below to begin your first practice.</p>
        )}
      </Card>

      {/* Standing */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-6">
          <StatTile label="Mastered" value={mastered.length} />
          <StatTile label="Learning" value={learning.length} />
          <StatTile label="To review" value={weak.filter((w) => w.status === 'needs_review').length} />
        </div>
        <ProgressBar value={mastered.length} max={Math.max(records.length, 1)} />
      </Card>

      {/* Weak topics alert */}
      {weak.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-error-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
            <div>
              <p className="text-sm font-semibold text-ink-700">Needs attention</p>
              <p className="text-sm text-ink-500">{weak[0].skillName} in {weak[0].topicName} could use practice.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Topic map */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Topic map</h3>
        <span className="inline-flex items-center gap-1 text-xs text-ink-300"><MapIcon className="h-3.5 w-3.5" /> {topics.length} topics</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {topics.map((t) => (
          <Link key={t.topicId} to={`/student/mathpath/topics/${t.topicId}`} className="block">
            <Card interactive className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-ink-700">{t.name}</h4>
                <Badge tone="neutral">{t.masteredCount}/{t.total}</Badge>
              </div>
              <ProgressBar value={t.masteredCount} max={Math.max(t.total, 1)} />
              <p className="mt-2 text-xs text-ink-300">{t.moeLevel}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
