import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  LineChart,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { GROUP_NAME } from '../config/brand';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const steps = [
  { icon: ClipboardList, title: 'Tell us what you need', body: 'Share the subject, level, and goals — it takes a couple of minutes.' },
  { icon: Sparkles, title: 'Get matched', body: 'Our matching surfaces vetted tutors suited to your child, with a clear breakdown of why.' },
  { icon: CalendarCheck, title: 'Book and learn', body: 'Schedule sessions, message your tutor, and track progress in one place.' },
];

const features = [
  { icon: ShieldCheck, title: 'Vetted & verified', body: 'Every tutor is reviewed and verified before they can take bookings.' },
  { icon: UserCheck, title: 'Personalised matching', body: 'Matches are scored across the criteria that matter to your family.' },
  { icon: LineChart, title: 'Progress tracking', body: 'Follow session notes, homework, and feedback over time.' },
  { icon: CreditCard, title: 'Secure payments', body: 'Pay safely online; tutors are paid after sessions are delivered.' },
];

export default function TutoringLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Tutor Matching"
        description="Connect with expert, vetted tutors and start learning today — Tutor Matching, a service of Tian Jun Education Group."
        path="/tutoring"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

      <main id="main">
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
            <span className="eyebrow">Tutor Matching · A {GROUP_NAME} service</span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find your perfect tutor
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Connect with expert, vetted tutors matched to your child's subjects, level, and goals —
              and start learning with confidence.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register?role=parent" className="btn-primary w-full sm:w-auto">
                Find a tutor <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register?role=tutor" className="btn-secondary w-full sm:w-auto">
                Become a tutor
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Matched in three simple steps
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="card p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-semibold text-indigo-600">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Why families choose us</span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built for trust and results
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title} className="card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="card overflow-hidden bg-indigo-600 p-10 text-center text-white sm:p-14">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Ready to get started?</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">
              Find a tutor today, or join our team of educators — including retired teachers and
              trained youth — and teach with purpose.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register?role=parent" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                Find a tutor <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register?role=tutor" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Become a tutor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
