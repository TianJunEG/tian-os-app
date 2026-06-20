import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, X, ArrowRight, ArrowLeft, EyeOff, Volume2 } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';
import { speak, isVoiceEnabled, setVoiceEnabled } from '../../../utils/sound';
import { getMascotVoice } from '../../../config/mascots';

// Self-test: each word is shown briefly to memorise, then hidden so the student
// types it from the sentence clue. (No audio yet — the brief reveal stands in
// for dictation.) One word at a time; graded server-side. A refresh sends the
// student back to the spelling home (items live in navigation state).
export default function SelfTest() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];
  const listTitle = location.state?.listTitle;

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(true);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (!items.length) navigate('/student/spelling', { replace: true }); }, [items, navigate]);
  useEffect(() => { setRevealed(true); setAnswer(''); setResult(null); setErr(''); }, [idx]);

  if (!items.length) return <Spinner />;
  const w = items[idx];
  const isLast = idx === items.length - 1;

  const check = async () => {
    if (busy || answer.trim() === '') return;
    setBusy(true); setErr('');
    try { const { data } = await spellingPracticeAPI.attempt(sessionId, { wordId: w.wordId, answer }); setResult(data); }
    catch (e) {
      const msg = e.response?.data?.error;
      setErr(msg === 'Word not found.' || msg === 'Session not found.'
        ? 'This practice set is out of date — please start a new session from Spelling.'
        : (msg || 'Could not check your spelling. Please try again.'));
    } finally { setBusy(false); }
  };
  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); return; }
    setBusy(true);
    try { await spellingPracticeAPI.complete(sessionId); } catch (_) { /* still navigate */ }
    navigate(`/student/spelling/results/${sessionId}`, { replace: true });
  };
  // Read the sentence clue aloud (dictation aid). Force-enable voice so speak()
  // isn't gated off, then narrate with Lysa's voice (the Spelling mascot).
  const readAloud = () => {
    if (!isVoiceEnabled()) setVoiceEnabled(true);
    const toRead = w.sentence || w.word || '';
    if (toRead) speak(toRead, getMascotVoice('lysa'));
  };

  return (
    <div className="mx-auto max-w-xl">
      <button
        onClick={() => navigate('/student/spelling')}
        aria-label="Exit self-test and return to Spelling"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-emerald-deep"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Spelling
      </button>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-ink-500">
        <span className="font-mono tabular-nums">Word {idx + 1} of {items.length}</span>
        {listTitle && <span className="min-w-0 truncate">{listTitle}</span>}
      </div>
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-6" />

      {/* Fixed min-height + button pinned to the bottom keeps the card the same
          size across the reveal / type / answered states (no layout jump). */}
      <Card className="flex min-h-[24rem] flex-col p-6">
        {/* Brief reveal, then cover */}
        {revealed && !result ? (
          <div className="m-auto text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Remember this spelling</p>
            <p className="my-3 font-display text-2xl sm:text-3xl font-semibold text-emerald-deep">{w.word}</p>
            {w.sentence && <p className="mx-auto mb-5 max-w-sm text-sm text-ink-500">{w.sentence}</p>}
            <Button size="m" icon={EyeOff} onClick={() => setRevealed(false)}>Hide &amp; spell it</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              {w.sentence
                ? <p className="text-ink-700">{w.sentence}</p>
                : <p className="text-sm text-ink-400">Type the word you just saw.</p>}
              <button
                type="button"
                onClick={readAloud}
                aria-label="Read the clue aloud"
                title="Read aloud"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-emerald-tint hover:text-emerald-deep"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <input
              value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result} autoFocus
              placeholder="Type the word" onKeyDown={(e) => { if (e.key === 'Enter' && !result) check(); }}
              aria-label="Type the spelling you just saw"
              className="w-full rounded-xl border border-line-soft px-4 py-3 text-lg text-ink-900 focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20"
            />

            {/* Reserved slot keeps the button position stable between states. */}
            <div className="mt-5 min-h-[72px]">
              {result && (
                <div className={`rounded-xl p-4 ${result.correct ? 'bg-success-100' : 'bg-error-100'}`}>
                  <div className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-success-700' : 'text-error-700'}`}>
                    {result.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    {result.correct ? 'Correct' : 'Not quite'}
                  </div>
                  {!result.correct && <p className="mt-1 text-sm text-ink-700">Correct spelling: <span className="font-semibold">{result.correctAnswer}</span></p>}
                </div>
              )}
              {err && (
                <p className="rounded-xl border-l-4 border-l-error-500 bg-error-100 p-3 text-sm text-error-700">
                  {err} {/out of date/.test(err) && <button onClick={() => navigate('/student/spelling', { replace: true })} className="font-semibold underline">Back to Spelling</button>}
                </p>
              )}
            </div>

            <div className="mt-auto pt-2">
              {!result ? (
                <Button size="l" disabled={busy || answer.trim() === ''} onClick={check} className="w-full">Check answer</Button>
              ) : (
                <Button size="l" icon={ArrowRight} disabled={busy} onClick={next} className="w-full">{isLast ? 'Finish' : 'Next word'}</Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
