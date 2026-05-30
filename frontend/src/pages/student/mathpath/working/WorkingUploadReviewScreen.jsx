import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader, Card, Button, ErrorState } from '../../../../components/ui';
import WorkingUploadCard from '../../../../components/mathpath/working/WorkingUploadCard';
import WorkingReviewCard from '../../../../components/mathpath/working/WorkingReviewCard';
import WorkingSubmissionSummary from '../../../../components/mathpath/working/WorkingSubmissionSummary';
import {
  createWorkingSession,
  createQuestionWorkingMap,
  markNoWorkingRequired,
  markWorkingExpected,
  prepareWorkingForAnalysis,
  submitPaperWorking,
} from '../../../../mathpath/working/workingUploadWorkflow';

export default function WorkingUploadReviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const sessionType = state.sessionType || 'practice';
  const questionRefs = state.questionRefs || [];
  const noWorkingChecked = state.noWorkingChecked || {};
  const rawFiles = state.rawFiles || [];
  const displayFiles = state.files || [];
  const requiringWorkingCount = questionRefs.filter((q) => q.workingRequired).length;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const workingRequiredMap = useMemo(
    () => questionRefs.reduce((acc, q) => {
      acc[q.questionId] = markWorkingExpected(q.questionId, q.questionFamilyId);
      return acc;
    }, {}),
    [questionRefs]
  );

  if (!displayFiles.length && !Object.values(noWorkingChecked).some(Boolean)) {
    return <ErrorState message="No working files to review yet." onRetry={() => navigate('/student/mathpath/working/upload', { replace: true, state })} />;
  }

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      let workingSessionId = state.workingSessionId;
      if (!workingSessionId) {
        const created = createWorkingSession({
          studentId: state.studentId || 'demo-student',
          practiceSessionId: state.practiceSessionId || null,
          assessmentSessionId: state.assessmentSessionId || null,
          domainId: 'fractions',
          skillIds: [...new Set(questionRefs.map((q) => q.skillId).filter(Boolean))],
          questionIds: questionRefs.map((q) => q.questionId),
          inputMethod: 'paper',
        });
        workingSessionId = created.workingSessionId;
      }

      if (questionRefs.length) {
        createQuestionWorkingMap({
          workingSessionId,
          questionIds: questionRefs.map((q) => q.questionId),
          workingRequiredMap,
        });
      }

      for (const q of questionRefs) {
        if (!noWorkingChecked[q.questionId]) continue;
        markNoWorkingRequired(q.questionId, 'Student marked no working required.', {
          questionFamilyId: q.questionFamilyId,
          systemAllowsNoWorking: Boolean(q.mentalMathEligible || !q.workingRequired),
        });
      }

      submitPaperWorking({
        workingSessionId,
        studentId: state.studentId || 'demo-student',
        fileUrls: displayFiles.map((f, i) => f.previewUrl || `local-page-${i + 1}`),
        pageCount: rawFiles.length || displayFiles.length,
      });

      const prepared = prepareWorkingForAnalysis(workingSessionId);
      navigate('/student/mathpath/working/success', {
        replace: true,
        state: {
          ...state,
          workingSessionId,
          prepared,
          pagesUploaded: rawFiles.length || displayFiles.length,
          requiringWorkingCount,
        },
      });
    } catch (e) {
      setError(e.message || 'Could not submit working.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Review Working Submission" subtitle="Check your pages before final submission." />
      <div className="space-y-4">
        <WorkingUploadCard
          sessionType={sessionType}
          questionCount={questionRefs.length || state.totalQuestions || 0}
          requiringWorkingCount={requiringWorkingCount}
          status="submitted"
        />
        <WorkingReviewCard items={displayFiles} />
        <WorkingSubmissionSummary
          questionRefs={questionRefs}
          noWorkingChecked={noWorkingChecked}
          missingWarning={state.warning || ''}
        />
        {error && <Card className="p-3 text-sm text-error-700">{error}</Card>}
        <Button className="w-full" icon={ArrowRight} disabled={submitting} onClick={submit}>
          {submitting ? 'Submitting…' : 'Submit Working'}
        </Button>
      </div>
    </div>
  );
}
