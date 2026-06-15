import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, UserCheck, LineChart, CreditCard } from 'lucide-react';
import { GROUP_NAME } from '../config/brand';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const STEPS = [
  { num: '01', title: 'Tell us what you need', body: 'Share the subject, level, and goals — it takes a couple of minutes.' },
  { num: '02', title: 'Get matched', body: 'Our matching surfaces vetted tutors suited to your child, with a clear breakdown of why.' },
  { num: '03', title: 'Book and learn', body: 'Schedule sessions, message your tutor, and track progress in one place.' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Vetted & verified', body: 'Every tutor is reviewed and verified before they can take bookings.' },
  { icon: UserCheck, title: 'Personalised matching', body: 'Matches are scored across the criteria that matter to your family.' },
  { icon: LineChart, title: 'Progress tracking', body: 'Follow session notes, homework, and feedback over time.' },
  { icon: CreditCard, title: 'Secure payments', body: 'Pay safely online; tutors are paid after sessions are delivered.' },
];

export default function TutoringLandingPage() {
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <Seo
        title="Tutor Matching"
        description={`Connect with expert, vetted tutors and start learning today — Tutor Matching, a service of ${GROUP_NAME}.`}
        path="/tutoring"
      />
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div style={{ position: 'absolute', top: -120, left: -80, width: 460, height: 460, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)' }} />

        <div style={{ position: 'relative' }}>
          <MarketingHeader />

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 40px 110px', textAlign: 'center' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 24 }}>
              Tutor Matching · A {GROUP_NAME} service
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(38px, 5.8vw, 78px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', margin: '0 auto', maxWidth: '18ch' }}>
              Find your perfect tutor
            </h1>
            <p data-reveal data-delay="2" style={{ marginTop: 24, fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', maxWidth: '52ch', marginLeft: 'auto', marginRight: 'auto' }}>
              Connect with expert, vetted tutors matched to your child's subjects, level, and goals — and start learning with confidence.
            </p>
            <div data-reveal data-delay="3" style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <Link
                to="/register?role=parent"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 12, background: '#5d86f0', color: '#0e1a31', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}
              >
                Find a tutor <ArrowRight size={16} />
              </Link>
              <Link
                to="/register?role=tutor"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}
              >
                Become a tutor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main id="main">
        {/* ── HOW IT WORKS ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
              How it works
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#1c2433', margin: '0 0 clamp(48px, 6vw, 80px)' }}>
              Matched in three simple steps
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
              {STEPS.map((s, i) => (
                <div key={s.num} data-reveal data-delay={String(i + 1)} style={{ padding: '32px 28px', background: 'white', borderRadius: 16, border: '1px solid #e1d9ca' }}>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 36, color: '#cf8a44', marginBottom: 20, lineHeight: 1 }}>{s.num}</div>
                  <h3 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: '#1c2433', margin: '0 0 10px' }}>{s.title}</h3>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#5c6472', margin: 0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ background: 'linear-gradient(180deg, #13223e, #101d36)', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
              Why families choose us
            </div>
            <h2 data-reveal style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: '#f6f2ea', margin: '0 0 clamp(48px, 6vw, 80px)', maxWidth: '22ch' }}>
              Built for trust and results
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <div key={title} data-reveal data-delay={String(i + 1)} style={{ padding: '28px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
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

        {/* ── CTA ── */}
        <section style={{ background: '#f4efe6', padding: 'clamp(80px, 10vw, 130px) 40px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div data-reveal style={{ background: '#13223e', borderRadius: 24, padding: 'clamp(44px, 6vw, 72px)', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'clamp(32px, 5vw, 70px)', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 18 }}>Ready to start</div>
                <h2 style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#f6f2ea', margin: '0 0 18px' }}>
                  Ready to get started?
                </h2>
                <p style={{ fontSize: 17.5, lineHeight: 1.65, color: '#aebbd2', margin: 0, maxWidth: '46ch' }}>
                  Find a tutor today, or join our team of educators — including retired teachers and trained youth — and teach with purpose.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 28px', borderRadius: 12, background: '#5d86f0', color: '#0e1a31', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
                  Find a tutor <ArrowRight size={16} />
                </Link>
                <Link to="/register?role=tutor" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
                  Become a tutor
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
