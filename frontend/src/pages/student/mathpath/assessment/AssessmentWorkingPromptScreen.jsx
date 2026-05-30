import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Button, ErrorState, PageHeader } from '../../../../components/ui';

export default function AssessmentWorkingPromptScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session;
  const scored = location.state?.scored;
  const report = location.state?.report;
  const reviewItems = location.state?.reviewItems || [];
  const questionRefs = location.state?.questionRefs || [];

  if (!session || !scored) {
    return <ErrorState message="No submitted assessment found." onRetry={() => navigate('/student/mathpath/assessment')} />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Upload Working" subtitle="Please upload your working sheets for this assessment." />
      <Card className="p-5">
        <p className="text-sm text-ink-700">
          Upload your pages so MathPath can better understand your thinking. This helps improve recommendations.
        </p>
        <div className="mt-4 space-y-2 text-sm text-ink-600">
          <p><span className="font-semibold">Questions requiring working:</span> {questionRefs.filter((q) => q.workingRequired).length}</p>
          <p><span className="font-semibold">Missing working warnings:</span> {scored.workingSummary?.missingWorking || 0}</p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/student/mathpath/assessment/results/${session.assessmentSessionId}`, {
                replace: true,
                state: {
                  session,
                  scored,
                  report,
                  reviewItems,
                  workingUploadStatus: 'pending',
                },
              })
            }
          >
            Skip for now
          </Button>
          <Button
            icon={ArrowRight}
            onClick={() =>
              navigate('/student/mathpath/working/upload?source=assessment', {
                state: {
                  sessionType: 'assessment',
                  studentId: session.studentId,
                  assessmentSessionId: session.assessmentSessionId,
                  totalQuestions: questionRefs.length,
                  questionRefs,
                  nextRecommendedAction: 'Review Results',
                },
              })
            }
          >
            Upload Working
          </Button>
        </div>
      </Card>
    </div>
  );
}
