import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Lock, ArrowRight, Stethoscope, GitFork, BookOpen, HelpCircle, Target, CalendarClock, AlertTriangle } from 'lucide-react';
import { Card, Badge, Button, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../design-os/studentVisualMode';
import { MascotBubble } from '../../../components/MascotAvatar';

const STEP_CONFIG = {
  diagnose: { label: 'Diagnose', icon: Stethoscope, description: 'Identify weak skills and misconceptions.' },
  simplify: { label: 'Simplify', icon: GitFork, description: 'Strengthen prerequisite skills first.' },
  reteach: { label: 'Re-teach', icon: BookOpen, description: 'Concept intro, worked examples, and visual models.' },
  check_understanding: { label: 'Check Understanding', icon: HelpCircle, description: 'Guided practice with scaffolding.' },
  original_complexity: { label: 'Original Complexity', icon: Target, description: 'Independent practice and mastery check.' },
  schedule_review: { label: 'Schedule Review', icon: CalendarClock, description: 'Spaced repetition reviews scheduled.' },
};

function stepTone(status) {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'gold';
  if (status === 'skipped') return 'neutral';
  return 'neutral';
}

function StepIcon({ status }) {
  if (status === 'completed' || status === 'skipped') return <CheckCircle2 className="h-5 w-5 text-success-600" />;
  if (status === 'in_progress') return <Circle className="h-5 w-5 text-gold-500" />;
  return <Lock className="h-4 w-4 text-ink-300" />;
}

function stepAction(step, session) {
  if (step.step === 'diagnose' && step.metadata?.diagnosticSessionId) {
    return { label: 'View Diagnostic', to: `/student/mathpath/diagnostic/results/${step.metadata.diagnosticSessionId}` };
  }
  if ((step.step === 'reteach' || step.step === 'check_understanding' || step.step === 'original_complexity') && session.currentAssignmentId) {
    return { label: 'Continue Recovery Pack', to: `/student/mathpath/assignments/${session.currentAssignmentId}` };
  }
  if (step.step === 'simplify') {
    return { label: 'View Prerequisites', to: null };
  }
  return null;
}

export default function RemediationJourney() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await mathpathAPI.remediationSession(id);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.error || 'Could not load remediation journey.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner label="Loading remediation journey..." />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;
  if (!data) return null;

  const { steps, percentComplete, session } = data;

  return (
    <div className={`mx-auto max-w-3xl space-y-6 ${visualStyles.page}`}>
      <PageHeader
        title="Remediation Journey"
        subtitle={`${session.targetSkillIds.length} skill${session.targetSkillIds.length > 1 ? 's' : ''} targeted`}
      />

      <MascotBubble
        name="talia"
        message={
          percentComplete >= 100
            ? "You've completed the full journey — amazing dedication!"
            : percentComplete >= 50
              ? `${percentComplete}% done — you're making great progress! Keep it up.`
              : "Every step forward counts. Let's work through this together!"
        }
        size="sm"
        className="mb-4"
      />

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${visualStyles.accent}`}>Progress</p>
            <p className="font-display text-2xl font-semibold text-ink-900">{percentComplete}% complete</p>
          </div>
          <Badge tone={session.status === 'completed' ? 'success' : session.status === 'abandoned' ? 'error' : 'gold'}>
            {session.status === 'completed' ? 'Completed' : session.status === 'abandoned' ? 'Abandoned' : 'In Progress'}
          </Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-success-500 transition-all duration-500" style={{ width: `${percentComplete}%` }} />
        </div>
      </Card>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const config = STEP_CONFIG[step.step] || {};
          const Icon = config.icon || Circle;
          const isCurrent = step.step === session.currentStep && session.status === 'active';
          const action = isCurrent ? stepAction(step, session) : null;

          return (
            <Card key={step.step} className={`p-4 ${isCurrent ? 'ring-2 ring-gold-300' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex flex-col items-center">
                  <StepIcon status={step.status} />
                  {i < steps.length - 1 && <div className={`mt-1 h-6 w-px ${step.status === 'completed' || step.status === 'skipped' ? 'bg-success-300' : 'bg-ink-100'}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-ink-400" />
                    <span className="text-sm font-semibold text-ink-800">{config.label}</span>
                    {step.status !== 'not_started' && (
                      <Badge tone={stepTone(step.status)}>
                        {step.status === 'skipped' ? 'Skipped' : step.status === 'completed' ? 'Done' : step.status === 'in_progress' ? 'Current' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">{config.description}</p>

                  {isCurrent && step.step === 'simplify' && session.prerequisites?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {session.prerequisites.map((p) => (
                        <div key={p.skillId} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
                          <span className="font-medium text-ink-700">{p.skillName || p.skillId}</span>
                          <Badge tone={p.status === 'mastered' ? 'success' : p.status === 'skipped' ? 'neutral' : 'gold'}>
                            {p.status === 'mastered' ? 'Mastered' : p.status === 'skipped' ? 'Skipped' : p.status === 'in_progress' ? 'Practising' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {isCurrent && step.metadata?.needsTutorIntervention && (
                    <p className="mt-2 rounded-lg bg-gold-100 px-3 py-2 text-sm font-medium text-gold-800">
                      Maximum attempts reached. A tutor can help you with this skill.
                    </p>
                  )}

                  {action?.to && (
                    <Button size="s" variant="primary" icon={ArrowRight} className="mt-3" onClick={() => navigate(action.to)}>
                      {action.label}
                    </Button>
                  )}

                  {step.status === 'completed' && step.step === 'schedule_review' && session.retentionEntries?.length > 0 && (
                    <div className="mt-2 text-xs text-ink-500">
                      {session.retentionEntries.length} review{session.retentionEntries.length > 1 ? 's' : ''} scheduled
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
