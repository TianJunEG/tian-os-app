import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, PageHeader, Spinner, ErrorState, Select, Input } from '../../components/ui';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const MODES = ['online', 'home', 'centre', 'consult'];

// Basic weekly availability editor. No booking/payment integration yet.
export default function Availability() {
  const [slots, setSlots] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const load = () => {
    setLoadError(false);
    setSlots(null);
    tutorAPI.availability().then((r) => setSlots(r.data.availability?.slots || [])).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  const update = (i, key, val) => setSlots((s) => s.map((row, j) => (j === i ? { ...row, [key]: val } : row)));
  const add = () => setSlots((s) => [...(s || []), { day: 'mon', start: '16:00', end: '18:00', mode: 'online' }]);
  const remove = (i) => setSlots((s) => s.filter((_, j) => j !== i));

  const validateSlots = (slotsToValidate) => {
    if (!Array.isArray(slotsToValidate)) return 'Invalid availability.';
    for (let i = 0; i < slotsToValidate.length; i += 1) {
      const s = slotsToValidate[i];
      if (!s.day || !s.start || !s.end || !s.mode) return 'Each slot must have day, start, end and mode.';
      const [sh, sm] = s.start.split(':').map(Number);
      const [eh, em] = s.end.split(':').map(Number);
      if (eh < sh || (eh === sh && em <= sm)) return 'End time must be after start time.';
    }
    return null;
  };

  const save = async () => {
    setSaveError(null);
    const err = validateSlots(slots || []);
    if (err) { setSaveError(err); return; }
    setSaving(true);
    try { await tutorAPI.updateAvailability({ slots }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (e) { setSaveError('Couldn\'t save availability. Please try again.'); }
    finally { setSaving(false); }
  };

  if (loadError) return <ErrorState message="Couldn't load availability." onRetry={load} />;
  if (!slots) return <Spinner />;
  return (
    <>
      <PageHeader title="Availability" subtitle="Your weekly lesson slots." action={<Button size="s" variant="secondary" icon={Plus} onClick={add}>Add slot</Button>} />
      <Card className="space-y-3 p-5">
        {slots.length === 0 && <p className="text-sm text-ink-500">No slots yet. Add one to show when you're available.</p>}
        {slots.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Select value={row.day} onChange={(e) => update(i, 'day', e.target.value)} className="w-28">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Input type="time" value={row.start} onChange={(e) => update(i, 'start', e.target.value)} className="w-28" />
            <span className="text-ink-300">–</span>
            <Input type="time" value={row.end} onChange={(e) => update(i, 'end', e.target.value)} className="w-28" />
            <Select value={row.mode} onChange={(e) => update(i, 'mode', e.target.value)} className="w-32">
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <button onClick={() => remove(i)} className="ml-auto rounded-lg p-2 text-ink-300 hover:text-error-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {saved && <p className="flex items-center gap-1 text-sm font-semibold text-success-700"><CheckCircle2 className="h-4 w-4" /> Availability updated.</p>}
        {saveError && <p className="text-sm text-error-700">{saveError}</p>}
        <Button size="l" disabled={saving} onClick={save} className="w-full">{saving ? 'Saving…' : 'Update availability'}</Button>
      </Card>
    </>
  );
}
