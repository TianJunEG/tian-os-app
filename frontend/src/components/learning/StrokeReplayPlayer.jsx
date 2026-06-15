import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import {
  CANVAS_WIDTH as DEFAULT_WIDTH,
  CANVAS_HEIGHT as DEFAULT_HEIGHT,
  drawStroke,
  buildReplayTimeline,
  getStrokeTimingMeta,
} from './drawingUtils';

// ─── Constants ──────────────────────────────────────────────────────────

const SPEEDS = [0.5, 1, 2, 4];
const UI_UPDATE_INTERVAL_MS = 80; // throttle React state updates during playback

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function controlButton(active = false, disabled = false) {
  return [
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition',
    active
      ? 'border-emerald-deep bg-emerald-deep text-white'
      : 'border-line-soft bg-white text-emerald-deep hover:bg-emerald-tint',
    disabled ? 'cursor-not-allowed opacity-40 hover:bg-white' : '',
  ].join(' ');
}

// ─── Component ──────────────────────────────────────────────────────────

/**
 * Replays timestamped stroke data on a read-only canvas.
 *
 * Props:
 *  - strokes:      array of stroke objects (with optional .timestamp and .points[].t)
 *  - background:   'ruled' | 'grid' (CSS-rendered, not painted on canvas)
 *  - canvasWidth:  logical width of the coordinate space (default 900)
 *  - canvasHeight: logical height of the coordinate space (default 320)
 *  - stampScale:   multiplier for math stamp rendering (1 for inline, 1.4 for fullscreen)
 *  - autoPlay:     start playing on mount
 *  - compact:      smaller controls layout
 *  - className:    extra class names on the outer wrapper
 *  - onTimeUpdate: (timeMs: number) => void — called during playback
 *  - audioSrc:     optional URL for synced voice narration (blob or signed R2 URL)
 */
export default function StrokeReplayPlayer({
  strokes = [],
  background = 'ruled',
  canvasWidth = DEFAULT_WIDTH,
  canvasHeight = DEFAULT_HEIGHT,
  stampScale = 1,
  autoPlay = false,
  compact = false,
  className = '',
  onTimeUpdate,
  audioSrc,
}) {
  // ── State (drives React UI) ──
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [displayTimeMs, setDisplayTimeMs] = useState(0);

  // ── Audio state ──
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const hasAudio = Boolean(audioSrc);

  // ── Refs (drive animation loop without re-renders) ──
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(null);
  const lastUIRef = useRef(0);
  const currentTimeMsRef = useRef(0);
  const cursorRef = useRef(0);
  const speedRef = useRef(speed);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  // ── Audio sync: keep playbackRate in sync ──
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  // ── Derived data ──
  const timeline = useMemo(() => buildReplayTimeline(strokes), [strokes]);
  const totalDuration = useMemo(
    () => (timeline.length ? timeline.at(-1).absoluteMs + 1 : 0),
    [timeline],
  );
  const strokeMeta = useMemo(
    () => getStrokeTimingMeta(strokes, timeline),
    [strokes, timeline],
  );
  const strokeCount = strokes.length;
  const strokeOptions = useMemo(() => ({ stampScale }), [stampScale]);

  // Computed from display time
  const currentStrokeIndex = useMemo(() => {
    for (let i = strokeMeta.length - 1; i >= 0; i--) {
      if (strokeMeta[i].startMs <= displayTimeMs) return i;
    }
    return -1;
  }, [strokeMeta, displayTimeMs]);

  const progress = totalDuration > 0 ? displayTimeMs / totalDuration : 0;
  const isEmpty = !strokes.length;

  // ── Full redraw (used for scrubbing and reset) ──

  const fullRedrawUpTo = useCallback((timeMs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Find last visible event
    let endIdx = 0;
    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].absoluteMs > timeMs) break;
      endIdx = i + 1;
    }

    // Build visibility map: strokeIndex → { maxPoint, complete, stamp }
    const visible = new Map();
    for (let i = 0; i < endIdx; i++) {
      const ev = timeline[i];
      const v = visible.get(ev.strokeIndex);
      if (!v) {
        visible.set(ev.strokeIndex, { maxPoint: ev.pointIndex, complete: ev.isStrokeEnd, stamp: ev.isStamp });
      } else {
        v.maxPoint = Math.max(v.maxPoint, ev.pointIndex);
        if (ev.isStrokeEnd) v.complete = true;
      }
    }

    // Draw in stroke order (preserves compositing order for erasers)
    const indices = [...visible.keys()].sort((a, b) => a - b);
    for (const si of indices) {
      const stroke = strokes[si];
      if (!stroke) continue;
      const v = visible.get(si);

      if (v.stamp || v.complete) {
        drawStroke(ctx, stroke, strokeOptions);
      } else {
        // Partial stroke — truncate points
        const points = stroke.points.slice(0, v.maxPoint + 1);
        if (points.length >= 2) {
          drawStroke(ctx, { ...stroke, points }, strokeOptions);
        }
      }
    }

    cursorRef.current = endIdx;
  }, [strokes, timeline, canvasWidth, canvasHeight, strokeOptions]);

  // ── Incremental forward draw ──

  const drawForwardTo = useCallback((timeMs) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let needsFullRedraw = false;

    while (cursorRef.current < timeline.length && timeline[cursorRef.current].absoluteMs <= timeMs) {
      const event = timeline[cursorRef.current];
      const stroke = strokes[event.strokeIndex];
      cursorRef.current++;
      if (!stroke) continue;

      if (event.isStamp) {
        drawStroke(ctx, stroke, strokeOptions);
        continue;
      }

      // Line/rectangle appear on completion (can't draw incrementally)
      if (stroke.tool === 'line' || stroke.tool === 'rectangle') {
        if (event.isStrokeEnd) needsFullRedraw = true;
        continue;
      }

      // Freehand: draw single segment (2-point drawStroke reuses all rendering logic)
      if (event.pointIndex > 0) {
        drawStroke(ctx, {
          ...stroke,
          points: [stroke.points[event.pointIndex - 1], stroke.points[event.pointIndex]],
        }, strokeOptions);
      }
    }

    if (needsFullRedraw) fullRedrawUpTo(timeMs);
  }, [strokes, timeline, strokeOptions, fullRedrawUpTo]);

  // ── Animation loop ──

  const animate = useCallback((timestamp) => {
    if (!lastFrameRef.current) lastFrameRef.current = timestamp;
    const dt = (timestamp - lastFrameRef.current) * speedRef.current;
    lastFrameRef.current = timestamp;

    const newTime = Math.min(currentTimeMsRef.current + dt, totalDuration);
    currentTimeMsRef.current = newTime;

    drawForwardTo(newTime);

    // Throttled UI update
    if (timestamp - lastUIRef.current > UI_UPDATE_INTERVAL_MS) {
      setDisplayTimeMs(newTime);
      onTimeUpdate?.(newTime);
      lastUIRef.current = timestamp;
    }

    if (newTime >= totalDuration) {
      setPlaying(false);
      setDisplayTimeMs(totalDuration);
      onTimeUpdate?.(totalDuration);
      // Pause audio when animation reaches the end
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [totalDuration, drawForwardTo, onTimeUpdate]);

  // Start/stop animation + audio sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      if (audio && !audio.paused) audio.pause();
      return;
    }
    // Sync audio position before playing
    if (audio) {
      audio.currentTime = currentTimeMsRef.current / 1000;
      audio.playbackRate = speedRef.current;
      audio.play().catch(() => { /* autoplay blocked — drawing still plays */ });
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
    };
  }, [playing, animate]);

  // Auto-play on mount (or when strokes change)
  useEffect(() => {
    if (autoPlay && strokes.length && totalDuration > 0) {
      currentTimeMsRef.current = 0;
      cursorRef.current = 0;
      setDisplayTimeMs(0);
      fullRedrawUpTo(0);
      setPlaying(true);
    }
  }, [autoPlay, strokes, totalDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when strokes change
  useEffect(() => {
    currentTimeMsRef.current = 0;
    cursorRef.current = 0;
    setDisplayTimeMs(0);
    setPlaying(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }, [strokes, canvasWidth, canvasHeight]);

  // ── User actions ──

  const togglePlay = useCallback(() => {
    if (isEmpty) return;
    setPlaying((prev) => {
      if (!prev && currentTimeMsRef.current >= totalDuration) {
        // Restart from beginning
        currentTimeMsRef.current = 0;
        cursorRef.current = 0;
        setDisplayTimeMs(0);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvasWidth, canvasHeight);
        const audio = audioRef.current;
        if (audio) audio.currentTime = 0;
      }
      return !prev;
    });
  }, [isEmpty, totalDuration, canvasWidth, canvasHeight]);

  const reset = useCallback(() => {
    setPlaying(false);
    currentTimeMsRef.current = 0;
    cursorRef.current = 0;
    setDisplayTimeMs(0);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvasWidth, canvasHeight);
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }, [canvasWidth, canvasHeight]);

  const scrubTo = useCallback((timeMs) => {
    const clamped = Math.max(0, Math.min(timeMs, totalDuration));
    setPlaying(false);
    currentTimeMsRef.current = clamped;
    setDisplayTimeMs(clamped);
    fullRedrawUpTo(clamped);
    onTimeUpdate?.(clamped);
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = clamped / 1000; }
  }, [totalDuration, fullRedrawUpTo, onTimeUpdate]);

  const stepForward = useCallback(() => {
    if (isEmpty) return;
    // Jump to start of next stroke
    const nextIdx = currentStrokeIndex + 1;
    if (nextIdx < strokeMeta.length) {
      scrubTo(strokeMeta[nextIdx].startMs);
    } else {
      scrubTo(totalDuration);
    }
  }, [isEmpty, currentStrokeIndex, strokeMeta, totalDuration, scrubTo]);

  const stepBack = useCallback(() => {
    if (isEmpty) return;
    // Jump to start of current stroke (or previous if already at start)
    const current = strokeMeta[currentStrokeIndex];
    if (current && displayTimeMs > current.startMs + 50) {
      scrubTo(current.startMs);
    } else if (currentStrokeIndex > 0) {
      scrubTo(strokeMeta[currentStrokeIndex - 1].startMs);
    } else {
      scrubTo(0);
    }
  }, [isEmpty, currentStrokeIndex, displayTimeMs, strokeMeta, scrubTo]);

  // ── Keyboard shortcuts (when player is focused) ──

  const handleKeyDown = useCallback((event) => {
    if (event.target.tagName === 'INPUT') return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      stepBack();
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      stepForward();
    }
  }, [togglePlay, stepBack, stepForward]);

  // ── Background CSS ──

  const backgroundCSS = background === 'grid'
    ? 'bg-[linear-gradient(#dbe4ef_1px,transparent_1px),linear-gradient(90deg,#dbe4ef_1px,transparent_1px)] bg-[size:24px_24px]'
    : 'bg-[repeating-linear-gradient(0deg,#fff,#fff_31px,#e8eef7_32px)]';

  // ── Render ──

  if (isEmpty) {
    return (
      <div className={`rounded-xl border border-line-soft bg-white p-4 ${className}`}>
        <p className="text-center text-sm text-ink-400">No stroke data to replay.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`rounded-xl border border-line-soft bg-white outline-none focus-within:ring-2 focus-within:ring-navy-300/30 ${className}`}
      data-testid="stroke-replay-player"
    >
      {/* Hidden audio element for synced voice narration */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioSrc}
          muted={muted}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

      {/* ── Canvas ── */}
      <div className={`overflow-auto rounded-t-xl border-b border-line-soft ${backgroundCSS}`}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`block ${compact ? 'h-[120px] sm:h-[150px]' : 'h-[220px] sm:h-[260px]'}`}
          style={{ width: '100%', minWidth: '100%' }}
          aria-label="Stroke replay canvas"
        />
      </div>

      {/* ── Controls ── */}
      <div className={compact ? 'p-2' : 'p-2.5 sm:p-3'}>
        {/* Timeline scrub bar with stroke activity markers */}
        <div className="relative mb-2 h-6">
          {/* Stroke activity visualization */}
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface-raised" aria-hidden="true">
            {strokeMeta.map((meta, i) => {
              if (totalDuration <= 0) return null;
              const left = (meta.startMs / totalDuration) * 100;
              const width = Math.max(0.5, ((meta.endMs - meta.startMs) / totalDuration) * 100);
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full rounded-full bg-emerald-border/60"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              );
            })}
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-emerald transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {/* Range input overlaid for interaction */}
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={1}
            value={displayTimeMs}
            onChange={(event) => scrubTo(Number(event.target.value))}
            className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
            aria-label="Playback position"
          />
          {/* Playhead indicator */}
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-navy-600 bg-white shadow-sm transition-[left] duration-75"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1.5">
          {/* Play/Pause */}
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
            className={controlButton(playing)}
            onClick={togglePlay}
          >
            {playing
              ? <Pause className="h-4 w-4" />
              : <Play className="h-4 w-4 translate-x-[1px]" />}
          </button>

          {/* Step back */}
          <button
            type="button"
            aria-label="Previous stroke"
            title="Previous stroke (←)"
            className={controlButton(false, currentStrokeIndex <= 0 && displayTimeMs === 0)}
            onClick={stepBack}
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Step forward */}
          <button
            type="button"
            aria-label="Next stroke"
            title="Next stroke (→)"
            className={controlButton(false, displayTimeMs >= totalDuration)}
            onClick={stepForward}
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Divider */}
          <span className="mx-0.5 h-5 w-px bg-line-soft" aria-hidden="true" />

          {/* Time display */}
          <span className="min-w-[72px] font-mono text-xs tabular-nums text-ink-500">
            {formatTime(displayTimeMs)}<span className="text-ink-300"> / </span>{formatTime(totalDuration)}
          </span>

          {/* Stroke counter */}
          {!compact && (
            <>
              <span className="mx-0.5 h-5 w-px bg-line-soft" aria-hidden="true" />
              <span className="text-xs text-ink-400">
                Stroke <span className="font-semibold text-ink-600">{Math.max(0, currentStrokeIndex + 1)}</span>
                <span className="text-ink-300"> / </span>
                <span className="font-semibold text-ink-600">{strokeCount}</span>
              </span>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Speed selector */}
          <div className="flex gap-0.5" role="radiogroup" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={speed === s}
                aria-label={`${s}x speed`}
                onClick={() => setSpeed(s)}
                className={[
                  'inline-flex h-7 min-w-[36px] items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold tabular-nums transition',
                  speed === s
                    ? 'border-navy-600 bg-emerald-deep text-white'
                    : 'border-line-soft bg-white text-ink-500 hover:bg-emerald-tint hover:text-emerald-deep',
                ].join(' ')}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Audio mute/unmute toggle */}
          {hasAudio && (
            <button
              type="button"
              aria-label={muted ? 'Unmute narration' : 'Mute narration'}
              title={muted ? 'Unmute narration' : 'Mute narration'}
              className={controlButton(false, false)}
              onClick={() => setMuted((prev) => !prev)}
            >
              {muted
                ? <VolumeX className="h-3.5 w-3.5 text-ink-400" />
                : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Reset */}
          <button
            type="button"
            aria-label="Reset to start"
            title="Reset to start"
            className={controlButton()}
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Input method badge (show when stroke data has pen input) */}
        {strokes.some((s) => s.pointerType === 'pen') && !compact && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                <path d="M10.5 1.5L4.5 7.5 3 10.5l3-1.5 6-6-1.5-1.5zm-7 8l-.5.5 1-1-.5.5z" />
              </svg>
              Stylus input
            </span>
            {strokes.some((s) => s.points?.some((p) => p.p != null)) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-tint px-2 py-0.5 text-[10px] font-semibold text-purple">
                Pressure data
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
