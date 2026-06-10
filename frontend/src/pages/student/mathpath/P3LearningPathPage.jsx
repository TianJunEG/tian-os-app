import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Hash, Plus, X, DollarSign, Ruler, Shapes, BarChart3, BookOpen, Trophy, AlertCircle } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '../../../components/ui';
import { mathpathAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import p3WholeNumbersSkillGraph from '../../../mathpath/primary/p3WholeNumbersSkillGraph';
import p3AddSubSkillGraph from '../../../mathpath/primary/p3AddSubSkillGraph';
import p3MulDivSkillGraph from '../../../mathpath/primary/p3MulDivSkillGraph';
import p3MoneySkillGraph from '../../../mathpath/primary/p3MoneySkillGraph';
import p3MeasTimeSkillGraph from '../../../mathpath/primary/p3MeasTimeSkillGraph';
import p3AreaPerimSkillGraph from '../../../mathpath/primary/p3AreaPerimSkillGraph';
import p3StatSkillGraph from '../../../mathpath/primary/p3StatSkillGraph';
import p3FractionsSkillGraph from '../../../mathpath/primary/p3FractionsSkillGraph';
import p3WordProbSkillGraph from '../../../mathpath/primary/p3WordProbSkillGraph';

// ---------------------------------------------------------------------------
// Domain configuration — order matters (progression sequence)
// ---------------------------------------------------------------------------
const DOMAIN_GROUPS = [
  {
    key: 'wholenumbers',
    label: 'Whole Numbers',
    description: 'Place value to 10 000, ordering, and rounding to the nearest 10 or 100.',
    icon: Hash,
    color: 'violet',
    graph: p3WholeNumbersSkillGraph,
  },
  {
    key: 'addsub',
    label: 'Addition & Subtraction',
    description: 'Addition and subtraction up to 10 000, with and without regrouping, and estimation.',
    icon: Plus,
    color: 'navy',
    graph: p3AddSubSkillGraph,
  },
  {
    key: 'muldiv',
    label: 'Multiplication & Division',
    description: 'Multiplication tables 6–9, multi-digit multiplication, and division with remainder.',
    icon: X,
    color: 'sky',
    graph: p3MulDivSkillGraph,
  },
  {
    key: 'money',
    label: 'Money',
    description: 'Addition and subtraction of dollars and cents, and making change.',
    icon: DollarSign,
    color: 'gold',
    graph: p3MoneySkillGraph,
  },
  {
    key: 'fractions',
    label: 'Fractions',
    description: 'Equivalent fractions and adding/subtracting related fractions with denominators up to 12.',
    icon: Shapes,
    color: 'mint',
    graph: p3FractionsSkillGraph,
  },
  {
    key: 'meastime',
    label: 'Measurement & Time',
    description: 'Length and mass conversions, 24-hour time, and calculating elapsed time.',
    icon: Ruler,
    color: 'sky',
    graph: p3MeasTimeSkillGraph,
  },
  {
    key: 'areaperim',
    label: 'Area & Perimeter',
    description: 'Area of rectangles and perimeter of composite figures.',
    icon: Shapes,
    color: 'violet',
    graph: p3AreaPerimSkillGraph,
  },
  {
    key: 'stat',
    label: 'Statistics',
    description: 'Reading and interpreting bar graphs and data tables.',
    icon: BarChart3,
    color: 'navy',
    graph: p3StatSkillGraph,
  },
  {
    key: 'wordprob',
    label: 'Word Problems',
    description: 'Multi-step word problems and comparison models.',
    icon: BookOpen,
    color: 'gold',
    graph: p3WordProbSkillGraph,
  },
];

// ---------------------------------------------------------------------------
// Domain colour mappings for badges / accents
// ---------------------------------------------------------------------------
const COLOR_MAP = {
  violet: { badge: 'navy', border: 'border-violet-200', bg: 'bg-gradient-to-br from-violet-50 via-white to-violet-50', icon: 'bg-violet-100 text-violet-700' },
  navy: { badge: 'navy', border: 'border-navy-200', bg: 'bg-gradient-to-br from-navy-50 via-white to-sky-50', icon: 'bg-navy-100 text-navy-700' },
  gold: { badge: 'gold', border: 'border-gold-200', bg: 'bg-gradient-to-br from-gold-50 via-white to-yellow-50', icon: 'bg-gold-100 text-gold-700' },
  mint: { badge: 'success', border: 'border-mint-200', bg: 'bg-gradient-to-br from-mint-50 via-white to-sky-50', icon: 'bg-mint-100 text-success-700' },
  sky: { badge: 'navy', border: 'border-sky-200', bg: 'bg-gradient-to-br from-sky-50 via-white to-violet-50', icon: 'bg-sky-100 text-navy-700' },
};

function difficultyLabel(difficulty) {
  if (difficulty <= 1) return 'Foundation';
  if (difficulty <= 2) return 'Developing';
  return 'Extension';
}

function difficultyTone(difficulty) {
  if (difficulty <= 1) return 'success';
  if (difficulty <= 2) return 'navy';
  return 'gold';
}

// ---------------------------------------------------------------------------
// Mastery helpers
// ---------------------------------------------------------------------------
function masteryLabel(status) {
  if (status === 'mastered' || status === 'accurate' || status === 'fluent' || status === 'retained') return 'Mastered';
  if (status === 'learning') return 'Learning';
  if (status === 'needsReview' || status === 'needs_review' || status === 'weak' || status === 'forgotten') return 'Needs Review';
  return null; // not started — don't show badge
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

// ---------------------------------------------------------------------------
// Skill card
// ---------------------------------------------------------------------------
function P3SkillCard({ skill, onStart, skillState }) {
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

// ---------------------------------------------------------------------------
// Domain section
// ---------------------------------------------------------------------------
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
          <P3SkillCard key={skill.id} skill={skill} onStart={onSkillStart} skillState={skillStatesMap[skill.id]} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function P3LearningPathPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [skillStatesMap, setSkillStatesMap] = useState({});

  const totalSkills = useMemo(
    () => DOMAIN_GROUPS.reduce((sum, d) => sum + (d.graph?.skills?.length || 0), 0),
    []
  );

  // Fetch skill mastery states on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await mathpathAPI.getP3SkillStates();
        if (cancelled) return;
        const map = {};
        for (const state of (data.skillStates || [])) {
          map[state.skillId] = state;
        }
        setSkillStatesMap(map);
      } catch (err) {
        // Gracefully degrade — skill cards still work without mastery badges
        console.warn('[P3LearningPath] Could not load skill states:', err.message);
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
        source: 'p3-learning-path',
        backTo: '/student/mathpath/p3',
        homeBase: '/student/mathpath/p3',
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Primary 3 Mathematics"
        subtitle={totalMastered > 0
          ? `${totalMastered}/${totalSkills} skills mastered — ${totalSkills} skills across 9 domains.`
          : `${totalSkills} skills across 9 domains — Singapore MOE P3 syllabus.`}
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">P3 Maths</p>
            <h2 className="font-display text-3xl font-semibold text-ink-900">P3 Maths</h2>
            <p className="mt-1 text-sm text-ink-500">
              Browse all Primary 3 skills and start practising any topic.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              icon={ArrowRight}
              onClick={() => {
                navigate('/student/mathpath/practice/skill-P3-WN-01', {
                  state: {
                    skillId: 'P3-WN-01',
                    questionCount: 6,
                    sessionType: 'practice',
                    source: 'p3-learning-path-hero',
                    backTo: '/student/mathpath/p3',
                    homeBase: '/student/mathpath/p3',
                  },
                });
              }}
            >
              Start with Whole Numbers
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/student/mathpath/practice/skill-P3-DIAGNOSTIC', {
                  state: {
                    skillId: 'P3-DIAGNOSTIC',
                    sessionType: 'diagnostic',
                    source: 'p3-learning-path-diagnostic',
                    backTo: '/student/mathpath/p3',
                    homeBase: '/student/mathpath/p3',
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
