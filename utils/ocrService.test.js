import { describe, expect, it, vi } from 'vitest';

vi.mock('pdf-parse', () => ({
  PDFParse: class {
    async getText() {
      return { text: '1. Add 1/2 and 1/4 [2 marks]' };
    }
    async destroy() {}
  },
}));

vi.mock('tesseract.js', () => ({
  default: {
    recognize: vi.fn(async () => ({
      data: { text: '1. Simplify 4/8', confidence: 72 },
    })),
  },
}));

const { extractTextFromPaper } = await import('../services/mathpath/ocrService.js');

describe('ocrService', () => {
  it('extracts ordered PDF text pages with confidence', async () => {
    const result = await extractTextFromPaper({
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
      filename: 'paper.pdf',
    });

    expect(result.pages).toEqual([
      expect.objectContaining({
        pageNumber: 1,
        extractedText: expect.stringContaining('Add 1/2'),
        confidence: 0.8,
      }),
    ]);
  });

  it('normalizes image OCR confidence to 0-1 scale', async () => {
    const result = await extractTextFromPaper({
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
      filename: 'paper.png',
    });

    expect(result.pages[0]).toMatchObject({
      extractedText: '1. Simplify 4/8',
      confidence: 0.72,
    });
  });
});
