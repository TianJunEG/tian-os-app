import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { recordingsAPI } from '../../services/api';
import { Card, PageHeader, Spinner, ErrorState, Badge } from '../../components/ui';
import { drawStroke } from '../../components/learning/drawingUtils';
import StrokeReplayPlayer from '../../components/learning/StrokeReplayPlayer';

// Parent replay: the audio element is the clock; ink is redrawn up to
// audio.currentTime. Stroke-level sync for A1 (per-stroke scrub comes in A2).
// Silent recordings (no audio) fall back to the self-clocked StrokeReplayPlayer.
export default function LessonReplay() {
  const { rid } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const lastCountRef = useRef(-1);

  const load = () => {
    setError(null);
    setData(null);
    recordingsAPI.parentRecording(rid)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Could not load this recording.'));
  };
  useEffect(() => { load(); }, [rid]); // eslint-disable-line

  const W = data?.recording?.canvasWidth || 1280;
  const H = data?.recording?.canvasHeight || 720;
  // Ink events arrive sorted by seq; each carries its parent-start offset tStartMs.
  const events = data?.ink || [];
  const hasAudio = Boolean(data?.audioUrl);

  // Redraw all strokes whose tStartMs <= the audio clock. Only repaints when the
  // visible-stroke count changes (forward play or a seek), so it stays cheap.
  useEffect(() => {
    if (!data || !hasAudio) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const drawUpTo = (ms) => {
      ctx.clearRect(0, 0, W, H);
      let count = 0;
      for (const ev of events) {
        if (ev.tStartMs > ms) break;
        drawStroke(ctx, ev.stroke);
        count++;
      }
      return count;
    };

    const tick = () => {
      const ms = (audioRef.current?.currentTime || 0) * 1000;
      let count = 0;
      for (const ev of events) { if (ev.tStartMs > ms) break; count++; }
      if (count !== lastCountRef.current) { drawUpTo(ms); lastCountRef.current = count; }
      rafRef.current = requestAnimationFrame(tick);
    };
    lastCountRef.current = -1;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data, hasAudio, events, W, H]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Lesson replay"
        subtitle={data.recording?.subjectId ? `${data.recording.subjectId} · ${new Date(data.recording.createdAt).toLocaleDateString()}` : undefined}
      />

      {!hasAudio ? (
        <>
          <div className="mb-3"><Badge tone="neutral">Silent recording (ink only)</Badge></div>
          <StrokeReplayPlayer strokes={events.map((e) => e.stroke)} canvasWidth={W} canvasHeight={H} />
        </>
      ) : (
        <Card className="overflow-hidden p-0">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="block w-full bg-white"
            style={{ aspectRatio: `${W} / ${H}` }}
            aria-label="Lesson replay canvas"
          />
          <div className="border-t border-hairline p-3">
            {/* Native controls give play / pause / scrub; ink follows the clock. */}
            <audio ref={audioRef} src={data.audioUrl} controls className="w-full" />
          </div>
        </Card>
      )}
    </>
  );
}
