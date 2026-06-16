import React, { useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { isSpeechInputSupported, startRecording } from '../utils/speechInput';

// A tap-to-talk button that transcribes the child's speech ON-DEVICE and hands
// the text to onTranscript. Renders nothing if the browser can't support it.
//
// Consent: the first time, it shows a one-time notice and records acceptance in
// localStorage. This is a technical scaffold only — real use with under-13s needs
// PARENTAL consent surfaced at the account level, not a child tapping "OK".
const CONSENT_KEY = 'speechInputConsent';

function hasConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === '1'; } catch { return false; }
}
function grantConsent() {
  try { localStorage.setItem(CONSENT_KEY, '1'); } catch { /* ignore */ }
}

export default function SpeechInputButton({ onTranscript, label = 'Say it' }) {
  const [state, setState] = useState('idle'); // idle | consent | recording | transcribing | error
  const recorderRef = useRef(null);

  if (!isSpeechInputSupported()) return null;

  const begin = async () => {
    if (!hasConsent()) { setState('consent'); return; }
    try {
      recorderRef.current = await startRecording();
      setState('recording');
    } catch {
      setState('error');
    }
  };

  const finish = async () => {
    if (!recorderRef.current) return;
    setState('transcribing');
    try {
      const text = await recorderRef.current.stop();
      recorderRef.current = null;
      setState('idle');
      if (text) onTranscript?.(text);
    } catch {
      recorderRef.current = null;
      setState('error');
    }
  };

  if (state === 'consent') {
    return (
      <div className="rounded-lg border border-hairline bg-bone p-2 text-xs text-ink-600">
        <p>Your voice is processed <strong>on this device only</strong> — nothing is recorded or sent anywhere.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => { grantConsent(); begin(); }} className="rounded-full bg-teal-500 px-3 py-1 font-semibold text-white">OK, let's talk</button>
          <button type="button" onClick={() => setState('idle')} className="rounded-full px-3 py-1 text-ink-400">Not now</button>
        </div>
      </div>
    );
  }

  const onClick = state === 'recording' ? finish : begin;
  const disabled = state === 'transcribing';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        state === 'recording' ? 'border-error-300 bg-error-50 text-error-700' : 'border-hairline text-ink-600 hover:bg-bone'
      } disabled:opacity-60`}
      aria-label={state === 'recording' ? 'Stop and transcribe' : label}
    >
      {state === 'transcribing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : state === 'recording' ? <Square className="h-3.5 w-3.5" />
        : <Mic className="h-3.5 w-3.5" />}
      {state === 'transcribing' ? 'Listening…' : state === 'recording' ? 'Tap to stop' : label}
    </button>
  );
}
