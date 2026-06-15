import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Brain, Pencil } from 'lucide-react';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const MODULES = [
  {
    icon: Brain,
    label: 'Available now',
    title: 'MathPath',
    body: 'Adaptive maths practice built around the Singapore curriculum. Diagnoses gaps, generates targeted questions, and tracks mastery across 51 skill areas from P1 to P6.',
    cta: { label: 'Start learning', to: '/register?role=student' },
    active: true,
  },
  {
    icon: Zap,
    label: 'Coming soon',
    title: 'Problem Solving Lab',
    body: 'Guided heuristic reasoning for word problems and multi-step questions — the exact six-step method Tian Jun tutors use, built into a structured practice flow.',
    active: false,
  },
  {
    icon: Pencil,
    label: 'Coming soon',
    title: 'Spelling',
    body: 'Systematic spelling practice tied to the MOE word list, with AI-generated sentences and adaptive recall scheduling.',
    active: false,
  },
];

export default function EduAppsLandingPage() {
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <Seo
        title="Platform"
        description="The Tian OS learning platform — adaptive apps for Singapore primary students, built by educators."
        path="/edu-apps"
      />
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div style={{ position: 'absolute', top: -100, right: -60, width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(79,123,240,0.2), transparent 65%)' }} />

        <div style={{ position: 'relative' }}>
          <MarketingHeader />

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px 110px', textAlign: 'center' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 24 }}>
              The Platform
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(38px, 5.8vw, 78px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', margin: '0 auto', maxWidth: '20ch' }}>
              Learning apps built for the way students actually learn
            </h1>
            <p data-reveal data-delay="2" style={{ marginTop: 24, fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', maxWidth: '54ch', marginLeft: 'auto', marginRight: 'auto' }}>
              Each Tian OS module is built around a specific skill gap — diagnostic first, adaptive always, and grounded in twenty years of classroom experience.
            </p>
            <div data-reveal data-delay="3" style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <Link
                to="/register?role=student"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 12, background: '#5d86f0', color: '#0e1a31', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}
              >
                Get started <ArrowRight size={16} />
              </Link>
              <Link
                to="/resources"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}
              >
                Explore free resources
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main id="main">
        {/* ── MODULES ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
              Modules
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#1c2433', margin: '0 0 clamp(48px, 6vw, 80px)', maxWidth: '26ch' }}>
              One platform, many ways to grow
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {MODULES.map(({ icon: Icon, label, title, body, cta, active }, i) => (
                <div
                  key={title}
                  data-reveal
                  data-delay={String(i + 1)}
                  style={{
                    padding: 'clamp(32px, 4vw, 48px)',
                    background: 'white',
                    borderRadius: 18,
                    border: active ? '1px solid #d4c9b8' : '1px solid #e1d9ca',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 32,
                    alignItems: 'center',
                    opacity: active ? 1 : 0.72,
                  }}
                >
                  <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: active ? '#13223e' : '#f4efe6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={24} color={active ? '#8fb1ff' : '#8a93a3'} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <h3 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: '#1c2433', margin: 0 }}>{title}</h3>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                          background: active ? '#eef3ff' : '#f4efe6',
                          color: active ? '#4f7bf0' : '#8a93a3',
                          border: active ? '1px solid #d4dfff' : '1px solid #e1d9ca',
                        }}>
                          {label}
                        </span>
                      </div>
                      <p style={{ fontSize: 16, lineHeight: 1.65, color: '#5c6472', margin: 0, maxWidth: '62ch' }}>{body}</p>
                    </div>
                  </div>
                  {cta && (
                    <Link
                      to={cta.to}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 12, background: '#13223e', color: '#f4f0e8', fontWeight: 600, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {cta.label} <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PHILOSOPHY ── */}
        <section style={{ background: 'linear-gradient(180deg, #13223e, #101d36)', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ maxWidth: 720 }}>
              <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
                How we build
              </div>
              <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#f6f2ea', margin: '0 0 32px' }}>
                Diagnostic first. Adaptive always.
              </h2>
              <p data-reveal style={{ fontSize: 18.5, lineHeight: 1.72, color: '#b7c3d8', margin: '0 0 22px' }}>
                Every module starts by finding where a student actually is — not where they should be. From there, practice adapts to close the specific gap, not the average one.
              </p>
              <p data-reveal style={{ fontSize: 18.5, lineHeight: 1.72, color: '#b7c3d8', margin: 0 }}>
                Built on twenty years of classroom experience, every feature in Tian OS answers a frustration our founder lived through firsthand.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 10vw, 130px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
              Get started
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#1c2433', margin: '0 auto 20px', maxWidth: '22ch' }}>
              Start with MathPath today — it's free.
            </h2>
            <p data-reveal style={{ fontSize: 17, lineHeight: 1.6, color: '#5c6472', maxWidth: '48ch', margin: '0 auto 40px' }}>
              No credit card needed. Create an account, take the diagnostic, and see exactly where your child stands.
            </p>
            <div data-reveal style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <Link to="/register?role=student" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 12, background: '#13223e', color: '#f4f0e8', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
                Create a free account <ArrowRight size={16} />
              </Link>
              <Link to="/our-story" style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 28px', borderRadius: 12, border: '1px solid #d4c9b8', color: '#3a4150', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
                Our story
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
