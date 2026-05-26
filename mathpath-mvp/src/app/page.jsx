'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { T, MODULE_COLORS } from '@/lib/tokens';
import { Card, Button, Chip, Stat, ProgressBar, Section, Wordmark } from '@/components/ui';
import { IconArrowRight, IconChevronRight, IconFlame, IconBrain, IconBolt, IconBook, IconChart } from '@/components/icons';
import { api, studentId, getStudent, setStudent } from '@/lib/client';

const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// Confidence trend — a calm gold sparkline of recent session mastery (values 0–1).
function Sparkline({ values }) {
  const w = 320, h = 40, p = 3;
  const min = Math.min(...values, 0), max = Math.max(...values, 1);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    p + (i / Math.max(1, values.length - 1)) * (w - p * 2),
    h - p - ((v - min) / span) * (h - p * 2),
  ]);
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="conffill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.gold500} stopOpacity="0.18" />
          <stop offset="100%" stopColor={T.gold500} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#conffill)" />
      <path d={line} fill="none" stroke={T.gold500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={T.gold500} />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [student, setLocal] = useState(null);
  const [name, setName] = useState('');
  const [rec, setRec] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getStudent();
    setLocal(s);
    setReady(true);
    if (s) api.recommendation(studentId()).then(setRec);
  }, []);

  function login(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const s = { id: `stu_${clean.toLowerCase().replace(/\s+/g, '_')}`, name: clean };
    setStudent(s);
    setLocal(s);
    api.recommendation(s.id).then(setRec);
  }

  if (!ready) return null;

  // ── Login ──
  if (!student) {
    return (
      <div style={{ padding: '40px 24px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: `tian-in .5s ${T.easeCalm}` }}>
        <Wordmark />
        <div style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 28 }}>
          One calm place to build mastery.
        </div>
        <p style={{ fontSize: 15, color: T.ink500, lineHeight: 1.5, marginTop: 12 }}>
          Sign in to continue your path. No accounts to set up — just your name for this demo.
        </p>
        <form onSubmit={login} style={{ marginTop: 28 }}>
          <input
            autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
            style={{
              width: '100%', height: 52, padding: '0 18px', marginBottom: 14,
              borderRadius: 14, border: `1px solid ${T.hairline}`, background: T.ivory,
              fontFamily: T.fontText, fontSize: 16, color: T.ink700, outline: 'none',
            }}
          />
          <Button variant="primary" size="l" fullWidth onClick={login} disabled={!name.trim()} iconRight={<IconArrowRight size={18} />}>
            Enter Tian OS
          </Button>
        </form>
      </div>
    );
  }

  // ── Dashboard ──
  const masteryPct = rec ? Math.round((rec.chain.reduce((a, s) => a + s.score, 0) / rec.chain.length) * 100) : 0;
  const nextSkill = rec?.recommendation?.skill?.skill_name || 'Loading…';
  const initial = student.name[0]?.toUpperCase() || 'A';

  const modules = [
    { id: 'mathpath', name: 'MathPath', color: MODULE_COLORS.mathpath, mastery: masteryPct, next: nextSkill, live: true, Icon: IconBolt },
    { id: 'science', name: 'Science', color: MODULE_COLORS.science, next: 'Diagnostic ready', activity: 'Coming soon', Icon: IconChart },
    { id: 'spelling', name: 'Spelling', color: MODULE_COLORS.spelling, next: 'List review', activity: 'Coming soon', Icon: IconBook },
    { id: 'reading', name: 'Reading', color: MODULE_COLORS.reading, next: 'Inference passage', activity: 'Coming soon', Icon: IconBook },
  ];

  return (
    <div style={{ paddingBottom: 32, animation: `tian-in .5s ${T.easeCalm}` }}>
      {/* Greeting + streak */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`, color: T.paper, display: 'grid', placeItems: 'center', fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 18 }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: T.ink500, fontWeight: 500 }}>{today}</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Hello, {student.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.gold100, padding: '8px 12px', borderRadius: 999, color: T.gold700, fontWeight: 600, fontSize: 13 }}>
          <IconFlame size={14} />1
        </div>
      </div>

      {/* Today's plan hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{ background: `linear-gradient(135deg, ${T.navy700} 0%, ${T.navy900} 100%)`, border: 'none', color: T.paper, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.22), transparent 70%)' }} />
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.gold300, marginBottom: 8 }}>Today’s plan</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 4 }}>A quick fluency sprint, then keep climbing</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, lineHeight: 1.45, marginBottom: 16 }}>
            We’ve queued <b style={{ color: T.gold300, fontWeight: 600 }}>{nextSkill}</b> — short, timed, and tuned to where you are.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="gold" size="m" onClick={() => router.push('/mathpath/practice')} iconRight={<IconArrowRight size={16} />}>Start daily sprint</Button>
            <Button variant="ghost" size="m" style={{ color: 'rgba(255,255,255,.8)' }} onClick={() => router.push('/mathpath')}>View plan</Button>
          </div>
        </Card>
      </div>

      {/* KPI row */}
      <Section title="Today">
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat label="Mastery" value={masteryPct} suffix="%" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Skills" value={`${rec ? rec.chain.filter((s) => s.mastery_status === 'mastered').length : 0}/${rec ? rec.chain.length : 6}`} />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Module" value="1" suffix=" active" />
          </div>
          {rec?.last_session && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.hairline}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.ink500 }}>
              <span style={{ fontWeight: 600, color: T.ink700 }}>Last session</span>
              <span>{Math.round(rec.last_session.accuracy * 100)}% accurate</span>
              {rec.last_session.average_time_seconds != null && <span>· {rec.last_session.average_time_seconds}s avg</span>}
              {rec.last_session.mastery_delta > 0 && <span style={{ color: T.success500, fontWeight: 600 }}>· +{Math.round(rec.last_session.mastery_delta * 100)} mastery</span>}
            </div>
          )}
          {rec?.confidence_trend?.length >= 2 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidence</span>
                <span style={{ fontSize: 11, color: T.success500, fontWeight: 600 }}>
                  {rec.confidence_trend[rec.confidence_trend.length - 1] >= rec.confidence_trend[0] ? 'Rising' : 'Building'}
                </span>
              </div>
              <Sparkline values={rec.confidence_trend} />
            </div>
          )}
        </Card>
      </Section>

      {/* Modules */}
      <Section title="Modules" action={<Chip size="s" tone="navy">1 active</Chip>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modules.map((m) => (
            <Card key={m.id} padding={16} onClick={m.live ? () => router.push('/mathpath') : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: m.live ? 1 : 0.6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: m.live ? m.color : T.bone, color: m.live ? T.gold500 : T.ink300, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <m.Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: T.ink700 }}>{m.name}</span>
                  {m.live && <span style={{ fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13, color: T.navy700 }}>{m.mastery}%</span>}
                </div>
                <div style={{ fontSize: 12, color: T.ink500, marginTop: 2, marginBottom: m.live ? 8 : 0 }}>
                  {m.live ? `Next · ${m.next}` : m.activity}
                </div>
                {m.live && <ProgressBar value={m.mastery} color={m.color} gold={m.mastery >= 80} />}
              </div>
              {m.live && <IconChevronRight size={18} color={T.ink300} />}
            </Card>
          ))}
        </div>
      </Section>

      {/* AI coach */}
      <Section title="From your AI coach">
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: T.gold100, color: T.gold700, display: 'grid', placeItems: 'center' }}><IconBrain size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700, lineHeight: 1.3 }}>Keep your multiplication facts sharp</div>
            <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>Timed sprint · ~3 min</div>
          </div>
          <Button variant="primary" size="s" iconRight={<IconArrowRight size={14} />} onClick={() => router.push('/mathpath/practice')}>Start</Button>
        </Card>
      </Section>
    </div>
  );
}
