import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, StatTile, PageHeader, Spinner, ErrorState } from '../../components/ui';

// Greet by time of day so the header feels personal, matching the student app's warmth.
function greetingForHour(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const TODAY_FORMAT = { weekday: 'long', day: 'numeric', month: 'long' };

// Urgency tier from the flagged count so the badge communicates more than a flat "Review".
function urgencyFor(flagged) {
  if (flagged >= 5) return { tone: 'error', label: 'High priority' };
  if (flagged >= 2) return { tone: 'sunshine', label: 'Review soon' };
  return { tone: 'sky', label: 'Check in' };
}

// Teacher home — quick scan of classes + what needs attention today.
export default function TeacherHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setData(null);
    teacherAPI.home().then((r) => setData(r.data)).catch(() => setLoadError(true));
  };
  useEffect(() => { load(); }, []);

  if (loadError) return <ErrorState message="Couldn't load Teacher dashboard." onRetry={load} />;
  if (!data) return <Spinner />;

  const firstName = (user?.name || '').split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());
  const title = firstName ? `${greeting}, ${firstName}` : greeting;
  const todayLabel = new Date().toLocaleDateString(undefined, TODAY_FORMAT);

  // Most urgent first — sort by the flagged count already returned (highest support need on top).
  const attention = [...data.attention].sort((a, b) => (b.flagged || 0) - (a.flagged || 0));

  return (
    <>
      <PageHeader title={title} subtitle={`${todayLabel} · Your classes and what needs attention.`} />
      <Card className="mb-4 p-4 sm:mb-6 sm:p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <StatTile label="Classes" value={data.classCount} />
          <StatTile label="Active interventions" value={data.activeInterventions} />
          <StatTile label="Need attention" value={attention.length} />
        </div>
      </Card>

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Classes needing attention</h3>
      {attention.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-tint text-emerald">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-ink-700">No urgent class needs today.</p>
              <p className="text-sm text-ink-500">Every class is on track — a good moment to review last week&apos;s growth or assign enrichment.</p>
            </div>
          </div>
          <Button to="/teacher/classes" size="s" variant="secondary" icon={ArrowRight} className="shrink-0">Review classes</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {attention.map((c) => {
            const urgency = urgencyFor(c.flagged);
            return (
              <Card key={c.classId} interactive className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink-700">{c.name}</p>
                  <p className="text-sm text-ink-500">{c.flagged} student{c.flagged === 1 ? '' : 's'} {c.flagged === 1 ? 'needs' : 'need'} support</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={urgency.tone}>{urgency.label}</Badge>
                  <Button to={`/teacher/classes/${c.classId}/weak-groups`} size="s" icon={ArrowRight}>Review</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
