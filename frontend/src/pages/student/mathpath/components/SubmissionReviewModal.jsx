import React from 'react';
import { Modal, Button } from '../../../../components/ui';
import WorkingEvidenceDecision from '../../../../components/learning/WorkingEvidenceDecision';
import { speak } from '../../../../utils/sound';

export default function SubmissionReviewModal({
  open,
  title = 'Before you submit',
  isLowerPrimary = false,
  reflection,
  reflectionOptions = [],
  onReflectionChange,
  onSelectAndConfirm,
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

  if (isLowerPrimary) {
    return (
      <Modal open={open} onClose={onClose} title={title}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {reflectionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={busy}
                onClick={() => {
                  speak(option.label, { rate: 0.85, gender: 'female' });
                  onSelectAndConfirm?.(option.value);
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-line-soft bg-surface-raised px-4 py-5 text-center transition hover:border-emerald hover:bg-emerald-tint active:scale-95"
              >
                <span className="text-5xl leading-none">{option.emoji}</span>
                <span className="text-base font-bold text-ink-800">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="pt-1 text-center">
            <button type="button" onClick={onClose} className="text-sm text-ink-400 underline">
              ← Change my answer
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {!reflection && (
          <div>
            <h3 className="mb-1 text-base font-semibold text-ink-800">How sure are you?</h3>
            <div className="grid grid-cols-2 gap-2">
              {reflectionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={busy}
                  onClick={() => onReflectionChange?.(option.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${reflection === option.value ? 'border-emerald bg-emerald-tint text-emerald-deep' : 'border-line-soft text-ink-600 hover:bg-surface-raised'}`}
                >
                  {option.emoji && <span className="mr-1">{option.emoji}</span>}{option.label}
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
            <p className="text-xs text-gold-deep">Please make a working choice to submit.</p>
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
