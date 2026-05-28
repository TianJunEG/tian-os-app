import React, { useEffect, useState } from 'react';
import { ArrowRight, Presentation } from 'lucide-react';
import { Card, Button, PageHeader, Badge, StatusBadge, Breadcrumb } from '../../../components/ui';
import { mechanismsAPI } from '../../../services/api';
import { MECHANISMS, MECHANISM_ORDER } from './content.js';

// Tian OS → Secondary → Mechanisms Playground overview. A clean, secondary-school
// appropriate landing: the four mechanisms as cards, plus a Teacher Mode entry.

const CRUMBS = [
  { label: 'Tian OS', to: '/student' },
  { label: 'Secondary' },
  { label: 'Mechanisms Playground' },
];

export default function MechanismsHome() {
  const [progress, setProgress] = useState({});
  useEffect(() => {
    mechanismsAPI.progress().then((r) => setProgress(r.data.progress || {})).catch(() => setProgress({}));
  }, []);

  return (
    <>
      <Breadcrumb items={CRUMBS} />
      <PageHeader
        title="Mechanisms Playground"
        subtitle="Interactive lower secondary D&T simulations for mechanisms."
        action={<Badge tone="navy">Sec 1–2 · D&T</Badge>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MECHANISM_ORDER.map((key) => {
          const m = MECHANISMS[key];
          const Icon = m.icon;
          return (
            <Card key={key} interactive className="flex h-full flex-col p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></span>
                <h3 className="font-display text-lg font-semibold text-navy-700">{m.name}</h3>
                {progress[key] && progress[key].status !== 'not_started' && (
                  <span className="ml-auto"><StatusBadge status={progress[key].status} /></span>
                )}
              </div>
              <p className="text-sm text-ink-500">{m.blurb}</p>
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Key concepts</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.keyConcepts.slice(0, 4).map((c) => <Badge key={c} tone="outline">{c}</Badge>)}
                  {m.keyConcepts.length > 4 && <Badge tone="neutral">+{m.keyConcepts.length - 4}</Badge>}
                </div>
              </div>
              <div className="mt-4 flex-1" />
              <Button to={`/secondary/mechanisms/${key}`} icon={ArrowRight} className="self-start">Open {m.name}</Button>
            </Card>
          );
        })}
      </div>

      {/* Teacher Mode entry point */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700"><Presentation className="h-5 w-5" /></span>
          <div>
            <h3 className="font-semibold text-ink-700">Teacher Mode</h3>
            <p className="text-sm text-ink-500">Open any mechanism, switch to Teacher Mode for answers and discussion prompts, or present full-screen to the class.</p>
          </div>
        </div>
        <Button to="/secondary/mechanisms/gears?mode=teacher" variant="secondary" className="shrink-0">Start in Teacher Mode</Button>
      </Card>
    </>
  );
}
