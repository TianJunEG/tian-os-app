import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  CORAL, CORAL_GLOW, TEAL, TEAL_DARK, IVORY, SKY, INK, INK_SOFT, SERIF, SANS, glassPanel,
  Reveal, Eyebrow, Headline, Wordmark, TianOSKeyframes,
} from '../components/tianos';

const MILESTONES = [
  { year: '2000s', label: 'Started tutoring at 16', detail: 'Private and peer tutoring while still in school' },
  { year: '2010s', label: 'NIE-trained educator', detail: 'National Institute of Education, Singapore' },
  { year: '', label: 'Mainstream school posting', detail: 'Primary and secondary mathematics' },
  { year: '', label: 'Special education school', detail: 'Adapting methods for diverse learning needs' },
  { year: '', label: 'Tuition franchise', detail: 'Scaling the teaching approach to more students' },
  { year: '2020', label: 'COVID pivot to online', detail: 'Conducted online lessons during lockdown' },
  { year: '2024', label: 'Built Tian OS', detail: 'From one classroom to every classroom' },
];

const BELIEFS = [
  {
    num: '01',
    title: 'The right approach works',
    body: 'A student who scores 9 out of 100 can reach an A at O-Levels. We have seen it. The method matters more than the starting point.',
  },
  {
    num: '02',
    title: 'Teachers should be multiplied, not replaced',
    body: 'AI does not replace the teacher. It gives every student the benefit of a teacher who knows exactly where they are — even when the teacher cannot be in the room.',
  },
  {
    num: '03',
    title: 'Built from real pain, not theory',
    body: 'Every feature in Tian OS comes from a classroom problem our founder has lived through — misconception patterns, confidence gaps, the limits of one-size-fits-all worksheets.',
  },
];

function ScoreProgression() {
  const stages = [
    { score: '9', label: 'P5 Exam', sub: 'out of 100', color: '#B4453C' },
    { score: '~65', label: 'PSLE', sub: 'Primary 6', color: '#D4A935' },
    { score: 'A', label: 'O-Levels', sub: 'Secondary 5', color: '#2F8F6F' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
      {stages.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && (
            <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, ${stages[i - 1].color}, ${s.color})`, margin: '0 -2px', flexShrink: 0 }} />
          )}
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              border: `3px solid ${s.color}`, display: 'grid', placeItems: 'center',
              margin: '0 auto 12px',
            }}>
              <span style={{ fontFamily: SERIF, fontSize: s.score.length > 2 ? 28 : 36, fontWeight: 400, color: s.color }}>{s.score}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: IVORY }}>{s.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,248,234,0.6)', marginTop: 2 }}>{s.sub}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FounderStoryPage() {
  return (
    <div style={{ background: IVORY, color: INK, fontFamily: SANS, minHeight: '100vh', overflowX: 'hidden' }}>
      <TianOSKeyframes />

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)', background: 'rgba(255,248,234,0.85)', borderBottom: '1px solid rgba(15,76,92,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><Wordmark /></Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link to="/founder" style={{ fontSize: 14, fontWeight: 600, color: TEAL, textDecoration: 'none' }}>Our Story</Link>
            <Link to="/edu-apps" style={{ fontSize: 14, fontWeight: 500, color: INK_SOFT, textDecoration: 'none' }}>Platform</Link>
            <Link to="/methodology" style={{ fontSize: 14, fontWeight: 500, color: INK_SOFT, textDecoration: 'none' }}>Our Approach</Link>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 999, background: CORAL, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: `0 10px 24px -8px ${CORAL_GLOW}` }}>
              Book a demo
            </Link>
          </nav>
        </div>
      </header>

      {/* 1 — Hero */}
      <section style={{ position: 'relative', background: `linear-gradient(170deg, ${TEAL_DARK} 0%, ${TEAL} 60%, ${IVORY} 100%)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '10%', top: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(167,216,240,0.18) 0%, transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '130px 24px 140px', textAlign: 'center' }}>
          <Reveal>
            <Eyebrow style={{ color: 'rgba(255,248,234,0.6)' }}>Our story</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline style={{ marginTop: 24, color: IVORY, fontSize: 'clamp(34px, 5.2vw, 64px)' }}>
              We started Tian OS because teaching is too important to do{' '}
              <em style={{ fontStyle: 'italic', color: SKY }}>alone</em>.
            </Headline>
          </Reveal>
          <Reveal delay={0.2}>
            <p style={{ marginTop: 28, maxWidth: 640, margin: '28px auto 0', fontSize: 20, lineHeight: 1.65, color: 'rgba(255,248,234,0.8)' }}>
              Every child deserves a teacher who knows exactly where they are.
              We're building the platform that makes that possible — at the scale
              of a whole school, not just the lucky few.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2 — Origin */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal>
          <Eyebrow>The beginning</Eyebrow>
          <Headline style={{ marginTop: 18 }}>It started in a classroom,<br />not a boardroom.</Headline>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.7, color: INK_SOFT, maxWidth: 720 }}>
            Our founder started teaching at 16 — first as a peer tutor, then as a private tutor
            putting herself through school. She trained at the National Institute of Education,
            was posted to a mainstream school, then transferred to a special education school where
            she learned to adapt every lesson to every learner.
          </p>
          <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.7, color: INK_SOFT, maxWidth: 720 }}>
            She ran a tuition franchise. She did private tuition. When COVID locked everyone down,
            she moved her classroom online. Through every chapter, one frustration stayed constant:
            there are only so many students one teacher can reach.
          </p>
        </Reveal>
      </section>

      {/* 3 — The Moment */}
      <section style={{ background: TEAL_DARK }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <Reveal>
            <Eyebrow style={{ color: CORAL }}>The moment that changed everything</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ marginTop: 28, fontSize: 20, lineHeight: 1.7, color: 'rgba(255,248,234,0.85)', maxWidth: 640, margin: '28px auto 0' }}>
              A Primary 5 girl walked into our founder's classroom scoring 9 out of 100.
              Under her guidance, the girl scored around 65 for PSLE. Years later, our founder
              taught her again — from Secondary 3 to Secondary 5 — and she achieved an A at O-Levels.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ marginTop: 48 }}>
              <ScoreProgression />
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <p style={{ marginTop: 48, fontSize: 22, fontFamily: SERIF, fontWeight: 300, fontStyle: 'italic', color: IVORY, maxWidth: 560, margin: '48px auto 0' }}>
              "There are many cases like this. What if it didn't depend on being lucky enough
              to find the right teacher?"
            </p>
          </Reveal>
        </div>
      </section>

      {/* 4 — What We Believe */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal>
          <Eyebrow>What we believe</Eyebrow>
          <Headline style={{ marginTop: 18 }}>Three principles from<br />twenty years in the classroom.</Headline>
        </Reveal>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {BELIEFS.map((b, i) => (
            <Reveal key={b.num} delay={i * 0.1}>
              <div style={{ ...glassPanel(), padding: 32, height: '100%' }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: CORAL, marginBottom: 14 }}>{b.num}</div>
                <div style={{ fontSize: 21, fontWeight: 600, color: INK, marginBottom: 12, fontFamily: SERIF }}>{b.title}</div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: INK_SOFT, margin: 0 }}>{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5 — The People */}
      <section style={{ background: TEAL_DARK }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <Reveal>
            <Eyebrow style={{ color: 'rgba(255,248,234,0.6)' }}>The people</Eyebrow>
            <Headline style={{ marginTop: 18, color: IVORY }}>Built by educators<br />and engineers.</Headline>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.7, color: 'rgba(255,248,234,0.8)', maxWidth: 600, margin: '24px auto 0' }}>
              Tian OS is not an edtech company that hired a teacher as a consultant.
              It was founded by a teacher who brought in engineers to translate 20 years
              of classroom instinct into software — diagnostic assessment, adaptive practice,
              and mastery analytics that work the way a good teacher thinks.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 6 — The Journey (Timeline) */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '100px 24px' }}>
        <Reveal>
          <Eyebrow>The journey</Eyebrow>
          <Headline style={{ marginTop: 18 }}>20+ years of learning<br />how students learn.</Headline>
        </Reveal>
        <div style={{ marginTop: 48 }}>
          {MILESTONES.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.06}>
              <div style={{
                display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16,
                padding: '20px 0',
                borderBottom: i < MILESTONES.length - 1 ? '1px solid rgba(15,76,92,0.10)' : 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEAL, letterSpacing: '0.04em', paddingTop: 3 }}>{m.year}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: INK }}>{m.label}</div>
                  <div style={{ fontSize: 14, color: INK_SOFT, marginTop: 3 }}>{m.detail}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7 — CTA */}
      <section style={{ position: 'relative', overflow: 'hidden', background: TEAL_DARK }}>
        <div style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,216,240,0.12) 0%, transparent 55%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '120px 24px 130px', textAlign: 'center' }}>
          <Reveal style={{ display: 'flex', justifyContent: 'center' }}><Wordmark size={56} onDark /></Reveal>
          <Reveal delay={0.15}>
            <Headline style={{ marginTop: 32, color: IVORY }}>Bring Tian OS<br />to your school.</Headline>
          </Reveal>
          <Reveal delay={0.25}>
            <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.6, color: 'rgba(255,248,234,0.7)', maxWidth: 480, margin: '20px auto 0' }}>
              From one classroom to every classroom. See how Tian OS can support
              your teachers and students.
            </p>
          </Reveal>
          <Reveal delay={0.35} style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 36px', borderRadius: 999,
              background: CORAL, color: '#fff', fontSize: 16, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: `0 20px 40px -10px ${CORAL_GLOW}`,
            }}>
              Book a demo <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer style={{ background: TEAL_DARK, borderTop: '1px solid rgba(255,248,234,0.1)', padding: '28px 24px', textAlign: 'center', fontSize: 13, color: 'rgba(255,248,234,0.6)' }}>
        &copy; Tian Jun Education Group &middot; AI-Native Learning Infrastructure for Schools.
      </footer>
    </div>
  );
}
