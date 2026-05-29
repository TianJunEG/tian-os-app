import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, ClipboardList, AlertTriangle, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mathpathAPI, assignmentsAPI } from '../../services/api';
import { SECTIONS } from '../../config/modules';
import { Card, Button, ModuleCard, StatTile, ProgressBar, PageHeader, EmptyState, StatusBadge, Alert, Spinner } from '../../components/ui';

// Student dashboard. Today's Learning surfaces the single recommended next
// action from the mastery engine; numbers come from MathPath once practised.
export default function StudentDashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];
  const [mastery, setMastery] = useState(null);
  const [masteryError, setMasteryError] = useState(false);
  const [masteryLoading, setMasteryLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    mathpathAPI.mastery()
      .then((r) => setMastery(r.data))
      .catch(() => setMasteryError(true))
      .finally(() => setMasteryLoading(false));

    assignmentsAPI.list()
      .then((r) => setPending((r.data.assignments || []).filter((a) => a.status !== 'completed')))
      .catch(() => setAssignmentsError(true))
      .finally(() => setAssignmentsLoading(false));
  }, []);

  const masteryData = mastery || { records: [], weakSkills: [], recommended: null, recentMistakeCount: 0 };
  const records = masteryData.records || [];
  const mastered = records.filter((r) => r.status === 'mastered').length;
  const needsReview = (masteryData.weakSkills || []).filter((w) => w.status === 'needs_review').length;
  const total = Math.max(records.length, 1);
  const recommended = masteryData.recommended;
  const weak = masteryData.weakSkills?.[0];

  return (
    <>
      <PageHeader title={`Hi, ${firstName}`} subtitle="Here's your learning today." />

      {/* Today's Learning — next best action */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gold-700">
              <Sparkles className="h-3.5 w-3.5" /> Today's learning
            </div>
            <h2 className="font-display text-xl font-semibold text-navy-700">
              {recommended ? recommended.skillName : 'Start your recommended practice'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {recommended ? `${recommended.topicName} · MathPath` : 'MathPath will pick the next best skill once you begin.'}
            </p>
          </div>
          <Button to="/student/mathpath" size="l" icon={ArrowRight} className="shrink-0">Open MathPath</Button>
        </div>
      </Card>

      {masteryError && (
        <Alert tone="error" className="mb-4">Unable to load your progress metrics right now. Your dashboard remains available while we refresh.</Alert>
      )}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-6">
          <StatTile label="Mastered" value={mastered} />
          <StatTile label="To review" value={needsReview} />
          <StatTile label="Skills seen" value={records.length} />
        </div>
        <ProgressBar value={mastered} max={total} />
        {masteryLoading ? (
          <p className="mt-3 text-sm text-ink-500">Loading progress…</p>
        ) : records.length === 0 ? (
          <p className="mt-3 text-xs text-ink-300">Your progress appears here after your first practice session.</p>
        ) : null}
      </Card>

      {/* Weak-topic alert */}
      {weak && (
        <Card className="mb-6 border-l-4 border-l-error-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" />
            <div>
              <p className="text-sm font-semibold text-ink-700">Worth a look</p>
              <p className="text-sm text-ink-500">{weak.skillName} in {weak.topicName} could use practice.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mistakes to review */}
      {mastery?.recentMistakeCount > 0 && (
        <Card interactive className="mb-6 flex items-center justify-between gap-3 p-4" role="button">
          <Link to="/student/mathpath/mistakes" className="flex flex-1 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700"><Wrench className="h-5 w-5" /></span>
            <span>
              <span className="block font-semibold text-ink-700">{mastery.recentMistakeCount} mistake{mastery.recentMistakeCount > 1 ? 's' : ''} to review</span>
              <span className="block text-sm text-ink-500">Turn recent slips into mastery.</span>
            </span>
          </Link>
          <Button size="s" to="/student/mathpath/mistakes">Review</Button>
        </Card>
      )}

      {/* Assignments */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Assigned to you</h3>
        {pending.length > 0 && <Link to="/student/assignments" className="text-sm font-semibold text-navy-700">See all →</Link>}
      </div>
      <div className="mb-8">
        {assignmentsLoading ? (
          <Spinner label="Loading assignments…" />
        ) : assignmentsError ? (
          <Alert tone="error">Unable to load assignments right now. Please try again in a moment.</Alert>
        ) : pending.length === 0 ? (
          <EmptyState icon={ClipboardList} message="No assignments yet. When a parent or teacher assigns practice, it shows up here." />
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 3).map((a) => (
              <Card key={a.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-700">{a.skillNames?.join(', ') || a.module}</p>
                  <p className="text-sm text-ink-500">{a.questionCount} questions</p>
                </div>
                <Button size="s" to="/student/assignments">Start</Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Module grid — grouped by section (core, then Secondary) */}
      {SECTIONS.filter((s) => s.modules.length > 0).map((section) => (
        <div key={section.key} className="mb-8 last:mb-0">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">
            {section.label || 'Your modules'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.modules.map((m) => <ModuleCard key={m.key} module={m} />)}
          </div>
        </div>
      ))}
    </>
  );
}
