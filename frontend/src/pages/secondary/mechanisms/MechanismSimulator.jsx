import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Eye, EyeOff, Presentation,
  ClipboardList, FileDown, MessagesSquare, Info,
} from 'lucide-react';
import { PageHeader, Button, Card, StatusBadge, Breadcrumb, Alert } from '../../../components/ui';
import { Segmented, KeyConcepts } from './components.jsx';
import { mechanismsAPI } from '../../../services/api';
import { MECHANISMS, MECHANISM_ORDER } from './content.js';
import { SIMS } from './sims/index.js';

// Tian OS → Secondary → Mechanisms Playground → {mechanism}. Owns the Student /
// Teacher mode split and the teacher tools; the simulator component owns the
// live physics and learning cards.

export default function MechanismSimulator() {
  const { mechanism } = useParams();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'teacher' ? 'teacher' : 'student');
  const [reveal, setReveal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [notice, setNotice] = useState('');
  const [mastery, setMastery] = useState(null);

  useEffect(() => {
    setMode(searchParams.get('mode') === 'teacher' ? 'teacher' : 'student');
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    mechanismsAPI.progress()
      .then((r) => { if (alive) setMastery(r.data.progress?.[mechanism] || null); })
      .catch((e) => console.warn("MechanismSimulator: fetch failed", e));
    return () => { alive = false; };
  }, [mechanism]);

  const m = MECHANISMS[mechanism];
  const Sim = SIMS[mechanism];
  if (!m || !Sim) return <Navigate to="/secondary/mechanisms" replace />;

  const teacher = mode === 'teacher';
  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 4000); };

  return (
    <>
      <Breadcrumb items={[
        { label: 'Tian OS', to: '/student' },
        { label: 'Secondary' },
        { label: 'Mechanisms Playground', to: '/secondary/mechanisms' },
        { label: m.name },
      ]} />
      <PageHeader
        title={m.name}
        subtitle={m.objective}
        action={
          <Segmented
            label="Mode"
            value={mode}
            options={[{ value: 'student', label: 'Student' }, { value: 'teacher', label: 'Teacher' }]}
            onChange={(v) => { setMode(v); setReveal(false); setShowDiscussion(false); }}
          />
        }
      />

      {/* Mode toolbar */}
      {teacher ? (
        <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
          <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">
            <GraduationCap className="h-3.5 w-3.5" /> Teacher tools
          </span>
          <Button size="s" variant={reveal ? 'gold' : 'secondary'} icon={reveal ? EyeOff : Eye} onClick={() => setReveal((v) => !v)}>
            {reveal ? 'Hide answers' : 'Show answers'}
          </Button>
          <Button size="s" variant={showDiscussion ? 'gold' : 'secondary'} icon={MessagesSquare} onClick={() => setShowDiscussion((v) => !v)}>
            Discussion prompt
          </Button>
          <Button size="s" variant="secondary" as={Link} to={`/secondary/mechanisms/${mechanism}/present`} icon={Presentation}>
            Present to class
          </Button>
          <Button size="s" variant="secondary" icon={ClipboardList} onClick={() => flash('Assigning D&T tasks to a class will arrive with the Secondary teacher dashboard.')}>
            Assign task
          </Button>
          <Button size="s" variant="secondary" icon={FileDown} onClick={() => window.print()}>
            Export worksheet
          </Button>
        </Card>
      ) : (
        <Card className="mb-4 flex items-center gap-2.5 p-3 text-sm text-ink-500">
          <BookOpen className="h-4 w-4 shrink-0 text-navy-700" />
          <span>Predict what will happen, run the simulation, record your observation, then check your understanding.</span>
        </Card>
      )}

      {notice && <Alert tone="info" icon={Info} className="mb-4">{notice}</Alert>}

      <Sim reveal={reveal} showDiscussion={showDiscussion} />

      {/* Key concepts footer */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">
          Key concepts
          {mastery && mastery.status !== 'not_started' && (
            <span className="ml-auto flex items-center gap-1.5 normal-case tracking-normal text-ink-500">Your progress: <StatusBadge status={mastery.status} /></span>
          )}
        </div>
        <KeyConcepts items={m.keyConcepts} />
      </div>

      {/* Other mechanisms */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">More mechanisms</span>
        {MECHANISM_ORDER.filter((k) => k !== mechanism).map((k) => (
          <Button key={k} size="s" variant="ghost" as={Link} to={`/secondary/mechanisms/${k}`}>{MECHANISMS[k].name}</Button>
        ))}
      </div>
    </>
  );
}
