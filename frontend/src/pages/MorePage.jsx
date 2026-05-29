import React from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { NAV } from '../config/nav';
import { MODULES } from '../config/modules';
import { Card, PageHeader, ModuleCard, EmptyState, Button } from '../components/ui';

const STUDENT_MORE_ORDER = [
  'fluency',
  'mistakes',
  'worksheets',
  'science',
  'spelling',
  'lifelab',
  'mechanisms',
];

const STUDENT_SECTIONS = [
  { label: 'MathPath tools', keys: ['fluency', 'mistakes', 'worksheets'] },
  { label: 'Other subjects', keys: ['science', 'spelling', 'lifelab'] },
  { label: 'Secondary', keys: ['mechanisms'] },
];

export default function MorePage() {
  const { role } = useWorkspace();
  const roleNav = NAV[role] || NAV.student;

  const studentModules = MODULES.filter((module) => STUDENT_MORE_ORDER.includes(module.key))
    .sort((a, b) => STUDENT_MORE_ORDER.indexOf(a.key) - STUDENT_MORE_ORDER.indexOf(b.key));

  const moreItems = roleNav.more || [];
  const homeLink = roleNav.bottom?.[0]?.to || '/';
  const pageTitle = role === 'student' ? 'More learning tools' : 'More tools';
  const pageSubtitle = role === 'student'
    ? 'Practise fluency, review mistakes, revise Science, spelling, LifeLab and Secondary tools.'
    : 'Discover secondary learning tools and support features for your role.';

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      {role === 'student' ? (
        <div className="space-y-8">
          {STUDENT_SECTIONS.map((section) => {
            const items = studentModules.filter((module) => section.keys.includes(module.key));
            if (items.length === 0) return null;
            return (
              <section key={section.label} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{section.label}</p>
                    <p className="mt-1 text-sm text-ink-500">Open additional learning paths that sit alongside MathPath.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((module) => (
                    <ModuleCard key={module.key} module={module} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : moreItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moreItems.map((item) => (
            <Link key={`${role}-${item.to}-${item.label}`} to={item.to} className="block focus-visible:outline-none">
              <Card interactive className="h-full p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="font-semibold text-ink-700">{item.label}</h3>
                <p className="mt-2 text-sm text-ink-500">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          message="No extra tools for this role yet. Check back as Tian OS expands your workspace."
        >
          <Button to={homeLink} variant="secondary" size="s">Back to dashboard</Button>
        </EmptyState>
      )}
    </div>
  );
}
