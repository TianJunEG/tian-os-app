import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Gift } from 'lucide-react';
import { studentProfileAPI, tutorAPI } from '../../services/api';
import { Card, Button, Spinner, Select, Field, Textarea, ErrorState, EmptyState } from '../../components/ui';
import { STICKERS, STICKER_GOAL_SIZE } from '../../../../shared/rewards/stickerCatalog';
import TutorStudentNav from '../tutor/TutorStudentNav';
import { useTutorStudent } from '../tutor/useTutorStudent';

// Reward chart — a kid fills a goal chart of STICKER_GOAL_SIZE stickers to earn a
// prize, and keeps every sticker in a collection below. Used as the student's own
// page (/student/rewards) AND a tutor view (/tutor/students/:id/rewards) where the
// tutor can also hand out stickers. Kaesy (the "Hype & Rewards" mascot) hosts it.
export default function RewardChart() {
  const { id } = useParams();          // present only on the tutor route
  const tutorMode = Boolean(id);
  const meta = useTutorStudent(tutorMode ? id : null);

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [pickCode, setPickCode] = useState(STICKERS[0].code);
  const [note, setNote] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardMsg, setAwardMsg] = useState('');

  const load = () => {
    setError(false);
    setData(null);
    studentProfileAPI.stickers(tutorMode ? id : undefined)
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const award = async () => {
    setAwarding(true);
    setAwardMsg('');
    try {
      await tutorAPI.awardSticker(id, { stickerCode: pickCode, note: note.trim() });
      setNote('');
      setAwardMsg('Sticker awarded! 🎉');
      load();
      setTimeout(() => setAwardMsg(''), 2500);
    } catch {
      setAwardMsg("Couldn't award the sticker. Please try again.");
    } finally { setAwarding(false); }
  };

  const body = () => {
    if (error) return <ErrorState message="Couldn’t load the reward chart." onRetry={load} />;
    if (!data) return <Spinner />;
    const { stickers = [], total = 0, progress = {} } = data;
    const goal = progress.goalSize || STICKER_GOAL_SIZE;
    const slotsFilled = progress.justCompleted ? goal : (progress.filledInCurrent || 0);
    const currentStickers = stickers.slice(0, slotsFilled);

    return (
      <>
        <Card className="mb-6 p-5">
          <div className="flex items-center gap-4">
            <img src="/mascots/kaesy.png" alt="Kaesy" className="h-16 w-16 shrink-0" draggable={false}
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink-900">{tutorMode ? `${meta?.name || 'Student'}’s reward chart` : 'My reward chart'}</h2>
              <p className="text-sm text-ink-500">
                {progress.remaining === goal && total > 0
                  ? 'Chart complete — prize time! 🎁'
                  : total === 0
                    ? 'Collect stickers to fill your chart!'
                    : `${slotsFilled}/${goal} this chart — ${progress.remaining} more to a prize!`}
              </p>
              {progress.completedCharts > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-gold-label">
                  <Gift className="h-4 w-4" /> {progress.completedCharts} prize chart{progress.completedCharts > 1 ? 's' : ''} completed
                </p>
              )}
            </div>
          </div>

          {/* Goal chart — fill the slots to earn a prize. */}
          <div className="mt-5 grid grid-cols-5 gap-3 sm:grid-cols-10">
            {Array.from({ length: goal }).map((_, i) => {
              const s = currentStickers[i];
              return (
                <div key={i} className={`grid aspect-square place-items-center rounded-xl border-2 ${s ? 'border-emerald-tint bg-emerald-tint/40' : 'border-dashed border-line'}`}>
                  {s
                    ? <img src={s.image} alt={s.label} title={s.label} className="h-[78%] w-[78%] object-contain" draggable={false} />
                    : <Sparkles className="h-4 w-4 text-ink-200" />}
                </div>
              );
            })}
          </div>
        </Card>

        {tutorMode && (
          <Card className="mb-6 space-y-3 p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Give a sticker</h3>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Sticker" className="min-w-[180px] flex-1">
                <Select value={pickCode} onChange={(e) => setPickCode(e.target.value)}>
                  {STICKERS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                </Select>
              </Field>
              <img src={STICKERS.find((s) => s.code === pickCode)?.image} alt="" className="h-11 w-11 object-contain" draggable={false} />
            </div>
            <Field label="Message (optional)">
              <Textarea rows={2} value={note} placeholder="e.g. Brilliant work on your fractions homework!"
                onChange={(e) => setNote(e.target.value)} />
            </Field>
            {awardMsg && <p className="text-sm font-semibold text-success-700">{awardMsg}</p>}
            <Button disabled={awarding} onClick={award}>{awarding ? 'Awarding…' : 'Give sticker'}</Button>
          </Card>
        )}

        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Collection ({total})</h3>
        {stickers.length === 0 ? (
          <EmptyState icon={Sparkles} message={tutorMode ? 'No stickers yet — award the first one above!' : 'No stickers yet. Keep up the great work to earn some!'} />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {stickers.map((s) => (
              <Card key={s.id} className="flex flex-col items-center p-3 text-center">
                <img src={s.image} alt={s.label} className="h-14 w-14 object-contain" draggable={false} />
                <span className="mt-1 text-xs font-semibold text-ink-700">{s.label}</span>
                {s.note && <span className="mt-0.5 line-clamp-2 text-[11px] text-ink-400">{s.note}</span>}
                <span className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-300">{s.source === 'auto' ? 'Earned' : 'Awarded'}</span>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  };

  return tutorMode
    ? <><TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />{body()}</>
    : <div className="mx-auto max-w-4xl px-4 py-6">{body()}</div>;
}
