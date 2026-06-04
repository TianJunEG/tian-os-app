import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '../../../../components/ui';

function labelForAction(action = '') {
  const labels = {
    continuePractice: 'Continue Practice',
    uploadWorking: 'Upload Working',
    reviewNeeded: 'Review Needed',
    advanceSkill: 'Continue Practice',
    scheduleRetention: 'Continue Practice',
  };
  const key = String(action || '').trim();
  if (!key) return 'Continue Practice';
  return labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase());
}

export default function WorkingUploadSuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const prepared = state.prepared || {};
  const pagesUploaded = state.pagesUploaded || 0;
  const requiringWorkingCount = state.requiringWorkingCount || 0;
  const workingNotNeededCount = state.workingNotNeededCount || 0;
  const nextAction = labelForAction(state.nextRecommendedAction || 'continuePractice');
  const hasUploadedPages = Number(pagesUploaded || 0) > 0;
  const allNoWorkingDeclarations = Boolean(
    state.allNoWorkingDeclarations ||
    (requiringWorkingCount > 0 && workingNotNeededCount >= requiringWorkingCount)
  );

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={hasUploadedPages ? 'Working Uploaded Successfully' : 'No Working Upload Needed'}
        subtitle={hasUploadedPages ? 'Your submission is ready for analysis.' : 'You are ready to continue.'}
      />
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3 text-success-700">
          <CheckCircle2 className="h-6 w-6" />
          <p className="text-base font-semibold">{hasUploadedPages ? 'Ready For Analysis' : 'Ready to continue'}</p>
        </div>

        {!hasUploadedPages && allNoWorkingDeclarations && (
          <p className="mb-4 rounded-xl bg-success-100 px-3 py-2 text-sm text-success-700">
            No working upload needed. You have declared working was not needed for these questions.
          </p>
        )}

        <div className="space-y-2 text-sm text-ink-700">
          <p><span className="font-semibold">Questions Requiring Working:</span> {requiringWorkingCount}</p>
          <p><span className="font-semibold">Pages Uploaded:</span> {pagesUploaded}</p>
          <p><span className="font-semibold">Working Not Needed:</span> {workingNotNeededCount}</p>
          <p><span className="font-semibold">Mapped Questions:</span> {(prepared.mappedQuestions || []).length}</p>
          <p><span className="font-semibold">Missing Working Warnings:</span> {(prepared.missingWorkingQuestions || []).length}</p>
        </div>

        <div className="mt-4">
          <Badge tone="success">Status: {hasUploadedPages ? (prepared.status || 'analysisReady') : 'Ready to continue'}</Badge>
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
