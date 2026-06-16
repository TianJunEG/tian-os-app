import React from 'react';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '../../../../components/ui';
import { MascotBubble } from '../../../../components/MascotAvatar';
import { getMascotForModule } from '../../../../config/mascots';
import { MATHPATH_DOMAINS } from './MathPathDomainGrid';

// Shared, themed skill-map for every MathPath domain. Replaces 11+ grey,
// two-click clones with one colourful, one-click component:
//  • domain colour + icon header (from MATHPATH_DOMAINS) instead of plain text
//  • Kylo greeting so the buddy is consistent with practice/result screens
//  • tapping an unlocked skill starts practice immediately (was two clicks)
//  • a friendly cold-start nudge when nothing has been attempted yet
// Data loading stays in the per-domain page; this is presentational only.
// `footerSlot` lets enriched domains (Decimals/Percentages/Ratio) add their
// diagnostic / assessment / speed-drill actions under the progress card.

const MASCOT_KEY = getMascotForModule('mathpath')?.key || 'kylo';

function statusTone(label) {
  if (label === 'Retained') return 'success';
  if (label === 'Fluent') return 'navy';
  if (label === 'Accurate') return 'gold';
  if (label === 'Needs Review' || label === 'Weak') return 'error';
  if (label === 'Locked') return 'neutral';
  if (label === 'Learning') return 'navy';
  return 'neutral';
}

function SkillCard({ skill, onPractise }) {
  const levelTag = (skill.singaporeLevel || []).join('/');
  const clickable = !skill.locked;
  return (
    <Card
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Practise ${skill.name}` : `${skill.name} — locked`}
      onClick={clickable ? () => onPractise(skill.id) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPractise(skill.id); } } : undefined}
      className={`p-4 transition ${clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'bg-surface-white/80 opacity-75'} ${skill.current ? 'ring-2 ring-gold-400/60' : ''}`}
    >
      <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
        <p className="text-base font-semibold leading-snug text-ink-800">{skill.name}</p>
        <span className="shrink-0">
          {skill.locked ? <Lock className="h-4 w-4 text-ink-300" /> : skill.complete ? <CheckCircle2 className="h-4 w-4 text-success-700" /> : <ArrowRight className="h-4 w-4 text-ink-300" />}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone={statusTone(skill.statusLabel)}>{skill.statusLabel}</Badge>
        {skill.current && <Badge tone="gold">Recommended</Badge>}
        {levelTag && <Badge tone="neutral">{levelTag}</Badge>}
      </div>
      {skill.locked && skill.missingPrerequisiteNames?.[0] && (
        <p className="mt-3 line-clamp-1 text-xs text-ink-400">Unlocks after {skill.missingPrerequisiteNames[0]}</p>
      )}
    </Card>
  );
}

export default function DomainSkillMap({ domain, view, onPractise, footerSlot = null, subtitle = '' }) {
  const meta = MATHPATH_DOMAINS.find((d) => d.slug === domain) || {};
  const Icon = meta.icon;
  const label = meta.label || 'MathPath';
  const coldStart = view.progress.mastered === 0 && view.progress.inProgress === 0;
  const greeting = coldStart
    ? `New to ${label}? Let's start with ${view.recommendedNext.skillName}.`
    : `You've mastered ${view.progress.mastered} of ${view.progress.total} ${label} skills — keep going!`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Themed header */}
      <div className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-5 ${meta.theme || ''}`}>
        {Icon && (
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${meta.chip || 'bg-white'}`}>
            <Icon className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink-900">{label}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}
        </div>
      </div>

      <MascotBubble name={MASCOT_KEY} message={greeting} size="sm" voiced />

      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="navy">{view.progress.percentageMastered}% mastered</Badge>
          <Badge tone="neutral">{view.progress.mastered}/{view.progress.total} skills</Badge>
          <Badge tone="gold">{view.progress.inProgress} in progress</Badge>
        </div>
        <ProgressBar className="mt-4" value={view.progress.mastered} max={view.progress.total} />
        <div className="mt-4 flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.chip || 'bg-gold-100 text-gold-700'}`}>
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-700">Recommended next</p>
            <p className="truncate text-sm font-semibold text-ink-700">{view.recommendedNext.skillName}</p>
          </div>
          <Button size="s" icon={ArrowRight} onClick={() => onPractise(view.recommendedNext.skillId)}>Practise</Button>
        </div>
        {footerSlot && <div className="mt-4 border-t border-ink-100 pt-3">{footerSlot}</div>}
      </Card>

      {view.strands.map((strand) => (
        <section key={strand.label}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{strand.label}</h3>
            <span className="text-xs text-ink-400">{strand.skills.length} skills</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {strand.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onPractise={onPractise} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
