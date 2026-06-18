import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lightbulb, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { getEpisode, MASCOT_COLORS } from '../../../data/comics/episodes';
import { comicsAPI } from '../../../services/api';

// ─── Speech bubble ───────────────────────────────────────────────────────────

function SpeechBubble({ text, side, color }) {
  const isLeft = side === 'left';
  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        border: `2.5px solid ${color}`,
        borderRadius: 14,
        padding: '8px 13px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        maxWidth: 220,
        alignSelf: isLeft ? 'flex-start' : 'flex-end',
        marginLeft: isLeft ? 8 : 'auto',
        marginRight: isLeft ? 'auto' : 8,
        marginTop: 6,
      }}
    >
      {text}
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

function ScenePanel({ scene, characters, speech }) {
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
            <SpeechBubble key={i} text={s.text} side="left" color={leftColor} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 6, alignItems: 'flex-end' }}>
          {rightSpeech.map((s, i) => (
            <SpeechBubble key={i} text={s.text} side="right" color={rightColor} />
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

// ─── End card ─────────────────────────────────────────────────────────────────

function EndCard({ nextEpisode }) {
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
  const [submitted, setSubmitted] = useState(false);

  const handleSolve = useCallback((problemId, correct) => {
    setSolvedProblems((prev) => ({ ...prev, [problemId]: correct }));
  }, []);

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
  const isLast = currentPanel === episode.panels.length - 1;
  const currentProblemSolved = panel?.problem ? solvedProblems[panel.problem.id] === true : true;
  const allSolved = episode.panels.every((p) => !p.problem || solvedProblems[p.problem.id] === true);

  const goNext = async () => {
    if (isLast) {
      if (!submitted && allSolved) {
        setSubmitted(true);
        try {
          await comicsAPI.complete(episode.id, Object.entries(solvedProblems).map(([id, correct]) => ({ problemId: id, correct })));
        } catch (_) {
          // non-blocking
        }
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
          onClick={() => navigate('/student/comics')}
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
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#a8a29e', fontWeight: 500 }}>
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
        <EndCard nextEpisode={episode.nextEpisode} />
      ) : (
        <>
          {/* Scene */}
          <ScenePanel
            scene={panel.scene}
            characters={panel.characters}
            speech={panel.speech}
          />

          {/* Menu note if present */}
          {panel.menuNote && (
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
              📋 {panel.menuNote}
            </div>
          )}

          {/* Problem */}
          {panel.problem && (
            <ProblemBox
              key={panel.id}
              problem={panel.problem}
              onSolve={handleSolve}
              solved={solvedProblems[panel.problem.id] === true}
              episode={episode.id}
              panelIndex={currentPanel}
            />
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
