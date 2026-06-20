import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lightbulb, CheckCircle, XCircle, BookOpen, Volume2, VolumeX, Pencil } from 'lucide-react';
import { getEpisode, getEpisodeById, MASCOT_COLORS } from '../../../data/comics/episodes';
import { resolveTier, generateEpisodeProblems } from '../../../data/comics/comicDifficulty';
import { comicsAPI, learningTelemetryAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import useComicNarration from './useComicNarration';
import WorkingCanvas from '../../../components/learning/WorkingCanvas';

// ─── Speech bubble ───────────────────────────────────────────────────────────

function SpeechBubble({ text, side, color, onPlay, isSpeaking }) {
  const isLeft = side === 'left';
  return (
    <div
      style={{
        position: 'relative',
        background: isSpeaking ? '#fffbeb' : '#fff',
        border: `2.5px solid ${color}`,
        borderRadius: 14,
        padding: '8px 13px',
        paddingRight: onPlay ? 30 : 13,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        maxWidth: 220,
        alignSelf: isLeft ? 'flex-start' : 'flex-end',
        marginLeft: isLeft ? 8 : 'auto',
        marginRight: isLeft ? 'auto' : 8,
        marginTop: 6,
        boxShadow: isSpeaking ? `0 0 0 3px ${color}44` : 'none',
        transition: 'box-shadow 0.15s, background 0.15s',
      }}
    >
      {text}
      {onPlay && (
        <button
          type="button"
          aria-label="Read aloud"
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 2,
            lineHeight: 0,
            color,
          }}
        >
          <Volume2 size={14} />
        </button>
      )}
      {/* tail */}
      <span
        style={{
          position: 'absolute',
          bottom: -12,
          [isLeft ? 'left' : 'right']: 18,
          width: 0,
          height: 0,
          borderLeft: isLeft ? `6px solid transparent` : `6px solid ${color}`,
          borderRight: isLeft ? `6px solid ${color}` : `6px solid transparent`,
          borderTop: `10px solid ${color}`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: -9,
          [isLeft ? 'left' : 'right']: 19,
          width: 0,
          height: 0,
          borderLeft: isLeft ? '5px solid transparent' : '5px solid #fff',
          borderRight: isLeft ? '5px solid #fff' : '5px solid transparent',
          borderTop: '9px solid #fff',
        }}
      />
    </div>
  );
}

// ─── Character placeholder (until real PNGs land) ────────────────────────────

function CharacterStand({ characterKey, pose, side }) {
  const color = MASCOT_COLORS[characterKey] ?? '#888';
  const label = characterKey.charAt(0).toUpperCase() + characterKey.slice(1);
  const isLeft = side === 'left';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: 0.9,
      }}
    >
      {/* Try real image first, fall back to placeholder */}
      <img
        src={`/comics/characters/${characterKey}-${pose}.png`}
        alt={`${label} — ${pose}`}
        style={{
          height: characterKey === 'kylo' ? 110 : 140,
          width: 'auto',
          objectFit: 'contain',
          transform: isLeft ? 'none' : 'scaleX(-1)',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling.style.display = 'flex';
        }}
      />
      {/* Placeholder shown only when image 404s */}
      <div
        style={{
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div
          style={{
            width: characterKey === 'kylo' ? 52 : 64,
            height: characterKey === 'kylo' ? 52 : 64,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: characterKey === 'kylo' ? 22 : 28,
            boxShadow: `0 2px 8px ${color}55`,
          }}
        >
          {label[0]}
        </div>
        <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

// ─── Scene background ─────────────────────────────────────────────────────────

const SCENE_COLORS = {
  'hawker-centre': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fbbf24 100%)',
};

function ScenePanel({ scene, characters, speech, onPlayLine, speakingIndex = -1 }) {
  const bg = SCENE_COLORS[scene] ?? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';

  // Group speeches by side
  const leftSpeech = speech.filter((s) => s.side === 'left');
  const rightSpeech = speech.filter((s) => s.side === 'right');

  const leftChar = characters.find((c) => c.side === 'left');
  const rightChar = characters.find((c) => c.side === 'right');
  const leftColor = leftChar ? MASCOT_COLORS[leftChar.key] : '#888';
  const rightColor = rightChar ? MASCOT_COLORS[rightChar.key] : '#888';

  return (
    <div
      style={{
        background: bg,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 260,
        border: '3px solid #1c1917',
      }}
    >
      {/* Background scene image — shown prominently when present, gradient is the fallback */}
      <img
        src={`/comics/backgrounds/${scene}.jpg`}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {/* Soft top scrim so speech bubbles always read against the scene */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 38%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Speech bubbles row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 12px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
          {leftSpeech.map((s, i) => (
            <SpeechBubble
              key={i}
              text={s.text}
              side="left"
              color={leftColor}
              onPlay={onPlayLine ? () => onPlayLine(s) : undefined}
              isSpeaking={speakingIndex === speech.indexOf(s)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 6, alignItems: 'flex-end' }}>
          {rightSpeech.map((s, i) => (
            <SpeechBubble
              key={i}
              text={s.text}
              side="right"
              color={rightColor}
              onPlay={onPlayLine ? () => onPlayLine(s) : undefined}
              isSpeaking={speakingIndex === speech.indexOf(s)}
            />
          ))}
        </div>
      </div>

      {/* Characters row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '16px 24px 8px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {leftChar && (
          <CharacterStand characterKey={leftChar.key} pose={leftChar.pose} side="left" />
        )}
        {rightChar && (
          <CharacterStand characterKey={rightChar.key} pose={rightChar.pose} side="right" />
        )}
      </div>
    </div>
  );
}

// ─── Inline problem box ───────────────────────────────────────────────────────

function ProblemBox({ problem, onSolve, solved, episode, panelIndex }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [showHint, setShowHint] = useState(false);

  const check = useCallback(() => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (num === problem.answer) {
      setStatus('correct');
      onSolve(problem.id, true);
    } else {
      setStatus('wrong');
      onSolve(problem.id, false);
    }
  }, [value, problem, onSolve]);

  const handleKey = (e) => {
    if (e.key === 'Enter') check();
  };

  return (
    <div
      style={{
        marginTop: 14,
        background: '#fffbeb',
        border: '2.5px solid #f59e0b',
        borderRadius: 14,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <BookOpen size={15} style={{ color: '#92400e' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Maths Challenge
        </span>
      </div>

      <p style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 12, lineHeight: 1.5 }}>
        {problem.question}
      </p>

      {problem.menuNote && (
        <p style={{ fontSize: 12, color: '#78716c', marginBottom: 10, fontStyle: 'italic' }}>
          Menu: {problem.menuNote}
        </p>
      )}

      {status !== 'correct' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#fff',
              border: `2px solid ${status === 'wrong' ? '#ef4444' : '#d4d4d4'}`,
              borderRadius: 10,
              padding: '6px 10px',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {problem.unitPosition === 'prefix' && (
              <span style={{ color: '#78716c' }}>{problem.unit}</span>
            )}
            <input
              type="number"
              value={value}
              onChange={(e) => { setValue(e.target.value); setStatus('idle'); }}
              onKeyDown={handleKey}
              placeholder="?"
              style={{
                width: 64,
                border: 'none',
                outline: 'none',
                fontSize: 15,
                fontWeight: 700,
                background: 'transparent',
                textAlign: 'center',
              }}
            />
          </div>
          <button
            onClick={check}
            style={{
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Check
          </button>
          <button
            onClick={() => setShowHint((h) => !h)}
            style={{
              background: 'transparent',
              border: '1.5px solid #d4d4d4',
              borderRadius: 10,
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#78716c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Lightbulb size={13} />
            Hint
          </button>
        </div>
      )}

      {status === 'wrong' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
          <XCircle size={15} /> Not quite — try again!
        </div>
      )}

      {status === 'correct' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 14, fontWeight: 700 }}>
          <CheckCircle size={16} />
          {problem.unitPosition === 'prefix' ? `${problem.unit}${problem.answer}` : `${problem.answer}${problem.unit}`} — correct!
        </div>
      )}

      {showHint && status !== 'correct' && (
        <div
          style={{
            marginTop: 10,
            background: '#fef9c3',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: '#713f12',
            fontWeight: 500,
          }}
        >
          💡 {problem.hint}
        </div>
      )}
    </div>
  );
}

// ─── Optional working scratchpad ──────────────────────────────────────────────
// A lightweight, collapsed-by-default sketch area so a child CAN show working
// without slowing the quick-read format. Reuses the MathPath WorkingCanvas in
// compact mode; never required. Captures vector strokes only (no AI analysis) —
// surfaced upward via onChange so the reader can save them with the episode.

function WorkingScratch({ problemId, value, onChange }) {
  const [open, setOpen] = useState(false);
  const hasWork = (value?.workingStrokes?.length || 0) > 0;
  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: '1.5px dashed #d4d4d4',
          borderRadius: 10,
          padding: '7px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: hasWork ? '#b45309' : '#78716c',
          cursor: 'pointer',
        }}
      >
        <Pencil size={13} />
        {open ? 'Hide working' : hasWork ? 'Working added · edit' : 'Show working (optional)'}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <WorkingCanvas
            questionId={problemId}
            required={false}
            allowNoWorking
            compact
            label="Sketch your working"
            submittedStrokes={value?.workingStrokes || []}
            onChange={(payload) => onChange(problemId, payload)}
          />
        </div>
      )}
    </div>
  );
}

// ─── End card ─────────────────────────────────────────────────────────────────

function EndCard({ nextEpisode, nextRec, onPlayNext }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        borderRadius: 16,
        border: '3px solid #1c1917',
        padding: '24px 20px',
        textAlign: 'center',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Episode complete!</p>

      {/* Adaptive "play next" — chains the reader into the episode that
          practises the student's weakest skill, keeping the session going. */}
      {nextRec?.episode && (
        <div style={{ marginTop: 12, marginBottom: nextEpisode ? 18 : 0 }}>
          {nextRec.skillName && (
            <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
              ✨ Next, let&apos;s practise {nextRec.skillName}
            </p>
          )}
          <button
            type="button"
            onClick={onPlayNext}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fbbf24',
              color: '#1c1917',
              border: '2.5px solid #1c1917',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.35)',
            }}
          >
            Play next · Ep {nextRec.episode.episode}: {nextRec.episode.title}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {nextEpisode && (
        <>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12, lineHeight: 1.5 }}>
            {nextEpisode.teaser}
          </p>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Coming next week
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export default function ComicReader() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const episode = getEpisode(slug);

  const [currentPanel, setCurrentPanel] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState({});
  const [workingByProblem, setWorkingByProblem] = useState({}); // optional scratchpad strokes, keyed by problemId
  const [submitted, setSubmitted] = useState(false);
  const [nextRec, setNextRec] = useState(null); // adaptive "play next" pick

  const { user } = useAuth();
  // One seed per reading: numbers stay stable while you read, fresh on replay.
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  // Difficulty tier from the student's level (never easier than the episode's
  // own grade); higher levels get harder numbers on the same story.
  const tier = useMemo(() => resolveTier(user || {}, episode?.grade || ''), [user, episode]);
  // Concrete, level-scaled problems for every panel, generated once per reading
  // with a shared ctx so story-linked numbers stay consistent across panels.
  // generateEpisodeProblems returns { problems, ctx } — ctx carries intermediate
  // values (totals, counts) that speech bubble functions reference.
  const { problems, ctx: episodeCtx } = useMemo(
    () => (episode ? generateEpisodeProblems(episode, tier, seed) : { problems: [], ctx: {} }),
    [episode, tier, seed],
  );

  const handleSolve = useCallback((problemId, correct) => {
    setSolvedProblems((prev) => ({ ...prev, [problemId]: correct }));
  }, []);

  // Keep only the vector strokes from the scratchpad (drop any rasterised image)
  // so the saved payload stays small.
  const handleWorking = useCallback((problemId, payload) => {
    setWorkingByProblem((prev) => ({ ...prev, [problemId]: { workingStrokes: payload?.workingStrokes || [] } }));
  }, []);

  const narration = useComicNarration();

  // Auto-narrate a panel's dialogue when the toggle is on; always cut off any
  // in-flight speech when the panel changes (incl. advancing to the end card).
  useEffect(() => {
    narration.stop();
    const current = episode?.panels?.[currentPanel];
    if (narration.autoNarrate && current) {
      // Resolve any function-based speech text before handing to narration.
      const resolved = {
        ...current,
        speech: (current.speech || []).map((s) => ({
          ...s,
          text: typeof s.text === 'function' ? s.text(episodeCtx, problems[currentPanel]) : s.text,
        })),
      };
      narration.playPanel(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPanel, narration.autoNarrate, episode]);

  // The route stays mounted when the slug changes (e.g. tapping "Play next"), so
  // reset to the first panel for the new episode.
  useEffect(() => {
    setCurrentPanel(0);
    setSolvedProblems({});
    setWorkingByProblem({});
    setSubmitted(false);
    setNextRec(null);
  }, [slug]);

  // Phase 3 instrumentation — one "opened" event per episode view (the top of
  // the engagement funnel). Fire-and-forget; never block the reader.
  useEffect(() => {
    if (!episode) return;
    learningTelemetryAPI.recordEvent({
      eventType: 'comic_episode_opened',
      domain: 'comics',
      sessionId: episode.id,
      metadata: { episodeId: episode.id, episodeTitle: episode.title },
    }).catch(() => {});
  }, [episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // On the end card, fetch the adaptive next pick. The finished episode was just
  // written to progress, so /recommended already excludes it; we also guard
  // against recommending the same episode.
  useEffect(() => {
    const atEnd = episode && currentPanel >= episode.panels.length;
    if (!atEnd) return undefined;
    let on = true;
    comicsAPI.recommended()
      .then((res) => {
        const rec = res.data?.recommended;
        const ep = rec && getEpisodeById(rec.episodeId);
        if (on && ep && ep.id !== episode.id) setNextRec({ episode: ep, skillName: rec.skillName });
      })
      .catch(() => { /* non-critical — the static teaser still shows */ });
    return () => { on = false; };
  }, [currentPanel, episode]);

  if (!episode) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#78716c' }}>
        Episode not found.
      </div>
    );
  }

  // Once the last panel is finished, currentPanel advances past the array to
  // show the end card — so `panel` is undefined here. Guard every dereference
  // below (optional chaining) or the end-card render throws.
  const panel = episode.panels[currentPanel];
  const problem = problems[currentPanel]; // level-scaled (or static) problem for this panel
  const isLast = currentPanel === episode.panels.length - 1;
  const currentProblemSolved = problem ? solvedProblems[problem.id] === true : true;
  const allSolved = problems.every((p) => !p || solvedProblems[p.id] === true);

  const goNext = async () => {
    if (isLast) {
      if (!submitted && allSolved) {
        setSubmitted(true);
        const answers = Object.values(solvedProblems);
        try {
          await comicsAPI.complete(episode.id, Object.entries(solvedProblems).map(([id, correct]) => {
            const strokes = workingByProblem[id]?.workingStrokes;
            return strokes?.length ? { problemId: id, correct, workingStrokes: strokes } : { problemId: id, correct };
          }));
        } catch (_) {
          // non-blocking
        }
        // Phase 3 instrumentation — the engagement signal for retention /
        // trial→paid. Fire-and-forget; never block the reader.
        learningTelemetryAPI.recordEvent({
          eventType: 'comic_episode_completed',
          domain: 'comics',
          sessionId: episode.id,
          metadata: {
            episodeId: episode.id,
            tier,
            problemsCorrect: answers.filter(Boolean).length,
            problemsTotal: answers.length,
          },
        }).catch(() => {});
      }
      setCurrentPanel(episode.panels.length); // show end card
    } else {
      setCurrentPanel((p) => p + 1);
    }
  };

  const showEndCard = currentPanel >= episode.panels.length;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => { narration.stop(); navigate('/student/comics'); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#78716c',
            fontSize: 13,
            fontWeight: 600,
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} /> All episodes
        </button>
        {narration.supported && (
          <button
            type="button"
            onClick={() => narration.setAutoNarrate(!narration.autoNarrate)}
            aria-pressed={narration.autoNarrate}
            title={narration.autoNarrate ? 'Auto-narration on' : 'Auto-narration off'}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 700,
              border: `1.5px solid ${narration.autoNarrate ? '#f59e0b' : '#d4d4d4'}`,
              background: narration.autoNarrate ? '#fffbeb' : 'transparent',
              color: narration.autoNarrate ? '#b45309' : '#78716c',
            }}
          >
            {narration.autoNarrate ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Narrate
          </button>
        )}
        <div style={{ marginLeft: narration.supported ? 12 : 'auto', fontSize: 12, color: '#a8a29e', fontWeight: 500 }}>
          {showEndCard ? '✓ Done' : `Panel ${currentPanel + 1} of ${episode.panels.length}`}
        </div>
      </div>

      {/* Episode title */}
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 2 }}>
        Ep {episode.episode}: {episode.title}
      </h1>
      <p style={{ fontSize: 12, color: '#a8a29e', fontWeight: 500, marginBottom: 16 }}>
        {episode.grade} · The Tian 7 Chronicles
      </p>

      {/* Panel progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {episode.panels.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i < currentPanel || showEndCard ? '#f59e0b' : i === currentPanel ? '#fbbf24' : '#e5e7eb',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {showEndCard ? (
        <EndCard
          nextEpisode={episode.nextEpisode}
          nextRec={nextRec}
          onPlayNext={() => {
            if (!nextRec?.episode) return;
            narration.stop();
            navigate(`/student/comics/${nextRec.episode.slug}`);
          }}
        />
      ) : (
        <>
          {/* Scene — speech entries may be plain strings or functions (ctx, problem) => string
              so story numbers always match the generated math challenge numbers. */}
          <ScenePanel
            scene={panel.scene}
            characters={panel.characters}
            speech={(panel.speech || []).map((s) => ({
              ...s,
              text: typeof s.text === 'function' ? s.text(episodeCtx, problems[currentPanel]) : s.text,
            }))}
            onPlayLine={narration.supported ? (line) => narration.playLine(line, panel.characters) : undefined}
            speakingIndex={narration.speakingIndex}
          />

          {/* Menu note if present — a generated problem may override it when it
              regenerates the prices, so the menu and the question stay in sync. */}
          {(problem?.menuNote ?? panel.menuNote) && (
            <div
              style={{
                marginTop: 10,
                background: '#f5f5f4',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 12,
                color: '#57534e',
                fontWeight: 500,
                fontStyle: 'italic',
              }}
            >
              📋 {problem?.menuNote ?? panel.menuNote}
            </div>
          )}

          {/* Problem + optional working scratchpad */}
          {problem && (
            <>
              <ProblemBox
                key={panel.id}
                problem={problem}
                onSolve={handleSolve}
                solved={solvedProblems[problem.id] === true}
                episode={episode.id}
                panelIndex={currentPanel}
              />
              <WorkingScratch
                key={`work-${panel.id}`}
                problemId={problem.id}
                value={workingByProblem[problem.id]}
                onChange={handleWorking}
              />
            </>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={goNext}
              disabled={!currentProblemSolved}
              style={{
                background: currentProblemSolved ? '#f59e0b' : '#e5e7eb',
                color: currentProblemSolved ? '#fff' : '#a8a29e',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: currentProblemSolved ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
            >
              {isLast ? 'Finish' : 'Next panel'} <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
