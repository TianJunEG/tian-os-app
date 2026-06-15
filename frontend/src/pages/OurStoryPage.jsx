import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const BELIEFS = [
  {
    num: '01',
    title: 'Every student can rise with the right approach.',
    body: "A 9 became an A. We’ve seen it too many times to believe any learner is a lost cause — they simply haven’t been reached the right way yet.",
  },
  {
    num: '02',
    title: 'Technology should multiply teachers, not replace them.',
    body: "The goal was never to remove the teacher from the room. It’s to let one teacher’s care reach the students she could never have reached alone.",
  },
  {
    num: '03',
    title: 'Built from real pain, not a product spec.',
    body: 'Mainstream and special-ed classrooms, tuition, online learning — every feature answers a frustration our founder lived through firsthand.',
  },
];

const TIMELINE = [
  { label: 'Age 16', title: 'It started with one student at a time.', body: 'Peer tutoring, then private tuition. The first taste of a truth that would shape everything: teaching changes lives, one learner at a time.' },
  { label: 'Trained at NIE', title: 'Formal training at the National Institute of Education.', body: 'The craft of teaching, learned rigorously — pedagogy, assessment, and how real students actually move from confusion to understanding.' },
  { label: 'Mainstream & special ed', title: 'Posted to a mainstream school, then a special education school.', body: 'Two very different kinds of classroom, one lesson in common: no two students learn the same way, and good teaching meets each one where they are.' },
  { label: 'Tuition franchise', title: 'Ran a tuition franchise and private practice.', body: 'Teaching at scale for the first time — and running headlong into the ceiling of what hours and human limits will allow.' },
  { label: 'COVID', title: 'Pivoted to online lessons through the lockdowns.', body: 'When classrooms closed, teaching went on through a screen — proof that the right technology could carry real learning anywhere.' },
  { label: 'Today — Tian OS', title: 'The platform built to lift the ceiling for good.', body: 'Everything those years taught her, turned into software — so the right approach can reach every student, not just the ones who find the right teacher.', highlight: true },
];

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.scroll-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Eyebrow({ children, light }) {
  return (
    <div className="scroll-reveal mb-7 font-mono text-[12.5px] uppercase tracking-[0.22em]" style={{ color: light ? '#8fb1ff' : '#4f7bf0' }}>
      {children}
    </div>
  );
}

function SectionHeading({ children, light, className = '' }) {
  return (
    <h2 className={`scroll-reveal font-marketing font-normal tracking-[-0.02em] ${className}`} style={{ fontSize: 'clamp(32px, 4.4vw, 58px)', lineHeight: 1.08, color: light ? '#f6f2ea' : '#1c2433' }}>
      {children}
    </h2>
  );
}

function TianLogo({ size = 26, dark }) {
  return (
    <div className="flex items-center gap-[11px]">
      <div
        className="flex items-center justify-center font-marketing font-semibold"
        style={{ width: size, height: size, borderRadius: size * 0.27, background: 'linear-gradient(135deg, #5d86f0, #8fb1ff)', color: '#0e1a31', fontSize: size * 0.65 }}
      >
        T
      </div>
      <span className="whitespace-nowrap font-semibold" style={{ fontSize: size * 0.65, color: dark ? '#1c2433' : '#f4f0e8' }}>Tian OS</span>
    </div>
  );
}

export default function OurStoryPage() {
  const rootRef = useScrollReveal();

  return (
    <div ref={rootRef} className="marketing-page" style={{ color: '#1d2230', background: '#f4efe6', overflowX: 'hidden' }}>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', color: '#f4f0e8' }}>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="pointer-events-none absolute" style={{ top: -120, right: -80, width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)' }} />

        <header className="relative mx-auto flex max-w-[1180px] items-center justify-between px-10 py-[30px]">
          <TianLogo />
          <nav className="flex items-center gap-[30px] text-[14.5px]" style={{ color: '#aebbd2' }}>
            <span style={{ color: '#f4f0e8' }}>Our Story</span>
            <span>Platform</span>
            <span>For Schools</span>
            <span className="whitespace-nowrap rounded-full border px-[18px] py-[9px]" style={{ borderColor: 'rgba(255,255,255,0.18)', color: '#f4f0e8' }}>Book a demo</span>
          </nav>
        </header>

        <div className="relative mx-auto max-w-[1180px] px-10 pb-[130px] pt-20">
          <div className="scroll-reveal">
            <div className="mb-[34px] font-mono text-[12.5px] uppercase tracking-[0.22em]" style={{ color: '#8fb1ff' }}>Our Story</div>
            <h1 className="font-marketing font-normal" style={{ fontSize: 'clamp(42px, 6.2vw, 92px)', lineHeight: 1.02, letterSpacing: '-0.022em', maxWidth: '17ch', color: '#f6f2ea' }}>
              We started Tian OS because teaching is too important to do <em className="italic" style={{ color: '#8fb1ff' }}>alone</em>.
            </h1>
          </div>
          <p className="scroll-reveal mt-10" style={{ maxWidth: '58ch', fontSize: 'clamp(18px, 1.6vw, 21px)', lineHeight: 1.6, color: '#b7c3d8' }}>
            Every child deserves a teacher who knows exactly where they are. We're building the platform that makes that possible — at the scale of a whole school, not just the lucky few.
          </p>
          <div className="scroll-reveal mt-[70px] flex items-center gap-[14px] font-mono text-[13px] tracking-[0.1em]" style={{ color: '#8a98b2' }}>
            <span className="inline-block" style={{ width: 1, height: 46, background: 'linear-gradient(#8fb1ff, transparent)' }} />
            <span>SCROLL TO READ</span>
          </div>
        </div>
      </section>

      {/* ===== ORIGIN ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div className="mx-auto max-w-[1180px]">
          <Eyebrow>The beginning</Eyebrow>
          <div className="grid items-start gap-[clamp(40px,6vw,100px)]" style={{ gridTemplateColumns: '1.05fr 0.95fr' }}>
            <SectionHeading>It started in a classroom, not a boardroom.</SectionHeading>
            <div className="scroll-reveal pt-2">
              <p className="mb-[22px] text-[18.5px] leading-[1.72]" style={{ color: '#3a4150' }}>
                Our founder has been teaching since she was sixteen — first as a peer tutor, then a private one. She trained at Singapore's National Institute of Education, was posted to a mainstream school and later transferred to a special education school, ran a tuition franchise alongside her own private tuition, and kept teaching online through the COVID lockdowns when classrooms emptied overnight.
              </p>
              <p className="text-[18.5px] leading-[1.72]" style={{ color: '#3a4150' }}>
                Across more than two decades and every kind of learner, one frustration never left her: there are only so many students one teacher can reach. She always believed technology could lift that ceiling. Tian OS is that belief, built.
              </p>
            </div>
          </div>
          <blockquote className="scroll-reveal" style={{ margin: 'clamp(60px, 8vw, 110px) 0 0', padding: '0 0 0 clamp(24px, 4vw, 56px)', borderLeft: '2px solid #cf8a44', maxWidth: '24ch' }}>
            <p className="font-marketing text-[clamp(26px,3.4vw,42px)] italic leading-[1.22] tracking-[-0.015em]" style={{ color: '#1c2433' }}>
              "There are only so many students one teacher can reach. I wanted to reach more."
            </p>
          </blockquote>
        </div>
      </section>

      {/* ===== THE MOMENT ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e, #101d36)', color: '#f4f0e8', padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[760px]">
            <Eyebrow light>The moment that changed everything</Eyebrow>
            <SectionHeading light>One girl. One number that didn't define her.</SectionHeading>
          </div>
          <p className="scroll-reveal mt-[34px] text-[18.5px] leading-[1.72]" style={{ maxWidth: '62ch', color: '#b7c3d8' }}>
            A Primary 5 girl came to our founder with a score of 9 out of 100. Most would have written her off. Instead, the right guidance met the right student — and her whole trajectory bent.
          </p>

          {/* Score progression */}
          <div className="scroll-reveal" style={{ marginTop: 'clamp(48px, 6vw, 80px)', display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 'clamp(14px, 2.5vw, 36px)', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.12)', padding: 'clamp(36px, 5vw, 56px) 0' }}>
            {[
              { score: <>9<span className="text-[0.36em]" style={{ color: '#6f7f9c' }}>/100</span></>, sub: 'Where she started', detail: 'Primary 5 exam' },
              null,
              { score: '~65', sub: 'A year of guidance later', detail: 'PSLE, Primary 6' },
              null,
              { score: <span style={{ color: '#8fb1ff' }}>A</span>, sub: 'Taught again, Sec 3–5', detail: 'O-Level result' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="font-marketing text-[26px] italic" style={{ color: '#cf8a44' }}>→</div>
              ) : (
                <div key={i} className="text-left">
                  <div className="font-marketing leading-none" style={{ fontSize: 'clamp(44px, 7vw, 84px)', color: '#f6f2ea' }}>{item.score}</div>
                  <div className="mt-3 text-[14px] leading-[1.4]" style={{ color: '#aebbd2' }}>{item.sub}<br /><span style={{ color: '#6f7f9c' }}>{item.detail}</span></div>
                </div>
              ),
            )}
          </div>

          <p className="scroll-reveal mt-[clamp(36px,5vw,56px)] text-[18.5px] leading-[1.72]" style={{ maxWidth: '62ch', color: '#b7c3d8' }}>
            There are many stories like hers — students who simply needed someone who understood how they learned. The approach works. <em className="italic" style={{ color: '#d9c4a0' }}>What if it didn't depend on being lucky enough to find the right teacher?</em> That question is why Tian OS exists.
          </p>
        </div>
      </section>

      {/* ===== WHAT WE BELIEVE ===== */}
      <section style={{ background: '#faf6ef', padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[760px]">
            <Eyebrow>What we believe</Eyebrow>
            <SectionHeading>
              Twenty years in the classroom taught us <em className="italic" style={{ color: '#4f7bf0' }}>what to build</em>.
            </SectionHeading>
          </div>
          <div className="grid grid-cols-3 border-t pt-14" style={{ marginTop: 'clamp(56px, 7vw, 96px)', gap: 'clamp(28px, 3vw, 48px)', borderColor: '#e1d9ca' }}>
            {BELIEFS.map((b, i) => (
              <div key={i} className="scroll-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="mb-[22px] font-marketing text-[30px]" style={{ color: '#cf8a44' }}>{b.num}</div>
                <h3 className="mb-[14px] font-marketing text-[23px] font-medium leading-[1.25]" style={{ color: '#1c2433' }}>{b.title}</h3>
                <p className="text-[16.5px] leading-[1.65]" style={{ color: '#5c6472' }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE PEOPLE ===== */}
      <section style={{ background: 'linear-gradient(180deg, #13223e, #101d36)', color: '#f4f0e8', padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[820px]">
            <Eyebrow light>The people</Eyebrow>
            <SectionHeading light>Built by educators and engineers.</SectionHeading>
            <p className="scroll-reveal mt-8 text-[18.5px] leading-[1.7]" style={{ maxWidth: '60ch', color: '#b7c3d8' }}>
              Half of building Tian OS is knowing what a struggling student looks like at eight o'clock on a Monday morning. The other half is building software worthy of that knowledge. We won't do one without the other.
            </p>
          </div>
          <div className="grid grid-cols-2 border-t pt-[52px]" style={{ marginTop: 'clamp(52px, 7vw, 88px)', gap: 'clamp(32px, 5vw, 80px)', borderColor: 'rgba(255,255,255,0.12)' }}>
            {[
              { role: 'The educator', text: "More than twenty years across mainstream classrooms, special education, tuition, and online learning. Every instinct in Tian OS comes from a teacher who has actually sat beside the child who scored a 9 — and refused to give up on her." },
              { role: 'The engineers', text: "Builders who turn that instinct into something a whole school can hold — translating two decades of hard-won classroom judgment into tools every teacher can reach for, every day." },
            ].map((p, i) => (
              <div key={i} className="scroll-reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="mb-4 font-marketing text-[26px] italic" style={{ color: '#cf8a44' }}>{p.role}</div>
                <p className="text-[17px] leading-[1.66]" style={{ color: '#aebbd2' }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section style={{ background: '#f4efe6', padding: 'clamp(90px, 12vw, 160px) 40px' }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[720px]" style={{ marginBottom: 'clamp(56px, 7vw, 90px)' }}>
            <Eyebrow>The journey</Eyebrow>
            <SectionHeading>From one classroom to a platform.</SectionHeading>
          </div>
          <div className="border-t" style={{ borderColor: '#e1d9ca' }}>
            {TIMELINE.map((t, i) => (
              <div key={i} className="scroll-reveal grid items-baseline gap-6 border-b py-[30px]" style={{ gridTemplateColumns: '210px 1fr', borderColor: '#e1d9ca', transitionDelay: `${i * 0.05}s` }}>
                <div className="font-marketing text-[23px] leading-[1.2]" style={{ color: t.highlight ? '#8fb1ff' : '#4f7bf0' }}>{t.label}</div>
                <div>
                  <h3 className="mb-[6px] font-marketing text-[22px] font-medium" style={{ color: '#1c2433' }}>{t.title}</h3>
                  <p className="max-w-[60ch] text-[16.5px] leading-[1.6]" style={{ color: '#5c6472' }}>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VISION ===== */}
      <section className="relative overflow-hidden text-center" style={{ background: 'linear-gradient(180deg, #13223e, #0e1a31)', color: '#f4f0e8', padding: 'clamp(110px, 15vw, 200px) 40px' }}>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ bottom: -160, width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 62%)' }} />
        <div className="relative mx-auto max-w-[980px]">
          <div className="scroll-reveal mb-9 font-mono text-[12.5px] uppercase tracking-[0.22em]" style={{ color: '#8fb1ff' }}>Where we're going</div>
          <h2 className="scroll-reveal font-marketing font-normal tracking-[-0.02em]" style={{ fontSize: 'clamp(34px, 5vw, 68px)', lineHeight: 1.1, color: '#f6f2ea' }}>
            From one classroom to <em className="italic" style={{ color: '#8fb1ff' }}>every</em> classroom.
          </h2>
          <p className="scroll-reveal mx-auto mt-8" style={{ maxWidth: '56ch', fontSize: 'clamp(18px, 1.6vw, 21px)', lineHeight: 1.62, color: '#b7c3d8' }}>
            Built on a deep understanding of where teachers actually struggle, Tian OS exists to help more students everywhere — not just the ones lucky enough to find the right teacher.
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ background: '#faf6ef', padding: 'clamp(90px, 12vw, 150px) 40px clamp(70px, 8vw, 90px)' }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="scroll-reveal grid items-center rounded-3xl" style={{ background: '#13223e', padding: 'clamp(44px, 6vw, 80px)', gridTemplateColumns: '1.2fr 0.8fr', gap: 'clamp(32px, 5vw, 70px)', color: '#f4f0e8' }}>
            <div>
              <div className="mb-6 font-mono text-[12.5px] uppercase tracking-[0.22em]" style={{ color: '#8fb1ff' }}>Partner with us</div>
              <h2 className="mb-[18px] font-marketing font-normal tracking-[-0.02em]" style={{ fontSize: 'clamp(30px, 3.8vw, 50px)', lineHeight: 1.08, color: '#f6f2ea' }}>
                Bring Tian OS to your school.
              </h2>
              <p className="max-w-[46ch] text-[18px] leading-[1.65]" style={{ color: '#aebbd2' }}>
                See how a platform built by a teacher, on real classroom pain points, helps your educators reach every student. We'll walk you through it.
              </p>
            </div>
            <div className="flex flex-col gap-[14px]">
              <a href="#" className="rounded-xl text-center font-semibold text-[16.5px] no-underline transition-colors" style={{ background: '#5d86f0', color: '#0e1a31', padding: '17px 28px' }}>
                Book a demo
              </a>
              <a href="#" className="rounded-xl border text-center font-semibold text-[16.5px] no-underline transition-colors" style={{ background: 'transparent', color: '#f4f0e8', padding: '17px 28px', borderColor: 'rgba(255,255,255,0.22)' }}>
                Talk to our team
              </a>
            </div>
          </div>

          <footer className="mt-[clamp(50px,6vw,80px)] flex flex-wrap items-center justify-between gap-4 border-t pt-[30px]" style={{ borderColor: '#e1d9ca' }}>
            <TianLogo size={24} dark />
            <div className="font-mono text-[14px] tracking-[0.03em]" style={{ color: '#8a8270' }}>
              An AI-native learning platform for schools.
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
