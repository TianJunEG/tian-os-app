import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Pencil, AlertCircle, Mic, MicOff, Loader2 } from 'lucide-react';
import { tutorAPI } from '../../services/api';
import { Card, Button, Badge, Spinner, ErrorState } from '../../components/ui';
import { MathText } from '../../components/ui/Fraction';
import WorkingCanvas from '../../components/learning/WorkingCanvas';
import StrokeReplayPlayer from '../../components/learning/StrokeReplayPlayer';

/**
 * Pick the best supported audio MIME type for MediaRecorder.
 * Returns '' if MediaRecorder is unavailable entirely.
 */
function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

/** Format seconds as m:ss */
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Tutor Explanation Recorder
 *
 * Full-page view where a tutor draws a visual explanation for a specific
 * student mistake. The recorded strokes (with timestamps) are saved and
 * replayed for the parent in MistakeCard.
 *
 * Optionally captures voice narration via MediaRecorder and uploads to R2.
 *
 * Route: /tutor/students/:id/mistakes/:mistakeId/explain
 */
export default function TutorExplanationRecorder() {
  const { id: studentId, mistakeId } = useParams();
  const navigate = useNavigate();

  // ── Data ──
  const [mistake, setMistake] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Stroke recording state ──
  const capturedRef = useRef({ strokes: [], image: '' });
  const [hasStrokes, setHasStrokes] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [recordingKey, setRecordingKey] = useState(0);

  // ── Audio recording state ──
  const mediaRef = useRef(null);        // MediaRecorder instance
  const chunksRef = useRef([]);          // audio data chunks
  const streamRef = useRef(null);        // MediaStream for cleanup
  const [micActive, setMicActive] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [micReady, setMicReady] = useState(false);

  // ── Recording timer ──
  const timerRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  // ── Audio preview ──
  const [previewAudioUrl, setPreviewAudioUrl] = useState('');

  // Clean up audio resources on unmount
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the mistake detail
  const load = useCallback(() => {
    setLoadError(false);
    setMistake(null);
    tutorAPI.mistake(studentId, mistakeId)
      .then((r) => setMistake(r.data.mistake))
      .catch(() => setLoadError(true));
  }, [studentId, mistakeId]);

  useEffect(() => { load(); }, [load]);

  // ── Mic toggle: start/stop audio capture alongside drawing ──
  const toggleMic = useCallback(async () => {
    if (micActive) {
      // Stop recording audio
      const mr = mediaRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.stop();
        mr.stream.getTracks().forEach((t) => t.stop());
      }
      mediaRef.current = null;
      streamRef.current = null;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setMicActive(false);
      return;
    }

    // Start recording audio
    setMicDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickAudioMime();
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.start(1000); // chunk every second
      mediaRef.current = mr;
      setMicActive(true);
      setMicReady(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      setMicDenied(true);
    }
  }, [micActive]);

  // Track strokes as the tutor draws
  const handleChange = useCallback((data) => {
    if (data.workingStrokes?.length) {
      capturedRef.current.strokes = [...data.workingStrokes];
      setHasStrokes(true);
    } else {
      capturedRef.current.strokes = [];
      setHasStrokes(false);
    }
  }, []);

  // Capture the final image + strokes on submit — also stop mic if active
  const handleSubmit = useCallback((data) => {
    capturedRef.current = {
      strokes: data.workingStrokes || [],
      image: data.workingImage || '',
    };
    setHasStrokes(capturedRef.current.strokes.length > 0);

    // Stop timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    // Stop audio recording and create preview blob
    const mr = mediaRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        mr.stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length) {
          const type = mr.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type });
          setPreviewAudioUrl(URL.createObjectURL(blob));
        }
      };
      mr.stop();
    }
    streamRef.current = null;
    mediaRef.current = null;
    setMicActive(false);
    setShowPreview(true);
  }, []);

  // Save strokes + audio to the backend
  const handleSave = useCallback(async () => {
    const { strokes, image } = capturedRef.current;
    if (!strokes.length) return;

    // Compute total recording duration from wall-clock timestamps.
    let durationMs = null;
    const timestamps = strokes
      .filter((s) => s.timestamp)
      .map((s) => new Date(s.timestamp).getTime())
      .filter(Number.isFinite);
    if (timestamps.length >= 1) {
      const firstStart = Math.min(...timestamps);
      const lastStroke = strokes[strokes.length - 1];
      const lastPointT = lastStroke?.points?.[lastStroke.points.length - 1]?.t ?? 0;
      const lastStart = new Date(lastStroke.timestamp).getTime();
      const computed = (Number.isFinite(lastStart) ? lastStart : firstStart) + lastPointT - firstStart;
      durationMs = Number.isFinite(computed) && computed >= 0 ? computed : null;
    }

    setSaving(true);
    setSaveError('');
    try {
      // 1. Save strokes
      await tutorAPI.saveExplanation(studentId, mistakeId, { strokes, image, durationMs });

      // 2. Upload audio if we captured any
      if (chunksRef.current.length > 0) {
        const mimeType = mediaRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fd = new FormData();
        fd.append('audio', blob, 'audio.webm');
        await tutorAPI.uploadExplanationAudio(studentId, mistakeId, fd);
      }

      setSaved(true);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [studentId, mistakeId]);

  // Re-record: clean up audio state
  const handleReRecord = useCallback(() => {
    if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
    setPreviewAudioUrl('');
    chunksRef.current = [];
    setMicReady(false);
    setElapsed(0);
    setShowPreview(false);
    setRecordingKey((k) => k + 1);
  }, [previewAudioUrl]);

  // ── Loading / error states ──
  if (loadError) return <ErrorState message="Couldn't load mistake details." onRetry={load} />;
  if (!mistake) return <Spinner label="Loading mistake…" />;

  // ── Success state ──
  if (saved) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy-700">Explanation saved</h1>
        <p className="mt-2 text-sm text-ink-500">
          The parent will see your recorded explanation{chunksRef.current.length > 0 ? ' with voice narration' : ''} on their mistake review screen.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(`/tutor/students/${studentId}`)}>
            Back to student
          </Button>
          <Button onClick={() => { setSaved(false); handleReRecord(); }}>
            Record another take
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* ── Header ── */}
      <button
        onClick={() => navigate(`/tutor/students/${studentId}`)}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to student
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-700">
          Record explanation
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Draw a step-by-step explanation for this mistake. You can also narrate with your voice.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left: Mistake Context ── */}
        <div className="lg:col-span-4">
          <Card className="sticky top-6 p-5">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Mistake details
            </h2>

            {mistake.skillName && (
              <div className="mb-3">
                <Badge tone="navy">{mistake.skillName}</Badge>
              </div>
            )}

            {/* Question */}
            <div className="mb-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Question</p>
              <div className="text-sm text-ink-900">
                <MathText text={mistake.questionStem || mistake.questionText || '—'} />
              </div>
            </div>

            {/* Student's answer vs correct */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl bg-error-100 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-error-700">
                  Student answered
                </p>
                <div className="text-sm text-ink-900">
                  <MathText text={mistake.studentAnswer || '—'} />
                </div>
              </div>

              {mistake.correctAnswer && (
                <div className="rounded-xl bg-success-100 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-success-700">
                    Correct answer
                  </p>
                  <div className="text-sm text-ink-900">
                    <MathText text={String(mistake.correctAnswer)} />
                  </div>
                </div>
              )}
            </div>

            {/* Worked solution (if any) */}
            {mistake.workedSolution && (
              <div className="mt-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Worked solution
                </p>
                <p className="text-sm text-ink-600">
                  <MathText text={mistake.workedSolution} />
                </p>
              </div>
            )}

            {/* Student's original working (if captured) */}
            {mistake.workingImage && (
              <div className="mt-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Student's working
                </p>
                <img
                  src={mistake.workingImage}
                  alt="Student working"
                  className="w-full rounded-lg border border-hairline"
                />
              </div>
            )}

            {/* Existing tutor explanation */}
            {mistake.tutorExplanation && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Previous recording
                </p>
                <p className="text-xs text-amber-600">
                  Recorded {new Date(mistake.tutorExplanation.recordedAt).toLocaleDateString()}.
                  Recording again will replace it.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right: Recording Canvas or Preview ── */}
        <div className="lg:col-span-8">
          {showPreview && capturedRef.current.strokes.length > 0 ? (
            /* ── Preview Mode ── */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                  Preview your explanation
                </h2>
                <Button
                  size="s"
                  variant="secondary"
                  icon={Pencil}
                  onClick={handleReRecord}
                >
                  Re-record
                </Button>
              </div>
              <StrokeReplayPlayer
                strokes={capturedRef.current.strokes}
                background="ruled"
                autoPlay={false}
                audioSrc={previewAudioUrl || undefined}
              />
              {previewAudioUrl && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
                  <Mic className="h-4 w-4 text-navy-500" />
                  Voice narration attached — plays in sync with drawing.
                </div>
              )}
              <div className="mt-4 flex items-center justify-end gap-3">
                {saveError && (
                  <span className="flex items-center gap-1 text-sm text-error-600">
                    <AlertCircle className="h-4 w-4" /> {saveError}
                  </span>
                )}
                <Button
                  variant="secondary"
                  onClick={handleReRecord}
                  disabled={saving}
                >
                  Re-record
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  icon={saving ? Loader2 : CheckCircle}
                  className={saving ? '[&_svg]:animate-spin' : ''}
                >
                  {saving ? 'Saving…' : 'Save & send to parent'}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Recording Mode ── */
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                    Draw your explanation
                  </h2>
                  <p className="mt-1 text-xs text-ink-400">
                    Use the canvas to show the student (and their parent) how to solve this step by step.
                    When you're done, click "Submit workings" below the canvas.
                  </p>
                </div>

                {/* Mic toggle */}
                <div className="flex flex-col items-end gap-1">
                  {micDenied ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-xs text-error-600">
                        <MicOff className="h-3.5 w-3.5" /> Microphone blocked
                      </span>
                      <span className="max-w-[180px] text-right text-[11px] leading-tight text-ink-400">
                        Allow mic access in your browser settings, then try again.
                      </span>
                      <button
                        onClick={toggleMic}
                        className="mt-0.5 text-[11px] font-semibold text-navy-600 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="s"
                      variant={micActive ? 'primary' : 'secondary'}
                      icon={micActive ? Mic : MicOff}
                      onClick={toggleMic}
                      className={micActive ? 'bg-error-600 hover:bg-error-700 border-error-600' : ''}
                    >
                      {micActive ? 'Recording…' : 'Add voice'}
                    </Button>
                  )}
                  {micActive && (
                    <span className="flex items-center gap-1.5 text-xs text-error-600">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error-500" />
                      <span className="tabular-nums">{fmtTime(elapsed)}</span>
                    </span>
                  )}
                  {!micActive && micReady && (
                    <span className="text-xs text-ink-400">Voice captured ✓ ({fmtTime(elapsed)})</span>
                  )}
                </div>
              </div>

              <WorkingCanvas
                key={recordingKey}
                questionId={`tutor-explain-${mistakeId}-${recordingKey}`}
                required={false}
                allowNoWorking={false}
                label="Record your explanation"
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
