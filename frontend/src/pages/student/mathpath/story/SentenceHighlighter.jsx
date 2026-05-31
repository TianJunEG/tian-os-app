import React from 'react';
import { splitIntoSentences } from '../../../../mathpath/story/storyTtsService';

export default function SentenceHighlighter({ text = '', activeIndex = -1, className = '' }) {
  const sentences = splitIntoSentences(text);
  if (!sentences.length) return null;
  return (
    <p className={className}>
      {sentences.map((sentence, index) => (
        <span
          key={`${sentence}-${index}`}
          className={index === activeIndex ? 'rounded bg-gold-100 px-1 text-navy-900' : ''}
        >
          {sentence}{index < sentences.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
