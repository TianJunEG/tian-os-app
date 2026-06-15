import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, XCircle, Wand2 } from 'lucide-react';
import { Badge, Button, Card } from '../../ui';
import { MathText } from '../../ui/Fraction';

function FluencyTone({ fluencyFlag }) {
  if (fluencyFlag === 'automatic' || fluencyFlag === 'accurateAndFluent') return <Badge tone="success">Fluent</Badge>;
  if (fluencyFlag === 'accurateButSlow') return <Badge tone="gold">Accurate but slow</Badge>;
  if (fluencyFlag === 'skipped') return <Badge tone="neutral">Skipped</Badge>;
  return <Badge tone="error">Review needed</Badge>;
}

export function QuestionReviewCard({ item, showDebugIds = false }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-800">{item.skillName || 'Skill practice'}</p>
          {item.questionFamilyName && <p className="text-xs text-ink-500">{item.questionFamilyName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {typeof item.difficulty === 'number' && <Badge tone="neutral">Difficulty {item.difficulty}</Badge>}
          {typeof item.marks === 'number' && <Badge tone="navy">{item.marks} mark{item.marks === 1 ? '' : 's'}</Badge>}
        </div>
      </div>
      <div className="mt-3 text-lg text-ink-900">
        <MathText text={item.prompt || 'Question unavailable'} />
      </div>
      {showDebugIds && (
        <p className="mt-3 text-xs text-ink-500">
          {item.skillId || 'skill'} · {item.questionFamilyId || 'family'} · {item.questionId || 'question'}
        </p>
      )}
    </Card>
  );
}

export function AnswerComparisonCard({ item }) {
  const correct = Boolean(item.correct);
  return (
    <Card className="p-4">
      <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${correct ? 'text-success-700' : 'text-error-700'}`}>
        {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {correct ? 'Correct' : 'Incorrect'}
      </div>
      <div className="space-y-1 text-sm">
        <p className="text-ink-600">Your answer: <span className="font-mono text-ink-900"><MathText text={item.studentAnswer || '—'} /></span></p>
        <p className="text-ink-600">Correct answer: <span className="font-mono text-success-700"><MathText text={item.correctAnswer || '—'} /></span></p>
        {typeof item.marksAwarded === 'number' && typeof item.totalMarks === 'number' && (
          <p className="text-ink-600">Marks: <span className="font-semibold text-ink-800">{item.marksAwarded}/{item.totalMarks}</span></p>
        )}
      </div>
    </Card>
  );
}

export function SolutionStepsCard({ solutionSteps = [] }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-800">Solution Steps</p>
      {solutionSteps.length ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-700">
          {solutionSteps.map((step, idx) => <li key={`${idx}-${step}`}>{step}</li>)}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-ink-500">Solution steps are unavailable for this question.</p>
      )}
    </Card>
  );
}

export function FluencyFeedbackCard({ item }) {
  let message = 'Focus on understanding the method before speed.';
  if (item.fluencyFlag === 'automatic' || item.fluencyFlag === 'accurateAndFluent') message = 'You solved this accurately and quickly.';
  else if (item.fluencyFlag === 'accurateButSlow') message = 'You got it correct. More speed practice will help.';
  else if (item.fluencyFlag === 'skipped') message = 'Try this again after reviewing the skill.';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-800">Fluency Feedback</p>
        <FluencyTone fluencyFlag={item.fluencyFlag} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-600">
        <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {item.timeTaken ?? 0}s</span>
        {typeof item.targetSeconds === 'number' && <span>Target: {item.targetSeconds}s</span>}
      </div>
      <p className="mt-2 text-sm text-ink-700">{message}</p>
    </Card>
  );
}

export function MistakeInsightCard({ insight, onModelDrawing }) {
  if (!insight) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold text-ink">Nice one!</p>
        <p className="mt-2 text-sm text-body-soft">You crushed this one — nothing to fix here. Onwards!</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-800">Mistake Insight</p>
      <p className="mt-2 text-sm text-ink-700">{insight.message}</p>
      {insight.recommendedSkill && (
        <p className="mt-1 text-sm text-ink-600">Recommended review: <span className="font-semibold text-ink-800">{insight.recommendedSkill}</span></p>
      )}
      {insight.modelDrawingTrainer?.href && (
        <div className="mt-3">
          <Button size="s" icon={Wand2} variant="secondary" onClick={onModelDrawing}>
            {insight.modelDrawingTrainer.label || 'Open model trainer'}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function WorkingStatusCard({ item }) {
  const required = Boolean(item.workingRequired);
  const uploaded = Boolean(item.workingUploaded);
  const quality = item.workingQualityBand;
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-800">Your working</p>
      {!required && <p className="mt-2 text-sm text-ink-600">No working needed for this one.</p>}
      {required && uploaded && <p className="mt-2 text-sm text-success-700">Nice — your working is saved.</p>}
      {required && !uploaded && <p className="mt-2 text-sm text-ink-600">No working this time. Showing your steps next time helps us help you.</p>}
      {quality && <p className="mt-1 text-sm text-ink-600">Working quality: <span className="font-semibold text-ink-800">{quality}</span></p>}
    </Card>
  );
}

export function NextActionCard({ actionLabel, onPrimary, primaryLabel, onBack }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-800">Recommended Next Action</p>
      <p className="mt-2 text-sm text-ink-700">{actionLabel}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button onClick={onPrimary}>{primaryLabel}</Button>
        <Button variant="secondary" onClick={onBack}>Return to Dashboard</Button>
      </div>
    </Card>
  );
}

export function ReviewFilterBar({ filter, setFilter }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="s" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>All</Button>
      <Button size="s" variant={filter === 'incorrect' ? 'primary' : 'secondary'} onClick={() => setFilter('incorrect')}>Incorrect</Button>
      <Button size="s" variant={filter === 'slow' ? 'primary' : 'secondary'} onClick={() => setFilter('slow')}>Accurate but slow</Button>
      <Button size="s" variant={filter === 'missingWorking' ? 'primary' : 'secondary'} onClick={() => setFilter('missingWorking')}>Missing working</Button>
    </div>
  );
}

export function MissingReviewState() {
  return (
    <Card className="p-6 text-center">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-gold-100 text-gold-800">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm text-ink-700">No reviewable attempts were found for this session.</p>
    </Card>
  );
}
