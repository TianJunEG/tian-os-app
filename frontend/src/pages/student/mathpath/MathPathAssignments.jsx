import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';

function statusText(status = '') {
  return String(status || 'assigned').replace(/_/g, ' ');
}

export default function MathPathAssignments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    mathpathAPI.mathPathAssignments()
      .then((res) => {
        if (mounted) setItems(res.data.assignments || []);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.error || 'Could not load Recovery Packs.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const startPractice = (assignment) => {
    const skillId = assignment.skillIds?.[0] || '';
    navigate('/student/mathpath/practice/new', {
      state: {
        assignmentId: assignment.id,
        skillId,
        weakSkillIds: assignment.skillIds || [],
        questionCount: assignment.targetQuestionCount || 12,
        sessionType: 'practice',
      },
    });
  };

  const runRecheck = async (assignment) => {
    setMessage('');
    try {
      const { data } = await mathpathAPI.createAssignmentRecheck(assignment.id);
      if (data.diagnosticSessionId) {
        navigate(`/student/mathpath/diagnostic/session/${data.diagnosticSessionId}`);
        return;
      }
      setMessage(data.message || 'Recheck is not ready yet.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Complete more of the Recovery Pack before recheck.');
    }
  };

  if (loading) return <Spinner label="Loading Recovery Packs..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Recovery Packs"
        subtitle="Targeted MathPath practice assigned from diagnostics or paper reviews."
      />
      {message && <Card className="mb-4 p-3 text-sm font-semibold text-ink-700">{message}</Card>}
      {!items.length ? (
        <EmptyState message="No Recovery Packs yet. Complete a diagnostic or paper review to unlock targeted practice." />
      ) : (
        <div className="space-y-3">
          {items.map((assignment) => {
            const completion = assignment.completion || {};
            const attempted = Number(completion.questionsAttempted || 0);
            const target = Number(assignment.targetQuestionCount || completion.questionsAssigned || 0);
            const recheckReady = Boolean(assignment.recheck?.recommended);
            return (
              <Card key={assignment.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{statusText(assignment.status)}</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-navy-700">{assignment.title || 'Fractions Recovery Pack'}</h2>
                    <p className="mt-1 text-sm text-ink-600">{assignment.description || 'Targeted practice for weak skills.'}</p>
                    <p className="mt-2 text-sm text-ink-600">Skills: {(assignment.skillIds || []).join(', ') || 'Fractions'}</p>
                  </div>
                  <div className="rounded-xl bg-paper px-3 py-2 text-sm text-ink-700">
                    <p>{attempted}/{target || '-'} questions</p>
                    <p>{Number(completion.accuracy || 0)}% accuracy</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recheckReady ? (
                    <Button icon={RefreshCw} onClick={() => runRecheck(assignment)}>Run Recheck</Button>
                  ) : (
                    <Button icon={ArrowRight} onClick={() => startPractice(assignment)}>
                      {assignment.status === 'in_progress' ? 'Continue Practice' : 'Start Practice'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
