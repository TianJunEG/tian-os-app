import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader, Card, Button, ErrorState } from '../../../../components/ui';
import WorkingUploadCard from '../../../../components/mathpath/working/WorkingUploadCard';
import WorkingReviewCard from '../../../../components/mathpath/working/WorkingReviewCard';
import WorkingSubmissionSummary from '../../../../components/mathpath/working/WorkingSubmissionSummary';
import { mathpathAPI } from '../../../../services/api';
import { markWorkingExpected } from '../../../../mathpath/working/workingUploadWorkflow';

const WORKING_SUBMISSION_TIMEOUT_MS = 12000;
const WORKING_SUBMISSION_ERROR = 'We could not save your working. Please try again.';

function withSubmissionTimeout(promise, label, timeoutMs = WORKING_SUBMISSION_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function assertWorkingSessionResponse(response, label) {
  const workingSession = response?.data?.workingSession;
  if (!workingSession?.workingSessionId) {
    throw new Error(`${label} did not return a working session.`);
  }
  return workingSession;
}

function assertUploadedMetadata(response, expectedFileCount) {
  const workingSession = assertWorkingSessionResponse(response, 'Working upload');
  const fileMetadata = Array.isArray(workingSession.fileMetadata) ? workingSession.fileMetadata : [];
  const fileUrls = Array.isArray(workingSession.fileUrls) ? workingSession.fileUrls : [];
  if (expectedFileCount > 0 && fileMetadata.length < expectedFileCount && fileUrls.length < expectedFileCount) {
    throw new Error('Working upload completed without saved file metadata.');
  }
  return workingSession;
}

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
  const hasSubmittedWorking = (q) => Boolean(q.workingSubmitted || q.workingUploaded || q.fullscreenWorkingSubmitted);
  const hasNoWorkingDeclaration = (q) => Boolean(noWorkingChecked[q.questionId] || q.workingNotNeeded);
  const missingWorkingCount = questionRefs.filter((q) => q.workingRequired && !hasNoWorkingDeclaration(q) && !hasSubmittedWorking(q)).length;
  const workingSubmittedCount = questionRefs.filter(hasSubmittedWorking).length;
  const workingNotNeededCount = questionRefs.filter(hasNoWorkingDeclaration).length;
  const allNoWorkingDeclarations = questionRefs.length > 0 && workingNotNeededCount === questionRefs.length && workingSubmittedCount === 0;
  const hasExistingWorkingDecision = questionRefs.some((q) => hasNoWorkingDeclaration(q) || hasSubmittedWorking(q));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const workingRequiredMap = useMemo(
    () => questionRefs.reduce((acc, q) => {
      acc[q.questionId] = markWorkingExpected(q.questionId, q.questionFamilyId);
      return acc;
    }, {}),
    [questionRefs]
  );

  if (!displayFiles.length && !Object.values(noWorkingChecked).some(Boolean) && !hasExistingWorkingDecision) {
    return <ErrorState message="No working files to review yet." onRetry={() => navigate('/student/mathpath/working/upload', { replace: true, state })} />;
  }

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (!rawFiles.length && missingWorkingCount > 0) {
        setError('Please upload working or mark working not needed for each required question before continuing.');
        return;
      }

      if (!rawFiles.length && missingWorkingCount === 0) {
        navigate('/student/mathpath', {
          replace: true,
          state: {
            workingStatus: 'ready_to_continue',
            workingSummary: {
              questionsShown: questionRefs.length,
              workingSubmitted: workingSubmittedCount,
              workingNotNeeded: workingNotNeededCount,
              missingWorking: 0,
              allNoWorkingDeclarations,
            },
          },
        });
        return;
      }

      let apiSession = null;
      let workingSessionId = state.workingSessionId || '';
      if (!workingSessionId) {
        const created = await withSubmissionTimeout(mathpathAPI.createWorkingSession({
          studentId: state.studentId || 'demo-student',
          practiceSessionId: state.practiceSessionId || null,
          assessmentSessionId: state.assessmentSessionId || null,
          domainId: 'fractions',
          skillIds: [...new Set(questionRefs.map((q) => q.skillId).filter(Boolean))],
          questionRefs: questionRefs.map((q) => ({
            questionId: q.questionId,
            skillId: q.skillId || '',
            questionFamilyId: q.questionFamilyId || '',
            workingRequired: Boolean(q.workingRequired),
            workingReason: q.workingRequired ? 'required_from_session' : 'optional_from_session',
          })),
          inputMethod: 'paper',
        }), 'Create working session');
        apiSession = assertWorkingSessionResponse(created, 'Create working session');
        workingSessionId = apiSession.workingSessionId;
      }

      for (const q of questionRefs) {
        if (!noWorkingChecked[q.questionId]) continue;
        const updated = await withSubmissionTimeout(mathpathAPI.markNoWorking(workingSessionId, {
          questionId: q.questionId,
          reason: 'student_declared_no_working',
        }), 'Mark no working needed');
        apiSession = assertWorkingSessionResponse(updated, 'Mark no working needed');
      }

      let uploaded = null;
      if (rawFiles.length) {
        const formData = new FormData();
        rawFiles.forEach((file) => formData.append('working', file));
        formData.append('sessionType', sessionType);
        formData.append('submittedFrom', 'student_working_upload');
        uploaded = await withSubmissionTimeout(mathpathAPI.uploadWorking(workingSessionId, formData), 'Upload working');
        apiSession = assertUploadedMetadata(uploaded, rawFiles.length);
      }

      const prepared = {
        status: apiSession?.analysisStatus || (rawFiles.length ? 'pending_analysis' : 'mapped'),
        mappedQuestions: apiSession?.questionWorkingMap || [],
        missingWorkingQuestions: (apiSession?.questionWorkingMap || []).filter((q) => q.workingRequired && !q.noWorkingRequiredChecked && !rawFiles.length),
        analysisEvidence: apiSession?.analysisEvidence || [],
        persisted: true,
      };

      navigate('/student/mathpath/working/success', {
        replace: true,
        state: {
          ...state,
          workingSessionId,
          prepared,
          pagesUploaded: rawFiles.length || displayFiles.length,
          requiringWorkingCount,
          workingNotNeededCount,
          allNoWorkingDeclarations,
        },
      });
    } catch (e) {
      console.error('Working submission failed', e);
      setError(WORKING_SUBMISSION_ERROR);
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
          pagesUploaded={rawFiles.length || displayFiles.length}
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
