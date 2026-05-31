import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, PencilLine, RotateCcw } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';

const MODE_META = {
  i_do: { label: 'I Do', helper: 'Watch each model step.' },
  we_do: { label: 'We Do', helper: 'Pause and choose the next step.' },
  you_do: { label: 'You Do', helper: 'Try the model independently.' },
};

function normalizeAnswer(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function BarModel({ model = {} }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removedParts = new Set((model.removedParts || []).map(Number));
  const remainingParts = new Set((model.remainingParts || []).map(Number));
  const selectedRegion = new Set((model.selectedRegion || []).map(Number));
  const subdivide = Math.max(1, Number(model.subdivideRemainingBy || 1));
  const removedSubparts = new Set((model.removedSubparts || []).map(Number));
  const finalSubpartsLeft = new Set((model.finalSubpartsLeft || []).map(Number));
  let runningSubpart = 0;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-navy-700">{model.wholeLabel || '1 whole'}</span>
        {model.remainderLabel && <Badge tone="gold">{model.remainderLabel}</Badge>}
      </div>
      <div className="flex min-h-[88px] overflow-hidden rounded-xl border border-navy-200">
        {Array.from({ length: denominator }, (_, index) => {
          const part = index + 1;
          const removed = removedParts.has(part);
          const remaining = remainingParts.has(part);
          const selected = selectedRegion.has(part);
          const shouldSubdivide = subdivide > 1 && remaining;
          const partClass = removed
            ? 'bg-error-100 text-error-700 line-through'
            : selected || (model.highlightRemaining && remaining)
              ? 'bg-gold-100 text-gold-800'
              : remaining
                ? 'bg-success-100 text-success-700'
                : 'bg-paper text-ink-500';
          return (
            <div key={part} className={`relative flex flex-1 items-stretch justify-center border-r border-navy-200 last:border-r-0 ${partClass}`}>
              {shouldSubdivide ? (
                <div className="flex w-full">
                  {Array.from({ length: subdivide }, () => {
                    runningSubpart += 1;
                    const subRemoved = removedSubparts.has(runningSubpart);
                    const subLeft = finalSubpartsLeft.has(runningSubpart);
                    return (
                      <div
                        key={runningSubpart}
                        className={`flex flex-1 items-center justify-center border-r border-navy-200 text-xs font-semibold last:border-r-0 ${
                          subRemoved ? 'bg-error-100 text-error-700 line-through' : subLeft ? 'bg-success-100 text-success-700' : ''
                        }`}
                      >
                        {runningSubpart}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="flex items-center justify-center px-1 text-sm font-semibold">{part}</span>
              )}
            </div>
          );
        })}
      </div>
      {model.equivalence && <p className="mt-3 text-sm font-medium text-navy-700">{model.equivalence}</p>}
      {model.finalAnswer && <p className="mt-3 text-base font-semibold text-success-700">Answer: {model.finalAnswer}</p>}
    </div>
  );
}

function BranchingModel({ branchModel }) {
  if (!branchModel?.type) return null;
  const first = branchModel.firstBranches || [];
  const second = branchModel.secondBranches || [];
  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-navy-700">Branching method</p>
      <div className="grid gap-3 text-sm">
        <div className="rounded-xl bg-navy-50 px-3 py-2 font-semibold text-navy-700">{branchModel.wholeLabel}</div>
        <div className="grid grid-cols-2 gap-2">
          {first.map((branch) => (
            <div key={`${branch.label}-${branch.value}`} className="rounded-xl border border-hairline px-3 py-2">
              <p className="text-xs font-semibold uppercase text-ink-500">{branch.label}</p>
              <p className="mt-1 font-mono text-base font-semibold text-ink-900">{branch.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gold-100 px-3 py-2 font-semibold text-gold-800">New amount: {branchModel.remainderLabel}</div>
        <div className="grid grid-cols-2 gap-2">
          {second.map((branch) => (
            <div key={`${branch.label}-${branch.value}`} className="rounded-xl border border-hairline px-3 py-2">
              <p className="text-xs font-semibold uppercase text-ink-500">{branch.label}</p>
              <p className="mt-1 font-mono text-base font-semibold text-ink-900">{branch.value}</p>
            </div>
          ))}
        </div>
        {branchModel.finalAnswer && <div className="rounded-xl bg-success-100 px-3 py-2 font-semibold text-success-700">Answer: {branchModel.finalAnswer}</div>}
      </div>
    </div>
  );
}

function TemplatePicker({ templates = [], onOpen }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.template_id} interactive className="flex flex-col p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-navy-700">{template.title}</h2>
            <Badge tone="navy">{template.question_type.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="mb-4 flex-1 text-sm leading-6 text-ink-600">{template.prompt}</p>
          <Button size="s" icon={ArrowRight} onClick={() => onOpen(template.template_id)}>Open trainer</Button>
        </Card>
      ))}
    </div>
  );
}

export default function FractionsModelTrainer() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState(null);
  const [mode, setMode] = useState('i_do');
  const [stepIndex, setStepIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [youDoAnswer, setYouDoAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        if (templateId) {
          const { data } = await mathpathAPI.modelTrainerTemplate(templateId);
          if (!mounted) return;
          setTemplate(data.template);
        } else {
          const { data } = await mathpathAPI.modelTrainerTemplates();
          if (!mounted) return;
          setTemplates(data.templates || []);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load the model trainer.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [templateId]);

  const steps = template?.model_steps || [];
  const currentStep = steps[stepIndex] || null;
  const prompt = currentStep?.student_prompt || null;
  const progressValue = Math.min(stepIndex + 1, Math.max(1, steps.length));
  const expectedAnswer = prompt?.expected_answer || '';
  const canCheck = Boolean(prompt && studentAnswer.trim());
  const checkedCorrect = feedback === 'correct';

  const modeHelper = useMemo(() => {
    if (!template) return MODE_META[mode].helper;
    return template.mode_labels?.[mode] || MODE_META[mode].helper;
  }, [mode, template]);

  const resetStepInput = () => {
    setStudentAnswer('');
    setFeedback('');
  };

  const goToStep = (nextIndex) => {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, nextIndex)));
    resetStepInput();
  };

  const checkPrompt = () => {
    if (!prompt) return;
    setFeedback(normalizeAnswer(studentAnswer) === normalizeAnswer(expectedAnswer) ? 'correct' : 'try_again');
  };

  if (loading) return <Spinner label="Loading model trainer..." />;
  if (error) return <EmptyState message={error}><Button onClick={() => navigate('/student/mathpath')}>Back to MathPath</Button></EmptyState>;

  if (!templateId) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Fractions Model Drawing Trainer"
          subtitle="Build bar models for fraction word problems using I Do, We Do, You Do."
          action={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/student/mathpath')}>MathPath</Button>}
        />
        <TemplatePicker templates={templates} onOpen={(id) => navigate(`/student/mathpath/fractions/model-trainer/${id}`)} />
      </div>
    );
  }

  if (!template || !currentStep) {
    return <EmptyState message="No model trainer template found." />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={template.title}
        subtitle={template.prompt}
        action={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/student/mathpath/fractions/model-trainer')}>All models</Button>}
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {Object.entries(MODE_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => { setMode(key); resetStepInput(); }}
            className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
              mode === key ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-hairline bg-white text-ink-600'
            }`}
          >
            <span className="block">{meta.label}</span>
            <span className="block text-xs font-medium text-ink-500">{meta.helper}</span>
          </button>
        ))}
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="gold">Step {stepIndex + 1} of {steps.length}</Badge>
            <h2 className="mt-2 text-xl font-semibold text-navy-700">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-ink-600">{modeHelper}</p>
          </div>
          <div className="hidden min-w-[180px] md:block">
            <ProgressBar value={progressValue} max={steps.length} />
          </div>
        </div>

        {mode !== 'you_do' ? (
          <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
            <div>
              <p className="mb-4 rounded-xl bg-bone px-4 py-3 text-base leading-7 text-ink-800">{currentStep.instruction}</p>
              {mode === 'we_do' && prompt && (
                <div className="rounded-xl border border-hairline bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-navy-700">{prompt.question}</p>
                  {prompt.type === 'choice' ? (
                    <div className="grid gap-2">
                      {(prompt.choices || []).map((choice) => (
                        <button
                          key={choice}
                          onClick={() => setStudentAnswer(choice)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm ${studentAnswer === choice ? 'border-navy-700 bg-navy-50' : 'border-hairline'}`}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={studentAnswer}
                      onChange={(event) => setStudentAnswer(event.target.value)}
                      className="w-full rounded-xl border border-hairline px-3 py-2 font-mono"
                      placeholder="Your answer"
                    />
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="s" disabled={!canCheck} onClick={checkPrompt}>Check</Button>
                    {feedback === 'correct' && <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-700"><Check className="h-4 w-4" /> Correct</span>}
                    {feedback === 'try_again' && <span className="text-sm font-semibold text-error-700">Try again. {template.remediation_hint}</span>}
                  </div>
                </div>
              )}
              {currentStep.sense_check && (
                <div className="mt-4 rounded-xl border border-gold-200 bg-gold-100/50 p-4">
                  <p className="text-sm font-semibold text-gold-700">Does your answer make sense?</p>
                  <p className="mt-1 text-sm text-ink-700">{currentStep.sense_check}</p>
                </div>
              )}
            </div>
            <div>
              <BarModel model={currentStep.model} />
              <BranchingModel branchModel={currentStep.model?.branchModel} />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
            <div className="rounded-xl border border-dashed border-navy-300 bg-navy-50/50 p-5">
              <div className="mb-3 flex items-center gap-2 text-navy-700">
                <PencilLine className="h-5 w-5" />
                <h2 className="font-semibold">Independent drawing placeholder</h2>
              </div>
              <p className="text-sm leading-6 text-ink-600">Use paper, a tablet stylus, or your exercise book to draw the model before checking the revealed version.</p>
              <textarea
                value={youDoAnswer}
                onChange={(event) => setYouDoAnswer(event.target.value)}
                className="mt-4 min-h-[120px] w-full rounded-xl border border-hairline px-3 py-2 text-sm"
                placeholder="Write your final answer and a short note about your model."
              />
              <div className="mt-4 rounded-xl bg-white p-3 text-sm text-ink-700">
                <p className="font-semibold text-navy-700">Sense check</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {(template.sense_check_hints || []).map((hint) => <li key={hint}>{hint}</li>)}
                </ul>
              </div>
            </div>
            <div>
              <BarModel model={steps[steps.length - 1]?.model || {}} />
              <BranchingModel branchModel={steps[steps.length - 1]?.model?.branchModel} />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" icon={ArrowLeft} disabled={stepIndex === 0 || mode === 'you_do'} onClick={() => goToStep(stepIndex - 1)}>Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setStepIndex(0); resetStepInput(); setYouDoAnswer(''); }}>Reset</Button>
            <Button icon={ArrowRight} disabled={stepIndex >= steps.length - 1 || (mode === 'we_do' && prompt && !checkedCorrect)} onClick={() => goToStep(stepIndex + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
