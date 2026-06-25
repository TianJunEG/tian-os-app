import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../../components/ui';
import { getUniversalSkillByFrameworkId } from '../../../mathpath/curriculum';
import { mathpathAPI } from '../../../services/api';

const STUDENT_SKILL_LABELS = {
  F001: 'Recognising fractions',
  F002: 'Understanding numerator and denominator',
  F003: 'Finding fractions of a whole',
  F004: 'Understanding unit fractions',
  F005: 'Placing fractions on a number line',
  F006: 'Comparing unit fractions',
  F007: 'Comparing fractions with the same denominator',
  F008: 'Comparing fractions with the same numerator',
  F009: 'Ordering fractions',
  F010: 'Understanding equivalent fractions',
  F011: 'Making equivalent fractions',
  F012: 'Simplifying fractions',
  F013: 'Understanding improper fractions',
  F014: 'Understanding mixed numbers',
  F015: 'Changing mixed numbers and improper fractions',
  F016: 'Adding fractions with the same denominator',
  F017: 'Subtracting fractions with the same denominator',
  F018: 'Adding fractions with different denominators',
  F019: 'Subtracting fractions with different denominators',
  F020: 'Finding a fraction of a quantity',
  F021: 'Multiplying fractions',
  F022: 'Dividing fractions',
};

const DOMAIN_EMOJI = {
  fractions: '🍕',
  decimals: '🔢',
  percentage: '📊',
  four_operations: '➕',
  operations: '➕',
  algebra: '🔣',
  geometry: '📐',
  measurement: '📏',
  area_perimeter: '📐',
  ratio: '⚖️',
  statistics: '📈',
  volume: '📦',
  circles: '⭕',
  money: '💰',
  time: '🕐',
  number_sense: '🔢',
};

function domainEmoji(title = '', skillIds = []) {
  const t = title.toLowerCase();
  for (const [key, emoji] of Object.entries(DOMAIN_EMOJI)) {
    if (t.includes(key.replace('_', ' ')) || t.includes(key)) return emoji;
  }
  if (skillIds[0]?.startsWith('F')) return '🍕';
  if (skillIds[0]?.startsWith('OP')) return '➕';
  return '📚';
}

function sourceReason(assignment) {
  // The API field is `sourceType` (e.g. 'diagnostic', 'paper_analysis'); fall
  // back to a legacy `source` value if present.
  const src = String(assignment.sourceType || assignment.source || '').toLowerCase();
  if (src === 'paper_analysis' || src === 'paper_review') return 'From paper review';
  if (src === 'diagnostic') return 'From check-in';
  if (assignment.description?.toLowerCase().includes('weak')) return 'Weak skills identified';
  return 'Assigned practice';
}

function studentSkillLabel(skillId = '') {
  const normalized = String(skillId || '').toUpperCase();
  if (!/^F\d{3}$/.test(normalized)) return 'Practice';
  return STUDENT_SKILL_LABELS[normalized]
    || getUniversalSkillByFrameworkId(normalized)?.title
    || 'Fractions practice';
}

function StatusChip({ status, recheckReady }) {
  if (recheckReady) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> Ready to recheck
    </span>
  );
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
  if (status === 'in_progress') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
      <Clock className="h-3 w-3" /> In progress
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
      <BookOpen className="h-3 w-3" /> New
    </span>
  );
}

function CircleProgress({ percent }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (percent / 100);
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" className="shrink-0" aria-label={`${percent}% complete`}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={percent >= 100 ? '#10b981' : '#6d28d9'}
        strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x={36} y={40} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1f2937">
        {percent}%
      </text>
    </svg>
  );
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
    navigate(`/student/mathpath/recovery-pack/${assignment.id}`);
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
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Recovery Packs"
        subtitle="Targeted practice to strengthen your weak skills."
      />
      {message && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {message}
        </div>
      )}
      {!items.length ? (
        <EmptyState message="No Recovery Packs yet. Complete a diagnostic or paper review to unlock targeted practice." />
      ) : (
        <div className="space-y-4">
          {items.map((assignment) => {
            const completion = assignment.completion || {};
            const attempted = Number(completion.questionsAttempted || 0);
            const target = Number(assignment.targetQuestionCount || completion.questionsAssigned || 0);
            const recheckReady = Boolean(assignment.recheck?.recommended);
            const percent = target ? Math.max(0, Math.min(100, Math.round((attempted / target) * 100))) : 0;
            const accuracy = Number(completion.accuracy || 0);
            const skillIds = assignment.skillIds || [];
            const emoji = domainEmoji(assignment.title || '', skillIds);
            const reason = sourceReason(assignment);

            return (
              <Card key={assignment.id} className="overflow-hidden p-0">
                {/* Colored top stripe */}
                <div className={`h-1.5 w-full ${recheckReady ? 'bg-emerald-400' : assignment.status === 'completed' ? 'bg-sky-400' : 'bg-violet-500'}`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    {/* Domain icon */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-3xl shadow-sm">
                      {emoji}
                    </div>

                    {/* Title + status */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip status={assignment.status} recheckReady={recheckReady} />
                        <span className="text-xs text-ink-400">{reason}</span>
                      </div>
                      <h2 className="mt-1 font-display text-lg font-bold leading-snug text-ink-900">
                        {assignment.title || 'Recovery Pack'}
                      </h2>
                    </div>

                    {/* Circle progress */}
                    <CircleProgress percent={percent} />
                  </div>

                  {/* Skill chips */}
                  {skillIds.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {skillIds.slice(0, 4).map((id) => (
                        <span
                          key={id}
                          className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                        >
                          {studentSkillLabel(id)}
                        </span>
                      ))}
                      {skillIds.length > 4 && (
                        <span className="inline-block rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-500">
                          +{skillIds.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 rounded-xl bg-surface-white px-4 py-2.5 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-ink-900">{attempted}<span className="text-ink-400">/{target || '—'}</span></p>
                      <p className="text-xs text-ink-500">Questions</p>
                    </div>
                    <div className="h-8 w-px bg-line-soft" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-ink-900">{accuracy}<span className="text-xs font-normal text-ink-400">%</span></p>
                      <p className="text-xs text-ink-500">Accuracy</p>
                    </div>
                    {recheckReady && (
                      <>
                        <div className="h-8 w-px bg-line-soft" />
                        <p className="text-sm font-semibold text-emerald-600">✓ You're ready for recheck!</p>
                      </>
                    )}
                    {!recheckReady && target > 0 && attempted < target && (
                      <>
                        <div className="h-8 w-px bg-line-soft" />
                        <p className="text-xs text-ink-500">{target - attempted} questions to unlock recheck</p>
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    {recheckReady || assignment.status === 'completed' ? (
                      <Button icon={RefreshCw} className="w-full" onClick={() => runRecheck(assignment)}>
                        {recheckReady ? 'Run Recheck' : 'Check Recheck Readiness'}
                      </Button>
                    ) : (
                      <Button icon={ArrowRight} className="w-full" onClick={() => startPractice(assignment)}>
                        {assignment.status === 'in_progress' ? 'Continue Recovery Pack' : 'Start Recovery Pack'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
