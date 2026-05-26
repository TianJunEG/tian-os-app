import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, UserCheck, BookOpen, ArrowRight, ArrowLeft,
  LineChart, ScanLine, FileText, FlaskConical, Calculator, SpellCheck,
} from 'lucide-react';
import {
  GOLD, GOLD_SOFT, INK, INK_SOFT, SERIF, SANS, glassPanel,
  Reveal, Eyebrow, Headline, Wordmark, Avatar, TrustRing, EduOSKeyframes,
} from '../components/eduos';

// Founder Story — "Built by Teachers". The fullest expression of the Edu OS launch-video look.
function CurriculumCard() {
  const rows = [
    { wk: 'Wk 1', topic: 'Fractions · part-whole', note: '✓ revise from P4 baseline' },
    { wk: 'Wk 2', topic: 'Ratio · introduction', note: 'part-part vs part-whole' },
    { wk: 'Wk 3', topic: 'Ratio · word problems', note: 'misconception · scaling vs adding' },
    { wk: 'Wk 4', topic: 'Percentage', note: 'connect to fraction & decimal' },
  ];
  return (
    <div style={{ position: 'relative', background: '#f6f1e3', color: '#3a3528', borderRadius: 16, padding: 30, transform: 'rotate(-2deg)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', fontFamily: SERIF }}>
      <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', color: '#9a8c6a', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>Curriculum plan · P5 Math · Term 2</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, padding: '11px 0', borderBottom: i < rows.length - 1 ? '1px solid #d4ccb0' : 'none' }}>
          <span style={{ fontFamily: SANS, fontSize: 12, color: '#9a8c6a', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{r.wk}</span>
          <span>
            <span style={{ display: 'block', fontFamily: SANS, fontSize: 16, color: '#1a1f2e', fontWeight: 600 }}>{r.topic}</span>
            <span style={{ fontSize: 14, fontStyle: 'italic', color: '#6b6450' }}>{r.note}</span>
          </span>
        </div>
      ))}
      <div style={{ position: 'absolute', top: 96, right: 18, fontFamily: "'Caveat', cursive", fontSize: 26, color: '#c04040', transform: 'rotate(6deg)' }}>← key gap!</div>
    </div>
  );
}

function Bubble({ text, dark = false }) {
  return (
    <div style={{ maxWidth: 320, padding: '16px 22px', borderRadius: 22, borderBottomLeftRadius: 6, background: dark ? 'rgba(20,36,68,0.92)' : 'rgba(255,255,255,0.95)', color: dark ? INK : '#1a1f2e', border: dark ? `1px solid ${GOLD_SOFT}` : 'none', fontFamily: SANS, fontSize: 19, fontWeight: 500, boxShadow: '0 14px 30px rgba(0,0,0,0.3)' }}>{text}</div>
  );
}

const MODULES = [
  { icon: LineChart, label: 'Progress Tracking', sub: 'Mastery, weak topics, readiness' },
  { icon: ScanLine, label: 'AI Math Diagnostic', sub: 'Snap a mistake, find the gap' },
  { icon: FileText, label: 'Mastery Worksheets', sub: 'Targeted, auto-generated practice' },
  { icon: FlaskConical, label: 'Primary Science Revision', sub: 'Adaptive open-ended quizzes' },
  { icon: Calculator, label: 'Home Math · P1–P6', sub: 'Structured tutoring programme' },
  { icon: SpellCheck, label: 'Spelling · EN · CN · ML', sub: 'Independent self-testing' },
];
const WHY_TM = [
  { icon: Sparkles, label: 'Better-fit matching', sub: 'Subject + level + learning style + goals' },
  { icon: ShieldCheck, label: 'Verification', sub: 'Identity, credentials, background screened' },
  { icon: UserCheck, label: 'Safety', sub: 'Check-in / check-out, lesson logged' },
  { icon: BookOpen, label: 'Accountability', sub: 'Post-lesson notes, weak topics, next steps' },
];

export default function FounderStoryPage() {
  return (
    <div style={{ background: '#050a14', color: INK, fontFamily: SANS, minHeight: '100vh', overflowX: 'hidden' }}>
      <EduOSKeyframes />

      <header style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)', background: 'rgba(5,10,20,0.7)', borderBottom: '1px solid rgba(180,200,240,0.12)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/"><Wordmark /></Link>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK_SOFT, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </header>

      {/* Scene 1 — Belief / hero */}
      <section style={{ position: 'relative', background: 'radial-gradient(ellipse at 35% 40%, #1a2940 0%, #0a1428 60%, #050a14 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '8%', top: '6%', width: 620, height: 620, background: 'radial-gradient(circle, rgba(255,200,120,0.16) 0%, transparent 60%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '110px 24px 120px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
          <Reveal>
            <Eyebrow>Our story</Eyebrow>
            <Headline style={{ marginTop: 20 }}>Built by teachers<br />who understand learning.</Headline>
            <p style={{ marginTop: 22, maxWidth: 460, fontSize: 19, lineHeight: 1.6, color: INK_SOFT }}>
              TutorMatch and Edu OS were built from years of real teaching experience — Singapore classrooms, exam pressure, learning gaps, and the different ways students learn.
            </p>
          </Reveal>
          <Reveal delay={0.15} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 460, width: '100%' }}><CurriculumCard /></div>
          </Reveal>
        </div>
      </section>

      {/* Scene 2 — Experience */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal><Headline>Primary. Secondary.<br />Special learning needs.</Headline></Reveal>
        <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { lvl: 'Primary', sub: 'P1 – P6 · PSLE prep', stats: [['Years taught', '15+'], ['Subjects', 'Math · Sci · Eng']] },
            { lvl: 'Secondary', sub: 'Sec 1 – Sec 4 · O-Level', stats: [['Years taught', '12+'], ['Subjects', 'Math · A-Math · Sci']] },
            { lvl: 'Learning needs', sub: 'Dyslexia · ADHD · slower processing', stats: [['Approach', 'Adaptive scaffolds'], ['Coaching', 'Confidence-first']] },
          ].map((t, i) => (
            <Reveal key={t.lvl} delay={i * 0.1}>
              <div style={{ ...glassPanel(), padding: 28, minHeight: 300 }}>
                <div style={{ fontSize: 24, color: GOLD, marginBottom: 8 }}>{t.lvl}</div>
                <div style={{ fontSize: 14, color: INK_SOFT, marginBottom: 20, lineHeight: 1.5 }}>{t.sub}</div>
                {t.stats.map((s) => (
                  <div key={s[0]} style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: INK_SOFT, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{s[0]}</div>
                    <div style={{ fontSize: 17, color: INK, marginTop: 4 }}>{s[1]}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scene 3 — Parent pain */}
      <section style={{ background: 'linear-gradient(180deg, #050a14, #091428, #050a14)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
          <Reveal><Headline>Parents need clarity,<br />not guesswork.</Headline></Reveal>
          <div style={{ marginTop: 56, display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start', justifyContent: 'center' }}>
            <Reveal style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Avatar label="Parent" />
              <Bubble text={'"Is my child actually improving?"'} />
            </Reveal>
            <Reveal delay={0.2} style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 40 }}>
              <Bubble text={'"Let me show you the data."'} dark />
              <Avatar label="Teacher" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Scene 4 — Tutor quality */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal><Headline style={{ textAlign: 'center' }}>Good tutoring is more<br />than qualifications.</Headline></Reveal>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          <Reveal>
            <div style={{ ...glassPanel(), padding: 30, height: '100%' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: INK_SOFT, textTransform: 'uppercase', marginBottom: 8 }}>On paper</div>
              <div style={{ fontSize: 24, color: INK, marginBottom: 20, fontFamily: SERIF }}>"Qualified"</div>
              {['Degree · NIE certified', '10 years experience', 'Strong A-Level results', 'Charges $90 / hr'].map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${INK_SOFT}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, color: INK }}>{line}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div style={{ ...glassPanel(true), padding: 30, height: '100%' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', color: GOLD, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>What actually matters</div>
              <div style={{ fontSize: 24, color: INK, marginBottom: 20, fontFamily: SERIF }}>Can they teach?</div>
              {['Diagnoses misconceptions accurately', "Explains clearly at the child's level", 'Adapts to learning style', 'Builds confidence, not just scores'].map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: GOLD, color: '#1a1f2e', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 16, color: INK }}>{line}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Scene 5 — Why TutorMatch */}
      <section style={{ background: 'linear-gradient(180deg, #050a14, #091428, #050a14)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '100px 24px' }}>
          <Reveal><Headline>Better matching starts with<br />better understanding.</Headline></Reveal>
          <div style={{ marginTop: 40 }}>
            {WHY_TM.map((it, i) => (
              <Reveal key={it.label} delay={i * 0.08}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 26px', marginBottom: 14, background: 'rgba(20,36,68,0.6)', border: `1px solid ${GOLD_SOFT}`, borderRadius: 14, backdropFilter: 'blur(20px)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.4)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <it.icon size={24} color={GOLD} />
                  </div>
                  <div>
                    <div style={{ fontSize: 21, fontWeight: 600, color: INK }}>{it.label}</div>
                    <div style={{ fontSize: 15, color: INK_SOFT, marginTop: 3 }}>{it.sub}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Scene 6 — Why Edu OS (modules) */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal>
          <Eyebrow>Beyond tuition</Eyebrow>
          <Headline style={{ marginTop: 20 }}>Learning support between<br />every lesson.</Headline>
        </Reveal>
        <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 }}>
          {MODULES.map((m, i) => (
            <Reveal key={m.label} delay={(i % 3) * 0.08}>
              <div style={{ ...glassPanel(), padding: 26, height: '100%' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.4)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                  <m.icon size={22} color={GOLD} />
                </div>
                <div style={{ fontSize: 19, fontWeight: 600, color: INK }}>{m.label}</div>
                <div style={{ fontSize: 14, color: INK_SOFT, marginTop: 4 }}>{m.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Scene 7 — Trust ring */}
      <section style={{ background: 'radial-gradient(ellipse at 50% 50%, #0f1f3a 0%, #050a14 70%)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '110px 24px', textAlign: 'center' }}>
          <Reveal><TrustRing /></Reveal>
          <Reveal delay={0.2}><Headline style={{ marginTop: 48 }}>Designed for parents.<br />Guided by educators.</Headline></Reveal>
        </div>
      </section>

      {/* Scene 8 — CTA */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%,-50%)', width: 1100, height: 1100, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD_SOFT} 0%, transparent 55%)`, filter: 'blur(40px)', opacity: 0.55, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '120px 24px 130px', textAlign: 'center' }}>
          <Reveal style={{ display: 'flex', justifyContent: 'center' }}><Wordmark size={64} /></Reveal>
          <Reveal delay={0.15}>
            <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 15, fontWeight: 300, color: INK, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.7 }}>+ TutorMatch</div>
          </Reveal>
          <Reveal delay={0.3}><Headline style={{ marginTop: 32 }}>Built by teachers.<br />Powered for parents.</Headline></Reveal>
          <Reveal delay={0.45} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 34px', borderRadius: 999, background: GOLD, color: '#1a1f2e', fontFamily: SANS, fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', boxShadow: `0 20px 40px -10px ${GOLD}55, 0 0 40px ${GOLD_SOFT}` }}>
              Join the launch waitlist <ArrowRight size={18} />
            </Link>
            <div style={{ fontSize: 13, color: INK_SOFT, letterSpacing: '0.06em' }}>eduos.sg · TutorMatch + Edu OS</div>
          </Reveal>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(180,200,240,0.12)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: INK_SOFT }}>
        © Tian Jun Education Group · AI-Native Learning. Built for Every Student.
      </footer>
    </div>
  );
}
