import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';

const LOW_CONFIDENCE_THRESHOLD = 0.65;

function clampConfidence(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n > 1 ? n / 100 : n));
}

async function extractPdfPages(buffer) {
  let parser = null;
  try {
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({ parsePageInfo: true });
    const text = String(parsed?.text || '').trim();
    const pageTexts = Array.isArray(parsed?.pages)
      ? parsed.pages.map((page) => String(page?.text || '').trim()).filter(Boolean)
      : [];
    const pages = pageTexts.length ? pageTexts : [text];
    return {
      pages: pages.map((extractedText, index) => ({
        pageNumber: index + 1,
        extractedText,
        confidence: extractedText ? 0.8 : 0,
        needsReview: !extractedText,
        warnings: extractedText ? [] : ['No readable text detected on this PDF page.'],
      })),
    };
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch {
        // best effort cleanup
      }
    }
  }
}

async function extractImagePage(buffer) {
  const result = await Tesseract.recognize(buffer, 'eng');
  const confidence = clampConfidence(result?.data?.confidence, 0);
  return {
    pages: [{
      pageNumber: 1,
      extractedText: String(result?.data?.text || '').trim(),
      confidence,
      needsReview: confidence < LOW_CONFIDENCE_THRESHOLD,
      warnings: [
        ...(confidence < LOW_CONFIDENCE_THRESHOLD ? ['Low OCR confidence. Adult review required.'] : []),
        ...(!String(result?.data?.text || '').trim() ? ['No readable text detected in image.'] : []),
      ],
    }],
  };
}

export async function extractTextFromPaper({ buffer, mimeType = '', filename = '' } = {}) {
  if (!buffer) {
    const err = new Error('No paper file buffer supplied for OCR.');
    err.status = 400;
    throw err;
  }
  const type = String(mimeType || '').toLowerCase();
  const name = String(filename || '').toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return extractPdfPages(buffer);
  }
  if (type.includes('image') || /\.(png|jpe?g)$/.test(name)) {
    return extractImagePage(buffer);
  }
  const err = new Error('Only PDF, JPG and PNG paper uploads are supported.');
  err.status = 400;
  throw err;
}

export { LOW_CONFIDENCE_THRESHOLD };
