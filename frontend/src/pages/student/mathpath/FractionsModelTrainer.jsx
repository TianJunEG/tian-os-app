import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Circle, Lock, PencilLine, RotateCcw } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../../../components/ui';
import { isFractionLikeAnswerValue } from './components/FractionAnswerInput';
import AnswerInputRenderer from './components/AnswerInputRenderer';
import FractionExpressionQuestion, { extractFractionExpression } from './components/FractionExpressionQuestion';
import { useAuth } from '../../../context/AuthContext';
import FullScreenWorkingMode from '../../../components/learning/FullScreenWorkingMode';
import { checkFractionAnswer } from '../../../mathpath/fractions/fractionQuestionGenerator';
import FEATURE_FLAGS from '../../../config/featureFlags';

const MODE_META = {
  i_do: { label: 'I Do', helper: 'Watch each model step.' },
  we_do: { label: 'We Do', helper: 'Pause and choose the next step.' },
  you_do: { label: 'You Do', helper: 'Try the model independently.' },
};

export const MODE_ORDER = ['i_do', 'we_do', 'you_do'];

export function getPhaseStatus(phaseKey, currentMode, completedPhases) {
  if (completedPhases.has(phaseKey)) return 'completed';
  if (phaseKey === currentMode) return 'current';
  const currentIdx = MODE_ORDER.indexOf(currentMode);
  const phaseIdx = MODE_ORDER.indexOf(phaseKey);
  if (phaseIdx === currentIdx + 1) return 'next';
  return 'locked';
}

export function getTransitionCTA(mode, isLastStep) {
  if (!isLastStep) return null;
  if (mode === 'i_do') return { label: 'Continue to We Do', nextMode: 'we_do' };
  if (mode === 'we_do') return { label: 'Continue to You Do', nextMode: 'you_do' };
  if (mode === 'you_do') return { label: 'See results', nextMode: null };
  return null;
}

export function extractCueHighlights(questionText = '', step = {}) {
  const cuePhrase = step.questionHighlightPhrase || step.reasoningCue || '';
  if (!cuePhrase || !questionText) return { segments: [{ text: questionText, highlighted: false }], cueExplanation: '' };
  const phrases = Array.isArray(cuePhrase) ? cuePhrase : [cuePhrase];
  const cueExplanation = step.cueExplanation || '';
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = questionText.split(regex);
  const lowerPhrases = new Set(phrases.map((p) => p.toLowerCase()));
  const segments = parts.filter(Boolean).map((part) => ({
    text: part,
    highlighted: lowerPhrases.has(part.toLowerCase()),
  }));
  return { segments, cueExplanation };
}

function HighlightedQuestion({ text, step }) {
  const { segments, cueExplanation } = extractCueHighlights(text, step);
  return (
    <div>
      <p className="text-lg leading-8 text-ink-800">
        {segments.map((seg, i) =>
          seg.highlighted
            ? <mark key={i} className="rounded bg-gold-200 px-0.5 font-semibold text-gold-900">{seg.text}</mark>
            : <span key={i}>{seg.text}</span>
        )}
      </p>
      {cueExplanation && <p className="mt-1 text-sm italic text-ink-500">{cueExplanation}</p>}
    </div>
  );
}

function normalizeAnswer(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function stripTrailingUnit(value) {
  return normalizeAnswer(value).replace(/[a-z]+$/i, '');
}

function splitFinalAnswerUnit(value) {
  const raw = String(value || '').trim();
  if (!raw) return { value: '', unit: '' };

  const spacedUnit = raw.match(/^(.+\d)\s+([a-zA-Z][a-zA-Z.]*)\.?$/);
  if (spacedUnit) return { value: spacedUnit[1].trim(), unit: spacedUnit[2].replace(/\.$/, '') };

  const compactUnit = raw.match(/^(-?\d+(?:\s+\d+\s*\/\s*\d+|\s*\/\s*-?\d+)?)([a-zA-Z]+)$/);
  if (compactUnit) return { value: compactUnit[1].trim(), unit: compactUnit[2] };

  return { value: raw, unit: '' };
}

function isNumericAnswerValue(value) {
  return /^-?\d+(?:\.\d+)?$/.test(String(value || '').trim());
}

function isMathAnswerValue(value) {
  const raw = String(value || '').trim();
  return isFractionLikeAnswerValue(raw) || isNumericAnswerValue(raw);
}

export function buildFinalAnswerQuestion({ expectedAnswer = '', prompt = 'Enter your final answer.' } = {}) {
  const { value } = splitFinalAnswerUnit(expectedAnswer);
  const answerFormat = isFractionLikeAnswerValue(value)
    ? 'mixed_number'
    : isNumericAnswerValue(value)
      ? 'whole_number'
      : 'text';

  return {
    questionId: 'model-trainer-final-answer',
    skillId: 'MODEL-TRAINER',
    prompt,
    answerFormat,
    answer_type: answerFormat,
    answerType: answerFormat,
    allowedInputTools: answerFormat === 'mixed_number'
      ? ['fraction', 'mixed', 'whole', 'clear']
      : answerFormat === 'whole_number'
        ? ['whole', 'clear']
        : undefined,
    answer: {
      type: answerFormat === 'whole_number' ? 'whole' : answerFormat === 'mixed_number' ? 'fraction' : 'text',
      display: value,
      value,
    },
  };
}

function checkFinalAnswer({ answer, expectedAnswer }) {
  const expectedValue = splitFinalAnswerUnit(expectedAnswer).value;
  const answerValue = splitFinalAnswerUnit(answer).value;

  if (isMathAnswerValue(expectedValue) || isMathAnswerValue(answerValue)) {
    return checkFractionAnswer({
      studentAnswer: answerValue,
      correctAnswer: expectedValue,
      acceptedAnswers: [],
    }).correct;
  }

  return normalizeAnswer(answerValue) === normalizeAnswer(expectedValue)
    || normalizeAnswer(answer) === normalizeAnswer(expectedAnswer)
    || normalizeAnswer(answerValue) === stripTrailingUnit(expectedAnswer);
}

function toInteger(value) {
  const n = Number(String(value || '').trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : null;
}

export function checkWeDoAnswer({ answer, expectedAnswer, expectedAction }) {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedExpected = normalizeAnswer(expectedAnswer);

  if (!expectedAction) {
    return {
      ok: normalizedAnswer === normalizedExpected,
      hint: '',
    };
  }

  switch (expectedAction) {
    case 'split_whole_into_denominator_parts':
      return {
        ok: toInteger(answer) === toInteger(expectedAnswer),
        hint: `Split the whole into ${expectedAnswer} equal parts.`,
      };
    case 'shade_or_remove_selected_parts':
      return {
        ok: toInteger(answer) === toInteger(expectedAnswer),
        hint: `Shade/remove exactly ${expectedAnswer} parts.`,
      };
    case 'count_remaining_parts':
      return {
        ok: toInteger(answer) === toInteger(expectedAnswer),
        hint: `Count the remaining parts carefully: ${expectedAnswer}.`,
      };
    case 'select_remaining_region':
      return {
        ok: normalizedAnswer === normalizedExpected,
        hint: 'Type the remaining fraction shown on the diagram.',
      };
    case 'treat_remainder_as_new_amount':
      return {
        ok: normalizedAnswer === normalizedExpected,
        hint: 'The next fraction should be taken from the remainder, not the original whole.',
      };
    case 'subdivide_remaining_region':
      return {
        ok: toInteger(answer) === toInteger(expectedAnswer),
        hint: `Subdivide each remaining part into ${expectedAnswer} pieces to update the denominator correctly.`,
      };
    case 'remove_fraction_of_remainder':
      return {
        ok: toInteger(answer) === toInteger(expectedAnswer),
        hint: `Remove the asked fraction of the remainder: ${expectedAnswer}.`,
      };
    case 'write_final_answer':
      return {
        ok: checkFinalAnswer({ answer, expectedAnswer }),
        hint: 'Write the final amount left.',
      };
    default:
      return { ok: normalizedAnswer === normalizedExpected, hint: '' };
  }
}

export function buildWeDoPromptForStep(step = {}) {
  if (step.student_prompt) return step.student_prompt;
  const finalAnswer = step.model?.finalAnswer || '';
  if (!finalAnswer) return null;
  const lowerWholeLabel = String(step.model?.wholeLabel || '').toLowerCase();
  const question = lowerWholeLabel.includes('l')
    ? 'How much juice is left?'
    : 'What is the final answer?';
  return {
    type: 'text',
    question,
    expected_answer: finalAnswer,
    generated: true,
  };
}

function BarModel({ model = {}, hidePartLabels = false }) {
  const denominator = Math.max(1, Number(model.denominator || 1));
  const removedParts = new Set((model.removedParts || []).map(Number));
  const remainingParts = new Set((model.remainingParts || []).map(Number));
  const selectedRegion = new Set((model.selectedRegion || []).map(Number));
  const subdivide = Math.max(1, Number(model.subdivideRemainingBy || 1));
  const removedSubparts = new Set((model.removedSubparts || []).map(Number));
  const finalSubpartsLeft = new Set((model.finalSubpartsLeft || []).map(Number));
  let runningSubpart = 0;

  return (
    <div className="rounded-2xl border border-line-soft bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-emerald-deep">{model.wholeLabel || '1 whole'}</span>
        {model.remainderLabel && <Badge tone="gold">{model.remainderLabel}</Badge>}
      </div>
      <div className="flex min-h-[88px] overflow-hidden rounded-xl border border-emerald-border">
        {Array.from({ length: denominator }, (_, index) => {
          const part = index + 1;
          const removed = removedParts.has(part);
          const remaining = remainingParts.has(part);
          const selected = selectedRegion.has(part);
          const shouldSubdivide = subdivide > 1 && remaining;
          const partClass = removed
            ? 'bg-danger-tint text-danger-deep opacity-80'
            : selected || (model.highlightRemaining && remaining)
              ? 'bg-gold-100 text-gold-800'
              : remaining
                ? 'bg-blue-50 text-emerald-deep'
                : 'bg-white text-ink-500';
          return (
            <div
              key={part}
              className={`relative flex flex-1 items-stretch justify-center border-r border-emerald-border last:border-r-0 ${partClass}`}
            >
              {shouldSubdivide ? (
                <div className="flex w-full">
                  {Array.from({ length: subdivide }, () => {
                    runningSubpart += 1;
                    const subRemoved = removedSubparts.has(runningSubpart);
                    const subLeft = finalSubpartsLeft.has(runningSubpart);
                    return (
                      <div
                        key={runningSubpart}
                        className={`relative flex flex-1 items-center justify-center border-r border-emerald-border text-xs font-semibold last:border-r-0 ${
                          subRemoved ? 'bg-danger-tint text-danger-deep opacity-80' : subLeft ? 'bg-blue-50 text-emerald-deep' : 'bg-white text-ink-500'
                        }`}
                      >
                        {!hidePartLabels && runningSubpart}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="flex items-center justify-center px-1 text-sm font-semibold">{hidePartLabels ? '' : part}</span>
              )}
            </div>
          );
        })}
      </div>
      {model.equivalence && <p className="mt-3 text-sm font-medium text-emerald-deep">{model.equivalence}</p>}
      {model.finalAnswer && <p className="mt-3 text-base font-semibold text-success-700">Answer: {model.finalAnswer}</p>}
    </div>
  );
}

export function buildRevealedModelForPrompt({ model = {}, expectedAction = '', reveal = true } = {}) {
  if (reveal || !expectedAction) {
    return { model, hidePartLabels: false, hideBranchModel: false };
  }

  const wholeOnly = {
    ...model,
    denominator: 1,
    removedParts: [],
    remainingParts: [1],
    selectedRegion: [],
    subdivideRemainingBy: 1,
    removedSubparts: [],
    finalSubpartsLeft: [],
    equivalence: '',
    finalAnswer: '',
    remainderLabel: '',
    branchModel: null,
  };

  if (expectedAction === 'split_whole_into_denominator_parts') {
    return { model: wholeOnly, hidePartLabels: true, hideBranchModel: true };
  }

  const withoutAnswerDetails = {
    ...model,
    removedParts: Array.isArray(model.removedParts) ? model.removedParts : [],
    remainingParts: Array.isArray(model.remainingParts) && model.remainingParts.length
      ? model.remainingParts
      : Array.from({ length: Math.max(1, Number(model.denominator || 1)) }, (_, index) => index + 1),
    selectedRegion: [],
    highlightRemaining: false,
    remainderLabel: '',
    equivalence: '',
    finalAnswer: '',
    branchModel: null,
  };

  if (expectedAction === 'shade_or_remove_selected_parts') {
    return {
      model: {
        ...withoutAnswerDetails,
        removedParts: [],
        removedSubparts: [],
        finalSubpartsLeft: [],
      },
      hidePartLabels: true,
      hideBranchModel: true,
    };
  }

  if (expectedAction === 'count_remaining_parts' || expectedAction === 'select_remaining_region' || expectedAction === 'treat_remainder_as_new_amount') {
    return {
      model: {
        ...withoutAnswerDetails,
        removedParts: [],
        remainingParts: Array.from({ length: Math.max(1, Number(model.denominator || 1)) }, (_, index) => index + 1),
        removedSubparts: [],
        finalSubpartsLeft: [],
      },
      hidePartLabels: true,
      hideBranchModel: true,
    };
  }

  if (expectedAction === 'subdivide_remaining_region') {
    return {
      model: {
        ...withoutAnswerDetails,
        removedParts: [],
        remainingParts: Array.from({ length: Math.max(1, Number(model.denominator || 1)) }, (_, index) => index + 1),
        subdivideRemainingBy: 1,
        removedSubparts: [],
        finalSubpartsLeft: [],
      },
      hidePartLabels: true,
      hideBranchModel: true,
    };
  }

  if (expectedAction === 'remove_fraction_of_remainder') {
    return {
      model: {
        ...withoutAnswerDetails,
        removedParts: [],
        remainingParts: Array.from({ length: Math.max(1, Number(model.denominator || 1)) }, (_, index) => index + 1),
        removedSubparts: [],
        finalSubpartsLeft: [],
      },
      hidePartLabels: true,
      hideBranchModel: true,
    };
  }

  return {
    model: {
      ...withoutAnswerDetails,
      removedParts: [],
      remainingParts: Array.from({ length: Math.max(1, Number(model.denominator || 1)) }, (_, index) => index + 1),
      removedSubparts: [],
      finalSubpartsLeft: [],
    },
    hidePartLabels: true,
    hideBranchModel: true,
  };
}

export function buildModelRevealStates({ model = {}, expectedAction = '', reveal = true } = {}) {
  const teacherSolutionState = {
    model,
    hidePartLabels: false,
    hideBranchModel: false,
  };
  const studentAttemptState = buildRevealedModelForPrompt({
    model,
    expectedAction,
    reveal: false,
  });

  return {
    teacherSolutionState,
    studentAttemptState,
    activeState: reveal ? teacherSolutionState : studentAttemptState,
  };
}

export function getVisibleWeDoInstruction({ instruction = '', hasPrompt = false, reveal = true } = {}) {
  if (!hasPrompt || reveal) return instruction;
  return 'Answer the prompt first. The completed model step will appear after you check.';
}

export function canRevealModelAnswer({ working = {}, bypass = false } = {}) {
  return Boolean(bypass || working.workingSubmitted || working.workingImage);
}

export function getStep5CompletionState({
  working = {},
  drawingBypassAllowed = false,
  finalAnswer = '',
  modelAnswerRevealed = false,
} = {}) {
  const modelSaved = canRevealModelAnswer({ working, bypass: drawingBypassAllowed });
  const finalAnswerEntered = Boolean(String(finalAnswer || '').trim());
  const canProceed = Boolean(modelSaved && finalAnswerEntered && modelAnswerRevealed);

  return {
    modelSaved,
    finalAnswer: String(finalAnswer || ''),
    finalAnswerEntered,
    modelAnswerRevealed: Boolean(modelAnswerRevealed),
    canProceed,
  };
}

function BranchingModel({ branchModel }) {
  if (!branchModel?.type) return null;
  const first = branchModel.firstBranches || [];
  const second = branchModel.secondBranches || [];
  return (
    <div className="mt-4 rounded-2xl border border-line-soft bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-emerald-deep">Branching method</p>
      <div className="grid gap-3 text-sm">
        <div className="rounded-xl bg-emerald-tint px-3 py-2 font-semibold text-emerald-deep">{branchModel.wholeLabel}</div>
        <div className="grid grid-cols-2 gap-2">
          {first.map((branch) => (
            <div key={`${branch.label}-${branch.value}`} className="rounded-xl border border-line-soft px-3 py-2">
              <p className="text-xs font-semibold uppercase text-ink-500">{branch.label}</p>
              <p className="mt-1 font-mono text-base font-semibold text-ink-900">{branch.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gold-100 px-3 py-2 font-semibold text-gold-800">New amount: {branchModel.remainderLabel}</div>
        <div className="grid grid-cols-2 gap-2">
          {second.map((branch) => (
            <div key={`${branch.label}-${branch.value}`} className="rounded-xl border border-line-soft px-3 py-2">
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
            <h2 className="text-base font-semibold text-emerald-deep">{template.title}</h2>
            <Badge tone="navy">{template.question_type.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="mb-4 flex-1 text-sm leading-6 text-ink-600">{template.prompt}</p>
          <Button size="s" icon={ArrowRight} onClick={() => onOpen(template.template_id)}>Open trainer</Button>
        </Card>
      ))}
    </div>
  );
}

const SAMPLE_TEXT = `Ali ate 2/5 of a cake. What fraction is left?
Sarah used 3/8 of a ribbon. What fraction is left?
A tank is 5/12 full. What fraction is empty?
Ben spent 7/10 of his money. What fraction remains?`;

function PatternTrainerLab() {
  const { user } = useAuth();
  const role = user?.role || '';
  const canTrain = ['admin', 'teacher', 'tutor'].includes(role) || (user?.roles || []).some((r) => ['admin', 'teacher', 'tutor'].includes(r));
  const [sampleText, setSampleText] = useState(SAMPLE_TEXT);
  const [skillId, setSkillId] = useState('F023');
  const [level, setLevel] = useState('P5');
  const [variantCount, setVariantCount] = useState(40);
  const [difficultyMix, setDifficultyMix] = useState({ easy: 10, medium: 10, hard: 10, wordProblem: 5, misconception: 5 });
  const [includeWordProblems, setIncludeWordProblems] = useState(true);
  const [includeMisconceptions, setIncludeMisconceptions] = useState(true);
  const [worksheetCompatible, setWorksheetCompatible] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [generated, setGenerated] = useState([]);
  const [approvedSet, setApprovedSet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (!canTrain) return null;

  const sourceQuestions = sampleText
    .split(/\n+/)
    .map((prompt) => ({ prompt: prompt.trim() }))
    .filter((row) => row.prompt);

  const payload = () => ({
    sourceQuestions,
    skillId,
    subject: 'Math',
    level,
    curriculum: 'MOE_PRIMARY_MATH_2021',
    topic: 'Fractions',
    variantCount: Number(variantCount || 40),
    worksheetCompatible,
    generatedVariantTarget: {
      easy: Number(difficultyMix.easy || 0),
      medium: Number(difficultyMix.medium || 0),
      hard: Number(difficultyMix.hard || 0),
      wordProblem: includeWordProblems ? Number(difficultyMix.wordProblem || 0) : 0,
      misconception: includeMisconceptions ? Number(difficultyMix.misconception || 0) : 0,
    },
  });

  const analyze = async () => {
    setBusy(true);
    setMessage('');
    setApprovedSet(null);
    try {
      const { data } = await mathpathAPI.analyzeQuestionPattern(payload());
      setAnalysis(data);
      setGenerated(data.preview || []);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not analyse the sample questions.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (!analysis?.pattern) return analyze();
    setBusy(true);
    setMessage('');
    setApprovedSet(null);
    try {
      const { data } = await mathpathAPI.generateQuestionPattern({
        pattern: {
          ...analysis.pattern,
          generatedVariantTarget: payload().generatedVariantTarget,
          worksheetCompatible,
        },
      });
      setAnalysis({ pattern: data.pattern, quality: data.quality, preview: data.variants.slice(0, 12) });
      setGenerated(data.variants || []);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not regenerate variants.');
    } finally {
      setBusy(false);
    }
  };

  const updateVariant = (variantId, field, value) => {
    setGenerated((prev) => prev.map((item) => item.variantId === variantId ? { ...item, [field]: value } : item));
  };

  const rejectVariant = (variantId) => {
    setGenerated((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const approve = async () => {
    if (!analysis?.pattern || !generated.length) return;
    setBusy(true);
    setMessage('');
    setApprovedSet(null);
    try {
      const { data } = await mathpathAPI.approveQuestionPattern({
        pattern: analysis.pattern,
        variants: generated,
        title: `${analysis.pattern.subtopic || 'Similar Questions'} Practice`,
      });
      setMessage(`Approved practice set: ${data.practiceSet.practiceSetId}`);
      setApprovedSet(data.practiceSet);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not approve practice set.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card id="similar-question-generator" className="mt-6 scroll-mt-6 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-emerald-deep">Similar Question Generator</h2>
          <p className="mt-1 text-sm text-ink-500">Paste representative questions, extract a reusable pattern, then approve a generated practice bank.</p>
        </div>
        <Badge tone="gold">Teacher/Admin</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,18rem]">
        <textarea
          value={sampleText}
          onChange={(event) => setSampleText(event.target.value)}
          className="min-h-[180px] rounded-xl border border-line-soft px-3 py-2 text-sm"
          placeholder="One sample question per line"
        />
        <div className="grid gap-3">
          <label className="text-sm font-semibold text-ink-700">Target skill
            <input value={skillId} onChange={(event) => setSkillId(event.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 font-mono text-sm" />
          </label>
          <label className="text-sm font-semibold text-ink-700">Level
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm">
              {['P3', 'P4', 'P5', 'P6', 'Sec1 G1'].map((row) => <option key={row}>{row}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-ink-700">Total variants
            <input type="number" min="10" max="80" value={variantCount} onChange={(event) => setVariantCount(event.target.value)} className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm" />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {['easy', 'medium', 'hard', 'wordProblem', 'misconception'].map((key) => (
          <label key={key} className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {key.replace(/([A-Z])/g, ' $1')}
            <input
              type="number"
              min="0"
              value={difficultyMix[key]}
              onChange={(event) => setDifficultyMix((prev) => ({ ...prev, [key]: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-line-soft px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-700">
        <label><input type="checkbox" checked={includeWordProblems} onChange={(e) => setIncludeWordProblems(e.target.checked)} /> Include word problems</label>
        <label><input type="checkbox" checked={includeMisconceptions} onChange={(e) => setIncludeMisconceptions(e.target.checked)} /> Include misconception variants</label>
        <label><input type="checkbox" checked={worksheetCompatible} onChange={(e) => setWorksheetCompatible(e.target.checked)} /> Worksheet compatible</label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={analyze} disabled={busy || sourceQuestions.length === 0}>{busy ? 'Working...' : 'Analyse and Generate'}</Button>
        <Button variant="secondary" onClick={regenerate} disabled={busy}>Regenerate</Button>
        <Button variant="secondary" onClick={approve} disabled={busy || !generated.length}>Approve and Save</Button>
      </div>

      {message && <p className="mt-3 text-sm font-semibold text-emerald-deep">{message}</p>}
      {approvedSet?.practiceSetId && (
        <div className="mt-3">
          <Button as={Link} to={`/student/mathpath/fractions/similar-practice/${approvedSet.practiceSetId}`} variant="secondary">
            Open student practice
          </Button>
        </div>
      )}
      {analysis?.pattern && (
        <div className="mt-5 rounded-xl bg-emerald-tint p-4 text-sm">
          <div className="grid gap-2 md:grid-cols-4">
            <p><span className="font-semibold">Skill:</span> {analysis.pattern.inferredSkillIds?.join(', ')}</p>
            <p><span className="font-semibold">Archetype:</span> {analysis.pattern.archetype}</p>
            <p><span className="font-semibold">Answer check:</span> {analysis.pattern.answerCheckStrategy}</p>
            <p><span className="font-semibold">Accepted:</span> {analysis.quality?.acceptedCount || generated.length}</p>
          </div>
          {(analysis.quality?.warnings || analysis.pattern.qualityWarnings || []).map((warning) => (
            <p key={warning} className="mt-2 text-gold-800">Warning: {warning}</p>
          ))}
        </div>
      )}

      {generated.length > 0 && (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Generated practice bank preview ({generated.length})</h3>
          {generated.slice(0, 20).map((item) => (
            <Card key={item.variantId} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="navy">{item.difficulty}</Badge>
                  <Badge tone="neutral">{item.questionCategory}</Badge>
                  {item.worksheetCompatible && <Badge tone="success">worksheet</Badge>}
                </div>
                <Button size="s" variant="ghost" onClick={() => rejectVariant(item.variantId)}>Reject</Button>
              </div>
              <textarea value={item.prompt} onChange={(e) => updateVariant(item.variantId, 'prompt', e.target.value)} className="mt-2 min-h-[64px] w-full rounded-lg border border-line-soft px-2 py-1 text-sm" />
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input value={item.answer} onChange={(e) => updateVariant(item.variantId, 'answer', e.target.value)} className="rounded-lg border border-line-soft px-2 py-1 text-sm" />
                <input value={item.workedSolution} onChange={(e) => updateVariant(item.variantId, 'workedSolution', e.target.value)} className="rounded-lg border border-line-soft px-2 py-1 text-sm" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
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
  const [weDoHint, setWeDoHint] = useState('');
  const [youDoAnswer, setYouDoAnswer] = useState('');
  const [youDoAnswerFeedback, setYouDoAnswerFeedback] = useState('');
  const [youDoWorking, setYouDoWorking] = useState({});
  const [showYouDoModel, setShowYouDoModel] = useState(false);
  const [fullScreenDrawingOpen, setFullScreenDrawingOpen] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!FEATURE_FLAGS.modelTrainer) {
    return (
      <EmptyState message="Model Trainer is not available for this pilot yet. Continue learning in MathPath.">
        <Button to="/student/mathpath" variant="secondary">Back to MathPath</Button>
      </EmptyState>
    );
  }

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
  const prompt = mode === 'we_do' ? buildWeDoPromptForStep(currentStep || {}) : currentStep?.student_prompt || null;
  const progressValue = Math.min(stepIndex + 1, Math.max(1, steps.length));
  const expectedAnswer = prompt?.expected_answer || '';
  const expectedAction = (currentStep?.expected_actions || [])[0] || (prompt?.generated ? 'write_final_answer' : '');
  const canCheck = Boolean(prompt && studentAnswer.trim());
  const promptAnswerQuestion = prompt?.type === 'choice'
    ? null
    : buildFinalAnswerQuestion({ expectedAnswer, prompt: prompt?.question || 'Enter your final answer.' });
  const isFractionAnswer = Boolean(
    prompt?.type !== 'choice'
    && prompt?.type !== 'number'
    && isFractionLikeAnswerValue(prompt?.expected_answer)
  );
  const expressionQuestion = isFractionAnswer && Boolean(extractFractionExpression(prompt?.question || ''));
  const checkedCorrect = feedback === 'correct';
  const shouldRevealTeacherSolution = mode === 'i_do' || !prompt || checkedCorrect;
  const weDoStepNeedsReflection = Boolean(currentStep?.sense_check && mode === 'we_do');
  const weDoStepComplete = mode !== 'we_do' || !prompt || (checkedCorrect && (!weDoStepNeedsReflection || Boolean(reflectionAnswer)));
  const drawingBypassAllowed = Boolean(template?.allowDrawingBypass || currentStep?.allowDrawingBypass);
  const finalStep = steps[steps.length - 1] || {};
  const finalAnswerParts = splitFinalAnswerUnit(finalStep?.model?.finalAnswer || '');
  const finalAnswerQuestion = buildFinalAnswerQuestion({
    expectedAnswer: finalStep?.model?.finalAnswer || '',
    prompt: 'Enter your final answer.',
  });
  const finalAnswerChecked = !finalAnswerParts.value || youDoAnswerFeedback === 'correct';
  const revealModelAllowed = canRevealModelAnswer({ working: youDoWorking, bypass: drawingBypassAllowed }) && finalAnswerChecked;
  const step5Completion = getStep5CompletionState({
    working: youDoWorking,
    drawingBypassAllowed,
    finalAnswer: youDoAnswer,
    modelAnswerRevealed: showYouDoModel,
  });
  const isLastStep = stepIndex >= steps.length - 1;
  const canProceedFromCurrentStep = mode === 'you_do' ? step5Completion.canProceed : weDoStepComplete;
  const transitionCTA = getTransitionCTA(mode, isLastStep);
  const nextDisabled = mode === 'you_do'
    ? !canProceedFromCurrentStep
    : transitionCTA ? !canProceedFromCurrentStep : (isLastStep || !canProceedFromCurrentStep);
  const modelRevealState = buildModelRevealStates({
    model: currentStep.model || {},
    expectedAction,
    reveal: shouldRevealTeacherSolution,
  }).activeState;
  const visibleInstruction = getVisibleWeDoInstruction({
    instruction: currentStep.instruction,
    hasPrompt: mode === 'we_do' && Boolean(prompt),
    reveal: shouldRevealTeacherSolution,
  });

  const modeHelper = useMemo(() => {
    if (!template) return MODE_META[mode].helper;
    return template.mode_labels?.[mode] || MODE_META[mode].helper;
  }, [mode, template]);

  const resetStepInput = () => {
    setStudentAnswer('');
    setFeedback('');
    setWeDoHint('');
    setShowYouDoModel(false);
    setYouDoWorking({});
    setFullScreenDrawingOpen(false);
    setReflectionAnswer('');
    setYouDoAnswerFeedback('');
  };

  const goToStep = (nextIndex) => {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, nextIndex)));
    resetStepInput();
    if (mode === 'you_do') {
      setShowYouDoModel(false);
    }
  };

  const checkPrompt = () => {
    if (!prompt) return;
    const result = checkWeDoAnswer({ answer: studentAnswer, expectedAnswer, expectedAction });
    setFeedback(result.ok ? 'correct' : 'try_again');
    setWeDoHint(result.ok ? '' : result.hint || '');
  };

  const checkYouDoFinalAnswer = () => {
    if (!finalAnswerParts.value) return;
    setYouDoAnswerFeedback(checkFinalAnswer({
      answer: youDoAnswer,
      expectedAnswer: finalStep?.model?.finalAnswer || '',
    }) ? 'correct' : 'try_again');
  };

  useEffect(() => {
    if (mode !== 'you_do') return;
    console.debug('[FractionsModelTrainer] Step 5 completion', {
      modelSaved: step5Completion.modelSaved,
      finalAnswer: step5Completion.finalAnswer,
      modelAnswerRevealed: step5Completion.modelAnswerRevealed,
      canProceed: step5Completion.canProceed,
    });
  }, [
    mode,
    step5Completion.modelSaved,
    step5Completion.finalAnswer,
    step5Completion.modelAnswerRevealed,
    step5Completion.canProceed,
  ]);

  const transitionToPhase = (nextMode) => {
    setCompletedPhases((prev) => new Set([...prev, mode]));
    setMode(nextMode);
    setStepIndex(0);
    resetStepInput();
    setYouDoAnswer('');
    if (nextMode === 'you_do') setShowYouDoModel(false);
  };

  const handleNext = () => {
    if (isLastStep) {
      const cta = getTransitionCTA(mode, true);
      if (cta?.nextMode) {
        transitionToPhase(cta.nextMode);
        return;
      }
      if (mode === 'you_do' && step5Completion.canProceed) {
        navigate('/student/mathpath');
        return;
      }
    }
    goToStep(stepIndex + 1);
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
        <PatternTrainerLab />
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

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(MODE_META).map(([key, meta]) => {
          const status = getPhaseStatus(key, mode, completedPhases);
          const StatusIcon = status === 'completed' ? CheckCircle : status === 'locked' ? Lock : Circle;
          const isDisabled = status === 'locked';
          return (
            <button
              key={key}
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return;
                setMode(key);
                resetStepInput();
                setYouDoAnswer('');
                if (key === 'you_do') setShowYouDoModel(false);
              }}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                status === 'current' ? 'border-emerald-deep bg-emerald-tint text-emerald-deep'
                  : status === 'completed' ? 'border-success-300 bg-success-50 text-success-700'
                  : status === 'next' ? 'border-line-soft bg-white text-ink-600'
                  : 'border-line-soft bg-surface-raised text-ink-400 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <StatusIcon className="h-4 w-4" />
                {meta.label}
              </span>
              <span className="block text-xs font-medium text-ink-500">{meta.helper}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Badge tone="gold">Step {stepIndex + 1} of {steps.length}</Badge>
            <h2 className="mt-2 text-xl font-semibold text-emerald-deep">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-ink-600">{modeHelper}</p>
          </div>
          <div className="hidden min-w-[180px] md:block">
            <ProgressBar value={progressValue} max={steps.length} />
          </div>
        </div>

        {mode !== 'you_do' ? (
          <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
            <div>
              <div className="mb-4 rounded-xl bg-bone px-4 py-3">
                <HighlightedQuestion text={visibleInstruction} step={currentStep} />
              </div>
              {mode === 'we_do' && prompt && (
              <div className="rounded-xl border border-line-soft bg-white p-4">
                {expressionQuestion ? (
                  <div className="mb-3">
                    <FractionExpressionQuestion
                      prompt={prompt.question}
                      value={studentAnswer}
                      onChange={setStudentAnswer}
                    />
                  </div>
                ) : (
                  <p className="mb-3 text-sm font-semibold text-emerald-deep">{prompt.question}</p>
                )}
                  {prompt.type === 'choice' ? (
                    <div className="grid gap-2">
                      {(prompt.choices || []).map((choice) => (
                        <button
                          key={choice}
                          onClick={() => setStudentAnswer(choice)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm ${studentAnswer === choice ? 'border-emerald-deep bg-emerald-tint' : 'border-line-soft'}`}
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                ) : expressionQuestion ? null : isFractionAnswer || promptAnswerQuestion ? (
                    <AnswerInputRenderer
                      question={promptAnswerQuestion}
                      value={studentAnswer}
                      onChange={setStudentAnswer}
                      onEnter={checkPrompt}
                    />
                  ) : (
                    <input
                      value={studentAnswer}
                      onChange={(event) => setStudentAnswer(event.target.value)}
                      className="w-full rounded-xl border border-line-soft px-3 py-2 font-mono"
                      placeholder="Your answer"
                    />
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="s" disabled={!canCheck} onClick={checkPrompt}>Check</Button>
                    {feedback === 'correct' && <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-700"><Check className="h-4 w-4" /> Correct</span>}
                    {feedback === 'try_again' && (
                      <span className="text-sm font-semibold text-error-700">
                        Try again. {weDoHint || template.remediation_hint}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {currentStep.sense_check && shouldRevealTeacherSolution && (
                <div className="mt-4 rounded-xl border border-gold-200 bg-gold-100/50 p-4">
                  <p className="text-sm font-semibold text-gold-700">Does your answer make sense?</p>
                  <p className="mt-1 text-sm text-ink-700">{currentStep.sense_check}</p>
                  {mode === 'we_do' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setReflectionAnswer(option.toLowerCase())}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                            reflectionAnswer === option.toLowerCase()
                              ? 'border-emerald-deep bg-emerald-tint text-emerald-deep'
                              : 'border-line-soft bg-white text-ink-700 hover:bg-surface-raised'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <BarModel model={modelRevealState.model} hidePartLabels={modelRevealState.hidePartLabels} />
              {!modelRevealState.hideBranchModel && <BranchingModel branchModel={modelRevealState.model?.branchModel} />}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr,1.1fr]">
            <div className="rounded-xl border border-dashed border-navy-300 bg-emerald-tint/50 p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-deep">
                <PencilLine className="h-5 w-5" />
                <h2 className="font-semibold">Draw your model</h2>
              </div>
              <p className="text-sm leading-6 text-ink-600">Use the full-screen drawing space so your bar model has enough room.</p>
              <div className="mt-4 rounded-xl border border-line-soft bg-white p-4">
                {youDoWorking.workingSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-success-700">
                      <Check className="h-4 w-4" />
                      Model saved
                    </div>
                    {youDoWorking.workingImage && (
                      <img
                        src={youDoWorking.workingImage}
                        alt="Saved model drawing preview"
                        className="max-h-44 w-full rounded-lg border border-line-soft bg-white object-contain"
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="s" variant="secondary" onClick={() => setFullScreenDrawingOpen(true)}>View Drawing</Button>
                      <Button size="s" onClick={() => setFullScreenDrawingOpen(true)}>Edit Drawing</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">No model saved yet</p>
                      <p className="mt-1 text-xs text-ink-500">Draw and save your model before revealing the worked answer.</p>
                    </div>
                    <Button size="s" onClick={() => setFullScreenDrawingOpen(true)}>Open Full-Screen Drawing</Button>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-xl border border-line-soft bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-emerald-deep">Enter your final answer.</p>
                <AnswerInputRenderer
                  question={finalAnswerQuestion}
                  value={youDoAnswer}
                  onChange={(nextValue) => {
                    setYouDoAnswer(nextValue);
                    setYouDoAnswerFeedback('');
                  }}
                  onEnter={checkYouDoFinalAnswer}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="s" variant="secondary" disabled={!youDoAnswer.trim() || !finalAnswerParts.value} onClick={checkYouDoFinalAnswer}>
                    Check final answer
                  </Button>
                  {youDoAnswerFeedback === 'correct' && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-700">
                      <Check className="h-4 w-4" />
                      Answer: {finalStep?.model?.finalAnswer || finalAnswerParts.value}
                    </span>
                  )}
                  {youDoAnswerFeedback === 'try_again' && (
                    <span className="text-sm font-semibold text-error-700">Try again. Check the fraction and the unit.</span>
                  )}
                </div>
              </div>
              <Button
	                size="s"
	                variant="secondary"
	                className="mt-3"
	                disabled={!revealModelAllowed}
	                onClick={() => setShowYouDoModel(true)}
	              >
                Reveal model answer
              </Button>
              {!revealModelAllowed && (
                <p className="mt-2 text-xs font-semibold text-ink-500">
                  Save your full-screen drawing and check your final answer before revealing the model answer.
                </p>
              )}
              <div className="mt-4 rounded-xl bg-white p-3 text-sm text-ink-700">
                <p className="font-semibold text-emerald-deep">Sense check</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {(template.sense_check_hints || []).map((hint) => <li key={hint}>{hint}</li>)}
                </ul>
              </div>
            </div>
            <div>
              {showYouDoModel ? (
                <>
                  <BarModel model={steps[steps.length - 1]?.model || {}} />
                  <BranchingModel branchModel={steps[steps.length - 1]?.model?.branchModel} />
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-line-soft bg-white p-4 text-sm text-ink-600">
                  <p className="font-semibold text-emerald-deep">Model answer hidden</p>
                  <p className="mt-1">Reveal your own model first, then tap “Reveal model answer” when you’re ready to compare.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" icon={ArrowLeft} disabled={stepIndex === 0 || mode === 'you_do'} onClick={() => goToStep(stepIndex - 1)}>Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setStepIndex(0); setYouDoAnswer(''); resetStepInput(); }}>Reset</Button>
            <Button icon={ArrowRight} disabled={nextDisabled} onClick={handleNext}>{transitionCTA?.label || 'Next'}</Button>
          </div>
        </div>
      </Card>
      <FullScreenWorkingMode
        open={fullScreenDrawingOpen}
        questionText={template.prompt || currentStep?.instruction || ''}
        questionContent={(
          <div className="space-y-3 text-base">
            <p className="font-semibold text-emerald-deep">{template.title}</p>
            <p>{template.prompt}</p>
            {youDoAnswer && (
              <p className="rounded-lg bg-emerald-tint px-3 py-2 text-sm text-emerald-deep">
                Your note: {youDoAnswer}
              </p>
            )}
          </div>
        )}
        questionSnapshot={{
          questionId: `${template.template_id || templateId}-you-do`,
          skillId: (template.linked_skill_ids || [])[0] || '',
          domainId: 'fractions',
          visualType: 'model_trainer',
        }}
        initialStrokes={youDoWorking.workingStrokes || []}
        initialMathObjects={youDoWorking.workingMathObjects || []}
        onClose={() => setFullScreenDrawingOpen(false)}
        onSave={(payload) => {
          setYouDoWorking(payload);
          setFullScreenDrawingOpen(false);
        }}
      />
    </div>
  );
}
