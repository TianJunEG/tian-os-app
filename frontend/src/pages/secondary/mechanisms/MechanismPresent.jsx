import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, MessagesSquare, X } from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { Segmented } from './components.jsx';
import { MECHANISMS, MECHANISM_ORDER } from './content.js';
import { SIMS } from './sims/index.js';

// Classroom presentation view — large simulation, minimal controls, big labels,
// answers hidden by default. Designed for projector display. Reachable from a
// mechanism's Teacher Mode via "Present to class".

export default function MechanismPresent() {
  const { mechanism } = useParams();
  const [active, setActive] = useState(mechanism);
  const [reveal, setReveal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);

  useEffect(() => {
    setActive(mechanism);
    setReveal(false);
    setShowDiscussion(false);
  }, [mechanism]);

  const m = MECHANISMS[active];
  const Sim = SIMS[active];
  if (!MECHANISMS[mechanism]) return <Navigate to="/secondary/mechanisms" replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge tone="navy">Presenting</Badge>
          <h1 className="font-display text-2xl font-semibold text-navy-700">{m.name}</h1>
        </div>
        <Button size="s" variant="ghost" as={Link} to={`/secondary/mechanisms/${active}?mode=teacher`} icon={X}>Exit presentation</Button>
      </div>

      <p className="text-lg text-ink-500">{m.objective}</p>

      {/* Minimal controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mechanism"
          size="m"
          value={active}
          options={MECHANISM_ORDER.map((k) => ({ value: k, label: MECHANISMS[k].name }))}
          onChange={(k) => { setActive(k); setReveal(false); setShowDiscussion(false); }}
        />
        <Button size="m" variant={reveal ? 'gold' : 'secondary'} icon={reveal ? EyeOff : Eye} onClick={() => setReveal((v) => !v)}>
          {reveal ? 'Hide explanation' : 'Reveal explanation'}
        </Button>
        <Button size="m" variant={showDiscussion ? 'gold' : 'secondary'} icon={MessagesSquare} onClick={() => setShowDiscussion((v) => !v)}>
          Discussion prompt
        </Button>
      </div>

      <Sim key={active} reveal={reveal} showDiscussion={showDiscussion} presentation />
    </div>
  );
}
