import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Variable, Box, Trophy, AlertCircle } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import p6AlgebraSkillGraph from '../../../mathpath/primary/p6AlgebraSkillGraph';
import p6AreaVolSkillGraph from '../../../mathpath/primary/p6AreaVolSkillGraph';
import p6CirclesSkillGraph from '../../../mathpath/primary/p6CirclesSkillGraph';
import p6DataAnalysisSkillGraph from '../../../mathpath/primary/p6DataAnalysisSkillGraph';
import p6FractionsSkillGraph from '../../../mathpath/primary/p6FractionsSkillGraph';
import p6GeometrySkillGraph from '../../../mathpath/primary/p6GeometrySkillGraph';
import p6PercentageSkillGraph from '../../../mathpath/primary/p6PercentageSkillGraph';
import p6RatioSkillGraph from '../../../mathpath/primary/p6RatioSkillGraph';
import p6SpeedSkillGraph from '../../../mathpath/primary/p6SpeedSkillGraph';

const DOMAIN_GROUPS = [
  {
    key: 'algebra',
    label: 'Algebra',
    description: 'Forming expressions, solving linear equations, and algebraic word problems.',
    icon: Variable,
    color: 'violet',
    graph: p6AlgebraSkillGraph,
  },
  {
    key: 'areavol',
    label: 'Area & Volume',
    description: 'Composite figures, cuboid volumes, and water displacement problems.',
    icon: Box,
    color: 'navy',
    graph: p6AreaVolSkillGraph,
  },
  {
    key: 'circles',
    label: 'Circles',
    description: 'Circumference, area, and composite circle problems.',
    icon: Trophy,
    color: 'gold',
    graph: p6CirclesSkillGraph,
  },
  {
    key: 'dataanalysis',
    label: 'Statistics',
    description: 'Pie charts, line graphs, mean, and data interpretation.',
    icon: AlertCircle,
    color: 'mint',
    graph: p6DataAnalysisSkillGraph,
  },
  {
    key: 'fractions',
    label: 'Fractions',
    description: 'Fraction operations, mixed numbers, and fraction word problems.',
    icon: Variable,
    color: 'sky',
    graph: p6FractionsSkillGraph,
  },
  {
    key: 'geometry',
    label: 'Geometry',
    description: 'Angles in triangles, quadrilaterals, and unknown angle problems.',
    icon: Box,
    color: 'navy',
    graph: p6GeometrySkillGraph,
  },
  {
    key: 'percentage',
    label: 'Percentage',
    description: 'Percentage increase/decrease, GST, and discount problems.',
    icon: Trophy,
    color: 'gold',
    graph: p6PercentageSkillGraph,
  },
  {
    key: 'ratio',
    label: 'Ratio',
    description: 'Equivalent ratios, ratio word problems, and ratio changes.',
    icon: Variable,
    color: 'mint',
    graph: p6RatioSkillGraph,
  },
  {
    key: 'speed',
    label: 'Speed',
    description: 'Average speed, distance-time graphs, and travel word problems.',
    icon: ArrowRight,
    color: 'sky',
    graph: p6SpeedSkillGraph,
  },
];

const COLOR_MAP = {
  violet: { badge: 'navy', border: 'border-purple-tint', bg: 'bg-gradient-to-br from-violet-50 via-white to-violet-50', icon: 'bg-purple-tint text-purple' },
  navy: { badge: 'navy', border: 'border-emerald-border', bg: 'bg-gradient-to-br from-navy-50 via-white to-sky-50', icon: 'bg-emerald-tint text-emerald-deep' },
  gold: { badge: 'gold', border: 'border-gold-200', bg: 'bg-gradient-to-br from-gold-50 via-white to-yellow-50', icon: 'bg-gold-100 text-gold-700' },
  mint: { badge: 'success', border: 'border-mint-200', bg: 'bg-gradient-to-br from-mint-50 via-white to-sky-50', icon: 'bg-mint-100 text-success-700' },
  sky: { badge: 'navy', border: 'border-sky-200', bg: 'bg-gradient-to-br from-sky-50 via-white to-violet-50', icon: 'bg-sky-100 text-emerald-deep' },
};

function difficultyLabel(difficulty) {
  if (difficulty <= 3) return 'Foundation';
  if (difficulty <= 4) return 'Developing';
  return 'Extension';
}

function difficultyTone(difficulty) {
  if (difficulty <= 3) return 'success';
  if (difficulty <= 4) return 'navy';
  return 'gold';
}

function masteryLabel(status) {
  if (status === 'mastered' || status === 'accurate' || status === 'fluent' || status === 'retained') return 'Mastered';
  if (status === 'learning') return 'Learning';
  if (status === 'needsReview' || status === 'needs_review' || status === 'weak' || status === 'forgotten') return 'Needs Review';
  return null;
}

function masteryTone(status) {
  if (status === 'mastered' || status === 'accurate' || status === 'fluent' || status === 'retained') return 'success';
  if (status === 'learning') return 'navy';
  if (status === 'needsReview' || status === 'needs_review' || status === 'weak' || status === 'forgotten') return 'gold';
  return 'neutral';
}

function masteryIcon(status) {
  if (status === 'mastered' || status === 'accurate' || status === 'fluent' || status === 'retained') return CheckCircle2;
  if (status === 'needsReview' || status === 'needs_review' || status === 'weak' || status === 'forgotten') return AlertCircle;
  return null;
}

function P6SkillCard({ skill, onStart, skillState }) {
  const status = skillState?.status || 'notStarted';
  const label = masteryLabel(status);
  const accuracy = skillState?.accuracy;
  const MasteryIcon = masteryIcon(status);

  return (
    <Card className={`p-4 ${status === 'mastered' ? 'border-success-200 bg-success-50/30' : ''}`}>
      <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
        <p className="text-base font-semibold leading-snug text-ink-800">{skill.name}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={difficultyTone(skill.difficulty)}>{difficultyLabel(skill.difficulty)}</Badge>
          {label && (
            <Badge tone={masteryTone(status)}>
              {MasteryIcon && <MasteryIcon className="mr-1 inline-block h-3 w-3" />}
              {label}
              {accuracy != null ? ` ${accuracy}%` : ''}
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-ink-500">{skill.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="neutral">{skill.id}</Badge>
        {skill.prerequisites?.length > 0 && (
          <Badge tone="neutral">{skill.prerequisites.length} prerequisite{skill.prerequisites.length > 1 ? 's' : ''}</Badge>
        )}
        {skillState?.attemptCount > 0 && (
          <Badge tone="neutral">{skillState.attemptCount} attempts</Badge>
        )}
      </div>
      <div className="mt-4">
        <Button size="s" variant="primary" icon={ArrowRight} onClick={() => onStart(skill)}>
          {status === 'mastered' ? 'Review' : status === 'needsReview' || status === 'weak' ? 'Revise' : 'Practise'}
        </Button>
      </div>
    </Card>
  );
}

function DomainSection({ domain, onSkillStart, skillStatesMap }) {
  const colors = COLOR_MAP[domain.color] || COLOR_MAP.violet;
  const Icon = domain.icon;
  const skills = domain.graph?.skills || [];

  const masteredCount = skills.filter((s) => {
    const st = skillStatesMap[s.id]?.status;
    return st === 'mastered' || st === 'accurate' || st === 'fluent' || st === 'retained';
  }).length;

  return (
    <section>
      <Card className={`mb-3 p-4 ${colors.border} ${colors.bg}`}>
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${colors.icon}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold text-ink-900">{domain.label}</h3>
            <p className="mt-0.5 text-sm text-ink-500">{domain.description}</p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
            <Badge tone={colors.badge}>{skills.length} skills</Badge>
            {masteredCount > 0 && (
              <Badge tone="success">
                <Trophy className="mr-1 inline-block h-3 w-3" />
                {masteredCount}/{skills.length} mastered
              </Badge>
            )}
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {skills.map((skill) => (
          <P6SkillCard key={skill.id} skill={skill} onStart={onSkillStart} skillState={skillStatesMap[skill.id]} />
        ))}
      </div>
    </section>
  );
}

export default function P6LearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [skillStatesMap, setSkillStatesMap] = useState({});

  const totalSkills = useMemo(
    () => DOMAIN_GROUPS.reduce((sum, d) => sum + (d.graph?.skills?.length || 0), 0),
    []
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await mathpathAPI.getP6SkillStates();
        if (cancelled) return;
        const map = {};
        for (const state of (data.skillStates || [])) {
          map[state.skillId] = state;
        }
        setSkillStatesMap(map);
      } catch (err) {
        console.warn('[P6LearningPath] Could not load skill states:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const totalMastered = useMemo(() => {
    return Object.values(skillStatesMap).filter((s) => {
      const st = s.status;
      return st === 'mastered' || st === 'accurate' || st === 'fluent' || st === 'retained';
    }).length;
  }, [skillStatesMap]);

  const handleSkillStart = (skill) => {
    navigate(`/student/mathpath/practice/skill-${skill.id}`, {
      state: {
        skillId: skill.id,
        questionCount: 6,
        sessionType: 'practice',
        source: 'p6-learning-path',
        backTo: '/student/mathpath/p6',
        homeBase: '/student/mathpath/p6',
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Primary 6 Mathematics"
        subtitle={totalMastered > 0
          ? `${totalMastered}/${totalSkills} skills mastered — ${totalSkills} skills across ${DOMAIN_GROUPS.length} domains.`
          : `${totalSkills} skills across ${DOMAIN_GROUPS.length} domains — Singapore MOE P6 syllabus.`}
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-deep">P6 Maths</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">P6 Maths</h2>
            <p className="mt-1 text-sm text-ink-500">
              Browse all Primary 6 skills and start practising any topic.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              icon={ArrowRight}
              onClick={() => {
                navigate('/student/mathpath/practice/skill-P6-ALG-01', {
                  state: {
                    skillId: 'P6-ALG-01',
                    questionCount: 6,
                    sessionType: 'practice',
                    source: 'p6-learning-path-hero',
                    backTo: '/student/mathpath/p6',
                    homeBase: '/student/mathpath/p6',
                  },
                });
              }}
            >
              Start with Algebra
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/student/mathpath/practice/skill-P6-DIAGNOSTIC', {
                  state: {
                    skillId: 'P6-DIAGNOSTIC',
                    sessionType: 'diagnostic',
                    source: 'p6-learning-path-diagnostic',
                    backTo: '/student/mathpath/p6',
                    homeBase: '/student/mathpath/p6',
                  },
                });
              }}
            >
              Quick Diagnostic
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DOMAIN_GROUPS.map((d) => (
            <Badge key={d.key} tone={COLOR_MAP[d.color]?.badge || 'neutral'}>
              {d.label} ({d.graph?.skills?.length || 0})
            </Badge>
          ))}
        </div>
      </Card>

      {DOMAIN_GROUPS.map((domain) => (
        <DomainSection key={domain.key} domain={domain} onSkillStart={handleSkillStart} skillStatesMap={skillStatesMap} />
      ))}
    </div>
  );
}
