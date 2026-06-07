import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, CheckCircle2, BookOpenCheck, Workflow, Timer, ClipboardList, Eye } from 'lucide-react';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const principles = [
  {
    icon: Eye,
    title: 'Diagnostic Assessment',
    body: 'Identify the student’s current strengths, weak skills and readiness before assigning practice.',
  },
  {
    icon: ClipboardList,
    title: 'Explicit and Guided Practice',
    body: 'Break learning into clear steps, worked examples and guided review before independent practice.',
  },
  {
    icon: CheckCircle2,
    title: 'Visual Representations',
    body: 'Use diagrams, number lines, fraction models and visual supports to make abstract ideas visible.',
  },
  {
    icon: BookOpenCheck,
    title: 'Working Evidence',
    body: 'Encourage students to show their method so misunderstandings can be diagnosed by process, not only by final answer.',
  },
  {
    icon: Timer,
    title: 'Confidence and Misconception Signals',
    body: 'Track whether students are confident, unsure, or need help so overconfident errors can be detected early.',
  },
  {
    icon: Workflow,
    title: 'Progress Monitoring',
    body: 'Track practice, mistakes, fluency and mastery over time so support can be adjusted as students grow.',
  },
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

export default function MethodologyPage() {
  const flowRows = [flowSteps.slice(0, 4), flowSteps.slice(4)];

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="The Tian OS MathPath Framework"
        description="Learn how the Tian OS MathPath remediation framework supports students with diagnostic assessment, targeted practice, working evidence, and progress monitoring."
        path="/methodology"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

      <main id="main">
        <section className="bg-gradient-to-b from-navy-50 via-white to-white">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
            <span className="eyebrow">MathPath Methodology</span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              The Tian OS MathPath Framework
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
              MathPath is designed to help students move from mistakes to mastery through diagnostic assessment,
              targeted practice, working analysis, confidence tracking and progress monitoring.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register?role=parent" className="btn-primary w-full sm:w-auto">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/founder" className="btn-secondary w-full sm:w-auto">
                Read Our Story
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why remediation needs more than more questions</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
              Many students do not improve simply by doing more questions. They improve when the learning gap is first
              found, the method is shown clearly, and practice is targeted to the exact skill they need next.
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
              Tian OS MathPath is built around this principle.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="eyebrow">Evidence-informed principles</span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for sustained learning, not short-term guessing</h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {principles.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="card p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="eyebrow">How MathPath works</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A clear learning loop</h2>
          </div>

          <div className="mt-10 space-y-6">
            {flowRows.map((row, rowIndex) => (
              <div key={rowIndex}>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {row.map((step, index) => (
                    <Fragment key={step}>
                      <div className="min-w-52 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center md:min-w-56">
                        <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">Step {rowIndex * 4 + index + 1}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{step}</p>
                      </div>
                      {index < row.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-slate-300 md:h-5 md:w-5" />
                      )}
                    </Fragment>
                  ))}
                </div>
                {rowIndex < flowRows.length - 1 && (
                  <div className="mt-3 flex justify-center md:hidden">
                    <ArrowDown className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">The sequence is designed so students revisit methods before moving on.</p>
        </section>

        <section className="bg-navy-50/60 py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <span className="eyebrow">What makes Tian OS different</span>
            <div className="mx-auto mt-3 max-w-4xl">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Right answers, right signals
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
                Most systems can tell whether an answer is right or wrong. Tian OS is being built to understand the
                learning behaviour around the answer: confidence, time taken, working evidence, repeated mistakes and
                remediation progress.
              </p>
              <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
                This helps parents, tutors and teachers understand what kind of support a student may need next.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="eyebrow">Research alignment</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Evidence-informed, with careful framing</h2>
          </div>
          <p className="mx-auto mt-5 max-w-4xl text-lg leading-relaxed text-slate-600">
            Tian OS MathPath is designed around intervention principles consistent with recommendations from recognised education research
            bodies, including:
          </p>
          <ul className="mx-auto mt-6 max-w-4xl list-disc space-y-3 pl-6 text-slate-700">
            {references.map((item) => (
              <li key={item.title}>
                <span className="font-semibold">{item.title}:</span> {item.subtitle}{' '}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-600 underline hover:text-navy-700"
                >
                  source
                </a>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
            <p className="font-medium">
              Tian OS is currently preparing for pilot implementation. The platform is designed around evidence-informed
              learning principles; formal Tian OS outcome studies will be developed as pilot data becomes available.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
