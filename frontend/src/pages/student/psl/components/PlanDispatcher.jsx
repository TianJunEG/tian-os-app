import React from 'react';
import ModelSelector from './ModelSelector';
import PlanReverseSteps from './PlanReverseSteps';
import PlanTableSetup from './PlanTableSetup';
import PlanGuessSetup from './PlanGuessSetup';
import PlanListCandidates from './PlanListCandidates';
import PlanEquationSetup from './PlanEquationSetup';

function PlaceholderPlan({ type, response, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Plan step: <strong>{type.replace(/_/g, ' ')}</strong>
      </p>
      <p className="text-xs text-ink-400">This plan type is coming soon.</p>
    </div>
  );
}

export default function PlanDispatcher({ type, response, onChange, scaffoldStep }) {
  const planType = type || scaffoldStep?.type || 'model';

  if (planType === 'model') {
    return (
      <ModelSelector
        modelType={response?.modelType}
        unknownPosition={response?.unknownPosition}
        onSelectModel={(mt) => onChange({ modelType: mt, unknownPosition: undefined })}
        onSelectPosition={(pos) => onChange({ unknownPosition: pos })}
      />
    );
  }

  if (planType === 'reverse_steps') {
    return <PlanReverseSteps scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (planType === 'table_setup') {
    return <PlanTableSetup scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (planType === 'guess_setup') {
    return <PlanGuessSetup scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (planType === 'list_candidates') {
    return <PlanListCandidates scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  if (planType === 'equation_setup') {
    return <PlanEquationSetup scaffoldStep={scaffoldStep} response={response} onChange={onChange} />;
  }

  return <PlaceholderPlan type={planType} response={response} onChange={onChange} />;
}
