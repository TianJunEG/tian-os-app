import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, BookOpen, FileText } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';

const TONE = { mastered: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };

// Levels present in the legacy P3–P6 bank, in display order.
const LEVELS = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];

// Science topic list — skills grouped by level, with a level filter that
// defaults to the student's own level so a P4 student isn't dropped into 44
// topics across four years of the syllabus.
export default function ScienceTopics() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [studentLevel, setStudentLevel] = useState('');
  const [activeLevel, setActiveLevel] = useState(null); // null = uninitialised; set after load
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    skillsAPI.list({ subject: 'science' })
      .then((r) => {
        const lvl = r.data.studentLevel || '';
        setSkills(r.data.skills || []);
        setStudentLevel(lvl);
        // Default the filter to the student's level if we have skills for it;
        // otherwise fall back to "All" so the page is never empty.
        const hasLevel = (r.data.skills || []).some((s) => s.moeLevel === lvl);
        setActiveLevel(hasLevel ? lvl : 'all');
      })
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

  // Only show level pills for levels that actually have skills in the bank.
  const availableLevels = useMemo(() => {
    const present = new Set(skills.map((s) => s.moeLevel).filter(Boolean));
    return LEVELS.filter((l) => present.has(l));
  }, [skills]);

  const visibleSkills = useMemo(() => {
    if (!activeLevel || activeLevel === 'all') return skills;
    return skills.filter((s) => s.moeLevel === activeLevel);
  }, [skills, activeLevel]);

  if (loading) return <Spinner label="Loading topics…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  // Group filtered skills by level for section headers.
  const byLevel = {};
  for (const s of visibleSkills) {
    const level = s.moeLevel || 'Other';
    (byLevel[level] ||= []).push(s);
  }
  const orderedLevels = Object.keys(byLevel).sort();

  const pill = (key, label) => {
    const selected = activeLevel === key;
    const isOwn = key === studentLevel;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveLevel(key)}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          selected ? 'border-[#2F6B7E] bg-[#2F6B7E] text-paper' : 'border-ink-100 bg-paper text-ink-600 hover:border-ink-300'
        }`}
        aria-pressed={selected}
      >
        {label}{isOwn ? ' · You' : ''}
      </button>
    );
  };

  return (
    <>
      <PageHeader title="Science topics" subtitle={studentLevel ? `Primary Science · ${studentLevel}` : 'Primary Science · pick a topic to revise'} />
      {skills.length === 0 && <EmptyState icon={AlertTriangle} message="Science practice is not available yet. Continue learning and check back soon." />}

      {skills.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Showing</span>
          {availableLevels.map((l) => pill(l, l.replace('Primary ', 'P')))}
          {pill('all', 'All levels')}
        </div>
      )}

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
                      <Button size="s" variant="secondary" icon={BookOpen} onClick={() => navigate(`/student/science/topic/${s.topicId}/lesson`)}>Learn</Button>
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
