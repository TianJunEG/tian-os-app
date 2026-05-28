import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Lock, Network, Sparkles } from 'lucide-react';
import { mathpathAPI } from '../../services/api';
import { Card, Button, Badge, StatusBadge, ProgressBar, StatTile, PageHeader, Spinner, EmptyState } from '../../components/ui';

// Student Skill Graph / Progress — the mastery map across MathPath: what's
// mastered, what's in progress, and what unlocks next. Read-only over the
// prerequisite-aware /api/mastery/graph; practice launches reuse the MathPath
// session flow. Math only for now (that's where the prerequisite graph lives).

// One badge per skill reflecting its place in the graph: mastered, locked
// (a prerequisite is still missing), ready (unlocked but not started), or its
// in-progress status.
function stateBadge(s) {
  if (s.status === 'mastered') return <StatusBadge status="mastered" />;
  if (s.locked) return <Badge tone="neutral"><Lock className="h-3 w-3" /> Locked</Badge>;
  if (s.status === 'not_started') return <Badge tone="gold">Ready</Badge>;
  return <StatusBadge status={s.status} />;
}

export default function SkillGraph() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    mathpathAPI.graph()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load your skill graph.'))
      .finally(() => setLoading(false));
  }, []);

  const startPractice = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
      const { data: s } = await mathpathAPI.startSession({ skillId, questionCount: 10 });
      navigate(`/student/mathpath/practice/${s.session_id}`, { state: { items: s.items } });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not start practice.');
      setStarting(false);
    }
  };

  if (loading) return <Spinner label="Loading your skill graph…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  const { summary, readyNext = [], topics = [] } = data || {};
  if (!summary || summary.total === 0) {
    return (
      <>
        <PageHeader title="Progress" subtitle="Your mastery map across MathPath." />
        <EmptyState icon={Network} message="Your progress map will appear once you begin MathPath practice." />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Progress" subtitle="Your mastery map across MathPath — what you've mastered and what unlocks next." />

      {/* Standing */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          <StatTile label="Mastered" value={summary.mastered} suffix={`/ ${summary.total}`} />
          <StatTile label="In progress" value={summary.inProgress} />
          <StatTile label="Ready" value={summary.ready} />
          <StatTile label="Locked" value={summary.locked} />
        </div>
        <ProgressBar value={summary.mastered} max={Math.max(summary.total, 1)} />
      </Card>

      {/* What unlocks next */}
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        <Sparkles className="h-3.5 w-3.5 text-gold-600" /> Ready to learn next
      </div>
      {readyNext.length === 0 ? (
        <Card className="mb-6 p-4 text-sm text-ink-500">
          {summary.mastered === summary.total
            ? 'Every skill mastered — outstanding work.'
            : 'Nothing new unlocked right now. Keep practising your in-progress skills to open up the next ones.'}
        </Card>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {readyNext.map((s) => (
            <Card key={s.skillId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink-700">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                  <span className="truncate">{s.topicName}</span>
                  {stateBadge(s)}
                </div>
              </div>
              <Button size="s" icon={ArrowRight} disabled={starting} onClick={() => startPractice(s.skillId)} className="shrink-0">Practise</Button>
            </Card>
          ))}
        </div>
      )}

      {/* The map — topic by topic, with each skill's place in the graph */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">The map</h3>
        <span className="inline-flex items-center gap-1 text-xs text-ink-300"><Network className="h-3.5 w-3.5" /> {topics.length} topics</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {topics.map((t) => (
          <Card key={t.topicId} className="p-5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Link to={`/student/mathpath/topics/${t.topicId}`} className="truncate font-semibold text-ink-700 hover:text-navy-700">{t.name}</Link>
              <Badge tone="neutral" className="shrink-0">{t.masteredCount}/{t.total}</Badge>
            </div>
            <p className="mb-3 text-xs text-ink-300">{t.moeLevel}</p>
            <ul className="divide-y divide-hairline">
              {t.skills.map((s) => (
                <li key={s.skillId} className={`flex items-center justify-between gap-3 py-2 ${s.locked ? 'opacity-60' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {s.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />}
                      <span className="truncate text-sm font-medium text-ink-700">{s.name}</span>
                    </div>
                    {s.locked && s.missingPrereqs.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-400">Unlocks after {s.missingPrereqs.join(', ')}</p>
                    )}
                  </div>
                  <span className="shrink-0">{stateBadge(s)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
