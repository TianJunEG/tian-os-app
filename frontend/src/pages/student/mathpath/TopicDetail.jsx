import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';

import sgP1Numbers from '../../../config/cheatsheets/sg-p1-numbers';
import sgP1AddSub from '../../../config/cheatsheets/sg-p1-add-sub';
import sgP1Shapes from '../../../config/cheatsheets/sg-p1-shapes';
import sgP2Numbers from '../../../config/cheatsheets/sg-p2-numbers';
import sgP2AddSub from '../../../config/cheatsheets/sg-p2-add-sub';
import sgP2Fractions from '../../../config/cheatsheets/sg-p2-fractions';
import sgP2Measurement from '../../../config/cheatsheets/sg-p2-measurement';
import sgP3Numbers from '../../../config/cheatsheets/sg-p3-numbers';
import sgP3Operations from '../../../config/cheatsheets/sg-p3-operations';
import sgP3Fractions from '../../../config/cheatsheets/sg-p3-fractions';
import sgP3Geometry from '../../../config/cheatsheets/sg-p3-geometry';
import sgP3Data from '../../../config/cheatsheets/sg-p3-data';
import sgP4Fractions from '../../../config/cheatsheets/sg-p4-fractions';
import sgP4WholeNumbers from '../../../config/cheatsheets/sg-p4-whole-numbers';
import sgP4FactorsMultiples from '../../../config/cheatsheets/sg-p4-factors-multiples';
import sgP4FourOperations from '../../../config/cheatsheets/sg-p4-four-operations';
import sgP4Decimals from '../../../config/cheatsheets/sg-p4-decimals';
import sgP4WordProblems from '../../../config/cheatsheets/sg-p4-word-problems';
import sgP4Statistics from '../../../config/cheatsheets/sg-p4-statistics';
import sgP5Fractions from '../../../config/cheatsheets/sg-p5-fractions';
import sgP5Decimals from '../../../config/cheatsheets/sg-p5-decimals';
import sgP5Percentage from '../../../config/cheatsheets/sg-p5-percentage';
import sgP5Ratio from '../../../config/cheatsheets/sg-p5-ratio';
import sgP5Geometry from '../../../config/cheatsheets/sg-p5-geometry';
import sgP5Measurement from '../../../config/cheatsheets/sg-p5-measurement';
import sgP5Operations from '../../../config/cheatsheets/sg-p5-operations';
import sgP6Algebra from '../../../config/cheatsheets/sg-p6-algebra';
import sgP6Fractions from '../../../config/cheatsheets/sg-p6-fractions';
import sgP6Percentage from '../../../config/cheatsheets/sg-p6-percentage';
import sgP6Ratio from '../../../config/cheatsheets/sg-p6-ratio';
import sgP6Geometry from '../../../config/cheatsheets/sg-p6-geometry';
import sgP6Measurement from '../../../config/cheatsheets/sg-p6-measurement';
import sgP6Statistics from '../../../config/cheatsheets/sg-p6-statistics';

const ALL_SHEETS = [
  sgP1Numbers, sgP1AddSub, sgP1Shapes,
  sgP2Numbers, sgP2AddSub, sgP2Fractions, sgP2Measurement,
  sgP3Numbers, sgP3Operations, sgP3Fractions, sgP3Geometry, sgP3Data,
  sgP4Fractions, sgP4WholeNumbers, sgP4FactorsMultiples, sgP4FourOperations, sgP4Decimals, sgP4WordProblems, sgP4Statistics,
  sgP5Fractions, sgP5Decimals, sgP5Percentage, sgP5Ratio, sgP5Geometry, sgP5Measurement, sgP5Operations,
  sgP6Algebra, sgP6Fractions, sgP6Percentage, sgP6Ratio, sgP6Geometry, sgP6Measurement, sgP6Statistics,
];

function findCheatSheet(topicName, moeLevel) {
  if (!topicName || !moeLevel) return null;
  const name = topicName.toLowerCase().trim();
  const level = moeLevel.toLowerCase().trim();
  return ALL_SHEETS.find((s) => {
    const sLevel = s.level.toLowerCase().trim();
    const sTopic = s.topic.toLowerCase().trim();
    return sLevel === level && (sTopic === name || name.includes(sTopic) || sTopic.includes(name));
  }) || null;
}
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
      <button onClick={() => navigate('/student/mathpath')} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep">
        <ArrowLeft className="h-4 w-4" /> MathPath
      </button>
      <PageHeader
        title={topic.name}
        subtitle={`${topic.moeLevel} · ${topic.masteredCount}/${topic.total} skills mastered`}
        action={
          <div className="flex items-center gap-2">
            {findCheatSheet(topic.name, topic.moeLevel) && (
              <Button variant="secondary" size="m" icon={BookOpen} onClick={() => navigate(`/student/mathpath/cheatsheet/${findCheatSheet(topic.name, topic.moeLevel).id}`)}>Cheat Sheet</Button>
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
