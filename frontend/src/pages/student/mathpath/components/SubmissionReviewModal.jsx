import React from 'react';
import { Modal, Button } from '../../../../components/ui';
import WorkingEvidenceDecision from '../../../../components/learning/WorkingEvidenceDecision';

export default function SubmissionReviewModal({
  open,
  title = 'Before you submit',
  reflection,
  reflectionOptions = [],
  onReflectionChange,
  working,
  workingRequirementLevel = 'MEDIUM',
  onDeclareOnPaper,
  onDeclareNotNeeded,
  onOpenWorking,
  onConfirm,
  onClose,
  confirmLabel = 'Submit answer',
  busy = false,
  canSubmit,
  workingQuestionLabel,
  openWorkingLabel = 'Open working',
}) {
  const hasWorking = Boolean(working?.workingSubmitted || working?.workingOnPaper || working?.workingNotNeeded);
  const confirmEnabled = canSubmit?.() ?? Boolean(reflection && hasWorking);
  const requirement = String(workingRequirementLevel || 'LOW').toUpperCase();
  const showOpenWorking = Boolean(onOpenWorking)
    && !working?.workingSubmitted
    && !working?.workingOnPaper
    && !working?.workingNotNeeded
    && (requirement === 'MEDIUM' || requirement === 'HIGH');

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {!reflection && (
          <div>
            <h3 className="mb-1 text-base font-semibold text-ink-800">How sure are you?</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {reflectionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={busy}
                  onClick={() => onReflectionChange?.(option.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${reflection === option.value ? 'border-navy-500 bg-navy-50 text-navy-800' : 'border-hairline text-ink-600 hover:bg-slate-50'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-1 text-base font-semibold text-ink-800">Show your working</h3>
          <WorkingEvidenceDecision
            working={working}
            requirementLevel={workingRequirementLevel}
            disabled={busy}
            onDeclareOnPaper={onDeclareOnPaper}
            onDeclareNotNeeded={onDeclareNotNeeded}
          />
          {showOpenWorking ? (
            <Button
              className="mt-2"
              variant="secondary"
              disabled={busy}
              onClick={onOpenWorking}
            >
              {openWorkingLabel}
            </Button>
          ) : null}
          {workingQuestionLabel ? (
            <p className="mt-2 text-xs text-ink-500">{workingQuestionLabel}</p>
          ) : null}
        </div>

        <div className="space-y-2 pt-1">
          {!confirmEnabled && !hasWorking ? (
            <p className="text-xs text-gold-700">Please make a working choice to submit.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={busy} onClick={onClose}>Go back</Button>
            <Button disabled={busy || !confirmEnabled} onClick={onConfirm}>
              {busy ? 'Submitting…' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
