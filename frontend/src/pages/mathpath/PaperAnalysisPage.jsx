import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { FileText, FileUp, Save, Wand2 } from 'lucide-react';
import { Button, Card, ErrorState, PageHeader } from '../../components/ui';
import { familyAPI, mathpathAPI, worksheetGenAPI } from '../../services/api';
import { getUniversalSkillByFrameworkId } from '../../mathpath/curriculum/fractionUniversalSkills';

// Map an internal skill code (e.g. "F015") to its friendly name. Falls back to
// the raw code if no mapping is found so nothing ever renders blank.
function skillFriendlyName(skillId = '') {
  const raw = String(skillId || '').trim();
  if (!raw) return '';
  return getUniversalSkillByFrameworkId(raw.toUpperCase())?.title || raw;
}

function skillFriendlyList(skillIds = []) {
  const names = (skillIds || []).map(skillFriendlyName).filter(Boolean);
  return names.length ? names.join(', ') : '';
}

const UPLOAD_TYPES = [
  ['completed_unmarked', 'Completed, unmarked'],
  ['marked_script', 'Marked script'],
  ['blank_worksheet', 'Blank worksheet'],
  ['corrections_working', 'Corrections / working'],
];

function parseQuestionRows(value = '') {
  return String(value || '')
    .split('\n')
    .map((line, index) => {
      const [questionNumber, questionText, detectedSkillIds = '', status = ''] = line.split('|').map((part) => part?.trim() || '');
      if (!questionText && !detectedSkillIds) return null;
      return {
        questionNumber: questionNumber || String(index + 1),
        questionText,
        detectedSkillIds: detectedSkillIds ? detectedSkillIds.split(',').map((id) => id.trim().toUpperCase()).filter(Boolean) : [],
        adultConfirmedWrong: /wrong|x|incorrect/i.test(status),
        adultConfirmedCorrect: /correct|tick/i.test(status),
      };
    })
    .filter(Boolean);
}

function confidenceText(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
}

export default function PaperAnalysisPage() {
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeStudentId = params.studentId || '';
  const analysisId = searchParams.get('analysis') || '';
  const [studentId, setStudentId] = useState(routeStudentId);
  const [uploadType, setUploadType] = useState('completed_unmarked');
  const [file, setFile] = useState(null);
  const [questionRows, setQuestionRows] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState('');
  const [routeAccess, setRouteAccess] = useState('allowed');
  const parsedRows = useMemo(() => parseQuestionRows(questionRows), [questionRows]);

  const requiresParentChildAccess = Boolean(routeStudentId && location.pathname.startsWith('/parent/children/'));

  useEffect(() => {
    if (!requiresParentChildAccess) {
      setRouteAccess('allowed');
      return undefined;
    }
    let mounted = true;
    setRouteAccess('checking');
    setError('');
    familyAPI.children()
      .then((res) => {
        if (!mounted) return;
        const children = res.data.children || [];
        const allowed = children.some((child) => String(child.studentId) === String(routeStudentId));
        setRouteAccess(allowed ? 'allowed' : 'blocked');
        if (!allowed) {
          setAnalysis(null);
          setQuestionRows('');
          setMessage('');
          setError('You do not have access to this child.');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setRouteAccess('blocked');
        setAnalysis(null);
        setQuestionRows('');
        setMessage('');
        setError('Could not verify child access.');
      });
    return () => { mounted = false; };
  }, [requiresParentChildAccess, routeStudentId]);

  useEffect(() => {
    setStudentId(routeStudentId);
    if (!analysisId) {
      setAnalysis(null);
      setQuestionRows('');
      setError('');
      setMessage('');
    }
  }, [routeStudentId, analysisId]);

  useEffect(() => {
    if (!analysisId) return;
    if (routeAccess !== 'allowed') return;
    let mounted = true;
    setLoading(true);
    setError('');
    setMessage('');
    setAnalysis(null);
    setQuestionRows('');
    mathpathAPI.paperAnalysis(analysisId)
      .then((res) => {
        if (!mounted) return;
        const loaded = res.data.analysis;
        setAnalysis(loaded);
        setStudentId(String(loaded?.studentId || routeStudentId || ''));
        setQuestionRows((loaded?.detectedQuestions || []).map((question) => [
          question.questionNumber || '',
          question.questionText || '',
          (question.detectedSkillIds || []).join(','),
          question.adultConfirmedWrong ? 'wrong' : question.adultConfirmedCorrect ? 'correct' : '',
        ].join(' | ')).join('\n'));
      })
      .catch((e) => {
        if (mounted) setError(e?.response?.data?.error || 'Could not load paper analysis.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [analysisId, routeAccess, routeStudentId]);

  const upload = async () => {
    if (routeAccess !== 'allowed') return;
      setLoading(true);
      setError('');
      setMessage('');
    try {
      if (!studentId) throw new Error('Enter or select a student first.');
      if (!file) throw new Error('Upload a PDF, JPG or PNG paper.');
      const form = new FormData();
      form.append('studentId', studentId);
      form.append('uploadType', uploadType);
      form.append('subjectId', 'math');
      form.append('domainId', 'fractions');
      form.append('paper', file);
      if (parsedRows.length) form.append('detectedQuestions', JSON.stringify(parsedRows));
      const { data } = await mathpathAPI.uploadPaperAnalysis(form);
      setAnalysis(data.analysis);
      setMessage('Paper uploaded for review.');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not upload paper.');
    } finally {
      setLoading(false);
    }
  };

  const saveReview = async () => {
    if (!analysis?._id) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await mathpathAPI.reviewPaperAnalysis(analysis._id, {
        detectedQuestions: parsedRows.length ? parsedRows : analysis.detectedQuestions,
      });
      setAnalysis(data.analysis);
      setMessage('Review saved.');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not save review.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (index, patch) => {
    setAnalysis((current) => {
      if (!current) return current;
      const detectedQuestions = [...(current.detectedQuestions || [])];
      detectedQuestions[index] = { ...(detectedQuestions[index] || {}), ...patch };
      return { ...current, detectedQuestions };
    });
  };

  const pollUntilReady = async (id) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await mathpathAPI.paperAnalysis(id);
      const a = res.data.analysis;
      if (a?.status === 'needs_review' || a?.status === 'reviewed' || a?.status === 'failed') {
        setAnalysis(a);
        return;
      }
    }
    setMessage('Still processing — refresh the page in a moment.');
  };

  const confirmOcr = async () => {
    if (!analysis?._id) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const corrections = (analysis.detectedQuestions || [])
        .filter((q) => q.needsAdultReview || !q.studentAnswer || !q.questionText)
        .map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          studentAnswer: q.studentAnswer,
          teacherMarkedCorrect: q.teacherMarkedCorrect,
          teacherMark: q.teacherMark,
        }));
      const { data } = await mathpathAPI.confirmOcrAnalysis(analysis._id, { corrections });
      if (data.queued) {
        setAnalysis(data.analysis);
        setMessage('Corrections saved — running skill analysis…');
        await pollUntilReady(analysis._id);
      } else {
        setAnalysis(data.analysis);
        setMessage('Analysis complete.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not submit corrections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Analyse School Paper"
        subtitle="Upload a worksheet or test script, confirm weak questions, and map them to targeted practice."
      />
      <div className="space-y-4">
        {routeAccess === 'blocked' && error && <ErrorState message={error} />}
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-700">
              Student ID
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2"
                placeholder="Student ID"
              />
            </label>
            <label className="text-sm text-ink-700">
              Upload type
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2">
                {UPLOAD_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm text-ink-700">
            Paper file
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full rounded-lg border border-line-soft px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-700">
            Manual review rows
            <textarea
              value={questionRows}
              onChange={(e) => setQuestionRows(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2"
              placeholder={"One question per line:\n1 | Add 1/3 and 1/6 | F015 | wrong\n2 | Simplify 4/8 | F007 | correct"}
            />
          </label>
          <p className="mt-2 text-xs text-ink-500">
            Tian OS will attempt OCR, question detection, mark detection, and skill mapping. Adult confirmation is required before assigning intervention.
          </p>
          {routeAccess !== 'blocked' && error && <ErrorState message={error} />}
          {message && <p className="mt-2 text-sm font-semibold text-success-700">{message}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={FileUp} onClick={upload} disabled={loading || routeAccess !== 'allowed'}>{loading ? 'Uploading...' : 'Upload for Review'}</Button>
            {analysis?._id && <Button icon={Save} variant="secondary" onClick={saveReview} disabled={loading}>Save Review</Button>}
          </div>
        </Card>

        {analysis && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Paper Analysis</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-emerald-deep">{analysis.originalFilename || 'Uploaded paper'}</h2>
            <p className="mt-1 text-sm text-ink-600">Status: {analysis.status}</p>
            {!!analysis.dataQualityWarnings?.length && (
              <div className="mt-3 rounded-xl bg-tianPeach px-3 py-2 text-sm text-error-700">
                <p className="font-semibold">Review warnings</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {analysis.dataQualityWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}
            {!!analysis.reportSummary && (
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                  <p className="text-ink-500">Questions</p>
                  <p className="font-semibold text-ink-800">{analysis.reportSummary.totalQuestions || analysis.detectedQuestions?.length || 0}</p>
                </div>
                <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                  <p className="text-ink-500">Correct</p>
                  <p className="font-semibold text-ink-800">{analysis.reportSummary.correct || 0}</p>
                </div>
                <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                  <p className="text-ink-500">Incorrect</p>
                  <p className="font-semibold text-ink-800">{analysis.reportSummary.incorrect || 0}</p>
                </div>
                <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                  <p className="text-ink-500">Confidence</p>
                  <p className="font-semibold text-ink-800">{confidenceText(analysis.reportSummary.confidence)}</p>
                </div>
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                <p className="font-semibold text-ink-700">Weak skills</p>
                <p className="text-ink-600">{analysis.weakSkillIds?.join(', ') || 'None confirmed yet'}</p>
              </div>
              <div className="rounded-xl bg-surface-white px-3 py-2 text-sm">
                <p className="font-semibold text-ink-700">Detected questions</p>
                <p className="text-ink-600">{analysis.detectedQuestions?.length || 0}</p>
              </div>
            </div>
            {!!analysis.ocrPages?.length && (
              <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-ink-700">
                OCR pages: {analysis.ocrPages.length}. Low-confidence pages require review: {analysis.ocrPages.filter((page) => page.needsReview).length}.
              </div>
            )}

            {/* ── OCR Confirmation Panel ───────────────────────────────────── */}
            {analysis.status === 'needs_ocr_confirmation' && (
              <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Some parts of the paper weren't fully clear — please check these questions before we continue the analysis.
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Only questions marked below need your attention. You can leave fields blank if you can't read them.
                </p>
                <div className="mt-4 space-y-4">
                  {(analysis.detectedQuestions || [])
                    .map((q, index) => ({ q, index }))
                    .filter(({ q }) => q.needsAdultReview || !q.studentAnswer || !q.questionText)
                    .map(({ q, index }) => (
                      <div key={`ocr-${q.questionNumber}-${index}`} className="rounded-xl border border-amber-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Question {q.questionNumber || index + 1}
                          {q.humanCorrected && <span className="ml-2 text-emerald-600">✓ corrected</span>}
                        </p>
                        <label className="block text-xs text-ink-600">
                          Question text
                          <input
                            className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                            value={q.questionText || ''}
                            onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                            placeholder="What does the question say?"
                          />
                        </label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="block text-xs text-ink-600">
                            Student&apos;s answer
                            <input
                              className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                              value={q.studentAnswer || ''}
                              onChange={(e) => updateQuestion(index, { studentAnswer: e.target.value })}
                              placeholder="What did the student write?"
                            />
                          </label>
                          <label className="block text-xs text-ink-600">
                            Teacher&apos;s mark
                            <select
                              className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                              value={q.teacherMarkedCorrect === true ? 'correct' : q.teacherMarkedCorrect === false ? 'wrong' : ''}
                              onChange={(e) => updateQuestion(index, {
                                teacherMarkedCorrect: e.target.value === 'correct' ? true : e.target.value === 'wrong' ? false : null,
                                teacherMark: e.target.value === 'correct' ? '✓' : e.target.value === 'wrong' ? '✗' : '',
                              })}
                            >
                              <option value="">Unknown / not marked</option>
                              <option value="correct">✓ Correct</option>
                              <option value="wrong">✗ Wrong</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
                <Button
                  className="mt-4 bg-amber-500 text-white hover:bg-amber-600"
                  onClick={confirmOcr}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Confirm and continue analysis'}
                </Button>
              </div>
            )}

            {analysis.status !== 'needs_ocr_confirmation' && !!analysis.detectedQuestions?.length && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-ink-700">Detected questions for adult review</p>
                {analysis.detectedQuestions.map((question, index) => (
                  <div key={`${question.questionNumber}-${index}`} className="rounded-xl border border-line-soft p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">
                          Question {question.questionNumber || index + 1} · confidence {confidenceText(question.confidence)}
                        </p>
                        <p className="mt-1 text-sm text-ink-700">{question.questionText || 'Question text needs review.'}</p>
                        <p className="mt-1 text-xs text-ink-500">
                          Answer: {question.studentAnswer || question.selectedOption || 'Not detected'} · Mark: {question.teacherMark || 'Not detected'} · Skill confidence {confidenceText(question.skillMappingConfidence || question.confidence)}
                        </p>
                        {!!question.skillMappingReasons?.length && (
                          <p className="mt-1 text-xs text-ink-500">Why: {question.skillMappingReasons.slice(0, 2).join(' ')}</p>
                        )}
                        {!!question.dataQualityWarnings?.length && (
                          <p className="mt-1 text-xs text-error-700">{question.dataQualityWarnings.join(' ')}</p>
                        )}
                        {!!question.misconceptionTags?.length && (
                          <p className="mt-1 text-xs text-ink-500">Misconceptions: {question.misconceptionTags.join(', ')}</p>
                        )}
                      </div>
                      {question.needsAdultReview && <span className="rounded-full bg-gold-tint px-2 py-1 text-xs font-semibold text-gold-deep">Review needed</span>}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs text-ink-600 sm:col-span-2">
                        OCR question text
                        <textarea
                          value={question.questionText || ''}
                          onChange={(e) => updateQuestion(index, { questionText: e.target.value, needsAdultReview: true })}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ink-600">
                        Skill mapping
                        <input
                          value={(question.detectedSkillIds || []).join(', ')}
                          onChange={(e) => updateQuestion(index, {
                            detectedSkillIds: e.target.value.split(',').map((id) => id.trim().toUpperCase()).filter(Boolean),
                            needsAdultReview: false,
                          })}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ink-600">
                        Detected answer
                        <input
                          value={question.studentAnswer || ''}
                          onChange={(e) => updateQuestion(index, { studentAnswer: e.target.value, needsAdultReview: true })}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ink-600">
                        Detected mark
                        <input
                          value={question.teacherMark || ''}
                          onChange={(e) => updateQuestion(index, { teacherMark: e.target.value, needsAdultReview: true })}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ink-600">
                        Misconception tags
                        <input
                          value={(question.misconceptionTags || []).join(', ')}
                          onChange={(e) => updateQuestion(index, {
                            misconceptionTags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                            needsAdultReview: true,
                          })}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs text-ink-600">
                        Adult notes
                        <input
                          value={question.adultNotes || ''}
                          onChange={(e) => updateQuestion(index, { adultNotes: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="s" variant={question.adultConfirmedCorrect ? 'primary' : 'secondary'} onClick={() => updateQuestion(index, {
                        adultConfirmedCorrect: true,
                        adultConfirmedWrong: false,
                        adultIgnored: false,
                        needsAdultReview: false,
                      })}>Correct</Button>
                      <Button size="s" variant={question.adultConfirmedWrong ? 'primary' : 'secondary'} onClick={() => updateQuestion(index, {
                        adultConfirmedCorrect: false,
                        adultConfirmedWrong: true,
                        adultIgnored: false,
                        needsAdultReview: false,
                      })}>Wrong</Button>
                      <Button size="s" variant={question.adultIgnored ? 'primary' : 'ghost'} onClick={() => updateQuestion(index, {
                        adultConfirmedCorrect: false,
                        adultConfirmedWrong: false,
                        adultIgnored: true,
                        needsAdultReview: false,
                      })}>Ignore</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button icon={Save} variant="secondary" onClick={saveReview} disabled={loading}>Save Review</Button>
              <Button
                icon={Wand2}
                variant="secondary"
                onClick={async () => {
                  setError('');
                  setMessage('');
                  try {
                    const { data } = await mathpathAPI.assignPaperAnalysisPractice(analysis._id);
                    setAnalysis({
                      ...analysis,
                      status: data.assigned ? 'assigned' : analysis.status,
                      linkedPracticeAssignmentIds: data.assignmentId
                        ? [...(analysis.linkedPracticeAssignmentIds || []), data.assignmentId]
                        : analysis.linkedPracticeAssignmentIds,
                    });
                    setMessage(data.message || 'Recovery Pack assigned.');
                  } catch (e) {
                    setError(e?.response?.data?.message || e?.response?.data?.error || 'Could not assign Recovery Pack.');
                  }
                }}
              >
                Assign Targeted Practice
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  setError('');
                  setMessage('');
                  try {
                    const { data } = await mathpathAPI.createPaperAnalysisRecheck(analysis._id);
                    setMessage(data.created ? 'Recheck created.' : (data.message || 'Complete the Recovery Pack before recheck.'));
                  } catch (e) {
                    setError(e?.response?.data?.message || e?.response?.data?.error || 'Complete the Recovery Pack before recheck.');
                  }
                }}
              >
                Create Mini Diagnostic
              </Button>
              <Button
                icon={FileText}
                variant="secondary"
                onClick={async () => {
                  setError('');
                  setMessage('');
                  try {
                    const { data } = await worksheetGenAPI.generateIntervention({
                      studentId: analysis.studentId || routeStudentId,
                      sourceType: 'paper_analysis',
                      sourceId: analysis._id,
                      worksheetType: 'recovery_worksheet',
                      questionCount: 12,
                    });
                    setMessage(data?.worksheet?.title ? `${data.worksheet.title} generated.` : 'Targeted worksheet generated.');
                  } catch (e) {
                    setError(e?.response?.data?.error || 'Could not generate targeted worksheet.');
                  }
                }}
              >
                Generate Targeted Worksheet
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
