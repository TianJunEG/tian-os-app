import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, CheckCircle2, BookOpenCheck, Workflow, Timer, ClipboardList, Eye } from 'lucide-react';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const PRINCIPLES = [
  { icon: Eye, title: 'Diagnostic Assessment', body: "Identify the student's current strengths, weak skills and readiness before assigning practice." },
  { icon: ClipboardList, title: 'Explicit and Guided Practice', body: 'Break learning into clear steps, worked examples and guided review before independent practice.' },
  { icon: CheckCircle2, title: 'Visual Representations', body: 'Use diagrams, number lines, fraction models and visual supports to make abstract ideas visible.' },
  { icon: BookOpenCheck, title: 'Working Evidence', body: 'Encourage students to show their method so misunderstandings can be diagnosed by process, not only by final answer.' },
  { icon: Timer, title: 'Confidence and Misconception Signals', body: 'Track whether students are confident, unsure, or need help so overconfident errors can be detected early.' },
  { icon: Workflow, title: 'Progress Monitoring', body: 'Track practice, mistakes, fluency and mastery over time so support can be adjusted as students grow.' },
];

const FLOW_STEPS = ['Diagnostic', 'Practice', 'Working Evidence', 'Mistake Analysis', 'Targeted Review', 'Fluency', 'Mastery Check', 'Progress Monitoring'];

const REFERENCES = [
  { title: 'Institute of Education Sciences, What Works Clearinghouse', subtitle: 'Assisting Students Struggling with Mathematics: Response to Intervention for Elementary and Middle Schools.', url: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/26' },
  { title: 'National Center on Intensive Intervention', subtitle: 'Mathematics Intervention Resources.', url: 'https://intensiveintervention.org/implementation-intervention/math-lessons' },
  { title: 'National Mathematics Advisory Panel', subtitle: 'Foundations for Success: The Final Report of the National Mathematics Advisory Panel.', url: 'https://files.eric.ed.gov/fulltext/ED500486.pdf' },
];

const flowRows = [FLOW_STEPS.slice(0, 4), FLOW_STEPS.slice(4)];

export default function MethodologyPage() {
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <Seo
        title="The Tian OS MathPath Framework"
        description="Learn how the Tian OS MathPath remediation framework supports students with diagnostic assessment, targeted practice, working evidence, and progress monitoring."
        path="/methodology"
      />
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div style={{ position: 'absolute', top: -120, right: -80, width: 460, height: 460, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)' }} />

        <div style={{ position: 'relative' }}>
          <MarketingHeader />

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px 110px', textAlign: 'center' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 24 }}>
              MathPath Methodology
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(36px, 5.5vw, 72px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', margin: '0 auto', maxWidth: '22ch' }}>
              The Tian OS MathPath Framework
            </h1>
            <p data-reveal data-delay="2" style={{ marginTop: 24, fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', maxWidth: '56ch', marginLeft: 'auto', marginRight: 'auto' }}>
              MathPath is designed to help students move from mistakes to mastery through diagnostic assessment, targeted practice, working analysis, confidence tracking and progress monitoring.
            </p>
            <div data-reveal data-delay="3" style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 12, background: '#5d86f0', color: '#0e1a31', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
                Start Learning <ArrowRight size={16} />
              </Link>
              <Link to="/our-story" style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
                Read Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main id="main">
        {/* ── WHY ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.018em', color: '#1c2433', margin: '0 0 28px' }}>
              Why remediation needs more than more questions
            </h2>
            <p data-reveal style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', margin: '0 0 18px' }}>
              Many students do not improve simply by doing more questions. They improve when the learning gap is first found, the method is shown clearly, and practice is targeted to the exact skill they need next.
            </p>
            <p data-reveal style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', margin: 0 }}>
              Tian OS MathPath is built around this principle.
            </p>
          </div>
        </section>

        {/* ── PRINCIPLES ── */}
        <section style={{ background: 'linear-gradient(180deg, #13223e, #101d36)', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
              Evidence-informed principles
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.018em', color: '#f6f2ea', margin: '0 0 clamp(48px, 6vw, 72px)', maxWidth: '26ch' }}>
              Built for sustained learning, not short-term guessing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
                <div key={title} data-reveal data-delay={String((i % 3) + 1)} style={{ padding: '28px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(93,134,240,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={20} color="#8fb1ff" />
                  </div>
                  <h3 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 17, color: '#f6f2ea', margin: '0 0 10px' }}>{title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#aebbd2', margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FLOW ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20, textAlign: 'center' }}>
              How MathPath works
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.018em', color: '#1c2433', margin: '0 0 clamp(48px, 6vw, 72px)', textAlign: 'center' }}>
              A clear learning loop
            </h2>
            <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {flowRows.map((row, rowIndex) => (
                <div key={rowIndex} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {row.map((step, index) => (
                      <Fragment key={step}>
                        <div style={{ padding: '14px 22px', background: 'white', borderRadius: 12, border: '1px solid #e1d9ca', textAlign: 'center', minWidth: 160 }}>
                          <p style={{ margin: '0 0 4px', fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4f7bf0' }}>Step {rowIndex * 4 + index + 1}</p>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#1c2433' }}>{step}</p>
                        </div>
                        {index < row.length - 1 && <ArrowRight size={16} color="#c4bdb2" />}
                      </Fragment>
                    ))}
                  </div>
                  {rowIndex < flowRows.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                      <ArrowDown size={16} color="#c4bdb2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: '#8a93a3' }}>The sequence is designed so students revisit methods before moving on.</p>
          </div>
        </section>

        {/* ── RIGHT SIGNALS ── */}
        <section style={{ background: '#faf6ef', padding: 'clamp(80px, 10vw, 130px) 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
              What makes Tian OS different
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.8vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.018em', color: '#1c2433', margin: '0 0 28px' }}>
              Right answers, right signals
            </h2>
            <p data-reveal style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', margin: '0 0 18px' }}>
              Most systems can tell whether an answer is right or wrong. Tian OS is being built to understand the learning behaviour around the answer: confidence, time taken, working evidence, repeated mistakes and remediation progress.
            </p>
            <p data-reveal style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', margin: 0 }}>
              This helps parents, tutors and teachers understand what kind of support a student may need next.
            </p>
          </div>
        </section>

        {/* ── REFERENCES ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(60px, 8vw, 100px) 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20, textAlign: 'center' }}>
              Research alignment
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.12, letterSpacing: '-0.015em', color: '#1c2433', margin: '0 0 24px', textAlign: 'center' }}>
              Evidence-informed, with careful framing
            </h2>
            <p data-reveal style={{ fontSize: 17, lineHeight: 1.65, color: '#5c6472', margin: '0 0 32px', textAlign: 'center' }}>
              Tian OS MathPath is designed around intervention principles consistent with recommendations from recognised education research bodies, including:
            </p>
            <ul data-reveal style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {REFERENCES.map((ref) => (
                <li key={ref.title} style={{ padding: '18px 22px', background: 'white', borderRadius: 12, border: '1px solid #e1d9ca', fontSize: 15, lineHeight: 1.6, color: '#3a4150' }}>
                  <strong style={{ color: '#1c2433' }}>{ref.title}:</strong>{' '}{ref.subtitle}{' '}
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ color: '#5d86f0', textDecoration: 'underline' }}>source</a>
                </li>
              ))}
            </ul>
            <div data-reveal style={{ padding: '20px 24px', background: '#fbf1e1', borderRadius: 12, border: '1px solid #f0dcb8', fontSize: 14.5, lineHeight: 1.6, color: '#7a5c2a' }}>
              Tian OS is currently preparing for pilot implementation. The platform is designed around evidence-informed learning principles; formal Tian OS outcome studies will be developed as pilot data becomes available.
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
