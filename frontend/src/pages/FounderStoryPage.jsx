import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

const RESPONSIVE_CSS = `
  html { scroll-behavior: smooth; }
  ::selection { background: #cf8a44; color: #13223e; }
  @media (max-width: 768px) {
    .story-grid-origin { grid-template-columns: 1fr !important; }
    .story-grid-beliefs { grid-template-columns: 1fr !important; }
    .story-grid-people-cols { grid-template-columns: 1fr !important; }
    .story-grid-timeline { grid-template-columns: 1fr !important; }
    .story-grid-scores { grid-template-columns: 1fr !important; gap: 24px !important; }
    .story-grid-scores .story-arrow { display: none; }
    .story-grid-cta { grid-template-columns: 1fr !important; }
    .story-nav-links { display: none !important; }
    .story-page > section { padding-left: 20px !important; padding-right: 20px !important; }
    .story-page header { padding-left: 20px !important; padding-right: 20px !important; }
  }
`;

const NEWSREADER = "'Newsreader', serif";
const SANS = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const NAVY = '#13223e';
const NAVY_DEEP = '#0e1a31';
const NAVY_MID = '#101d36';
const PAPER = '#f4efe6';
const PAPER_WARM = '#faf6ef';
const INK = '#1d2230';
const INK_LIGHT = '#1c2433';
const BODY = '#3a4150';
const BODY_MUTED = '#5c6472';
const PERIWINKLE = '#5d86f0';
const PERIWINKLE_SOFT = '#8fb1ff';
const PERIWINKLE_MID = '#4f7bf0';
const GOLD = '#cf8a44';
const TEXT_LIGHT = '#f4f0e8';
const TEXT_CREAM = '#f6f2ea';
const TEXT_MUTED_DARK = '#aebbd2';
const TEXT_SECONDARY_DARK = '#b7c3d8';
const TEXT_DIM_DARK = '#8a98b2';
const TEXT_DIMMER = '#6f7f9c';
const TEXT_FOOTER = '#8a8270';
const BORDER_WARM = '#e1d9ca';

function useScrollReveal() {
  const containerRef = useRef(null);

  const initObserver = useCallback(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'none';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = initObserver();
    return cleanup;
  }, [initObserver]);

  return containerRef;
}

const reveal = (delay = 0) => ({
  'data-reveal': true,
  style: {
    opacity: 0,
    transform: 'translateY(26px)',
    transition: `opacity .9s cubic-bezier(.2,.65,.2,1) ${delay}s, transform .9s cubic-bezier(.2,.65,.2,1) ${delay}s`,
  },
});

const eyebrow = (light = false) => ({
  fontFamily: MONO,
  fontSize: 12.5,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: light ? PERIWINKLE_SOFT : PERIWINKLE_MID,
  marginBottom: 28,
});

const sectionH2 = (light = false) => ({
  fontFamily: NEWSREADER,
  fontWeight: 400,
  fontSize: 'clamp(32px, 4.4vw, 58px)',
  lineHeight: 1.08,
  letterSpacing: '-0.02em',
  margin: 0,
  color: light ? TEXT_CREAM : INK_LIGHT,
});

const bodyText = (light = false) => ({
  margin: 0,
  fontSize: 18.5,
  lineHeight: 1.72,
  color: light ? TEXT_SECONDARY_DARK : BODY,
});

const BELIEFS = [
  {
    num: '01',
    title: 'Every student can rise with the right approach.',
    body: "A 9 became an A. We've seen it too many times to believe any learner is a lost cause — they simply haven't been reached the right way yet.",
  },
  {
    num: '02',
    title: 'Technology should multiply teachers, not replace them.',
    body: "The goal was never to remove the teacher from the room. It's to let one teacher's care reach the students she could never have reached alone.",
  },
  {
    num: '03',
    title: 'Built from real pain, not a product spec.',
    body: 'Mainstream and special-ed classrooms, tuition, online learning — every feature answers a frustration our founder lived through firsthand.',
  },
];

const TIMELINE = [
  {
    period: 'Age 16',
    title: 'It started with one student at a time.',
    body: 'Peer tutoring, then private tuition. The first taste of a truth that would shape everything: teaching changes lives, one learner at a time.',
  },
  {
    period: 'Trained at NIE',
    title: 'Formal training at the National Institute of Education.',
    body: 'The craft of teaching, learned rigorously — pedagogy, assessment, and how real students actually move from confusion to understanding.',
  },
  {
    period: 'Mainstream & special ed',
    title: 'Posted to a mainstream school, then a special education school.',
    body: 'Two very different kinds of classroom, one lesson in common: no two students learn the same way, and good teaching meets each one where they are.',
  },
  {
    period: 'Tuition franchise',
    title: 'Ran a tuition franchise and private practice.',
    body: 'Teaching at scale for the first time — and running headlong into the ceiling of what hours and human limits will allow.',
  },
  {
    period: 'COVID',
    title: 'Pivoted to online lessons through the lockdowns.',
    body: 'When classrooms closed, teaching went on through a screen — proof that the right technology could carry real learning anywhere.',
  },
  {
    period: 'Today — Tian OS',
    title: 'The platform built to lift the ceiling for good.',
    body: "Everything those years taught her, turned into software — so the right approach can reach every student, not just the ones who find the right teacher.",
    highlight: true,
  },
];

function HoverLink({ to, baseStyle, hoverStyle, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      style={{ ...baseStyle, ...(hovered ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

function TianLogo({ size = 26, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.27,
          background: `linear-gradient(135deg, ${PERIWINKLE}, ${PERIWINKLE_SOFT})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: NEWSREADER,
          fontWeight: 600,
          color: NAVY_DEEP,
          fontSize: size * 0.65,
        }}
      >
        T
      </div>
      <span
        style={{
          fontWeight: 600,
          fontSize: size * 0.65,
          letterSpacing: '-0.01em',
          color: light ? TEXT_LIGHT : INK_LIGHT,
          whiteSpace: 'nowrap',
        }}
      >
        Tian OS
      </span>
    </div>
  );
}

export default function FounderStoryPage() {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      className="story-page"
      style={{
        fontFamily: SANS,
        color: INK,
        background: PAPER,
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
      />

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
          color: TEXT_LIGHT,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 460,
            height: 460,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <header
          style={{
            position: 'relative',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '30px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <TianLogo light />
          </Link>
          <nav
            className="story-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              fontSize: 14.5,
              color: TEXT_MUTED_DARK,
            }}
          >
            <span style={{ color: TEXT_LIGHT }}>Our Story</span>
            <Link to="/edu-apps" style={{ color: 'inherit', textDecoration: 'none' }}>
              Platform
            </Link>
            <span>For Schools</span>
            <Link
              to="/register"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '9px 18px',
                borderRadius: 999,
                color: TEXT_LIGHT,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              Book a demo
            </Link>
          </nav>
        </header>

        <div
          style={{
            position: 'relative',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '80px 40px 130px',
          }}
        >
          <div {...reveal(0)}>
            <div style={eyebrow(true)}>Our Story</div>
            <h1
              style={{
                fontFamily: NEWSREADER,
                fontWeight: 400,
                fontSize: 'clamp(42px, 6.2vw, 92px)',
                lineHeight: 1.02,
                letterSpacing: '-0.022em',
                margin: 0,
                maxWidth: '17ch',
                color: TEXT_CREAM,
              }}
            >
              We started Tian OS because teaching is too important to do{' '}
              <em style={{ fontStyle: 'italic', color: PERIWINKLE_SOFT }}>alone</em>.
            </h1>
          </div>
          <p
            {...reveal(0.12)}
            style={{
              ...reveal(0.12).style,
              margin: '40px 0 0',
              maxWidth: '58ch',
              fontSize: 'clamp(18px, 1.6vw, 21px)',
              lineHeight: 1.6,
              color: TEXT_SECONDARY_DARK,
            }}
          >
            Every child deserves a teacher who knows exactly where they are. We're building
            the platform that makes that possible — at the scale of a whole school, not just the
            lucky few.
          </p>

          <div
            {...reveal(0.24)}
            style={{
              ...reveal(0.24).style,
              marginTop: 70,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: TEXT_DIM_DARK,
              fontSize: 13,
              fontFamily: MONO,
              letterSpacing: '0.1em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 1,
                height: 46,
                background: `linear-gradient(${PERIWINKLE_SOFT}, transparent)`,
              }}
            />
            <span>SCROLL TO READ</span>
          </div>
        </div>
      </section>

      {/* ── ORIGIN ── */}
      <section style={{ background: PAPER, padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow() }}>
            The beginning
          </div>
          <div
            className="story-grid-origin"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.05fr 0.95fr',
              gap: 'clamp(40px, 6vw, 100px)',
              alignItems: 'start',
            }}
          >
            <h2 {...reveal(0)} style={{ ...reveal(0).style, ...sectionH2() }}>
              It started in a classroom, not a boardroom.
            </h2>
            <div {...reveal(0.1)} style={{ ...reveal(0.1).style, paddingTop: 8 }}>
              <p style={{ ...bodyText(), marginBottom: 22 }}>
                Our founder has been teaching since she was sixteen — first as a peer tutor,
                then a private one. She trained at Singapore's National Institute of Education,
                was posted to a mainstream school and later transferred to a special education
                school, ran a tuition franchise alongside her own private tuition, and kept
                teaching online through the COVID lockdowns when classrooms emptied overnight.
              </p>
              <p style={bodyText()}>
                Across more than two decades and every kind of learner, one frustration never
                left her: there are only so many students one teacher can reach. She always
                believed technology could lift that ceiling. Tian OS is that belief, built.
              </p>
            </div>
          </div>

          <blockquote
            {...reveal(0)}
            style={{
              ...reveal(0).style,
              margin: 'clamp(60px, 8vw, 110px) 0 0',
              padding: '0 0 0 clamp(24px, 4vw, 56px)',
              borderLeft: `2px solid ${GOLD}`,
              maxWidth: '24ch',
            }}
          >
            <p
              style={{
                fontFamily: NEWSREADER,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(26px, 3.4vw, 42px)',
                lineHeight: 1.22,
                letterSpacing: '-0.015em',
                margin: 0,
                color: INK_LIGHT,
              }}
            >
              "There are only so many students one teacher can reach. I wanted to reach more."
            </p>
          </blockquote>
        </div>
      </section>

      {/* ── THE MOMENT ── */}
      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_MID})`,
          color: TEXT_LIGHT,
          padding: 'clamp(90px, 12vw, 160px) 40px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 760 }}>
            <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow(true) }}>
              The moment that changed everything
            </div>
            <h2 {...reveal(0)} style={{ ...reveal(0).style, ...sectionH2(true) }}>
              One girl. One number that didn't define her.
            </h2>
          </div>

          <p
            {...reveal(0.08)}
            style={{
              ...reveal(0.08).style,
              ...bodyText(true),
              margin: '34px 0 0',
              maxWidth: '62ch',
            }}
          >
            A Primary 5 girl came to our founder with a score of 9 out of 100. Most would have
            written her off. Instead, the right guidance met the right student — and her whole
            trajectory bent.
          </p>

          {/* Score progression */}
          <div
            className="story-grid-scores"
            {...reveal(0.14)}
            style={{
              ...reveal(0.14).style,
              marginTop: 'clamp(48px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              gap: 'clamp(14px, 2.5vw, 36px)',
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              padding: 'clamp(36px, 5vw, 56px) 0',
            }}
          >
            <div>
              <div style={{ fontFamily: NEWSREADER, fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 1, color: TEXT_CREAM }}>
                9<span style={{ fontSize: '0.36em', color: TEXT_DIMMER }}>/100</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: TEXT_MUTED_DARK, lineHeight: 1.4 }}>
                Where she started<br />
                <span style={{ color: TEXT_DIMMER }}>Primary 5 exam</span>
              </div>
            </div>
            <div className="story-arrow" style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 26, color: GOLD }}>→</div>
            <div>
              <div style={{ fontFamily: NEWSREADER, fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 1, color: TEXT_CREAM }}>
                ~65
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: TEXT_MUTED_DARK, lineHeight: 1.4 }}>
                A year of guidance later<br />
                <span style={{ color: TEXT_DIMMER }}>PSLE, Primary 6</span>
              </div>
            </div>
            <div className="story-arrow" style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 26, color: GOLD }}>→</div>
            <div>
              <div style={{ fontFamily: NEWSREADER, fontSize: 'clamp(44px, 7vw, 84px)', lineHeight: 1, color: PERIWINKLE_SOFT }}>
                A
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: TEXT_MUTED_DARK, lineHeight: 1.4 }}>
                Taught again, Sec 3–5<br />
                <span style={{ color: TEXT_DIMMER }}>O-Level result</span>
              </div>
            </div>
          </div>

          <p
            {...reveal(0)}
            style={{
              ...reveal(0).style,
              ...bodyText(true),
              margin: 'clamp(36px, 5vw, 56px) 0 0',
              maxWidth: '62ch',
            }}
          >
            There are many stories like hers — students who simply needed someone who understood
            how they learned. The approach works.{' '}
            <em style={{ fontStyle: 'italic', color: '#d9c4a0' }}>
              What if it didn't depend on being lucky enough to find the right teacher?
            </em>{' '}
            That question is why Tian OS exists.
          </p>
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ── */}
      <section style={{ background: PAPER_WARM, padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 760 }}>
            <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow() }}>
              What we believe
            </div>
            <h2 {...reveal(0)} style={{ ...reveal(0).style, ...sectionH2() }}>
              Twenty years in the classroom taught us{' '}
              <em style={{ fontStyle: 'italic', color: PERIWINKLE_MID }}>what to build</em>.
            </h2>
          </div>

          <div
            className="story-grid-beliefs"
            style={{
              marginTop: 'clamp(56px, 7vw, 96px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(28px, 3vw, 48px)',
              borderTop: `1px solid ${BORDER_WARM}`,
              paddingTop: 56,
            }}
          >
            {BELIEFS.map((b, i) => (
              <div
                key={b.num}
                {...reveal(i * 0.1)}
                style={{ ...reveal(i * 0.1).style }}
              >
                <div
                  style={{
                    fontFamily: NEWSREADER,
                    fontSize: 30,
                    color: GOLD,
                    marginBottom: 22,
                  }}
                >
                  {b.num}
                </div>
                <h3
                  style={{
                    fontFamily: NEWSREADER,
                    fontWeight: 500,
                    fontSize: 23,
                    lineHeight: 1.25,
                    margin: '0 0 14px',
                    color: INK_LIGHT,
                  }}
                >
                  {b.title}
                </h3>
                <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, color: BODY_MUTED }}>
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PEOPLE ── */}
      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_MID})`,
          color: TEXT_LIGHT,
          padding: 'clamp(90px, 12vw, 160px) 40px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}>
            <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow(true) }}>
              The people
            </div>
            <h2 {...reveal(0)} style={{ ...reveal(0).style, ...sectionH2(true) }}>
              Built by educators and engineers.
            </h2>
            <p
              {...reveal(0.08)}
              style={{
                ...reveal(0.08).style,
                ...bodyText(true),
                margin: '32px 0 0',
                maxWidth: '60ch',
              }}
            >
              Half of building Tian OS is knowing what a struggling student looks like at eight
              o'clock on a Monday morning. The other half is building software worthy of that
              knowledge. We won't do one without the other.
            </p>
          </div>

          <div
            className="story-grid-people-cols"
            style={{
              marginTop: 'clamp(52px, 7vw, 88px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 80px)',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 52,
            }}
          >
            <div {...reveal(0)} style={reveal(0).style}>
              <div
                style={{
                  fontFamily: NEWSREADER,
                  fontStyle: 'italic',
                  fontSize: 26,
                  color: GOLD,
                  marginBottom: 16,
                }}
              >
                The educator
              </div>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.66, color: TEXT_MUTED_DARK }}>
                More than twenty years across mainstream classrooms, special education, tuition,
                and online learning. Every instinct in Tian OS comes from a teacher who has
                actually sat beside the child who scored a 9 — and refused to give up on her.
              </p>
            </div>
            <div {...reveal(0.12)} style={reveal(0.12).style}>
              <div
                style={{
                  fontFamily: NEWSREADER,
                  fontStyle: 'italic',
                  fontSize: 26,
                  color: GOLD,
                  marginBottom: 16,
                }}
              >
                The engineers
              </div>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.66, color: TEXT_MUTED_DARK }}>
                Builders who turn that instinct into something a whole school can hold —
                translating two decades of hard-won classroom judgment into tools every teacher
                can reach for, every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE JOURNEY (TIMELINE) ── */}
      <section style={{ background: PAPER, padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 720, marginBottom: 'clamp(56px, 7vw, 90px)' }}>
            <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow() }}>
              The journey
            </div>
            <h2 {...reveal(0)} style={{ ...reveal(0).style, ...sectionH2() }}>
              From one classroom to a platform.
            </h2>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER_WARM}` }}>
            {TIMELINE.map((item, i) => (
              <div
                className="story-grid-timeline"
                key={item.period}
                {...reveal(i * 0.05)}
                style={{
                  ...reveal(i * 0.05).style,
                  display: 'grid',
                  gridTemplateColumns: '210px 1fr',
                  gap: 24,
                  padding: '30px 0',
                  borderBottom: `1px solid ${BORDER_WARM}`,
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontFamily: NEWSREADER,
                    fontSize: 23,
                    color: item.highlight ? PERIWINKLE_SOFT : PERIWINKLE_MID,
                    lineHeight: 1.2,
                  }}
                >
                  {item.period}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: NEWSREADER,
                      fontWeight: 500,
                      fontSize: 22,
                      margin: '0 0 6px',
                      color: INK_LIGHT,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16.5,
                      lineHeight: 1.6,
                      color: BODY_MUTED,
                      maxWidth: '60ch',
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
          color: TEXT_LIGHT,
          padding: 'clamp(110px, 15vw, 200px) 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 640,
            height: 640,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 62%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto' }}>
          <div {...reveal(0)} style={{ ...reveal(0).style, ...eyebrow(true), marginBottom: 36 }}>
            Where we're going
          </div>
          <h2
            {...reveal(0)}
            style={{
              ...reveal(0).style,
              fontFamily: NEWSREADER,
              fontWeight: 400,
              fontSize: 'clamp(34px, 5vw, 68px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0,
              color: TEXT_CREAM,
            }}
          >
            From one classroom to <em style={{ fontStyle: 'italic', color: PERIWINKLE_SOFT }}>every</em>{' '}
            classroom.
          </h2>
          <p
            {...reveal(0.12)}
            style={{
              ...reveal(0.12).style,
              margin: '32px auto 0',
              maxWidth: '56ch',
              fontSize: 'clamp(18px, 1.6vw, 21px)',
              lineHeight: 1.62,
              color: TEXT_SECONDARY_DARK,
            }}
          >
            Built on a deep understanding of where teachers actually struggle, Tian OS exists to
            help more students everywhere — not just the ones lucky enough to find the right
            teacher.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: PAPER_WARM, padding: 'clamp(90px, 12vw, 150px) 40px clamp(70px, 8vw, 90px)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div
            className="story-grid-cta"
            {...reveal(0)}
            style={{
              ...reveal(0).style,
              background: NAVY,
              borderRadius: 24,
              padding: 'clamp(44px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: 'clamp(32px, 5vw, 70px)',
              alignItems: 'center',
              color: TEXT_LIGHT,
            }}
          >
            <div>
              <div style={eyebrow(true)}>Partner with us</div>
              <h2
                style={{
                  fontFamily: NEWSREADER,
                  fontWeight: 400,
                  fontSize: 'clamp(30px, 3.8vw, 50px)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  margin: '0 0 18px',
                  color: TEXT_CREAM,
                }}
              >
                Bring Tian OS to your school.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.65,
                  color: TEXT_MUTED_DARK,
                  maxWidth: '46ch',
                }}
              >
                See how a platform built by a teacher, on real classroom pain points, helps your
                educators reach every student. We'll walk you through it.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <HoverLink
                to="/register"
                baseStyle={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: PERIWINKLE,
                  color: NAVY_DEEP,
                  fontWeight: 600,
                  fontSize: 16.5,
                  padding: '17px 28px',
                  borderRadius: 12,
                  transition: 'background .2s',
                }}
                hoverStyle={{ background: PERIWINKLE_SOFT }}
              >
                Book a demo
              </HoverLink>
              <HoverLink
                to="/register"
                baseStyle={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  background: 'transparent',
                  color: TEXT_LIGHT,
                  fontWeight: 600,
                  fontSize: 16.5,
                  padding: '17px 28px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.22)',
                  transition: 'border-color .2s',
                }}
                hoverStyle={{ borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Talk to our team
              </HoverLink>
            </div>
          </div>

          <footer
            style={{
              marginTop: 'clamp(50px, 6vw, 80px)',
              paddingTop: 30,
              borderTop: `1px solid ${BORDER_WARM}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <TianLogo size={24} />
            <div
              style={{
                fontSize: 14,
                color: TEXT_FOOTER,
                fontFamily: MONO,
                letterSpacing: '0.03em',
              }}
            >
              An AI-native learning platform for schools.
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
