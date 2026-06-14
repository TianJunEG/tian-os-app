import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';

const CHEAT_SHEET_MAP = {
  'sg-p4-wn': 'sg-p4-wn',
  'sg-p4-fm': 'sg-p4-fm',
  'sg-p4-fo': 'sg-p4-fo',
  'sg-p4-fr': 'sg-p4-fr',
  'sg-p4-dec': 'sg-p4-dec',
  'sg-p4-wp': 'sg-p4-wp',
  'sg-p4-stat': 'sg-p4-stat',
};
import { Card, Button, StatusBadge, ProgressBar, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// One topic: its skills with mastery, and practice entry points.
export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await mathpathAPI.map();
        setTopic((data.topics || []).find((t) => String(t.topicId) === String(topicId)) || null);
      } catch (e) { setError(e.response?.data?.error || 'Could not load topic.'); }
      finally { setLoading(false); }
    })();
  }, [topicId]);

  const startPractice = async (payload) => {
    if (starting) return;
    setStarting(true);
    try {
      const skillId = payload?.skillId || '';
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skillId));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skillId).toUpperCase(),
            questionCount: 10,
            sessionType: 'practice',
            source: 'topic-detail',
          },
        });
        return;
      }
      const { data } = await mathpathAPI.startSession({ ...payload, questionCount: 10 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading topic…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!topic) return <EmptyState icon={AlertTriangle} message="Topic not found." />;

  return (
    <>
      <button onClick={() => navigate('/student/mathpath')} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700">
        <ArrowLeft className="h-4 w-4" /> MathPath
      </button>
      <PageHeader
        title={topic.name}
        subtitle={`${topic.moeLevel} · ${topic.masteredCount}/${topic.total} skills mastered`}
        action={
          <div className="flex items-center gap-2">
            {CHEAT_SHEET_MAP[topicId] && (
              <Button variant="secondary" size="m" icon={BookOpen} onClick={() => navigate(`/student/mathpath/cheatsheet/${CHEAT_SHEET_MAP[topicId]}`)}>Cheat Sheet</Button>
            )}
            <Button size="m" icon={ArrowRight} disabled={starting} onClick={() => startPractice({ skillIds: topic.skills.map((s) => s.skillId) })}>{starting ? 'Starting…' : 'Practise topic'}</Button>
          </div>
        }
      />

      <div className="space-y-3">
        {topic.skills.map((s) => (
          <Card key={s.skillId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-700">{s.name}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={s.status} />
                {s.attempts > 0 && <span className="font-mono text-xs text-ink-300 tabular-nums">{s.score}%</span>}
              </div>
            </div>
            <Button variant="secondary" size="s" disabled={starting} onClick={() => startPractice({ skillId: s.skillId })}>Practise</Button>
          </Card>
        ))}
      </div>
    </>
  );
}
