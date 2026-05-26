'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { T } from '@/lib/tokens';
import { Card, Button, Chip, Ring, ProgressBar } from '@/components/ui';
import { Math as Tex, Step } from '@/components/Math';
import FractionVisual from '@/components/FractionBar';
import { IconX, IconCheck, IconClock, IconArrowRight, IconSparkle, IconBolt } from '@/components/icons';
import Keypad from '@/components/Keypad';
import { api, studentId, getStudent } from '@/lib/client';

const MODE_CHIP = {
  remediate: { label: 'Remediation', tone: 'error' },
  prerequisite: { label: 'Foundation', tone: 'navy' },
  misconception: { label: 'Reinforce', tone: 'gold' },
  fluency: { label: 'Fluency drill', tone: 'gold' },
  advance: { label: 'New skill', tone: 'success' },
  review: { label: 'Review', tone: 'navy' },
};

// Shared: render a question's prompt (visual bar + KaTeX or plain text).
function QuestionView({ item, big }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {item.question_type === 'choice' && item.prompt_text && !item.prompt_latex && (
        <div style={{ fontSize: 17, fontWeight: 600, color: T.ink700, marginBottom: 16 }}>{item.prompt_text}</div>
      )}
      {item.visual && <div style={{ marginBottom: 18 }}><FractionVisual visual={item.visual} /></div>}
      {item.prompt_latex
        ? <Tex tex={item.prompt_latex} display size={big ? 2.4 : 1.6} color={T.navy700} />
        : item.question_type === 'numeric'
          ? <div style={{ fontFamily: T.fontDisplay, fontWeight: 500, fontSize: big ? 60 : 30, color: T.navy700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{item.prompt_text} <span style={{ color: T.ink300 }}>=</span></div>
          : null}
    </div>
  );
}

function Choices({ choices, onPick, chosen, answer, locked }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {choices.map((c) => {
        const isChosen = chosen === c.value;
        const isAnswer = c.value === answer;
        const bg = locked && isAnswer ? T.success100 : locked && isChosen ? T.error100 : T.paper;
        const border = locked && isAnswer ? T.success500 : locked && isChosen ? T.error500 : T.hairline;
        return (
          <button key={c.value} onClick={() => !locked && onPick(c.value)}
            onPointerDown={(e) => { if (!locked) e.currentTarget.style.transform = 'scale(0.96)'; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'none'; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            style={{ height: 76, borderRadius: 16, background: bg, border: `1.5px solid ${border}`, display: 'grid', placeItems: 'center', boxShadow: T.shadowResting, transition: `background 160ms ${T.easeCalm}, border-color 160ms ${T.easeCalm}, transform 100ms ${T.easeCalm}` }}>
            <Tex tex={c.latex} size={1.5} color={T.navy700} />
          </button>
        );
      })}
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const [phase, setPhase] = useState('loading');
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState('');
  const [chosen, setChosen] = useState(null);
  const [flash, setFlash] = useState(null);
  const [lastTime, setLastTime] = useState(null);
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [remediation, setRemediation] = useState(null);
  const [complete, setComplete] = useState(null);
  const results = useRef([]);
  const qStart = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !getStudent()) { router.replace('/'); return; }
    api.startSession(studentId()).then((d) => { if (d.error) return; setSession(d); results.current = []; setPhase('playing'); });
  }, [router]);

  useEffect(() => { if (phase === 'playing') { qStart.current = performance.now(); setValue(''); setChosen(null); } }, [idx, phase]);
  useEffect(() => { if (phase === 'complete') return; const t = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(t); }, [phase]);

  if (phase === 'loading' || !session) return <div style={{ padding: 60, textAlign: 'center', color: T.ink500 }}>Preparing your session…</div>;

  const items = session.items;
  const item = items[idx];
  const total = items.length;
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');
  const mode = MODE_CHIP[session.recommendation?.mode];

  async function finish() {
    setPhase('loading');
    const data = await api.completeSession({ studentId: studentId(), session_id: session.session_id, skill_id: session.skill.skill_id, items: results.current });
    setComplete(data); setPhase('complete');
  }
  function advance() { if (idx + 1 >= total) finish(); else setIdx((i) => i + 1); }

  async function submit(given) {
    if (given == null || given === '' || phase !== 'playing') return;
    const timeSeconds = (performance.now() - qStart.current) / 1000;
    const ok = item.question_type === 'choice' ? String(given) === String(item.answer) : Number(given) === Number(item.answer);
    setLastTime(timeSeconds); setChosen(given);
    const base = { question_id: item.question_id, given_answer: String(given), first_try: true, time_seconds: Math.round(timeSeconds * 10) / 10 };
    if (ok) {
      results.current.push({ ...base, correct: true, hint_used: false, misconception_tag: null });
      setFlash('ok'); setStreak((s) => s + 1);
      setTimeout(() => { setFlash(null); advance(); }, item.question_type === 'choice' ? 750 : 650);
      return;
    }
    setFlash('no'); setStreak(0);
    const res = await api.attempt(studentId(), item.skill_id, item.params, given);
    results.current.push({ ...base, correct: false, hint_used: true, misconception_tag: res.remediation?.misconception?.tag || null });
    setTimeout(() => { setFlash(null); setRemediation(res.remediation); setPhase('remediation'); }, item.question_type === 'choice' ? 850 : 800);
  }

  if (phase === 'complete' && complete) {
    return <Summary session={session} complete={complete} elapsed={`${mm}:${ss}`} bestStreak={streak} onAgain={() => window.location.reload()} onDone={() => router.push('/mathpath')} />;
  }
  if (phase === 'remediation' && remediation) {
    return <Remediation skillName={session.skill.skill_name} data={remediation} onDone={() => { setRemediation(null); setPhase('playing'); advance(); }} />;
  }

  const target = session.skill.expected_time_seconds;
  const speedColor = lastTime == null ? T.navy700 : lastTime < target ? T.success500 : lastTime < target * 1.5 ? T.gold500 : T.error500;
  const valueColor = flash === 'ok' ? T.success500 : flash === 'no' ? T.error500 : T.navy700;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: T.paper }}>
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => router.push('/mathpath')} style={{ width: 36, height: 36, borderRadius: 12, background: T.bone, display: 'grid', placeItems: 'center', color: T.navy700 }}><IconX size={18} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
            {session.skill.skill_name}{mode && <Chip size="s" tone={mode.tone}>{mode.label}</Chip>}
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, color: T.ink700, fontWeight: 600, marginTop: 1 }}>{Math.min(idx + 1, total)} / {total}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.navy050, padding: '6px 10px', borderRadius: 999, color: T.navy700, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13 }}>
          <IconClock size={13} />{mm}:{ss}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ height: 3, borderRadius: 999, background: T.bone, overflow: 'hidden' }}>
          <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${T.navy700}, ${T.gold500})`, transition: `width 400ms ${T.easeCalm}` }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Streak</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ width: 18, height: 8, borderRadius: 4, background: i < Math.min(streak, 6) ? T.gold500 : T.bone, transition: `background 240ms ${T.easeCalm}` }} />)}
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 600, color: T.navy700, marginLeft: 4 }}>{streak}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>Question {Math.min(idx + 1, total)}</div>
        <div key={`q-${idx}`} style={{ opacity: flash && item.question_type === 'numeric' ? 0.55 : 1, transition: `opacity 200ms ${T.easeCalm}`, width: '100%', animation: `tian-in .3s ${T.easeCalm}` }}>
          <QuestionView item={item} big />
        </div>

        {item.question_type === 'numeric' && (
          <div style={{ marginTop: 26, minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 50, fontWeight: 500, color: valueColor, letterSpacing: '-0.03em', minHeight: 58, lineHeight: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 12 }}>
              {value || <span style={{ color: T.ink100 }}>·</span>}
              {flash === 'ok' && <IconCheck size={32} color={T.success500} />}
              {flash === 'no' && <IconX size={32} color={T.error500} />}
            </div>
            {flash === 'no' && <div style={{ fontSize: 13, color: T.ink500, marginTop: 6 }}>The answer is <b style={{ color: T.navy700 }}>{item.answer}</b>.</div>}
            {flash === 'ok' && lastTime != null && <div style={{ fontSize: 12, color: speedColor, fontWeight: 600, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{lastTime.toFixed(1)}s {lastTime < target ? '· fast' : '· steady'}</div>}
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))' }}>
        {item.question_type === 'numeric'
          ? <Keypad value={value} onChange={setValue} onSubmit={() => submit(value)} disabled={flash != null} />
          : <Choices choices={item.choices} onPick={submit} chosen={chosen} answer={item.answer} locked={flash != null} />}
      </div>
    </div>
  );
}

// ── AI remediation: message → worked example → guided "now you try" ──
function Remediation({ skillName, data, onDone }) {
  const [sib, setSib] = useState('');
  const [sibState, setSibState] = useState(null);
  const tq = data.guided.try_question;
  const check = (given) => { if (given == null || given === '') return; setSib(given); setSibState(String(given) === String(tq.answer) ? 'right' : 'wrong'); };

  return (
    <div style={{ paddingBottom: 28, animation: `tian-in .35s ${T.easeCalm}` }}>
      <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.gold700, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Remediation</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', marginTop: 1 }}>{skillName}</div>
        </div>
        <Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>Coach</Chip>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ background: T.gold100, border: `1px solid ${T.gold300}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, background: T.gold500, color: T.navy900, display: 'grid', placeItems: 'center', marginTop: 1, fontWeight: 700 }}>!</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{data.misconception.label}</div>
            <div style={{ fontSize: 13.5, color: T.ink700, lineHeight: 1.5 }}>{data.message}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Worked example</div>
          {data.worked_example.visual && <div style={{ marginBottom: 12 }}><FractionVisual visual={data.worked_example.visual} /></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.worked_example.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: 8, flexShrink: 0, background: T.navy700, color: T.paper, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 }}>{i + 1}</div>
                <div style={{ flex: 1, fontSize: 13.5, color: T.ink700, lineHeight: 1.5 }}><Step step={s} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.gold700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Now you try{data.guided.from_prerequisite ? ` · ${data.guided.from_prerequisite}` : ''}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}><QuestionView item={tq} /></div>
          {tq.question_type === 'numeric' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <input inputMode="numeric" value={sib} onChange={(e) => { setSib(e.target.value.replace(/[^0-9]/g, '')); setSibState(null); }} onKeyDown={(e) => e.key === 'Enter' && check(sib)}
                style={{ width: 90, height: 48, borderRadius: 12, border: `2px solid ${sibState === 'right' ? T.success500 : sibState === 'wrong' ? T.error500 : T.hairline}`, background: T.paper, textAlign: 'center', fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600, color: T.navy700, outline: 'none' }} />
              {sibState == null && <Button variant="secondary" size="m" onClick={() => check(sib)} disabled={!sib}>Check</Button>}
            </div>
          ) : (
            <Choices choices={tq.choices} onPick={check} chosen={sib} answer={tq.answer} locked={sibState != null} />
          )}
          {sibState === 'wrong' && <div style={{ fontSize: 12.5, color: T.error500, marginTop: 10, textAlign: 'center' }}>Not quite — try again, following the pattern.</div>}
          {sibState === 'right' && <div style={{ fontSize: 12.5, color: T.success500, fontWeight: 600, marginTop: 10, textAlign: 'center' }}>That’s it — pattern locked in.</div>}
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {sibState === 'right'
          ? <Button variant="primary" size="m" fullWidth onClick={onDone} iconRight={<IconArrowRight size={16} />}>Keep practising</Button>
          : <Button variant="ghost" size="m" fullWidth onClick={onDone}>Skip for now</Button>}
      </div>
    </div>
  );
}

// ── Session summary ──
function Summary({ session, complete, elapsed, bestStreak, onAgain, onDone }) {
  const m = complete.mastery_update;
  const next = complete.next_recommendation;
  const summary = complete.session_summary;
  const accuracy = Math.round(m.accuracy * 100);
  const masteryPct = Math.round(m.score * 100);
  const sameSkill = next.recommended_skill_id === session.skill.skill_id;

  return (
    <div style={{ background: T.ivory, minHeight: '100dvh', paddingBottom: 32, animation: `tian-in .4s ${T.easeCalm}` }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onDone} style={{ width: 36, height: 36, borderRadius: 12, background: T.paper, border: `1px solid ${T.hairline}`, display: 'grid', placeItems: 'center', color: T.navy700 }}><IconX size={18} /></button>
        <div style={{ flex: 1, fontSize: 13, color: T.ink500, fontWeight: 600 }}>Session complete</div>
      </div>

      <div style={{ padding: '8px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.gold700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{session.skill.skill_name}</div>
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 30, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{m.mastery_status === 'mastered' ? 'Mastered.' : 'Good progress.'}</div>
        <div style={{ fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5, maxWidth: 280, margin: '8px auto 0' }}>{summary.correct_count} of {summary.item_count} first-try correct in {elapsed}.</div>
      </div>

      <div style={{ padding: '24px 20px 0', display: 'flex', justifyContent: 'center', gap: 22 }}>
        <Ring value={masteryPct} size={104} stroke={10} label={`${masteryPct}%`} sub="mastery" gold />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          <SummaryStat label="Accuracy" value={`${accuracy}%`} />
          {m.median_first_try_seconds != null && <SummaryStat label="Typical time" value={`${m.median_first_try_seconds}s`} />}
          <SummaryStat label="Best streak" value={m.best_streak ?? bestStreak} />
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <Card padding={18}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ink500, letterSpacing: '0.06em', marginBottom: 10, textTransform: 'capitalize' }}>Mastery · {m.mastery_status.replace('_', ' ')} · {m.fluency_status}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: T.ink700, fontWeight: 500 }}>{session.skill.skill_name}</span>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: m.mastery_status === 'mastered' ? T.success500 : T.navy700, fontWeight: 600 }}>{m.mastery_status === 'mastered' ? 'Mastered ✓' : `${masteryPct}%`}</span>
          </div>
          <ProgressBar value={masteryPct} color={T.navy700} gold={masteryPct >= 85} height={7} />
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Card padding={18} style={{ background: T.navy700, border: 'none', color: T.paper }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.gold300, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{sameSkill ? 'Recommended next' : 'Up next'}</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>{next.skill.skill_name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, marginBottom: 14 }}>{next.reason}</div>
          <Button variant="gold" size="m" onClick={onAgain} iconRight={<IconArrowRight size={16} />}>{sameSkill ? 'Practise again' : `Start ${next.skill.skill_name}`}</Button>
        </Card>
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <Button variant="secondary" size="m" fullWidth onClick={onDone}>Back to MathPath</Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}
