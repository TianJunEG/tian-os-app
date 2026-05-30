import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '../../../../components/ui';

export default function WorkingUploadSuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const prepared = state.prepared || {};
  const pagesUploaded = state.pagesUploaded || 0;
  const requiringWorkingCount = state.requiringWorkingCount || 0;
  const nextAction = state.nextRecommendedAction || 'Continue Practice';

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Working Uploaded Successfully" subtitle="Your submission is ready for analysis." />
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3 text-success-700">
          <CheckCircle2 className="h-6 w-6" />
          <p className="text-base font-semibold">Ready For Analysis</p>
        </div>

        <div className="space-y-2 text-sm text-ink-700">
          <p><span className="font-semibold">Questions Requiring Working:</span> {requiringWorkingCount}</p>
          <p><span className="font-semibold">Pages Uploaded:</span> {pagesUploaded}</p>
          <p><span className="font-semibold">Mapped Questions:</span> {(prepared.mappedQuestions || []).length}</p>
          <p><span className="font-semibold">Missing Working Warnings:</span> {(prepared.missingWorkingQuestions || []).length}</p>
        </div>

        <div className="mt-4">
          <Badge tone="success">Status: {prepared.status || 'analysisReady'}</Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => navigate('/student/mathpath', { replace: true })}>
            Continue Practice
          </Button>
          <Button icon={ArrowRight} onClick={() => navigate('/student', { replace: true })}>
            {nextAction}
          </Button>
        </div>
      </Card>
    </div>
  );
}

