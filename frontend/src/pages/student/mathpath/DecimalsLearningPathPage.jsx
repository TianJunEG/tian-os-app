import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Target } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { mathpathAPI } from '../../../services/api';
import { Badge, Button, Card, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { buildDecimalsLearningPathView } from '../../../mathpath/decimals/decimalsLearningPathModel';

// Student-facing Decimals skill map. Presentational only: all status /
// prerequisite-locking / recommended-next logic lives in the pure
// buildDecimalsLearningPathView() model (shared + unit-tested). Practice launch
// is wired in a later increment; for now a skill card reveals its detail inline.

function statusTone(label) {
  if (label === 'Retained') return 'success';
  if (label === 'Fluent') return 'navy';
  if (label === 'Accurate') return 'gold';
  if (label === 'Needs Review' || label === 'Weak') return 'error';
  if (label === 'Locked') return 'neutral';
  if (label === 'Learning') return 'navy';
  return 'neutral';
}

function SkillCard({ skill, selected, onSelect }) {
  const levelTag = (skill.singaporeLevel || []).join('/');
  return (
    <Card
      className={`p-4 cursor-pointer transition ${skill.current ? 'ring-2 ring-gold-400/60' : ''} ${skill.locked ? 'bg-paper/80 opacity-75' : ''} ${selected ? 'ring-2 ring-navy-400/60' : ''}`}
      onClick={() => onSelect(skill.id)}
    >
      <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
        <p className="text-base font-semibold leading-snug text-ink-800">{skill.name}</p>
        <span className="shrink-0">
          {skill.locked ? <Lock className="h-4 w-4 text-ink-300" /> : skill.complete ? <CheckCircle2 className="h-4 w-4 text-success-700" /> : null}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone={statusTone(skill.statusLabel)}>{skill.statusLabel}</Badge>
        {skill.current && <Badge tone="gold">Recommended</Badge>}
        {levelTag && <Badge tone="neutral">{levelTag}</Badge>}
      </div>
      {skill.locked && skill.missingPrerequisiteNames[0] && (
        <p className="mt-3 line-clamp-1 text-xs text-ink-400">Unlocks after {skill.missingPrerequisiteNames[0]}</p>
      )}
    </Card>
  );
}

export default function DecimalsLearningPathPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const startPractice = (skillId) => navigate(`/student/mathpath/decimals/practice?skill=${skillId}`);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await mathpathAPI.decimalsSkillStates();
        const all = Array.isArray(res?.data?.records) ? res.data.records : [];
        // Defensive: keep only D-coded records in case the endpoint widens later.
        const decimalRecords = all.filter((r) => /^D0\d\d$/.test(String(r.skillId || '')));
        if (active) setRecords(decimalRecords);
      } catch {
        if (active) setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const view = useMemo(() => buildDecimalsLearningPathView({ masteryRecords: records }), [records]);
  const selected = useMemo(
    () => view.strands.flatMap((s) => s.skills).find((s) => s.id === selectedId) || null,
    [view, selectedId],
  );

  if (loading) {
    return <div className="grid place-items-center py-20"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageHeader title="Decimals" subtitle="Place value through operations, conversion and measurement (P4–P6)." />

      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="navy">{view.progress.percentageMastered}% mastered</Badge>
          <Badge tone="neutral">{view.progress.mastered}/{view.progress.total} skills</Badge>
          <Badge tone="gold">{view.progress.inProgress} in progress</Badge>
        </div>
        <ProgressBar className="mt-4" value={view.progress.mastered} max={view.progress.total} />
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended Next</p>
            <p className="truncate text-sm font-semibold text-ink-700">{view.recommendedNext.skillName}</p>
          </div>
          <Button size="s" icon={ArrowRight} onClick={() => startPractice(view.recommendedNext.skillId)}>Practise</Button>
        </div>
      </Card>

      {selected && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-ink-800">{selected.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone(selected.statusLabel)}>{selected.statusLabel}</Badge>
            {(selected.singaporeLevel || []).map((lvl) => <Badge key={lvl} tone="neutral">{lvl}</Badge>)}
          </div>
          {selected.locked && (
            <p className="mt-2 text-xs text-ink-400">
              Complete {selected.missingPrerequisiteNames.join(', ')} to unlock this skill.
            </p>
          )}
          <div className="mt-3">
            <Button size="s" disabled={selected.locked} onClick={() => !selected.locked && startPractice(selected.id)}>
              {selected.locked ? 'Locked' : 'Practise This Skill'}
            </Button>
          </div>
        </Card>
      )}

      {view.strands.map((strand) => (
        <section key={strand.label}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{strand.label}</h3>
            <span className="text-xs text-ink-400">{strand.skills.length} skills</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {strand.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} selected={skill.id === selectedId} onSelect={setSelectedId} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
