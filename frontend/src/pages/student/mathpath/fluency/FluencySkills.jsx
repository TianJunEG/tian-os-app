import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertTriangle } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../../services/api';
import { Card, Badge, PageHeader, Spinner, EmptyState } from '../../../../components/ui';

const TONE = { mastered: 'success', fluent: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };

// MathPath › Fluency › skill selection.
export default function FluencySkills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    skillsAPI.list({ group: 'fluency' })
      .then((r) => setSkills(r.data.skills || []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load skills.'))
      .finally(() => setLoading(false));
  }, []);

  const start = async (skillId) => {
    setBusy(skillId);
    try {
      const { data } = await mathpathAPI.startSession({ feature: 'Fluency Practice', mode: 'fluency', skillId, questionCount: 8 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items, backTo: '/student/mathpath/fluency' } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setBusy(null); }
  };

  if (loading) return <Spinner label="Loading skills…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  return (
    <>
      <PageHeader title="Fluency skills" subtitle="Pick a skill to drill" />
      <div className="space-y-2">
        {skills.length === 0 && <EmptyState icon={AlertTriangle} message="No fluency skills yet. Run npm run seed:fluency." />}
        {skills.map((s) => (
          <Card key={s.skillId} interactive className="flex items-center justify-between p-4" role="button" onClick={() => start(s.skillId)}>
            <div>
              <div className="font-semibold text-ink-700">{s.name}</div>
              <div className="text-xs text-ink-500">{s.topicName}{s.moeLevel ? ` · ${s.moeLevel}` : ''}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={TONE[s.status] || 'neutral'}>{s.statusLabel}</Badge>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-700 text-paper">
                <Zap className="h-4 w-4" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
