import React from 'react';
import { splitIntoSentences } from '../../../../mathpath/story/storyTtsService';
import KeyFactHighlighter from './KeyFactHighlighter';

export default function SentenceHighlighter({
  text = '',
  activeIndex = -1,
  className = '',
  keyFacts = [],
  activeFactId = '',
  onFactSelect,
}) {
  const sentences = splitIntoSentences(text);
  if (!sentences.length) return null;
  return (
    <div className={className}>
      {sentences.map((sentence, index) => (
        <p
          key={`${sentence}-${index}`}
          className={`mb-2 rounded-lg px-2 py-1 leading-relaxed last:mb-0 ${index === activeIndex ? 'bg-gold-100 text-navy-900' : ''}`}
        >
          <KeyFactHighlighter
            sentence={sentence}
            facts={(keyFacts || []).filter((fact) => Number(fact.sentenceIndex) === index)}
            activeFactId={activeFactId}
            onFactSelect={onFactSelect}
          />
        </p>
      ))}
    </div>
  );
}
