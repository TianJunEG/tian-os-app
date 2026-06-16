import { describe, it, expect, vi, afterEach } from 'vitest';
import { isSpeechInputSupported } from './speechInput';

afterEach(() => { vi.unstubAllGlobals(); });

describe('isSpeechInputSupported', () => {
  it('is false when mic/MediaRecorder is unavailable (e.g. jsdom)', () => {
    // jsdom has no getUserMedia / MediaRecorder by default.
    expect(isSpeechInputSupported()).toBe(false);
  });

  it('is true when getUserMedia, MediaRecorder and WebAssembly are present', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => {} } });
    vi.stubGlobal('MediaRecorder', function MediaRecorder() {});
    // WebAssembly exists in the node/jsdom test env already.
    expect(isSpeechInputSupported()).toBe(true);
  });
});
