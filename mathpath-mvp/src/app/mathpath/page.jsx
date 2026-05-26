'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card, Button, Chip, Stat, ProgressBar, Ring, Section, ScreenHeader } from '@/components/ui';
import { IconArrowRight, IconBolt, IconBook } from '@/components/icons';
import { api, studentId, getStudent } from '@/lib/client';

const KIND_COPY = {
  start_new: { tag: 'Start next', tone: T.gold700, bg: T.gold100 },
  continue: { tag: 'Keep going', tone: T.gold700, bg: T.gold100 },
  advance: { tag: 'Unlocked', tone: T.success500, bg: T.success100 },
  fluency: { tag: 'Fluency drill', tone: T.gold700, bg: T.gold100 },
  remediate: { tag: 'Remediation', tone: T.error500, bg: T.error100 },
  reinforce: { tag: 'Reinforce', tone: T.navy700, bg: T.navy050 },
  review: { tag: 'Review', tone: T.navy700, bg: T.navy050 },
};

const CONFIDENCE = {
  building: { label: 'Building', c: T.error500 },
  steady: { label: 'Steady', c: T.gold700 },
  confident: { label: 'Confident', c: T.success500 },
};

const STATUS_CHIP = {
  mastered: { c: T.success500, bg: T.success100, label: 'Mastered' },
  fluent: { c: T.success500, bg: T.success100, label: 'Fluent' },
  practising: { c: T.gold700, bg: T.gold100, label: 'Practising' },
  developing: { c: T.error500, bg: T.error100, label: 'Developing' },
  not_started: { c: T.ink500, bg: T.bone, label: 'Not started' },
};
function statusChip(s) {
  if (s.locked && s.mastery_status === 'not_started') return { c: T.ink500, bg: T.bone, label: 'Locked' };
  return STATUS_CHIP[s.mastery_status] || STATUS_CHIP.not_started;
}

export default function MathPathDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !getStudent()) { router.replace('/'); return; }
    api.recommendation(studentId()).then(setData);
  }, [router]);

  if (!data) {
    return (<div><ScreenHeader title="MathPath" subtitle="Adaptive math mastery" onBack={() => router.push('/')} /><div style={{ padding: 40, textAlign: 'center', color: T.ink500 }}>Loading your path…</div></div>);
  }

  const rec = data.recommendation;
  const kind = KIND_COPY[rec.kind] || KIND_COPY.continue;
  const overall = Math.round((data.chain.reduce((a, s) => a + s.score, 0) / data.chain.length) * 100);
  const mastered = data.chain.filter((s) => s.mastery_status === 'mastered').length;
  const conf = CONFIDENCE[rec.confidence_status] || CONFIDENCE.steady;

  return (
    <div style={{ paddingBottom: 32, animation: `tian-in .4s ${T.easeCalm}` }}>
      <ScreenHeader onBack={() => router.push('/')} title="MathPath" subtitle="Adaptive math mastery + fluency" />

      {/* Hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{ background: T.ivory, border: `1px solid ${T.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring value={overall} size={86} stroke={9} label={`${overall}%`} sub="overall" gold />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Mastery score</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', marginBottom: 6 }}>{mastered} of {data.chain.length} mastered</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: conf.c, background: T.paper, border: `1px solid ${T.hairline}`, padding: '3px 10px', borderRadius: 999 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: conf.c }} /> Confidence: {conf.label}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommended next */}
      <Section title="Recommended for now">
        <Card padding={18} active style={{ borderColor: T.gold300 }}>
          <div style={{ display: 'inline-flex', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: kind.tone, background: kind.bg, padding: '3px 10px', borderRadius: 999, marginBottom: 10 }}>{kind.tag}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: T.navy700, color: T.gold500, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{rec.skill.domain === 'fr' ? <IconBook size={20} /> : <IconBolt size={20} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600, color: T.navy700, letterSpacing: '-0.01em' }}>{rec.skill.skill_name}</div>
              <div style={{ fontSize: 12.5, color: T.ink500, marginTop: 3, lineHeight: 1.4 }}>{rec.reason}</div>
            </div>
          </div>
          {(rec.remediation_suggestions?.length > 0 || rec.fluency_drills?.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {rec.remediation_suggestions?.map((r) => <Chip key={r.skill_id} size="s" tone="error">Reteach: {r.skill_name}</Chip>)}
              {rec.fluency_drills?.map((f) => <Chip key={f.skill_id} size="s" tone="gold">Drill: target {f.target_seconds}s</Chip>)}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Button variant="primary" size="m" fullWidth onClick={() => router.push('/mathpath/practice')} iconRight={<IconArrowRight size={16} />}>Start practice</Button>
          </div>
        </Card>
      </Section>

      {/* Skill graph by domain */}
      {data.domains.map((dom) => (
        <Section key={dom.key} title={dom.name} action={<Chip size="s" tone="outline">{dom.skills.filter((s) => s.mastery_status === 'mastered').length}/{dom.skills.length}</Chip>}>
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {dom.skills.map((s, i) => {
              const f = statusChip(s);
              const showSpeed = s.mastery_status !== 'not_started';
              const pct = Math.round(s.score * 100);
              const isRec = s.skill_id === rec.recommended_skill_id;
              return (
                <div key={s.skill_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < dom.skills.length - 1 ? `1px solid ${T.hairline}` : 'none', background: isRec ? T.navy050 : 'transparent', opacity: s.locked && !isRec ? 0.6 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.ink700 }}>{s.skill_name}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13, color: T.navy700 }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} color={T.navy500} height={5} gold={pct >= 85} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.ink500, letterSpacing: '0.06em' }}>{s.level_tag}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: f.bg, color: f.c, padding: '2px 8px', borderRadius: 999 }}>{f.label}</span>
                      {showSpeed && <span style={{ fontSize: 11, color: T.ink500, textTransform: 'capitalize' }}>{s.fluency_status}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </Section>
      ))}
    </div>
  );
}
