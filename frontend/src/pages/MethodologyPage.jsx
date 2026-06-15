import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, CheckCircle2, BookOpenCheck, Workflow, Timer, ClipboardList, Eye } from 'lucide-react';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const principles = [
  { icon: Eye,           title: 'Diagnostic Assessment',            body: 'Identify the student's current strengths, weak skills and readiness before assigning practice.' },
  { icon: ClipboardList, title: 'Explicit and Guided Practice',     body: 'Break learning into clear steps, worked examples and guided review before independent practice.' },
  { icon: CheckCircle2,  title: 'Visual Representations',          body: 'Use diagrams, number lines, fraction models and visual supports to make abstract ideas visible.' },
  { icon: BookOpenCheck, title: 'Working Evidence',                 body: 'Encourage students to show their method so misunderstandings can be diagnosed by process, not only by final answer.' },
  { icon: Timer,         title: 'Confidence and Misconception Signals', body: 'Track whether students are confident, unsure, or need help so overconfident errors can be detected early.' },
  { icon: Workflow,      title: 'Progress Monitoring',              body: 'Track practice, mistakes, fluency and mastery over time so support can be adjusted as students grow.' },
];

const flowSteps = [
  'Diagnostic',
  'Practice',
  'Working Evidence',
  'Mistake Analysis',
  'Targeted Review',
  'Fluency',
  'Mastery Check',
  'Progress Monitoring',
];

const references = [
  {
    title: 'Institute of Education Sciences, What Works Clearinghouse',
    subtitle: 'Assisting Students Struggling with Mathematics: Response to Intervention for Elementary and Middle Schools.',
    url: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/26',
  },
  {
    title: 'National Center on Intensive Intervention',
    subtitle: 'Mathematics Intervention Resources.',
    url: 'https://intensiveintervention.org/implementation-intervention/math-lessons',
  },
  {
    title: 'National Mathematics Advisory Panel',
    subtitle: 'Foundations for Success: The Final Report of the National Mathematics Advisory Panel.',
    url: 'https://files.eric.ed.gov/fulltext/ED500486.pdf',
  },
];

const GRID = 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)';

export default function MethodologyPage() {
  const flowRows = [flowSteps.slice(0, 4), flowSteps.slice(4)];
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Seo
        title="The Tian OS MathPath Framework"
        description="Learn how the Tian OS MathPath remediation framework supports students with diagnostic assessment, targeted practice, working evidence, and progress monitoring."
        path="/methodology"
      />
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: GRID, backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: -120, right: -80, width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)', pointerEvents: 'none' }} />

        <MarketingHeader />

        <main id="main">
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '80px 40px 130px', position: 'relative' }}>
            <div data-reveal style={{ display: 'inline-block', marginBottom: 28, fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff' }}>
              MathPath Methodology
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(42px, 6.2vw, 86px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', maxWidth: '22ch', margin: '0 0 24px' }}>
              The Tian OS MathPath Framework
            </h1>
            <p data-reveal data-delay="2" style={{ maxWidth: '58ch', fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', margin: '0 0 44px' }}>
              MathPath is designed to help students move from mistakes to mastery through diagnostic assessment, targeted practice, working analysis, confidence tracking and progress monitoring.
            </p>
            <div data-reveal data-delay="3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#5d86f0', color: '#0e1a31', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                Start Learning <ArrowRight size={16} />
              </Link>
              <Link to="/our-story" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                Read Our Story
              </Link>
            </div>
          </div>
        </main>
      </section>

      {/* ===== WHY SECTION ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 130px) 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(26px, 3.6vw, 46px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 28 }}>
            Why remediation needs more than more questions
          </h2>
          <p data-reveal data-delay="1" style={{ fontSize: 18, lineHeight: 1.7, color: '#4a5568', marginBottom: 16 }}>
            Many students do not improve simply by doing more questions. They improve when the learning gap is first found, the method is shown clearly, and practice is targeted to the exact skill they need next.
          </p>
          <p data-reveal data-delay="2" style={{ fontSize: 18, lineHeight: 1.7, color: '#4a5568' }}>
            Tian OS MathPath is built around this principle.
          </p>
        </div>
      </section>

      {/* ===== PRINCIPLES ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e 0%, #101d36 100%)', padding: 'clamp(80px, 11vw, 140px) 40px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -160, left: '50%', transform: 'translateX(-50%)', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 62%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
            Evidence-informed principles
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 50px)', lineHeight: 1.12, letterSpacing: '-0.02em', color: '#f6f2ea', maxWidth: '26ch', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
            Built for sustained learning, not short-term guessing
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {principles.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} data-reveal data-delay={i + 1} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: '30px 26px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(93,134,240,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={20} color="#8fb1ff" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#f6f2ea', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#aebbd2' }}>{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FLOW ===== */}
      <section style={{ background: '#faf6ef', padding: 'clamp(80px, 11vw, 130px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 16, textAlign: 'center' }}>
            How MathPath works
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 50px)', lineHeight: 1.12, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 52, textAlign: 'center' }}>
            A clear learning loop
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {flowRows.map((row, rowIndex) => (
              <div key={rowIndex} data-reveal data-delay={rowIndex + 1}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {row.map((step, index) => (
                    <Fragment key={step}>
                      <div style={{ minWidth: 200, background: '#fff', borderRadius: 14, border: '1px solid #e0d8cc', padding: '14px 20px', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5d86f0', fontWeight: 600, marginBottom: 4 }}>
                          Step {rowIndex * 4 + index + 1}
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1c2433' }}>{step}</p>
                      </div>
                      {index < row.length - 1 && (
                        <ArrowRight size={16} color="#c8bfb0" />
                      )}
                    </Fragment>
                  ))}
                </div>
                {rowIndex < flowRows.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                    <ArrowDown size={16} color="#c8bfb0" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: '#8a8270', textAlign: 'center' }}>The sequence is designed so students revisit methods before moving on.</p>
        </div>
      </section>

      {/* ===== WHAT MAKES US DIFFERENT ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 130px) 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 16 }}>
            What makes Tian OS different
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(26px, 3.6vw, 46px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 28 }}>
            Right answers, right signals
          </h2>
          <p data-reveal data-delay="2" style={{ fontSize: 18, lineHeight: 1.7, color: '#4a5568', marginBottom: 16 }}>
            Most systems can tell whether an answer is right or wrong. Tian OS is being built to understand the learning behaviour around the answer: confidence, time taken, working evidence, repeated mistakes and remediation progress.
          </p>
          <p data-reveal data-delay="3" style={{ fontSize: 18, lineHeight: 1.7, color: '#4a5568' }}>
            This helps parents, tutors and teachers understand what kind of support a student may need next.
          </p>
        </div>
      </section>

      {/* ===== RESEARCH ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e 0%, #101d36 100%)', padding: 'clamp(80px, 11vw, 130px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 16 }}>
            Research alignment
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 50px)', lineHeight: 1.12, letterSpacing: '-0.02em', color: '#f6f2ea', maxWidth: '28ch', marginBottom: 28 }}>
            Evidence-informed, with careful framing
          </h2>
          <p data-reveal data-delay="2" style={{ fontSize: 17, lineHeight: 1.7, color: '#b7c3d8', maxWidth: '70ch', marginBottom: 32 }}>
            Tian OS MathPath is designed around intervention principles consistent with recommendations from recognised education research bodies, including:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {references.map((item, i) => (
              <li key={item.title} data-reveal data-delay={i + 1} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 600, color: '#f6f2ea', display: 'block', marginBottom: 4 }}>{item.title}:</span>
                <span style={{ color: '#aebbd2', fontSize: 15 }}>{item.subtitle}{' '}
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#8fb1ff', textDecoration: 'underline' }}>source</a>
                </span>
              </li>
            ))}
          </ul>

          <div data-reveal style={{ background: 'rgba(207,138,68,0.12)', border: '1px solid rgba(207,138,68,0.3)', borderRadius: 14, padding: '20px 24px' }}>
            <p style={{ fontSize: 14.5, color: '#e8c89a', margin: 0 }}>
              Tian OS is currently preparing for pilot implementation. The platform is designed around evidence-informed learning principles; formal Tian OS outcome studies will be developed as pilot data becomes available.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
