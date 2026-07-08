import React, { useMemo, useRef, useState } from 'react';
import { Play, Square, RotateCcw, CheckCircle2 } from 'lucide-react';
import { createSpeaker, ttsSupported, speakOptionsFor } from '../../utils/tts';
import { playWin } from '../../utils/sound';
import { confettiBurst } from '../../utils/confetti';

// Splits a passage into sentence segments, reads each one twice with a pause
// for writing, then scores the typed text against the original word by word.
export default function Dictation({ words = [], onAttempt, lang = 'en' }) {
  const speaker = useRef(createSpeaker());
  const sp = speakOptionsFor(lang);

  const seededPassage = useMemo(
    () => words.map((w) => w.sentence).filter(Boolean).join(' '),
    [words]
  );

  const [passage, setPassage] = useState(seededPassage);
  const [typed, setTyped] = useState('');
  const [slow, setSlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeSeg, setActiveSeg] = useState(-1);
  const [report, setReport] = useState(null);

  const segments = useMemo(
    () => passage.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [],
    [passage]
  );

  const start = () => {
    if (!segments.length) return;
    setReport(null);
    setPlaying(true);
    const rate = slow ? 0.7 : 0.85;
    const steps = [];
    segments.forEach((seg) => {
      // Mark which segment is being read (first read of each).
      steps.push({ text: seg, rate, seg: true, ...sp });
      steps.push({ pause: 600 });
      steps.push({ text: seg, rate, ...sp }); // read twice
      steps.push({ pause: Math.min(4000, 900 + seg.length * 60) }); // time to write
    });
    let segCounter = -1;
    speaker.current.play(steps, {
      onStep: (_, step) => {
        if (step.seg) {
          segCounter += 1;
          setActiveSeg(segCounter);
        }
      },
      onDone: () => {
        setPlaying(false);
        setActiveSeg(-1);
      }
    });
  };

  const stop = () => {
    speaker.current.stop();
    setPlaying(false);
    setActiveSeg(-1);
  };

  const tokenize = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  // Word-level longest common subsequence, used to highlight matches/misses.
  const diff = () => {
    const a = tokenize(passage);
    const b = tokenize(typed);
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    // Walk to mark which original words were matched in order.
    const matched = new Array(a.length).fill(false);
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        matched[i] = true;
        i += 1;
        j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i += 1;
      } else {
        j += 1;
      }
    }
    const correct = matched.filter(Boolean).length;
    return {
      tokens: a.map((w, k) => ({ w, ok: matched[k] })),
      correct,
      total: a.length,
      accuracy: a.length ? Math.round((correct / a.length) * 100) : 0
    };
  };

  const check = () => {
    stop();
    const r = diff();
    setReport(r);
    // Dictation is passage-level: it scores the whole typed passage against the
    // seeded sentences via LCS, which cannot yield reliable PER-WORD spelling
    // correctness. Logging one attempt per passage token corrupted per-word
    // mastery/SRS stats — it recorded example-sentence filler words that are on
    // no list, double-counted words repeated in a passage, and mis-graded
    // correctly-spelled words when the transcription was reordered or dropped a
    // word (LCS alignment != spelling correctness). Log a single passage-level
    // attempt instead; per-word spelling is captured by LookCoverCheck/MockTest.
    onAttempt?.('dictation', r.accuracy >= 80);
    if (r.accuracy >= 70) {
      playWin();
      confettiBurst();
    }
  };

  return (
    <div>
      {!ttsSupported() && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          Your browser does not support reading aloud, so the passage stays visible below.
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-1">Passage</label>
      <textarea
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        rows={3}
        placeholder="Paste or type a passage to be read aloud…"
        className="w-full p-3 border border-gray-300 rounded-lg focus:border-emerald outline-none text-sm"
      />

      <div className="flex flex-wrap items-center gap-3 my-4 text-sm">
        {!playing ? (
          <button
            onClick={start}
            disabled={!segments.length}
            className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald-deep disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> Start dictation
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} className="rounded text-emerald" />
          Slower voice
        </label>
        {playing && activeSeg >= 0 && (
          <span className="text-emerald font-medium">
            Reading sentence {activeSeg + 1} of {segments.length}…
          </span>
        )}
        <span className="ml-auto text-gray-400">{segments.length} sentence(s)</span>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">Write what you hear</label>
      <textarea
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        rows={5}
        placeholder="Type here as you listen…"
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald outline-none"
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={check}
          disabled={!typed.trim() || !passage.trim()}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 font-medium inline-flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" /> Check my writing
        </button>
        {report && (
          <button
            onClick={() => {
              setTyped('');
              setReport(null);
            }}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> Clear
          </button>
        )}
      </div>

      {report && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Accuracy: <span className="text-emerald">{report.accuracy}%</span>{' '}
            <span className="text-sm font-normal text-gray-500">
              ({report.correct}/{report.total} words)
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2">Your version compared to the passage:</p>
          <p className="leading-relaxed">
            {report.tokens.map((t, i) => (
              <span
                key={i}
                className={t.ok ? 'text-green-700' : 'text-red-600 line-through decoration-red-400'}
              >
                {t.w}{' '}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
