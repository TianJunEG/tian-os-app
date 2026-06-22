import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ListChecks, Zap } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, CollapsibleSection } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import { visibleSkillLevel } from '../../../../utils/skillLevel';
import FEATURE_FLAGS from '../../../../config/featureFlags';
import { DOMAIN_PRACTICE_CONFIG } from '../domainPractice/core';

function domainForSkillId(skillId) {
  const id = String(skillId || '');
  for (const [domain, config] of Object.entries(DOMAIN_PRACTICE_CONFIG)) {
    if (config.pattern && config.startFluency && config.pattern.test(id)) return domain;
  }
  return null;
}

const TONE = { mastered: 'success', fluent: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };
const PRIORITY_STATUSES = new Set(['learning', 'needs_review', 'not_started']);
const EMPTY_FLUENCY_MESSAGE = 'No fluency practice is available yet. Continue learning to unlock fluency challenges.';

function normalizeLevel(level = '') {
  const text = String(level || '').trim();
  return text || 'Other';
}

function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());
}

function SkillRow({ skill, busy, onStart }) {
  const { user } = useAuth();
  const studentLevel = user?.studentLevel || user?.moeLevel || user?.profile?.studentLevel || '';
  const shownLevel = visibleSkillLevel(skill.moeLevel, studentLevel);
  return (
    <button
      type="button"
      disabled={busy === skill.skillId}
      onClick={() => onStart(skill.skillId)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-line-soft bg-surface-white px-3 py-3 text-left transition hover:bg-emerald-tint disabled:opacity-60"
    >
      <div className="min-w-0">
        <div className="truncate font-semibold text-ink-800">{skill.name}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge tone={TONE[skill.status] || 'neutral'}>{skill.statusLabel}</Badge>
          {shownLevel && <Badge tone="gold">{shownLevel}</Badge>}
        </div>
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-deep text-paper">
        <Zap className="h-4 w-4" />
      </span>
    </button>
  );
}

function SkillGroup({ title, subtitle, skills, busy, onStart }) {
  return (
    <CollapsibleSection title={title} summary={subtitle} action={<Badge tone="neutral">{skills.length}</Badge>} surface={false}>
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        {skills.map((skill) => (
          <SkillRow key={skill.skillId} skill={skill} busy={busy} onStart={onStart} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// MathPath › Fluency › skill selection.
export default function FluencySkills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [view, setView] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (!FEATURE_FLAGS.fluency) {
    return (
      <EmptyState icon={Zap} message="Fluency practice is not available yet. Continue learning to unlock it.">
        <Button to="/student/mathpath" variant="secondary">Back to MathPath</Button>
      </EmptyState>
    );
  }

  useEffect(() => {
    skillsAPI.list({ group: 'fluency' })
      .then((r) => {
        const rows = r.data.skills || [];
        console.info('[fluency-skills] inventory', {
          totalFluencySkillsFound: rows.length,
          availableFluencySkills: rows.filter((skill) => Number(skill.availableQuestionCount || 0) > 0).length,
          filteredFluencySkills: rows.length,
        });
        setSkills(rows);
      })
      .catch((e) => setError(e.response?.data?.error || 'Could not load skills.'))
      .finally(() => setLoading(false));
  }, []);

  const start = async (skillId) => {
    setBusy(skillId);
    try {
      const isFrameworkSkillId = /^F\d{3}$/i.test(String(skillId || ''));
      if (isFrameworkSkillId) {
        navigate('/student/mathpath/practice/recommended-pathway', {
          state: {
            skillId: String(skillId).toUpperCase(),
            questionCount: 8,
            sessionType: 'practice',
            source: 'fluency-skills',
            backTo: '/student/mathpath/fluency',
          },
        });
        return;
      }
      const domain = domainForSkillId(skillId);
      if (domain) {
        navigate(`/student/mathpath/${domain}/fluency?skill=${skillId}`);
        setBusy(null);
        return;
      }
      const { data } = await mathpathAPI.startSession({ feature: 'Fluency Practice', mode: 'fluency', skillId, questionCount: 8 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items, backTo: '/student/mathpath/fluency' } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setBusy(null); }
  };

  const groupedSections = useMemo(() => {
    const source = view === 'recommended'
      ? skills.filter((skill) => PRIORITY_STATUSES.has(skill.status))
      : skills;
    const grouped = groupBy(source, (skill) => view === 'level' ? normalizeLevel(skill.moeLevel) : (skill.topicName || 'Other'));
    return [...grouped.entries()]
      .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
      .map(([title, rows]) => ({
        title,
        subtitle: view === 'level' ? 'Grouped by school level' : 'Grouped by topic',
        skills: rows.sort((a, b) => String(a.name).localeCompare(String(b.name))),
      }));
  }, [skills, view]);

  const recommendedCount = skills.filter((skill) => PRIORITY_STATUSES.has(skill.status)).length;

  if (loading) return <Spinner label="Loading skills…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  return (
    <>
      <PageHeader title="Fluency skills" subtitle="Pick a focused drill." />
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-tint text-emerald-deep">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-800">{skills.length} fluency skills</p>
              <p className="text-sm text-ink-500">{recommendedCount} ready to practise now</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-line-soft bg-surface-white p-1">
            {[
              ['recommended', 'Recommended'],
              ['topic', 'Topic'],
              ['level', 'Level'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${view === key ? 'bg-emerald-deep text-white' : 'text-ink-500 hover:bg-emerald-tint'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {skills.length === 0 && <EmptyState icon={AlertTriangle} message={EMPTY_FLUENCY_MESSAGE} />}
        {skills.length > 0 && groupedSections.length === 0 && (
          <EmptyState icon={Zap} message="Everything in this view is already fluent. Browse by topic or level for more drills.">
            <Button variant="secondary" onClick={() => setView('topic')}>Browse Topics</Button>
          </EmptyState>
        )}
        {groupedSections.map((section) => (
          <SkillGroup
            key={`${view}-${section.title}`}
            title={section.title}
            subtitle={section.subtitle}
            skills={section.skills}
            busy={busy}
            onStart={start}
          />
        ))}
      </div>
    </>
  );
}
