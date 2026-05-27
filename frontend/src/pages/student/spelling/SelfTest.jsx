import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, X, ArrowRight, Eye } from 'lucide-react';
import { spellingPracticeAPI } from '../../../services/api';
import { Card, Button, ProgressBar, Spinner } from '../../../components/ui';

// Self-test: each word is shown briefly to memorise, then hidden so the student
// types it from the sentence clue. (No audio yet — the brief reveal stands in
// for dictation.) One word at a time; graded server-side.
export default function SelfTest() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(true);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!items.length) navigate('/student/spelling', { replace: true }); }, [items, navigate]);
  useEffect(() => { setRevealed(true); setAnswer(''); setResult(null); }, [idx]);

  if (!items.length) return <Spinner />;
  const w = items[idx];
  const isLast = idx === items.length - 1;

  const check = async () => {
    if (busy || answer === '') return;
    setBusy(true);
    try { const { data } = await spellingPracticeAPI.attempt(sessionId, { wordId: w.wordId, answer }); setResult(data); }
    catch (_) { /* allow retry */ } finally { setBusy(false); }
  };
  const next = async () => {
    if (!isLast) { setIdx((i) => i + 1); return; }
    setBusy(true);
    try { await spellingPracticeAPI.complete(sessionId); } catch (_) { /* still navigate */ }
    navigate(`/student/spelling/results/${sessionId}`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-ink-500">
        <span className="font-mono tabular-nums">Word {idx + 1} of {items.length}</span>
      </div>
      <ProgressBar value={idx + (result ? 1 : 0)} max={items.length} className="mb-6" />

      <Card className="p-6">
        {/* Brief reveal, then cover */}
        {revealed && !result ? (
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Remember this spelling</p>
            <p className="my-3 font-display text-3xl font-semibold text-navy-700">{w.word}</p>
            <Button size="m" icon={Eye} onClick={() => setRevealed(false)}>Hide & spell it</Button>
          </div>
        ) : (
          <>
            {w.sentence && <p className="mb-4 text-ink-700">{w.sentence}</p>}
            <input
              value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!!result} autoFocus
              placeholder="Type the word" onKeyDown={(e) => { if (e.key === 'Enter' && !result) check(); }}
              className="w-full rounded-xl border border-hairline px-4 py-3 text-lg text-ink-900 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
            />
            {result && (
              <div className={`mt-5 rounded-xl p-4 ${result.correct ? 'bg-success-100' : 'bg-error-100'}`}>
                <div className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-success-700' : 'text-error-700'}`}>
                  {result.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  {result.correct ? 'Correct' : 'Not quite'}
                </div>
                {!result.correct && <p className="mt-1 text-sm text-ink-700">Correct spelling: <span className="font-semibold">{result.correctAnswer}</span></p>}
              </div>
            )}
            <div className="mt-6">
              {!result ? (
                <Button size="l" disabled={busy || answer === ''} onClick={check} className="w-full">Check answer</Button>
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
