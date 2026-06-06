import { detectPaperMarks } from './paperMarkDetectionService.js';

const QUESTION_START = /^\s*(?:q(?:uestion)?\s*)?(\d+[a-z]?)(?:[\).:]|\s+-|\s{2,})\s*(.*)$/i;
const MARKS_PATTERN = /\[(\d+)\s*(?:mark|marks|m)\]|\((\d+)\s*(?:mark|marks|m)\)/i;
const ANSWER_PATTERN = /\b(?:ans(?:wer)?|student answer|answer written)\s*[:=-]\s*([^;\n]+)/i;

function confidenceForQuestion(text = '', questionNumber = '') {
  let score = questionNumber ? 0.55 : 0.25;
  if (String(text || '').length > 20) score += 0.2;
  if (MARKS_PATTERN.test(text)) score += 0.1;
  if (ANSWER_PATTERN.test(text)) score += 0.05;
  return Math.max(0, Math.min(0.95, score));
}

export function segmentQuestionsFromOcrPages(pages = []) {
  const blocks = [];
  let current = null;

  (pages || []).forEach((page) => {
    const lines = String(page.extractedText || '').split(/\r?\n/);
    lines.forEach((line) => {
      const match = line.match(QUESTION_START);
      if (match) {
        if (current) blocks.push(current);
        current = {
          questionNumber: match[1],
          pageNumber: Number(page.pageNumber || 1),
          lines: [match[2] || ''],
        };
        return;
      }
      if (current) current.lines.push(line);
    });
  });
  if (current) blocks.push(current);

  if (!blocks.length) {
    const fallbackText = (pages || []).map((page) => page.extractedText).filter(Boolean).join('\n').trim();
    if (fallbackText) {
      blocks.push({ questionNumber: '1', pageNumber: 1, lines: [fallbackText] });
    }
  }

  return blocks.map((block, index) => {
    const text = block.lines.join('\n').trim();
    const marksMatch = text.match(MARKS_PATTERN);
    const marks = marksMatch ? Number(marksMatch[1] || marksMatch[2] || 0) : null;
    const detection = detectPaperMarks(text);
    const confidence = confidenceForQuestion(text, block.questionNumber || String(index + 1));
    const warnings = [
      ...(!block.questionNumber ? ['Question number was inferred.'] : []),
      ...(!text ? ['Question text is empty.'] : []),
      ...(confidence < 0.65 ? ['Low question segmentation confidence.'] : []),
      ...(!detection.studentAnswer && detection.teacherMarkedCorrect !== null ? ['Teacher mark detected but student answer is unclear.'] : []),
    ];
    return {
      questionNumber: String(block.questionNumber || index + 1),
      questionText: text.replace(ANSWER_PATTERN, '').trim(),
      marks: Number.isFinite(marks) ? marks : null,
      pageNumber: Number(block.pageNumber || 1),
      confidence,
      ...detection,
      needsAdultReview: confidence < 0.85 || detection.studentAnswerConfidence > 0 || detection.teacherMarkConfidence > 0,
      dataQualityWarnings: warnings,
    };
  });
}
