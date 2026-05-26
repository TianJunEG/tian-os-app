import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GraduationCap,
  Smartphone,
  ShieldCheck,
  BookOpenCheck,
  Users,
  Accessibility,
  HeartHandshake,
  Sprout,
  Award,
} from 'lucide-react';
import { partnersAPI } from '../services/api';
import { GROUP_NAME, SERVICES } from '../config/brand';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { trackEvent } from '../lib/analytics';

const serviceIcon = {
  tutoring: GraduationCap,
  'edu-apps': Smartphone,
};

const trustPoints = [
  { icon: ShieldCheck, label: 'Vetted, verified tutors' },
  { icon: BookOpenCheck, label: 'MOE-aligned resources' },
  { icon: Award, label: 'Experienced educators' },
  { icon: Accessibility, label: 'An inclusive team' },
];

const missionPillars = [
  {
    icon: Sprout,
    title: 'Investing in at-risk youth',
    body: 'We support young people facing barriers to education. As they grow and achieve strong results, we train and mentor them to become tutors themselves — turning their own progress into a livelihood, and into a role model for the next student coming up behind them.',
  },
  {
    icon: Award,
    title: 'Honouring experienced educators',
    body: "We bring retired teachers back into education as consultants and tutors. Decades of classroom wisdom shouldn't retire with them — instead it guides our students, mentors our newest tutors, and shapes how every service is built.",
  },
  {
    icon: Accessibility,
    title: 'Inclusive employment',
    body: 'We hire persons with disabilities across our team — in roles like marketing, customer service, and operations. Meaningful work and the right support unlock real talent, and building an inclusive workplace makes everything we do stronger.',
  },
];

const partnerTypes = [
  { title: 'Schools & institutions', body: 'Bring vetted tutoring and learning tools to your students.' },
  { title: 'Educators & creators', body: 'Grow your reach and build alongside our services.' },
  { title: 'Organizations', body: 'Expand learning access through community programs.' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-50 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-navy-200/40 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">A social enterprise in education</span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Empowering learners across every stage
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            {GROUP_NAME} brings together a family of education services — expert tutor matching, free
            learning resources, and more to come — all built to create opportunity through learning.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register?role=parent" className="btn-primary w-full sm:w-auto">
              Find a tutor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/resources" className="btn-secondary w-full sm:w-auto">
              Explore free resources
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {trustPoints.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
                <Icon className="h-5 w-5 text-navy-600" />
              </span>
              <span className="text-sm font-medium text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">Our services</span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          One group, many ways to learn
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Choose a service to get started — with more joining the family over time.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {SERVICES.map((service) => {
          const Icon = serviceIcon[service.id] || GraduationCap;
          const inner = (
            <div
              className={`card flex h-full flex-col p-8 transition ${
                service.available ? 'hover:-translate-y-1 hover:shadow-md' : 'opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <Icon className="h-6 w-6" />
                </span>
                {!service.available && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Coming soon
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-2 flex-1 text-slate-600">{service.tagline}</p>
              {service.available && (
                <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-navy-600">
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          );
          return service.available ? (
            <Link key={service.id} to={service.path} className="block">
              {inner}
            </Link>
          ) : (
            <div key={service.id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">
            <HeartHandshake className="h-3.5 w-3.5" /> A social enterprise
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Education that gives back
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {GROUP_NAME} is being established as a social enterprise — a business built to create
            opportunity, not just returns. Every service we run is designed to lift the people who
            need it most and to keep great teaching in the hands of those who do it best.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {missionPillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-600">{body}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-slate-600">
          The result is a cycle that compounds: experienced teachers raise up young learners, those
          learners become tutors, and an inclusive team powers it all — so the impact grows with
          every student we reach and every person we employ.
        </p>
      </div>
    </section>
  );
}

function PartnershipSection() {
  const [form, setForm] = useState({ name: '', organization: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await partnersAPI.submitInquiry(form);
      trackEvent('Partnership Inquiry');
      setStatus('success');
      setForm({ name: '', organization: '', email: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your inquiry. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section id="partner" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-5">
          <div className="bg-navy-600 p-8 text-white md:col-span-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <HeartHandshake className="h-3.5 w-3.5" /> Partnerships
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">Partner with us</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-100">
              {GROUP_NAME} is building a connected family of education services, and the best ones
              are built together. We're not formally opening partnerships yet — but if this sounds
              like you, introduce yourself and we'll reach out as opportunities open up.
            </p>
            <ul className="mt-6 space-y-4">
              {partnerTypes.map((p) => (
                <li key={p.title}>
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="text-sm text-navy-100">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 md:col-span-3">
            {status === 'success' ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-emerald-50 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <HeartHandshake className="h-6 w-6" />
                </span>
                <p className="mt-4 font-medium text-emerald-800">
                  Thanks for reaching out. We've received your details and will be in touch as
                  partnership opportunities open up.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="partner-name" className="field-label">Name</label>
                    <input id="partner-name" type="text" name="name" value={form.name} onChange={handleChange} required maxLength={100} className="field" />
                  </div>
                  <div>
                    <label htmlFor="partner-org" className="field-label">
                      Organization <span className="text-slate-400">(optional)</span>
                    </label>
                    <input id="partner-org" type="text" name="organization" value={form.organization} onChange={handleChange} maxLength={150} className="field" />
                  </div>
                </div>
                <div>
                  <label htmlFor="partner-email" className="field-label">Email</label>
                  <input id="partner-email" type="email" name="email" value={form.email} onChange={handleChange} required className="field" />
                </div>
                <div>
                  <label htmlFor="partner-message" className="field-label">Tell us how you'd like to work together</label>
                  <textarea id="partner-message" name="message" value={form.message} onChange={handleChange} required minLength={10} maxLength={2000} rows={4} className="field" />
                </div>
                <button type="submit" disabled={status === 'submitting'} className="btn-primary">
                  {status === 'submitting' ? 'Sending...' : 'Get in touch'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GroupLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        description={`${GROUP_NAME} is a social enterprise bringing together a family of education services — tutor matching, learning resources, and more.`}
        path="/"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <ServicesSection />
        <MissionSection />
        <PartnershipSection />
      </main>
      <SiteFooter />
    </div>
  );
}
