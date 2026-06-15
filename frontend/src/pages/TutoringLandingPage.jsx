import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Sparkles, CalendarCheck, ShieldCheck, UserCheck, LineChart, CreditCard } from 'lucide-react';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const steps = [
  { icon: ClipboardList, num: '01', title: 'Tell us what you need', body: 'Share the subject, level, and goals — it takes a couple of minutes.' },
  { icon: Sparkles,      num: '02', title: 'Get matched',           body: 'Our matching surfaces vetted tutors suited to your child, with a clear breakdown of why.' },
  { icon: CalendarCheck, num: '03', title: 'Book and learn',        body: 'Schedule sessions, message your tutor, and track progress in one place.' },
];

const features = [
  { icon: ShieldCheck, title: 'Vetted & verified',     body: 'Every tutor is reviewed and verified before they can take bookings.' },
  { icon: UserCheck,   title: 'Personalised matching', body: 'Matches are scored across the criteria that matter to your family.' },
  { icon: LineChart,   title: 'Progress tracking',     body: 'Follow session notes, homework, and feedback over time.' },
  { icon: CreditCard,  title: 'Secure payments',       body: 'Pay safely online; tutors are paid after sessions are delivered.' },
];

const GRID = 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)';

export default function TutoringLandingPage() {
  useScrollReveal();

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Seo
        title="Tutor Matching"
        description="Connect with expert, vetted tutors and start learning today."
        path="/tutoring"
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
              Tutor Matching
            </div>
            <h1 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(42px, 6.2vw, 86px)', lineHeight: 1.04, letterSpacing: '-0.022em', color: '#f6f2ea', maxWidth: '18ch', margin: '0 0 24px' }}>
              Find your perfect<br />tutor
            </h1>
            <p data-reveal data-delay="2" style={{ maxWidth: '52ch', fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.62, color: '#b7c3d8', margin: '0 0 44px' }}>
              Connect with expert, vetted tutors matched to your child's subjects, level, and goals — and start learning with confidence.
            </p>
            <div data-reveal data-delay="3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/register?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#5d86f0', color: '#0e1a31', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                Find a tutor <ArrowRight size={16} />
              </Link>
              <Link to="/register?role=tutor" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', padding: '14px 26px', borderRadius: 10, fontWeight: 600, fontSize: 15.5, textDecoration: 'none' }}>
                Become a tutor
              </Link>
            </div>
          </div>
        </main>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4f7bf0', marginBottom: 20 }}>
            How it works
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#1c2433', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
            Matched in three simple steps
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} data-reveal data-delay={i + 1} style={{ background: '#fff', borderRadius: 18, padding: '36px 32px', border: '1px solid #e8e0d4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(93,134,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color="#5d86f0" />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5d86f0', fontWeight: 600 }}>Step {s.num}</span>
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1c2433', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#5c6472' }}>{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== WHY FAMILIES CHOOSE US ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e 0%, #101d36 100%)', padding: 'clamp(80px, 11vw, 140px) 40px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -160, left: '50%', transform: 'translateX(-50%)', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 62%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
          <div data-reveal style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 20 }}>
            Why families choose us
          </div>
          <h2 data-reveal data-delay="1" style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#f6f2ea', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
            Built for trust and results
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} data-reveal data-delay={i + 1} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(93,134,240,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <Icon size={20} color="#8fb1ff" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f6f2ea', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#aebbd2' }}>{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: '#faf6ef', padding: 'clamp(80px, 11vw, 140px) 40px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div data-reveal style={{ background: '#13223e', borderRadius: 24, padding: 'clamp(44px, 6vw, 80px)', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'clamp(32px, 5vw, 70px)', alignItems: 'center', color: '#f4f0e8' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 12.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 16 }}>Ready to get started?</div>
              <h2 style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#f6f2ea', marginBottom: 16 }}>
                Find a tutor today.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: '#aebbd2', maxWidth: '46ch' }}>
                Or join our team of educators — including retired teachers and trained youth — and teach with purpose.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Link to="/register?role=parent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#5d86f0', color: '#0e1a31', padding: '16px 28px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
                Find a tutor <ArrowRight size={16} />
              </Link>
              <Link to="/register?role=tutor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.22)', color: '#f4f0e8', padding: '16px 28px', borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
                Become a tutor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
