import React, { useCallback, useState } from 'react';
import WorkingCanvas from '../components/learning/WorkingCanvas';
import StrokeReplayPlayer from '../components/learning/StrokeReplayPlayer';

/**
 * Demo page for the timestamped stroke capture + replay system.
 * Draw on the canvas, then watch the replay player reproduce it.
 */
export default function StrokeReplayDemo() {
  const [capturedStrokes, setCapturedStrokes] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback((data) => {
    if (data.workingStrokes?.length) {
      setCapturedStrokes([...data.workingStrokes]);
    }
  }, []);

  const handleSubmit = useCallback((data) => {
    if (data.workingStrokes?.length) {
      setCapturedStrokes([...data.workingStrokes]);
      setSubmitted(true);
    }
  }, []);

  const reset = () => {
    setCapturedStrokes([]);
    setSubmitted(false);
  };

  // Summary stats
  const totalPoints = capturedStrokes.reduce((sum, s) => sum + (s.points?.length || 0), 0);
  const hasTimestamps = capturedStrokes.some((s) => s.timestamp);
  const hasPressure = capturedStrokes.some((s) => s.points?.some((p) => p.p != null));
  const pointerTypes = [...new Set(capturedStrokes.map((s) => s.pointerType).filter(Boolean))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Stroke Replay Demo</h1>
        <p className="mt-1 text-sm text-body-muted">
          Draw on the canvas below, then submit to see the replay player reproduce your strokes
          with exact timing.
        </p>
      </div>

      {/* ── Drawing Canvas ── */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-body-muted">
          1. Draw something
        </h2>
        <WorkingCanvas
          questionId="demo"
          required={false}
          allowNoWorking={false}
          label="Draw your working here"
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>

      {/* ── Capture Stats ── */}
      {capturedStrokes.length > 0 && (
        <div className="mb-6 rounded-xl border border-line bg-surface-raised p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-body-muted">
            Captured Data
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-ink">{capturedStrokes.length}</p>
              <p className="text-xs text-body-muted">Strokes</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-ink">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-body-muted">Points</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-ink">
                {hasTimestamps ? <span className="text-green-600">Yes</span> : <span className="text-red-500">No</span>}
              </p>
              <p className="text-xs text-body-muted">Timestamps</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-ink">
                {hasPressure ? <span className="text-purple">Yes</span> : <span className="text-body-faint">No</span>}
              </p>
              <p className="text-xs text-body-muted">Pressure</p>
            </div>
          </div>

          {pointerTypes.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-body-muted">Input types:</span>
              {pointerTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  {type}
                </span>
              ))}
            </div>
          )}

          {/* Raw data preview */}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-body-muted hover:text-body">
              View raw stroke data
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-green-400">
              {JSON.stringify(capturedStrokes.slice(0, 3).map((s) => ({
                ...s,
                points: `[${s.points?.length || 0} points — first: ${JSON.stringify(s.points?.[0])}, last: ${JSON.stringify(s.points?.at?.(-1))}]`,
              })), null, 2)}
              {capturedStrokes.length > 3 ? `\n\n... and ${capturedStrokes.length - 3} more strokes` : ''}
            </pre>
          </details>
        </div>
      )}

      {/* ── Replay Player ── */}
      {submitted && capturedStrokes.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-body-muted">
              2. Watch the replay
            </h2>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium text-body-soft hover:bg-surface-raised"
            >
              Reset demo
            </button>
          </div>
          <StrokeReplayPlayer
            strokes={capturedStrokes}
            background="ruled"
          />
        </div>
      )}

      {/* ── Instructions ── */}
      {!submitted && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
          <p className="font-semibold">How to test:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-blue-700">
            <li>Draw something on the canvas above (try different tools and colours)</li>
            <li>Click <strong>Submit workings</strong></li>
            <li>The replay player will appear below — click play to watch your drawing replayed</li>
            <li>Try the scrub bar, step-forward/back, and speed controls</li>
            <li>If using a stylus/Apple Pencil, pressure data will be captured and shown</li>
          </ol>
        </div>
      )}
    </div>
  );
}
