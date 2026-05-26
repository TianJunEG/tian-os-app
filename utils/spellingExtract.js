// Extracts candidate spelling words from uploaded files.
//
// Extraction is inherently imperfect, so every path is best-effort and the
// frontend always shows an editable review screen before a list is saved.
// Supported: PDF (pdf-parse), DOCX (mammoth, with <u> underline detection),
// images (tesseract.js OCR) and plain text / CSV.

import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_WORDS = 300;
const BULLET_RE = /^\s*(?:\d+\s*[.)\-:]|[-*•·▪◦‣o])\s*/i;
const SENTENCE_END_RE = /[.?!]["')\]]?\s*$/;

const stripBullet = (line) => line.replace(BULLET_RE, '').trim();

// Tokens that look like real words (contain at least one letter). Keeps
// hyphens/apostrophes inside words (e.g. "mother-in-law", "don't").
const wordTokens = (str) =>
  (str.match(/[A-Za-z][A-Za-z'-]*/g) || []).filter((t) => /[A-Za-z]/.test(t));

const looksLikeSentence = (line, tokens) =>
  SENTENCE_END_RE.test(line) || tokens.length >= 5;

// Guess the tested word in a sentence: the longest alphabetic token.
const guessTestedWord = (tokens) =>
  tokens.reduce((best, t) => (t.length > best.length ? t : best), '');

const cleanWord = (w) => w.replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '').trim();

// Turn raw text into candidate { word, sentence, definition } entries.
export function parseWordsFromText(rawText) {
  const entries = [];
  const seen = new Set();
  const text = String(rawText || '').replace(/\r\n?/g, '\n');

  const pushWord = (word) => {
    const w = cleanWord(word);
    if (!w) return;
    const key = w.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ word: w, sentence: '', definition: '' });
  };

  for (const rawLine of text.split('\n')) {
    if (entries.length >= MAX_WORDS) break;
    const line = stripBullet(rawLine);
    if (!line) continue;

    const tokens = wordTokens(line);
    if (tokens.length === 0) continue;

    if (tokens.length === 1) {
      pushWord(tokens[0]);
      continue;
    }

    if (looksLikeSentence(line, tokens)) {
      entries.push({ word: cleanWord(guessTestedWord(tokens)), sentence: line, definition: '' });
      continue;
    }

    // Short multi-token line with no sentence punctuation: treat as a
    // comma/space separated word list (e.g. "bought, thought, brought").
    const parts = line.includes(',') ? line.split(',') : tokens;
    for (const part of parts) {
      const t = wordTokens(part);
      if (t.length === 1) pushWord(t[0]);
      else if (t.length > 1) pushWord(guessTestedWord(t));
    }
  }

  return entries.slice(0, MAX_WORDS);
}

// Parse mammoth HTML, treating an underlined run as the tested word and the
// surrounding paragraph as its example sentence.
export function parseWordsFromHtml(html) {
  const entries = [];
  const seen = new Set();
  const source = String(html || '');

  // Split into block-level chunks (paragraphs, list items, table cells).
  const blocks = source
    .split(/<\/(?:p|li|td|th|h[1-6]|div|tr)>/i)
    .map((b) => b.replace(/<br\s*\/?>/gi, '\n'));

  const stripTags = (s) =>
    s
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();

  let sawUnderline = false;

  for (const block of blocks) {
    if (entries.length >= MAX_WORDS) break;
    const underlineMatch = block.match(/<u\b[^>]*>([\s\S]*?)<\/u>/i);
    const plain = stripBullet(stripTags(block));
    if (!plain) continue;

    if (underlineMatch) {
      const underlined = cleanWord(stripTags(underlineMatch[1]));
      if (underlined) {
        sawUnderline = true;
        entries.push({ word: underlined, sentence: plain, definition: '' });
        continue;
      }
    }

    // No underline in this block: fall back to plain-text parsing.
    for (const e of parseWordsFromText(plain)) {
      const key = (e.word || e.sentence).toLowerCase();
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      entries.push(e);
      if (entries.length >= MAX_WORDS) break;
    }
  }

  // If underlines were found, keep only the rich {word, sentence} entries so
  // we don't pollute the list with stray words from the same document.
  const result = sawUnderline ? entries.filter((e) => e.sentence) : entries;
  return result.slice(0, MAX_WORDS);
}

// Main entry: dispatch on file type. Returns { words, sourceType, warning }.
export async function extractWordsFromFile(buffer, originalName, mimetype) {
  const ext = path.extname(originalName || '').toLowerCase();
  const mime = mimetype || '';

  try {
    if (ext === '.pdf' || mime === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const { text } = await parser.getText();
      await parser.destroy?.();
      return { words: parseWordsFromText(text), sourceType: 'pdf' };
    }

    if (ext === '.docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value: html } = await mammoth.convertToHtml({ buffer });
      return { words: parseWordsFromHtml(html), sourceType: 'docx' };
    }

    if (ext === '.doc' || mime === 'application/msword') {
      // Legacy binary .doc is not reliably parseable here.
      return {
        words: [],
        sourceType: 'doc',
        warning:
          'Legacy .doc files cannot be read automatically. Please save it as .docx, or type the words below.'
      };
    }

    if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext)) {
      // OCR is best-effort and may be slow; isolate any failure.
      try {
        const { recognize } = await import('tesseract.js');
        const { data } = await recognize(buffer, 'eng');
        const words = parseWordsFromText(data?.text || '');
        return {
          words,
          sourceType: 'image',
          warning: words.length
            ? undefined
            : 'We could not read any words from this image. Please type them below.'
        };
      } catch (ocrErr) {
        return {
          words: [],
          sourceType: 'image',
          warning: 'Automatic reading of this image failed. Please type the words below.'
        };
      }
    }

    if (['.txt', '.csv', '.text', '.md'].includes(ext) || mime.startsWith('text/')) {
      return { words: parseWordsFromText(buffer.toString('utf8')), sourceType: 'text' };
    }

    return {
      words: [],
      sourceType: 'text',
      warning: 'Unsupported file type. Please upload a PDF, Word (.docx), image or text file.'
    };
  } catch (err) {
    return {
      words: [],
      sourceType: ext === '.pdf' ? 'pdf' : 'text',
      warning: `We could not read this file automatically (${err.message}). Please type the words below.`
    };
  }
}
