import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, BookOpen, FileText } from 'lucide-react';
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

  // Group topics by level. Each topic has one skill (same name) under the
  // legacy-bank import, so render one card per topic with a single Practise
  // button. The same topic name can recur across levels (e.g. Digestive
  // System at P4 and P5), so the level section keeps them visually distinct.
  const byLevel = {};
  for (const s of skills) {
    const level = s.moeLevel || 'Other';
    (byLevel[level] ||= []).push(s);
  }
  const orderedLevels = Object.keys(byLevel).sort();

  return (
    <>
      <PageHeader title="Science topics" subtitle="Primary Science · pick a topic to revise" />
      {skills.length === 0 && <EmptyState icon={AlertTriangle} message="No Science topics yet. Run npm run seed:science." />}
      <div className="space-y-8">
        {orderedLevels.map((level) => (
          <section key={level}>
            <h2 className="mb-3 text-base font-semibold text-ink-700">{level}</h2>
            <div className="space-y-2">
              {byLevel[level].map((s) => (
                <Card key={s.skillId} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-ink-700">{s.topicName}</div>
                      <Badge tone={TONE[s.status] || 'neutral'} className="mt-1">{s.statusLabel}</Badge>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button size="s" variant="ghost" icon={FileText} onClick={() => navigate(`/student/science/topic/${s.topicId}/notes`)}>Notes</Button>
                      <Button size="s" variant="secondary" icon={BookOpen} onClick={() => navigate(`/student/science/topic/${s.topicId}/lesson`)}>Lesson</Button>
                      <Button size="s" icon={ArrowRight} disabled={busy === s.skillId} onClick={() => practise(s.skillId, { topicId: s.topicId })}>Practise</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
