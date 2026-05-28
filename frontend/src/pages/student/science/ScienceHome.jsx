import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, ArrowRight, ListChecks, AlertTriangle, StickyNote } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

// Science Adaptive Revision — home. Secondary Tian OS module; reuses the shared
// practice/mastery/mistake core (subject = Science). Practice runs through the
// shared MathPath practice screen with a Science results destination.
const TONE = { mastered: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };

export default function ScienceHome() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [studentLevel, setStudentLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    skillsAPI.list({ subject: 'science' })
      .then((r) => {
        setSkills(r.data.skills || []);
        setStudentLevel(r.data.studentLevel || '');
      })
      .catch((e) => setError(e.response?.data?.error || 'Could not load Science.'))
      .finally(() => setLoading(false));
  }, []);

  // Start a session. Pass a topicId for a topic-level mix (more variety), or a
  // skillId to target one weak skill.
  const start = async ({ topicId, skillId }) => {
    if ((!topicId && !skillId) || starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Science Adaptive Revision', topicId, skillId, questionCount: 8 });
      navigate(`/student/science/practice/${data.session_id}`, {
        state: { items: data.items, resultsBase: '/student/science', homeBase: '/student/science' },
      });
    } catch (e) { setError(e.response?.data?.error || 'Could not start revision.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading Science…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  // Clean empty state when no Science content/data exists.
  if (skills.length === 0) {
    return (
      <>
        <PageHeader title="Science Adaptive Revision" subtitle="Adaptive revision across Primary Science topics." />
        <EmptyState icon={FlaskConical} message="Science Adaptive Revision is ready. Start with a topic.">
          <Button to="/student/science/topics" icon={ArrowRight}>View topics</Button>
        </EmptyState>
      </>
    );
  }

  // Constrain the home surface to the student's own level so a P4 student
  // doesn't get a P6 "recommended topic" or P5 weak-skill suggestions. Falls
  // back to the full pool only when the student's level has no skills (so the
  // page is never empty for a student outside the seeded range).
  const levelSkills = studentLevel ? skills.filter((s) => s.moeLevel === studentLevel) : skills;
  const pool = levelSkills.length ? levelSkills : skills;
  const practised = pool.filter((s) => s.status !== 'not_started');
  const recommended = [...pool].sort((a, b) => a.score - b.score)[0];
  const weak = pool.filter((s) => s.status === 'needs_review' || s.status === 'learning').slice(0, 4);

  return (
    <>
      <PageHeader title="Science Adaptive Revision" subtitle={studentLevel ? `${studentLevel} · adaptive revision` : 'A secondary module — revise alongside MathPath.'} />

      <Card className="mb-6 bg-gradient-to-br from-[#2F6B7E] to-[#1d4452] p-5 text-paper">
        <div className="mb-1 flex items-center gap-2 text-paper/80"><FlaskConical className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-[0.1em]">Recommended topic</span></div>
        <div className="font-display text-xl font-semibold">{recommended?.name}</div>
        <p className="mb-4 mt-1 text-sm text-paper/70">{recommended?.topicName} · short revision set.</p>
        <Button variant="gold" icon={ArrowRight} disabled={starting || !recommended} onClick={() => start({ topicId: recommended?.topicId })}>
          {starting ? 'Starting…' : 'Start revision'}
        </Button>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Topics to review</h3>
      <div className="mb-6 space-y-2">
        {weak.length === 0 && <Card className="p-4 text-sm text-ink-500">{practised.length ? 'Your Science topics are looking strong.' : 'Start a topic to build your Science profile.'}</Card>}
        {weak.map((s) => (
          <Card key={s.skillId} interactive role="button" aria-label={`Practise ${s.name}`} className="flex items-center justify-between gap-3 p-4" onClick={() => start({ skillId: s.skillId })}>
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink-700">{s.name}</div>
              <div className="truncate text-xs text-ink-500">{s.topicName}</div>
            </div>
            <Badge tone={TONE[s.status] || 'neutral'} className="shrink-0">{s.statusLabel}</Badge>
          </Card>
        ))}
      </div>

      <Button variant="secondary" icon={ListChecks} to="/student/science/topics" className="w-full">View all topics</Button>
      <Button variant="ghost" icon={StickyNote} to="/student/science/notes" className="mt-2 w-full">My notes</Button>
    </>
  );
}
