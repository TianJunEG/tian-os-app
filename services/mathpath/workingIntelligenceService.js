export const REVIEW_STATUSES = ['pending', 'reviewed', 'corrected', 'verified', 'rejected', 'unreadable'];
export const ANALYSIS_STATUSES = ['queued', 'processing', 'ocr_complete', 'needs_human_review', 'failed', 'ready_for_ai'];

const UNIT_PATTERN = /\b(?:cm|m|km|g|kg|ml|l|litre|litres|dollar|dollars|cent|cents|unit|units)\b/gi;
const LABEL_PATTERN = /\b(?:answer|ans|step|q\d+|working|left|remainder|total|part|whole)\b/gi;
const SYMBOL_PATTERN = /[+\-x×*÷/=<>]/g;
const EQUATION_PATTERN = /(?:\d+\s*)?(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[a-z])(?:\s*[+\-x×*÷/]\s*(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[a-z]))+\s*=\s*(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[a-z])/gi;
const MIXED_FRACTION_PATTERN = /\b(\d+)\s+(\d+)\s*\/\s*(\d+)\b/g;
const FRACTION_PATTERN = /\b(\d+)\s*\/\s*(\d+)\b/g;
const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix, parts = []) {
  const suffix = parts.filter(Boolean).join('_').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${prefix}_${suffix || Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function confidence(score, note = '', source = 'heuristic') {
  return { score: Math.max(0, Math.min(1, Number(score) || 0)), source, note };
}

function uniqueMatches(text = '', pattern) {
  const values = [];
  const seen = new Set();
  String(text || '').replace(pattern, (match) => {
    const cleaned = match.trim();
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      values.push(cleaned);
    }
    return match;
  });
  return values;
}

function normalizeFraction(value = '') {
  const mixed = String(value).match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return `${mixed[1]} ${mixed[2]}/${mixed[3]}`;
  const fraction = String(value).match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return `${fraction[1]}/${fraction[2]}`;
  return String(value || '').trim();
}

function extractTextFromStrokeData(strokes = []) {
  const rows = Array.isArray(strokes) ? strokes : [];
  return rows
    .map((stroke) => stroke?.text || stroke?.label || stroke?.value || '')
    .filter(Boolean)
    .join('\n');
}

function element(value, type, score, note = '') {
  return {
    value,
    normalized: type === 'fraction' ? normalizeFraction(value) : String(value || '').trim(),
    type,
    confidence: confidence(score, note),
    boundingBox: null,
  };
}

export function extractOcrCandidates(input = {}) {
  const rawText = [
    input.ocrText,
    input.rawText,
    input.questionMetadata?.workingText,
    input.questionMetadata?.studentWorkingText,
    extractTextFromStrokeData(input.strokeData || input.canvasStrokeData),
  ].filter(Boolean).join('\n').trim();

  const fractions = [
    ...uniqueMatches(rawText, MIXED_FRACTION_PATTERN).map((value) => element(value, 'mixed_number', 0.72, 'Detected mixed-number text pattern.')),
    ...uniqueMatches(rawText, FRACTION_PATTERN).map((value) => element(value, 'fraction', 0.68, 'Detected inline fraction text pattern.')),
  ];
  const equations = uniqueMatches(rawText, EQUATION_PATTERN).map((value) => element(value, 'equation', 0.64, 'Detected simple equation/operator pattern.'));
  const symbols = uniqueMatches(rawText, SYMBOL_PATTERN).map((value) => element(value, 'symbol', 0.7, 'Detected mathematical symbol.'));
  const units = uniqueMatches(rawText, UNIT_PATTERN).map((value) => element(value, 'unit', 0.62, 'Detected common school unit.'));
  const labels = uniqueMatches(rawText, LABEL_PATTERN).map((value) => element(value, 'label', 0.58, 'Detected common working label.'));
  const numbers = uniqueMatches(rawText, NUMBER_PATTERN)
    .filter((value) => !fractions.some((f) => f.value.includes(value)))
    .map((value) => element(value, 'number', 0.66, 'Detected numeric token.'));

  const hasText = rawText.length > 0;
  return {
    rawText,
    numbers,
    fractions,
    equations,
    symbols,
    units,
    labels,
    confidence: confidence(
      hasText ? Math.min(0.78, 0.42 + (numbers.length + fractions.length + equations.length) * 0.06) : 0.18,
      hasText ? 'Heuristic OCR candidate extraction from supplied text/stroke labels.' : 'No OCR text available yet; raw image preserved for human review.'
    ),
  };
}

export function detectFractionRepresentations(ocrOutput = {}) {
  return (ocrOutput.fractions || []).map((fraction) => {
    const normalized = normalizeFraction(fraction.normalized || fraction.value);
    const isMixedNumber = /^\d+\s+\d+\/\d+$/.test(normalized);
    const isImproper = !isMixedNumber && (() => {
      const match = normalized.match(/^(\d+)\/(\d+)$/);
      return match ? Number(match[1]) > Number(match[2]) : false;
    })();
    return {
      ...fraction,
      normalized,
      representationType: isMixedNumber ? 'mixed_number' : isImproper ? 'improper_fraction' : 'proper_fraction',
    };
  });
}

export function extractEquationExpressions(ocrOutput = {}) {
  return (ocrOutput.equations || []).map((equation) => ({
    ...equation,
    operators: uniqueMatches(equation.value, SYMBOL_PATTERN),
    hasEquals: String(equation.value).includes('='),
  }));
}

export function segmentWorkingSteps(input = {}) {
  const text = input.ocrOutput?.rawText || input.rawText || '';
  const strokeData = Array.isArray(input.strokeData) ? input.strokeData : [];
  const textSteps = String(text || '')
    .split(/\n+|(?:^|\s)(?:step\s*)?\d+[).:]\s*/i)
    .map((line) => line.trim())
    .filter(Boolean);

  if (textSteps.length) {
    return textSteps.map((line, index) => ({
      stepNumber: index + 1,
      text: line,
      strokeIds: [],
      extractedExpressions: extractEquationExpressions(extractOcrCandidates({ rawText: line })),
      confidence: confidence(0.62, 'Segmented by line breaks or step markers.'),
    }));
  }

  const grouped = new Map();
  strokeData.forEach((stroke, index) => {
    const page = Number(stroke.pageNumber || stroke.page || 1);
    const y = Number(stroke.y ?? stroke.bounds?.y ?? index * 40);
    const bucket = `${page}:${Math.floor(y / 60)}`;
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket).push(stroke);
  });

  return [...grouped.values()].map((strokes, index) => ({
    stepNumber: index + 1,
    text: strokes.map((stroke) => stroke.text || stroke.label || '').filter(Boolean).join(' '),
    strokeIds: strokes.map((stroke, strokeIndex) => String(stroke.id || stroke.strokeId || `stroke_${index + 1}_${strokeIndex + 1}`)),
    extractedExpressions: [],
    confidence: confidence(0.46, 'Segmented by approximate stroke positioning.'),
  }));
}

export function buildWorkingTimeline(input = {}) {
  const strokes = Array.isArray(input.strokeData) ? input.strokeData : [];
  const events = strokes.map((stroke, index) => ({
    eventType: stroke.erased ? 'erase' : 'stroke',
    timestamp: stroke.timestamp || stroke.createdAt || null,
    strokeId: String(stroke.id || stroke.strokeId || `stroke_${index + 1}`),
    pageNumber: Number(stroke.pageNumber || stroke.page || 1),
    action: stroke.erased ? 'erase' : 'write',
    metadata: {
      pointCount: Array.isArray(stroke.points) ? stroke.points.length : null,
      colour: stroke.colour || stroke.color || '',
    },
  }));
  if (input.submittedAt) {
    events.push({
      eventType: 'submission',
      timestamp: input.submittedAt,
      strokeId: '',
      pageNumber: null,
      action: 'submit',
      metadata: {},
    });
  }
  return events.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}

export function buildStructuredWorkingRecord(input = {}) {
  const mapRow = input.mapRow || {};
  const rawImages = [
    ...(Array.isArray(input.uploadedImages) ? input.uploadedImages : []),
    ...(Array.isArray(input.fileUrls) ? input.fileUrls.filter((url) => /\.(png|jpe?g|webp)$/i.test(url)) : []),
  ];
  const strokeData = input.canvasStrokeData || input.strokeData || [];
  const ocrOutput = extractOcrCandidates({
    ...input,
    strokeData,
    questionMetadata: input.questionMetadata || {},
  });
  ocrOutput.fractions = detectFractionRepresentations(ocrOutput);
  ocrOutput.equations = extractEquationExpressions(ocrOutput);
  const detectedSteps = segmentWorkingSteps({ ocrOutput, strokeData });
  const hasReviewableData = Boolean(ocrOutput.rawText || rawImages.length || (Array.isArray(strokeData) && strokeData.length));
  const lowConfidence = ocrOutput.confidence.score < 0.5;

  return {
    workingId: input.workingId || makeId('workingintel', [input.workingSessionId, mapRow.questionId || input.questionId]),
    workingSessionId: input.workingSessionId,
    studentId: input.studentId,
    questionId: mapRow.questionId || input.questionId || '',
    skillId: mapRow.skillId || input.skillId || '',
    practiceSessionId: input.practiceSessionId || null,
    assessmentSessionId: input.assessmentSessionId || null,
    workingCode: mapRow.workingCode || input.workingCode || '',
    uploadType: input.inputMethod || 'unknown',
    rawImage: rawImages[0] || input.canvasImage || '',
    rawImages,
    rawArchive: {
      fileUrls: input.fileUrls || [],
      fileMetadata: input.fileMetadata || [],
      canvasImage: input.canvasImage || '',
      strokeData,
      digitalInkData: input.digitalInkData || null,
    },
    ocrOutput,
    detectedSteps,
    timeline: buildWorkingTimeline({ strokeData, submittedAt: input.submittedAt || input.submissionTimestamp }),
    reviewStatus: 'pending',
    analysisStatus: lowConfidence ? 'needs_human_review' : 'ocr_complete',
    humanReviewStatus: 'pending',
    datasetRecord: buildDatasetRecord({
      question: input.questionMetadata?.question || input.questionMetadata?.stem || '',
      skillId: mapRow.skillId || input.skillId || '',
      working: { rawImages, strokeData },
      ocrOutput,
      detectedSteps,
      outcome: input.questionMetadata?.outcome || null,
    }),
    qualityMetrics: {
      ocrSuccess: Boolean(ocrOutput.rawText),
      fractionExtractionSuccess: ocrOutput.fractions.length > 0,
      stepSegmentationSuccess: detectedSteps.length > 0,
      unreadable: !hasReviewableData,
    },
    processing: {
      attempts: 1,
      lastAttemptAt: nowIso(),
      nextRetryAt: lowConfidence && hasReviewableData ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
      error: '',
      cachedAt: nowIso(),
    },
    submittedAt: input.submittedAt || input.submissionTimestamp || null,
  };
}

export function buildWorkingIntelligenceRecordsFromSession(session = {}, questionMetadataById = {}) {
  const maps = Array.isArray(session.questionWorkingMap) ? session.questionWorkingMap : [];
  const rows = maps.length ? maps : [{ questionId: '', skillId: session.skillIds?.[0] || '', workingCode: '' }];
  return rows.map((mapRow) => buildStructuredWorkingRecord({
    ...session,
    mapRow,
    questionMetadata: questionMetadataById[mapRow.questionId] || {},
  }));
}

export function applyHumanReviewCorrection(record = {}, correction = {}) {
  const flags = Array.isArray(correction.flags) ? correction.flags : [];
  const nextStatus = flags.includes('unreadable')
    ? 'unreadable'
    : correction.verified
      ? 'verified'
      : correction.correctedOcrText || correction.correctedSteps
        ? 'corrected'
        : 'reviewed';
  return {
    ...record,
    reviewStatus: nextStatus,
    humanReviewStatus: nextStatus,
    reviewerUserId: correction.reviewerUserId || record.reviewerUserId || '',
    reviewerRole: correction.reviewerRole || record.reviewerRole || '',
    reviewCorrections: [
      ...(record.reviewCorrections || []),
      {
        reviewerUserId: correction.reviewerUserId || '',
        reviewerRole: correction.reviewerRole || '',
        correctedOcrText: correction.correctedOcrText || '',
        correctedSteps: correction.correctedSteps || [],
        flags,
        notes: correction.notes || '',
        reviewedAt: correction.reviewedAt || nowIso(),
      },
    ],
    analysisStatus: nextStatus === 'verified' ? 'ready_for_ai' : nextStatus === 'unreadable' ? 'needs_human_review' : record.analysisStatus,
  };
}

export function buildOcrAuditReport(records = []) {
  const list = Array.isArray(records) ? records : [];
  const total = list.length;
  const ocrSuccess = list.filter((row) => row.qualityMetrics?.ocrSuccess).length;
  const fractionSuccess = list.filter((row) => row.qualityMetrics?.fractionExtractionSuccess).length;
  const stepSuccess = list.filter((row) => row.qualityMetrics?.stepSegmentationSuccess).length;
  const unreadable = list.filter((row) => row.qualityMetrics?.unreadable || row.reviewStatus === 'unreadable').length;
  return {
    totalRecords: total,
    ocrSuccessRate: total ? Math.round((ocrSuccess / total) * 1000) / 10 : 0,
    fractionExtractionSuccessRate: total ? Math.round((fractionSuccess / total) * 1000) / 10 : 0,
    stepSegmentationSuccessRate: total ? Math.round((stepSuccess / total) * 1000) / 10 : 0,
    unreadableWorkingRate: total ? Math.round((unreadable / total) * 1000) / 10 : 0,
  };
}

export function buildDatasetRecord({ question = '', skillId = '', working = {}, ocrOutput = {}, detectedSteps = [], corrections = [], outcome = null } = {}) {
  return {
    question,
    skillId,
    working,
    ocrOutput,
    stepSequence: detectedSteps,
    reviewCorrections: corrections,
    outcome,
    aiTrainingReady: corrections.some((correction) => correction.flags?.includes('verified')) || false,
  };
}

export function validateWorkingIntelligenceFoundation() {
  const record = buildStructuredWorkingRecord({
    workingSessionId: 'work_1',
    studentId: 'student_1',
    inputMethod: 'stylus',
    canvasStrokeData: [
      { id: 's1', text: '1/2 + 1/4 = 3/4', timestamp: '2026-06-01T08:00:00.000Z', y: 10 },
      { id: 's2', text: 'Ans 3/4 litre', timestamp: '2026-06-01T08:00:05.000Z', y: 90 },
    ],
    mapRow: { questionId: 'q1', skillId: 'F018', workingCode: 'MP-FRAC-F018-TEST' },
    submittedAt: '2026-06-01T08:00:10.000Z',
  });
  const corrected = applyHumanReviewCorrection(record, { reviewerUserId: 'adult_1', reviewerRole: 'tutor', verified: true });
  const audit = buildOcrAuditReport([corrected]);

  return {
    completed: true,
    checks: {
      structuredRecordCreated: Boolean(record.workingId && record.workingSessionId),
      rawWorkingPreserved: Array.isArray(record.rawArchive.strokeData) && record.rawArchive.strokeData.length === 2,
      fractionsDetected: record.ocrOutput.fractions.some((fraction) => fraction.normalized === '1/2'),
      equationsDetected: record.ocrOutput.equations.length > 0,
      stepsSegmented: record.detectedSteps.length >= 2,
      timelineBuilt: record.timeline.some((event) => event.eventType === 'submission'),
      humanReviewStored: corrected.reviewStatus === 'verified',
      datasetPrepared: Boolean(record.datasetRecord.stepSequence),
      auditCalculated: audit.ocrSuccessRate === 100,
    },
  };
}

