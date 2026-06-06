import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileUp, Save, Wand2 } from 'lucide-react';
import { Button, Card, ErrorState, PageHeader } from '../../components/ui';
import { mathpathAPI } from '../../services/api';

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

export default function PaperAnalysisPage() {
  const params = useParams();
  const routeStudentId = params.studentId || '';
  const [studentId, setStudentId] = useState(routeStudentId);
  const [uploadType, setUploadType] = useState('completed_unmarked');
  const [file, setFile] = useState(null);
  const [questionRows, setQuestionRows] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const parsedRows = useMemo(() => parseQuestionRows(questionRows), [questionRows]);

  const upload = async () => {
    setLoading(true);
    setError('');
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
    try {
      const { data } = await mathpathAPI.reviewPaperAnalysis(analysis._id, {
        detectedQuestions: parsedRows.length ? parsedRows : analysis.detectedQuestions,
      });
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not save review.');
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
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-700">
              Student ID
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline px-3 py-2"
                placeholder="Student ID"
              />
            </label>
            <label className="text-sm text-ink-700">
              Upload type
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="mt-1 w-full rounded-lg border border-hairline px-3 py-2">
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
              className="mt-1 block w-full rounded-lg border border-hairline px-3 py-2"
            />
          </label>
          <label className="mt-3 block text-sm text-ink-700">
            Manual review rows
            <textarea
              value={questionRows}
              onChange={(e) => setQuestionRows(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-hairline px-3 py-2"
              placeholder={"One question per line:\n1 | Add 1/3 and 1/6 | F015 | wrong\n2 | Simplify 4/8 | F007 | correct"}
            />
          </label>
          <p className="mt-2 text-xs text-ink-500">
            OCR/AI extraction is not automatic in this MVP. Add manual rows when you want immediate skill mapping.
          </p>
          {error && <ErrorState message={error} />}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={FileUp} onClick={upload} disabled={loading}>{loading ? 'Uploading...' : 'Upload for Review'}</Button>
            {analysis?._id && <Button icon={Save} variant="secondary" onClick={saveReview} disabled={loading}>Save Review</Button>}
          </div>
        </Card>

        {analysis && (
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Paper Analysis</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-navy-700">{analysis.originalFilename || 'Uploaded paper'}</h2>
            <p className="mt-1 text-sm text-ink-600">Status: {analysis.status}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-paper px-3 py-2 text-sm">
                <p className="font-semibold text-ink-700">Weak skills</p>
                <p className="text-ink-600">{analysis.weakSkillIds?.join(', ') || 'None confirmed yet'}</p>
              </div>
              <div className="rounded-xl bg-paper px-3 py-2 text-sm">
                <p className="font-semibold text-ink-700">Detected questions</p>
                <p className="text-ink-600">{analysis.detectedQuestions?.length || 0}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                icon={Wand2}
                variant="secondary"
                onClick={async () => {
                  const { data } = await mathpathAPI.assignPaperAnalysisPractice(analysis._id);
                  setAnalysis({ ...analysis, recommendedActions: data.recommendedActions || analysis.recommendedActions });
                }}
              >
                Assign Targeted Practice
              </Button>
              <Button
                variant="secondary"
                onClick={async () => { await mathpathAPI.createPaperAnalysisRecheck(analysis._id); }}
              >
                Create Mini Diagnostic
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
