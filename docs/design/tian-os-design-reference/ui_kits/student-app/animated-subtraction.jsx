// animated-subtraction.jsx — Step-by-step regrouping subtraction
// Used in AI Remediation worked example. Animates the regroup cascade
// across columns, with a caption explaining each move.

const { useState: _aUseState, useEffect: _aUseEffect, useMemo: _aUseMemo } = React;

// Build animation frames for a 3-digit subtraction with regrouping.
// Pass top + bottom as digit arrays e.g. [3,0,5] and [1,7,8].
// For simplicity: this is hand-tuned for problems that need regrouping
// across a zero. Generic for any 3-digit borrow chain.
function buildFrames(top, bottom) {
  // We work right-to-left. For each column where top < bottom, regroup.
  // Track running "current top digits after regrouping" (numbers can be 10+).
  const cur = [...top]; // mutable copy
  const regrouped = [null, null, null]; // display values after regroup
  const struck = [false, false, false];

  const frames = [];

  // F0 — initial state, just the problem
  frames.push({
    cur: [...cur], regrouped: [...regrouped], struck: [...struck],
    answer: [null, null, null], active: null,
    caption: `Solve ${top.join('')} − ${bottom.join('')}.`,
    captionStrong: true,
  });

  // F1 — highlight ones, can we subtract?
  frames.push({
    cur: [...cur], regrouped: [...regrouped], struck: [...struck],
    answer: [null, null, null], active: 2,
    caption: cur[2] >= bottom[2]
      ? `${cur[2]} − ${bottom[2]} works as-is.`
      : `${cur[2]} − ${bottom[2]} — we need more in the ones place.`,
  });

  // If ones column needs regrouping
  if (cur[2] < bottom[2]) {
    // Need to regroup. Walk left to find a non-zero digit.
    if (cur[1] > 0) {
      // Simple case — borrow from tens directly (not in our 305-178 demo)
      frames.push({
        cur: [...cur], regrouped: [cur[0], cur[1] - 1, cur[2] + 10],
        struck: [false, true, true],
        answer: [null, null, null], active: 1,
        caption: `Tens give 1 to the ones: tens ${cur[1]} → ${cur[1] - 1}, ones ${cur[2]} → ${cur[2] + 10}.`,
      });
      cur[1] -= 1; cur[2] += 10;
      regrouped[1] = cur[1]; regrouped[2] = cur[2];
      struck[1] = true; struck[2] = true;
    } else {
      // Tens is 0 — walk further left
      frames.push({
        cur: [...cur], regrouped: [...regrouped], struck: [...struck],
        answer: [null, null, null], active: 1,
        caption: `The tens are 0 — we keep walking left.`,
      });
      // Regroup from hundreds → tens
      frames.push({
        cur: [...cur], regrouped: [cur[0] - 1, 10, cur[2]],
        struck: [true, true, false],
        answer: [null, null, null], active: 0,
        caption: `Take 1 from the hundreds: ${cur[0]} → ${cur[0] - 1}, and the 0 in the tens becomes 10.`,
      });
      cur[0] -= 1; cur[1] = 10;
      regrouped[0] = cur[0]; regrouped[1] = cur[1];
      struck[0] = true; struck[1] = true;
      // Now tens (10) donates 1 to ones
      frames.push({
        cur: [...cur], regrouped: [cur[0], 9, cur[2] + 10],
        struck: [true, true, true],
        answer: [null, null, null], active: 1,
        caption: `The tens (10) give 1 to the ones: tens → 9, ones ${cur[2]} → ${cur[2] + 10}.`,
      });
      cur[1] = 9; cur[2] += 10;
      regrouped[1] = cur[1]; regrouped[2] = cur[2];
    }
  }

  // F: subtract ones
  const a2 = cur[2] - bottom[2];
  frames.push({
    cur: [...cur], regrouped: [...regrouped], struck: [...struck],
    answer: [null, null, a2], active: 2,
    caption: `${cur[2]} − ${bottom[2]} = ${a2}.`,
  });

  // Tens column subtract (assume cur[1] >= bottom[1] for the demo)
  let a1;
  if (cur[1] >= bottom[1]) {
    a1 = cur[1] - bottom[1];
    frames.push({
      cur: [...cur], regrouped: [...regrouped], struck: [...struck],
      answer: [null, a1, a2], active: 1,
      caption: `${cur[1]} − ${bottom[1]} = ${a1}.`,
    });
  } else {
    // Need to regroup tens from hundreds (not in our demo)
    a1 = cur[1] + 10 - bottom[1];
    frames.push({
      cur: [...cur], regrouped: [cur[0] - 1, cur[1] + 10, cur[2]],
      struck: [true, true, struck[2]],
      answer: [null, null, a2], active: 0,
      caption: `Hundreds give 1 to tens: ${cur[0]} → ${cur[0] - 1}, tens → ${cur[1] + 10}.`,
    });
    cur[0] -= 1; cur[1] += 10;
    regrouped[0] = cur[0]; regrouped[1] = cur[1];
    struck[0] = true; struck[1] = true;
    frames.push({
      cur: [...cur], regrouped: [...regrouped], struck: [...struck],
      answer: [null, a1, a2], active: 1,
      caption: `${cur[1]} − ${bottom[1]} = ${a1}.`,
    });
  }

  // Hundreds subtract
  const a0 = cur[0] - bottom[0];
  frames.push({
    cur: [...cur], regrouped: [...regrouped], struck: [...struck],
    answer: [a0, a1, a2], active: 0,
    caption: `${cur[0]} − ${bottom[0]} = ${a0}.`,
  });

  // Final
  frames.push({
    cur: [...cur], regrouped: [...regrouped], struck: [...struck],
    answer: [a0, a1, a2], active: null,
    caption: `${top.join('')} − ${bottom.join('')} = ${a0}${a1}${a2}.`,
    captionStrong: true,
    done: true,
  });

  return frames;
}

function AnimatedSubtraction({ top = [3,0,5], bottom = [1,7,8] }) {
  const FRAMES = _aUseMemo(() => buildFrames(top, bottom), [top.join(','), bottom.join(',')]);
  const [frame, setFrame] = _aUseState(0);
  const [playing, setPlaying] = _aUseState(true);

  _aUseEffect(() => {
    if (!playing) return;
    if (frame >= FRAMES.length - 1) return;
    const t = setTimeout(() => setFrame(f => f + 1), 1700);
    return () => clearTimeout(t);
  }, [frame, playing, FRAMES.length]);

  const f = FRAMES[frame];
  const cellW = 44;

  return (
    <div>
      {/* Animated column */}
      <div style={{
        display: 'inline-block',
        padding: '14px 18px 12px',
        background: T.ivory, borderRadius: 16,
        position: 'relative',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `28px repeat(3, ${cellW}px)`,
          rowGap: 0, columnGap: 0,
          fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
        }}>
          {/* Row 0: regroup marks (small, above) */}
          <div />
          {[0,1,2].map(i => (
            <div key={`r${i}`} style={{
              height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600,
              color: f.regrouped[i] !== null ? T.gold500 : 'transparent',
              transition: `color 240ms ${T.easeCalm}`,
            }}>
              {f.regrouped[i] !== null ? f.regrouped[i] : '·'}
            </div>
          ))}

          {/* Row 1: top digits, with strike-through animated */}
          <div />
          {[0,1,2].map(i => (
            <div key={`t${i}`} style={{
              height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 500,
              color: f.struck[i] ? T.ink300 : T.navy700,
              position: 'relative',
            }}>
              {top[i]}
              <span style={{
                position: 'absolute', left: '15%', right: '15%', top: '50%',
                height: 2, background: T.error500,
                transform: f.struck[i] ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left center',
                transition: `transform 280ms ${T.easeCalm}`,
                opacity: 0.7,
              }} />
            </div>
          ))}

          {/* Row 2: minus + bottom digits */}
          <div style={{
            height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: T.navy700, fontWeight: 500,
          }}>−</div>
          {[0,1,2].map(i => (
            <div key={`b${i}`} style={{
              height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 500, color: T.navy700,
            }}>
              {bottom[i]}
            </div>
          ))}

          {/* Row 3: subtraction line */}
          <div />
          <div style={{ gridColumn: '2 / span 3', height: 0, borderTop: `2px solid ${T.navy700}`, marginTop: 2 }} />

          {/* Row 4: answer digits — fade in */}
          <div />
          {[0,1,2].map(i => (
            <div key={`a${i}`} style={{
              height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 600, color: T.success500,
              opacity: f.answer[i] !== null ? 1 : 0,
              transform: f.answer[i] !== null ? 'translateY(0)' : 'translateY(-6px)',
              transition: `opacity 320ms ${T.easeCalm}, transform 320ms ${T.easeCalm}`,
            }}>
              {f.answer[i] !== null ? f.answer[i] : '·'}
            </div>
          ))}
        </div>

        {/* Active column glow — positioned absolutely */}
        <div style={{
          position: 'absolute',
          left: f.active !== null ? `${18 + 28 + f.active * cellW}px` : '50%',
          top: 4,
          width: cellW,
          height: 'calc(100% - 8px)',
          borderRadius: 10,
          background: f.active !== null ? `${T.gold500}14` : 'transparent',
          boxShadow: f.active !== null ? `0 0 0 1px ${T.gold500}33` : 'none',
          opacity: f.active !== null ? 1 : 0,
          pointerEvents: 'none',
          transition: `left 360ms ${T.easeCalm}, opacity 240ms ${T.easeCalm}`,
          zIndex: 0,
        }} />
      </div>

      {/* Caption */}
      <div style={{
        marginTop: 14, minHeight: 44,
        padding: '12px 14px',
        background: f.done ? T.success100 : T.navy050,
        borderRadius: 12,
        fontSize: 13, lineHeight: 1.5,
        color: f.done ? T.success500 : T.navy700,
        fontWeight: f.captionStrong ? 600 : 500,
        transition: `background 240ms ${T.easeCalm}, color 240ms ${T.easeCalm}`,
      }}>
        {f.caption}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
      }}>
        <button onClick={() => { setFrame(0); setPlaying(true); }} style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.bone, color: T.navy700,
          display: 'grid', placeItems: 'center',
        }} title="Replay">
          <IconRevise size={16} />
        </button>
        <button onClick={() => setPlaying(p => !p)} style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.navy700, color: T.gold500,
          display: 'grid', placeItems: 'center',
        }} title={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <IconPlay size={14} />
          )}
        </button>
        <button onClick={() => setFrame(f => Math.max(0, f - 1))} disabled={frame === 0} style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.paper, border: `1px solid ${T.hairline}`,
          color: frame === 0 ? T.ink300 : T.navy700,
          display: 'grid', placeItems: 'center',
        }} title="Previous step">
          <IconArrowLeft size={16} />
        </button>
        <button onClick={() => { setPlaying(false); setFrame(f => Math.min(FRAMES.length - 1, f + 1)); }} disabled={frame >= FRAMES.length - 1} style={{
          width: 36, height: 36, borderRadius: 10,
          background: T.paper, border: `1px solid ${T.hairline}`,
          color: frame >= FRAMES.length - 1 ? T.ink300 : T.navy700,
          display: 'grid', placeItems: 'center',
        }} title="Next step">
          <IconArrowRight size={16} />
        </button>

        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: 11, color: T.ink500, fontWeight: 600,
          fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.04em',
        }}>
          Step {frame + 1} / {FRAMES.length}
        </div>
      </div>

      {/* Step thread */}
      <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
        {FRAMES.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i <= frame ? (i === frame ? T.gold500 : T.navy700) : T.bone,
            transition: `background 240ms ${T.easeCalm}`,
          }} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AnimatedSubtraction, buildSubtractionFrames: buildFrames });
