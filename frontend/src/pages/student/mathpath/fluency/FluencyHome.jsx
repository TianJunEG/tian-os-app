import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ListChecks, AlertTriangle, CheckCircle2, Clock3, Target, BookCheck } from 'lucide-react';
import { mathpathAPI, skillsAPI } from '../../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState, CollapsibleSection } from '../../../../components/ui';
import { useAuth } from '../../../../context/AuthContext';
import { getVisualModeStyles, resolveStudentVisualMode } from '../../../../design-os/studentVisualMode';
import FEATURE_FLAGS from '../../../../config/featureFlags';

// MathPath › Fluency — home. Recommended skill, weak fluency skills, quick practice.
// Fluency is a FEATURE of MathPath: it reuses the shared practice/result screens.

// Skill-code prefix → domain slug so review items can deep-link to the right session.
function domainFromSkillId(skillId) {
  if (!skillId) return null;
  if (/^P0\d\d$/.test(skillId)) return 'percentages';
  if (/^R0\d\d$/.test(skillId)) return 'ratio-rate';
  if (/AL0\d\d/.test(skillId)) return 'algebra';
  if (/GE0\d\d/.test(skillId)) return 'geometry';
  if (/VL0\d\d/.test(skillId)) return 'volume';
  return null;
}
const TONE = { mastered: 'success', fluent: 'success', learning: 'gold', needs_review: 'error', not_started: 'neutral' };
const EMPTY_FLUENCY_MESSAGE = 'No fluency practice is available yet. Continue learning to unlock fluency challenges.';
const STATUS_META = {
  fluentSkills: { title: 'Fluent Skills', icon: CheckCircle2, tone: 'success', empty: 'Fluent skills will appear after a few quick sessions.' },
  developingSkills: { title: 'Developing Fluency', icon: Clock3, tone: 'gold', empty: 'Skills building speed and confidence will appear here.' },
  needsPracticeSkills: { title: 'Needs More Practice', icon: Target, tone: 'error', empty: 'Skills that need accuracy first will appear here.' },
};

export default function FluencyHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState(null);
  const [fluency, setFluency] = useState(null);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  if (!FEATURE_FLAGS.fluency) {
    return (
      <EmptyState icon={Zap} message="Fluency practice is not available yet. Continue learning to unlock it.">
        <Button to="/student/mathpath" variant="secondary">Back to MathPath</Button>
      </EmptyState>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const [s, m, f, r] = await Promise.all([
          skillsAPI.list({ group: 'fluency' }),
          mathpathAPI.mastery(),
          mathpathAPI.fluency(),
          mathpathAPI.retention(),
        ]);
        const rows = s.data.skills || [];
        console.info('[fluency-home] inventory', {
          totalFluencySkillsFound: rows.length,
          availableFluencySkills: rows.filter((skill) => Number(skill.availableQuestionCount || 0) > 0).length,
          filteredFluencySkills: rows.length,
        });
        setSkills(rows);
        setMastery(m.data);
        setFluency(f.data);
        setRetention(r.data);
      } catch (e) { setError(e.response?.data?.error || 'Could not load Fluency.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const start = async (skillId) => {
    if (!skillId || starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startFluencySession({ skillId, questionCount: 12 });
      navigate(`/student/mathpath/practice/${data.session_id}`, { state: { items: data.items, backTo: '/student/mathpath/fluency' } });
    } catch (e) { setError(e.response?.data?.error || 'Could not start practice.'); setStarting(false); }
  };

  if (loading) return <Spinner label="Loading Fluency…" />;
  if (error) return <EmptyState icon={AlertTriangle} message={error} />;

  // Recommend the weakest skill you have NOT yet mastered — never a mastered one,
  // even when it happens to be the lowest-scored. Mirrors the `weak` list below.
  const weak = skills.filter((s) => s.status !== 'mastered');
  const statusRows = [
    ...(fluency?.needsPracticeSkills || []),
    ...(fluency?.developingSkills || []),
  ];
  const recommendedRecord = statusRows[0] || null;
  const recommended = recommendedRecord
    ? {
        skillId: recommendedRecord.skillId,
        name: recommendedRecord.skillName,
        topicName: 'Fractions',
        statusLabel: recommendedRecord.fluencyStatus === 'developing' ? 'Developing' : 'Needs practice',
        status: recommendedRecord.fluencyStatus === 'developing' ? 'learning' : 'needs_review',
      }
    : ([...weak].sort((a, b) => a.score - b.score)[0] || null);
  const topWeak = [...weak].sort((a, b) => a.score - b.score).slice(0, 3);
  const grouped = weak.reduce((acc, skill) => {
    const key = skill.topicName || 'Fractions';
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {});

  return (
    <div className={`${visualStyles.page} space-y-6`}>
      <PageHeader title="Fluency Practice" subtitle="MathPath · short, focused sessions for automaticity and retention" />

      <Card className={`p-5 ${visualStyles.heroCard}`}>
        <div className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${visualStyles.accent}`}>Recommended now</div>
        {recommended ? (
          <>
            <div className="font-display text-xl font-semibold text-ink-900">{recommended.name}</div>
            <p className="mb-4 mt-1 text-sm text-ink-600">One skill, 10–20 questions, no countdown pressure.</p>
            <Button className={visualStyles.primaryCta} icon={Zap} disabled={starting} onClick={() => start(recommended.skillId)}>
              {starting ? 'Starting…' : 'Start fluency session'}
            </Button>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-600">{skills.length === 0 ? EMPTY_FLUENCY_MESSAGE : (fluency?.emptyState || 'Every fluency skill is sharp. Come back later to keep them fresh.')}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-label="Fluency status">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const rows = fluency?.[key] || [];
          return (
            <Card key={key} className={`p-4 ${visualStyles.accentCard}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-emerald" />
                  <h3 className="text-sm font-semibold text-ink-800">{meta.title}</h3>
                </div>
                <Badge tone={meta.tone}>{rows.length}</Badge>
              </div>
              {rows.length ? (
                <div className="mt-3 space-y-2">
                  {rows.slice(0, 3).map((row) => (
                    <button
                      key={row.skillId}
                      type="button"
                      onClick={() => start(row.skillId)}
                      className="w-full rounded-lg border border-line-soft bg-white/80 px-3 py-2 text-left"
                    >
                      <div className="text-sm font-semibold text-ink-800">{row.skillName}</div>
                      <div className="mt-0.5 text-xs text-ink-500">
                        {row.averageTimeSeconds ? `${row.averageTimeSeconds}s avg` : 'Timing building'} · {row.interpretation}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-500">{meta.empty}</p>
              )}
            </Card>
          );
        })}
      </div>

      {(!!retention?.overdueReviews?.length || !!retention?.upcomingReviews?.length) && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BookCheck className="h-4 w-4 text-emerald" />
            <h3 className="text-sm font-semibold text-ink-800">Retention Reviews</h3>
            {!!retention?.overdueReviews?.length && <Badge tone="error">{retention.overdueReviews.length} overdue</Badge>}
            {!!retention?.upcomingReviews?.length && <Badge tone="gold">{retention.upcomingReviews.length} upcoming</Badge>}
          </div>
          <div className="mt-3 space-y-2">
            {[...(retention.overdueReviews || []), ...(retention.upcomingReviews || [])].slice(0, 5).map((review) => {
              const domain = domainFromSkillId(review.skillId);
              return (
                <button
                  key={review.skillId}
                  type="button"
                  disabled={!domain}
                  onClick={() => domain && navigate(`/student/mathpath/${domain}/retention?skill=${review.skillId}`)}
                  className={`w-full rounded-lg border border-line-soft bg-white/80 px-3 py-2 text-left ${domain ? 'hover:border-emerald cursor-pointer' : 'opacity-50 cursor-default'}`}
                >
                  <div className="text-sm font-semibold text-ink-800">{review.skillName || review.skillCode || review.skillId}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {review.reviewDate ? `Due ${review.reviewDate}` : 'Ready to review'}
                    {domain && <span className="ml-2 text-emerald-deep">· Start review →</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">Start a focused drill</h3>
      <div className="space-y-2">
        {weak.length === 0 && (
          <Card className={`p-4 text-sm text-ink-500 ${visualStyles.accentCard}`}>
            {skills.length === 0 ? EMPTY_FLUENCY_MESSAGE : (fluency?.emptyState || 'All your fluency skills are sharp. Nice work.')}
          </Card>
        )}
        {topWeak.map((s) => (
          <Card key={s.skillId} interactive className={`flex items-center justify-between p-4 ${visualStyles.accentCard}`} onClick={() => start(s.skillId)} role="button">
            <div>
              <div className="font-semibold text-ink-700">{s.name}</div>
              <div className="text-xs text-ink-500">
                {s.topicName}
                {s.fluency && s.fluency !== '—' && <> · {s.fluency}</>}
                {s.streak > 1 && <> · 🔥 {s.streak} in a row</>}
              </div>
            </div>
            <Badge tone={TONE[s.status] || 'neutral'}>{s.statusLabel}</Badge>
          </Card>
        ))}
      </div>

      {weak.length > topWeak.length && (
        <CollapsibleSection
          title="All fluency skills by topic"
          summary={`${weak.length} skills available for extra practice`}
          surface={false}
          className="mb-6"
        >
          <div className="space-y-3">
            {Object.entries(grouped).map(([topic, rows]) => (
              <CollapsibleSection key={topic} title={topic} summary={`${rows.length} skill${rows.length === 1 ? '' : 's'}`} surface={false}>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <button key={s.skillId} type="button" onClick={() => start(s.skillId)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-line-soft px-3 py-2 text-left">
                      <span className="min-w-0 truncate text-sm font-semibold text-ink-700">{s.name}</span>
                      <Badge tone={TONE[s.status] || 'neutral'}>{s.statusLabel}</Badge>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <Button variant="secondary" icon={ListChecks} to="/student/mathpath/fluency/skills" className="w-full bg-white/80">View all fluency skills</Button>
      {mastery?.recentMistakeCount > 0 && (
        <p className="mt-4 text-center text-xs text-ink-500">
          {mastery.recentMistakeCount} mistakes waiting · <a className="font-semibold text-emerald-deep" href="/student/mathpath/mistakes">review them</a>
        </p>
      )}
    </div>
  );
}
