import React from 'react';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { splitIntoSentences } from '../../../../mathpath/story/storyTtsService';
import useStoryTextToSpeech from '../../../../mathpath/story/useStoryTextToSpeech';

export default function StoryAudioControls({
  storyText = '',
  stepText = '',
  hintText = '',
  feedbackText = '',
  onStorySentenceChange,
}) {
  const storySentences = splitIntoSentences(storyText);
  const currentStepSentences = splitIntoSentences([stepText, hintText, feedbackText].filter(Boolean).join(' '));
  const tts = useStoryTextToSpeech({ onSentenceChange: onStorySentenceChange });

  if (!tts.isAvailable) {
    return (
      <div className="rounded-xl border border-hairline bg-slate-50 px-3 py-2 text-xs text-ink-500">
        Audio is unavailable on this device. You can still use Story Mode normally.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-hairline bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700">
        <Volume2 className="h-4 w-4" />
        Listen
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={Play} onClick={() => tts.play(storySentences)}>Play story</Button>
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={Pause} onClick={tts.pause}>Pause</Button>
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={RotateCcw} onClick={tts.replaySentence}>Replay sentence</Button>
        <Button size="s" className="min-h-[44px]" variant="secondary" icon={Play} onClick={() => tts.play(currentStepSentences)}>Read step</Button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-ink-600">
        <input
          type="checkbox"
          checked={tts.rate < 0.8}
          onChange={(event) => tts.setRate(event.target.checked ? 0.7 : 0.85)}
        />
        Slower reading
      </label>
    </div>
  );
}
