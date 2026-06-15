import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, Pencil, CheckCircle2, Target, Repeat } from 'lucide-react';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const MODULES = [
  {
    icon: Brain,
    label: 'Available now',
    active: true,
    title: 'MathPath',
    body: 'Diagnostic-first maths remediation. MathPath finds the skill gaps holding a student back, then builds a targeted practice path from diagnosis to mastery.',
    cta: { label: 'Start learning', to: '/register?role=student' },
  },
  {
    icon: Zap,
    label: 'Coming soon',
    active: false,
    title: 'Problem Solving Lab',
    body: 'Guided heuristic reasoning for word problems and multi-step questions. Students learn how to think through problems, not just recall procedures.',
    cta: null,
  },
  {
    icon: Pencil,
    label: 'Coming soon',
    active: false,
    title: 'Spelling',
    body: 'Structured literacy practice built around the patterns students actually struggle with — diagnosed automatically, revisited systematically.',
    cta: null,
  },
];

const PHILOSOPHY = [
  { icon: Target,      title: 'Diagnostic first',   body: 'Every module starts by finding where the student actually is — not where the syllabus says they should be.' },
  { icon: Repeat,      title: 'Targeted repetition', body: 'Practice is focused on the exact skills that need work, not a broad sweep of everything.' },
  { icon: CheckCircle2, title: 'Mastery signals',   body: 'Students advance when they can demonstrate consistent, confident understanding — not just one right answer.' },
];

const GRID = 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)';

export default function EduAppsLandingPage() {
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Seo
        title="Platform — Tian OS"
        description="AI-native learning modules built around diagnostic assessment, targeted practice, and mastery signals."
        path="/edu-apps"
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
              The Platform
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(42px, 6.2vw, 86px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', maxWidth: '20ch', margin: '0 0 24px' }}>
              A platform that knows where every student is
            </h1>
            <p data-reveal data-delay="2" style={{ maxWidth: '54ch', fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', margin: '0 0 44px' }}>
              Tian OS is a suite of AI-native learning modules — each one diagnostic-first, each one built to find the gap and close it.
            </p>
            <div data-reveal data-delay="3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/register?role=student" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#5d86f0', color: '#0e1a31', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                Start with MathPath <ArrowRight size={16} />
              </Link>
              <Link to="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                See the methodology
              </Link>
            </div>
          </div>
        </main>
      </section>

      {/* ===== MODULES ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
            Modules
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
            Every subject. The same rigour.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 28 }}>
            {MODULES.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={m.title} data-reveal data-delay={i + 1} style={{ background: m.active ? '#fff' : 'rgba(255,255,255,0.55)', borderRadius: 18, padding: '36px 32px', border: m.active ? '1px solid #c8d9f8' : '1px solid #e8e0d4', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: m.active ? 'rgba(93,134,240,0.12)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={m.active ? '#5d86f0' : '#8a90a0'} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: m.active ? '#5d86f0' : '#9ca3af', fontWeight: 600, padding: '5px 10px', borderRadius: 6, background: m.active ? 'rgba(93,134,240,0.1)' : 'rgba(0,0,0,0.05)' }}>
                      {m.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: m.active ? '#1c2433' : '#6b7280', marginBottom: 12 }}>{m.title}</h3>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: m.active ? '#4a5568' : '#9ca3af', flexGrow: 1 }}>{m.body}</p>
                  {m.cta && (
                    <Link to={m.cta.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: '#5d86f0', color: '#fff', padding: '12px 22px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', alignSelf: 'flex-start' }}>
                      {m.cta.label} <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e 0%, #101d36 100%)', padding: 'clamp(80px, 11vw, 140px) 40px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -160, left: '50%', transform: 'translateX(-50%)', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 62%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
            The approach
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#f6f2ea', maxWidth: '22ch', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
            The same principles behind every module
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {PHILOSOPHY.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.title} data-reveal data-delay={i + 1} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(93,134,240,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={20} color="#8fb1ff" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f6f2ea', marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#aebbd2' }}>{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: '#faf6ef', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
            Get started
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 20 }}>
            Start where your student is.
          </h2>
          <p data-reveal data-delay="2" style={{ maxWidth: '48ch', margin: '0 auto 40px', fontSize: 17, lineHeight: 1.65, color: '#5c6472' }}>
            MathPath is live now. Diagnostic assessment, targeted practice, and progress tracking — for free.
          </p>
          <div data-reveal data-delay="3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=student" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#5d86f0', color: '#fff', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
              Try MathPath <ArrowRight size={16} />
            </Link>
            <Link to="/resources" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #c8c0b0', color: '#1c2433', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none', background: 'transparent' }}>
              Explore free resources
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
