import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Circle, Square, Eraser, Pen, Undo2, Share2 } from 'lucide-react';
import { recordingsAPI } from '../../services/api';
import { useTutorStudent } from './useTutorStudent';
import TutorStudentNav from './TutorStudentNav';
import { Card, Button, Badge, Alert } from '../../components/ui';
import { beginStrokeData, pointFromEvent, finalizeStroke, drawStroke } from '../../components/learning/drawingUtils';

const W = 1280;
const H = 720;
const COLOURS = ['#111827', '#2563eb', '#dc2626', '#16a34a'];
const FLUSH_EVERY_MS = 5000;

function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

// Tutor lesson recorder: timed vector ink + audio, persisted for parent replay.
// Reuses drawingUtils so replay renders identically. Audio is captured via
// MediaRecorder on the same clock (t0) as the strokes; ink flushes in batches.
export default function LessonRecorder() {
  const { id } = useParams();
  const meta = useTutorStudent(id);

  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const ridRef = useRef(null);
  const t0Ref = useRef(0);
  const seqRef = useRef(0);
  const pendingRef = useRef([]);
  const flushTimerRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const [tool, setTool] = useState('pen');
  const [colour, setColour] = useState(COLOURS[0]);
  const [status, setStatus] = useState('idle'); // idle | recording | saving | done | error
  const [micDenied, setMicDenied] = useState(false);
  const [error, setError] = useState(null);
  const [shared, setShared] = useState(false);

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentStrokeRef.current?.points?.length >= 2) drawStroke(ctx, currentStrokeRef.current);
  };

  useEffect(() => () => { if (flushTimerRef.current) clearInterval(flushTimerRef.current); }, []);

  const flushInk = async () => {
    if (!ridRef.current || pendingRef.current.length === 0) return;
    const batch = pendingRef.current;
    pendingRef.current = [];
    try { await recordingsAPI.appendInk(ridRef.current, batch); }
    catch { pendingRef.current = batch.concat(pendingRef.current); } // requeue on failure
  };

  const start = async () => {
    setError(null);
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setMicDenied(true); } // proceed ink-only → silent replay
    try {
      const res = await recordingsAPI.create({ studentId: id, canvasWidth: W, canvasHeight: H });
      ridRef.current = res.data.recording._id;
    } catch (e) {
      setError('Could not start the recording. Please try again.');
      stream?.getTracks().forEach((t) => t.stop());
      return;
    }
    t0Ref.current = Date.now();
    seqRef.current = 0;
    strokesRef.current = [];
    pendingRef.current = [];
    redraw();

    if (stream) {
      const mimeType = pickAudioMime();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunksRef.current.push(ev.data); };
      mr.start(1000);
      mediaRef.current = mr;
    }
    flushTimerRef.current = setInterval(flushInk, FLUSH_EVERY_MS);
    setStatus('recording');
  };

  const stop = async () => {
    setStatus('saving');
    if (flushTimerRef.current) { clearInterval(flushTimerRef.current); flushTimerRef.current = null; }
    await flushInk();

    const rid = ridRef.current;
    const mr = mediaRef.current;
    if (mr && mr.state !== 'inactive') {
      try {
        await new Promise((resolve) => { mr.onstop = resolve; mr.stop(); });
        mr.stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        await recordingsAPI.uploadAudio(rid, fd);
      } catch (e) {
        console.warn('[LessonRecorder] audio upload failed:', e);
        // Non-fatal: ink is saved; proceed to finalise so the recording is usable.
      }
    }
    try {
      await recordingsAPI.finalise(rid, { durationMs: Date.now() - t0Ref.current, pageCount: 1 });
      setStatus('done');
    } catch (e) {
      console.error('[LessonRecorder] finalise failed:', e);
      setError('Ink was saved but the recording could not be finalised. Please try again.');
      setStatus('error');
    }
  };

  const toggleShare = async () => {
    const next = !shared;
    setShared(next);
    try { await recordingsAPI.setVisibility(ridRef.current, next ? 'shared_parent' : 'private'); }
    catch { setShared(!next); }
  };

  // ── pointer handlers ──
  const down = (e) => {
    if (status !== 'recording') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    currentStrokeRef.current = beginStrokeData(e, tool, colour, tool === 'eraser' ? 24 : 4, canvasRef.current, W, H);
  };
  const move = (e) => {
    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(pointFromEvent(e, canvasRef.current, W, H));
    redraw();
  };
  const up = () => {
    const stroke = finalizeStroke(currentStrokeRef.current);
    currentStrokeRef.current = null;
    if (!stroke) return;
    strokesRef.current.push(stroke);
    const tStartMs = Math.max(0, new Date(stroke.timestamp).getTime() - t0Ref.current);
    const lastT = stroke.points?.[stroke.points.length - 1]?.t || 0;
    pendingRef.current.push({ page: 0, tStartMs, tEndMs: tStartMs + lastT, seq: seqRef.current++, stroke });
    if (pendingRef.current.length >= 20) flushInk();
    redraw();
  };
  const undo = () => { strokesRef.current.pop(); redraw(); };

  const recording = status === 'recording';

  return (
    <>
      <TutorStudentNav studentId={id} name={meta?.name || 'Student'} level={meta?.level} />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {micDenied && status !== 'idle' && (
        <Alert tone="warning" className="mb-4">Microphone is off — recording ink only (silent replay).</Alert>
      )}

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {status === 'idle' && <Button icon={Mic} onClick={start}>Start recording</Button>}
          {recording && (
            <>
              <Button variant="secondary" icon={Square} onClick={stop}>Stop & save</Button>
              <Badge tone="error" className="animate-pulse">● Recording</Badge>
              <span className="mx-1 h-5 w-px bg-line-soft" />
              <button aria-label="Pen" onClick={() => setTool('pen')}
                className={`rounded-lg p-2 ${tool === 'pen' ? 'bg-emerald-deep text-white' : 'text-ink-500 hover:bg-emerald-tint'}`}>
                <Pen className="h-4 w-4" />
              </button>
              <button aria-label="Eraser" onClick={() => setTool('eraser')}
                className={`rounded-lg p-2 ${tool === 'eraser' ? 'bg-emerald-deep text-white' : 'text-ink-500 hover:bg-emerald-tint'}`}>
                <Eraser className="h-4 w-4" />
              </button>
              {COLOURS.map((c) => (
                <button key={c} aria-label={`Colour ${c}`} onClick={() => { setColour(c); setTool('pen'); }}
                  className={`h-6 w-6 rounded-full border-2 ${colour === c && tool === 'pen' ? 'border-emerald-deep' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
              <button aria-label="Undo" onClick={undo} className="rounded-lg p-2 text-ink-500 hover:bg-emerald-tint">
                <Undo2 className="h-4 w-4" />
              </button>
            </>
          )}
          {status === 'saving' && <Badge tone="neutral">Saving…</Badge>}
          {status === 'done' && (
            <>
              <Badge tone="success">Saved</Badge>
              <Button variant={shared ? 'primary' : 'secondary'} icon={Share2} onClick={toggleShare}>
                {shared ? 'Shared with parent' : 'Share with parent'}
              </Button>
            </>
          )}
          {micDenied
            ? <MicOff className="ml-auto h-4 w-4 text-ink-300" />
            : <Mic className="ml-auto h-4 w-4 text-ink-300" />}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          className="block w-full touch-none bg-white"
          style={{ aspectRatio: `${W} / ${H}`, cursor: recording ? 'crosshair' : 'default' }}
        />
      </Card>
      {status === 'idle' && (
        <p className="mt-3 text-sm text-ink-500">
          Press <strong>Start recording</strong>, then explain on the canvas with your stylus. Your voice and
          writing are captured together so a parent can replay the lesson.
        </p>
      )}
    </>
  );
}
