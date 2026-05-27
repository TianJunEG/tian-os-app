import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

const TONE = { mastered: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };

// Science topic list — skills grouped by topic, with mastery status. Practise per skill.
export default function ScienceTopics() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    skillsAPI.list({ subject: 'science' })
      .then((r) => setSkills(r.data.skills || []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load topics.'))
      .finally(() => setLoading(false));
  }, []);

  const practise = async (key, payload) => {
    setBusy(key);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Science Adaptive Revision', questionCount: 8, ...payload });
      navigate(`/student/science/practice/${data.session_id}`, {
        state: { items: data.items, resultsBase: '/student/science', homeBase: '/student/science' },
      });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setBusy(null); }
  };

  if (loading) return <Spinner label="Loading topics…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  // Group skills by topic.
  const byTopic = {};
  for (const s of skills) { (byTopic[s.topicName] ||= []).push(s); }

  return (
    <>
      <PageHeader title="Science topics" subtitle="Primary Science · pick a topic to revise" />
      {skills.length === 0 && <EmptyState icon={AlertTriangle} message="No Science topics yet. Run npm run seed:science." />}
      <div className="space-y-6">
        {Object.entries(byTopic).map(([topic, ts]) => (
          <div key={topic}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{topic}</h3>
                <span className="text-xs text-ink-300">{ts[0]?.moeLevel}</span>
              </div>
              <Button size="s" variant="secondary" icon={ArrowRight} disabled={busy === `t-${topic}`} onClick={() => practise(`t-${topic}`, { topicId: ts[0]?.topicId })}>Practise topic</Button>
            </div>
            <div className="space-y-2">
              {ts.map((s) => (
                <Card key={s.skillId} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ink-700">{s.name}</div>
                    <Badge tone={TONE[s.status] || 'neutral'} className="mt-1">{s.statusLabel}</Badge>
                  </div>
                  <Button size="s" icon={ArrowRight} disabled={busy === s.skillId} onClick={() => practise(s.skillId)} className="shrink-0">Practise</Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
