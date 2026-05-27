import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, PageHeader, Spinner } from '../../components/ui';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MODES = ['online', 'home', 'centre', 'consult'];

// Basic weekly availability editor. No booking/payment integration yet.
export default function Availability() {
  const [slots, setSlots] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { tutorAPI.availability().then((r) => setSlots(r.data.availability?.slots || [])).catch(() => setSlots([])); }, []);

  const update = (i, key, val) => setSlots((s) => s.map((row, j) => (j === i ? { ...row, [key]: val } : row)));
  const add = () => setSlots((s) => [...s, { day: 'mon', start: '16:00', end: '18:00', mode: 'online' }]);
  const remove = (i) => setSlots((s) => s.filter((_, j) => j !== i));

  const save = async () => {
    setSaving(true);
    try { await tutorAPI.updateAvailability({ slots }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    finally { setSaving(false); }
  };

  if (!slots) return <Spinner />;
  return (
    <>
      <PageHeader title="Availability" subtitle="Your weekly lesson slots." action={<Button size="s" variant="secondary" icon={Plus} onClick={add}>Add slot</Button>} />
      <Card className="space-y-3 p-5">
        {slots.length === 0 && <p className="text-sm text-ink-500">No slots yet. Add one to show when you're available.</p>}
        {slots.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select value={row.day} onChange={(e) => update(i, 'day', e.target.value)} className="rounded-xl border border-hairline px-3 py-2 text-sm capitalize">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" value={row.start} onChange={(e) => update(i, 'start', e.target.value)} className="rounded-xl border border-hairline px-3 py-2 text-sm" />
            <span className="text-ink-300">–</span>
            <input type="time" value={row.end} onChange={(e) => update(i, 'end', e.target.value)} className="rounded-xl border border-hairline px-3 py-2 text-sm" />
            <select value={row.mode} onChange={(e) => update(i, 'mode', e.target.value)} className="rounded-xl border border-hairline px-3 py-2 text-sm capitalize">
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => remove(i)} className="ml-auto rounded-lg p-2 text-ink-300 hover:text-error-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {saved && <p className="flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Availability updated.</p>}
        <Button size="l" disabled={saving} onClick={save} className="w-full">{saving ? 'Saving…' : 'Update availability'}</Button>
      </Card>
    </>
  );
}
