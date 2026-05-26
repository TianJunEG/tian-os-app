import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone, Gamepad2, BarChart3 } from 'lucide-react';
import { GROUP_NAME } from '../config/brand';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const previews = [
  { icon: Gamepad2, title: 'Interactive practice', body: 'Bite-sized, game-like exercises that keep students engaged.' },
  { icon: BarChart3, title: 'Progress insights', body: 'Clear feedback so families can see growth over time.' },
  { icon: Smartphone, title: 'Learn anywhere', body: 'Designed for the devices students already use, every day.' },
];

export default function EduAppsLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Edu Apps"
        description="Interactive learning apps for every student — coming soon from Tian Jun Education Group."
        path="/edu-apps"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

      <main id="main">
        <section className="relative overflow-hidden bg-gradient-to-b from-navy-50 via-white to-white">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-navy-200/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Coming soon
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Interactive learning apps for every student
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              We're building a suite of educational apps under {GROUP_NAME}. In the meantime, explore
              our free resources or find a tutor.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/resources" className="btn-primary w-full sm:w-auto">Explore resources</Link>
              <Link to="/tutoring" className="btn-secondary w-full sm:w-auto">Find a tutor</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {previews.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-semibold text-navy-600 hover:text-navy-700">
              <ArrowLeft className="h-4 w-4" /> Back to {GROUP_NAME}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
