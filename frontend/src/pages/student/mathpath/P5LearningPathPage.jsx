import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Divide,
  Percent,
  Scale,
  Triangle,
  Box,
  BarChart3,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import MasteryStars from '../../../components/mathpath/learning/MasteryStars';
import { BackLink, Badge, Button, Card } from '../../../components/ui';

const DOMAIN_GROUPS = [
  {
    key: 'wholenumbers',
    label: 'Whole Numbers',
    icon: Calculator,
    color: 'blue',
    skills: [
      { id: 'P5-WN-01', name: 'Place Value to Millions' },
      { id: 'P5-WN-02', name: 'Rounding & Estimation' },
      { id: 'P5-WN-03', name: 'Order of Operations' },
    ],
  },
  {
    key: 'fractions',
    label: 'Fractions',
    icon: Divide,
    color: 'purple',
    skills: [
      { id: 'P5-FR-01', name: 'Unlike Fractions +/−' },
      { id: 'P5-FR-02', name: 'Fraction of Whole Number' },
      { id: 'P5-FR-03', name: 'Fraction ×/÷' },
    ],
  },
  {
    key: 'decimals',
    label: 'Decimals',
    icon: Calculator,
    color: 'teal',
    skills: [
      { id: 'P5-DEC-01', name: 'Decimal Place Value & Rounding' },
      { id: 'P5-DEC-02', name: 'Decimal Four Operations' },
      { id: 'P5-DEC-03', name: 'Fraction-Decimal Conversion' },
    ],
    deepLink: '/student/mathpath/decimals',
  },
  {
    key: 'percentage',
    label: 'Percentage',
    icon: Percent,
    color: 'rose',
    skills: [
      { id: 'P5-PCT-01', name: 'Percent ↔ Fraction/Decimal' },
      { id: 'P5-PCT-02', name: 'Percentage of Quantity' },
      { id: 'P5-PCT-03', name: 'Percentage Word Problems' },
    ],
  },
  {
    key: 'ratio',
    label: 'Ratio',
    icon: Scale,
    color: 'amber',
    skills: [
      { id: 'P5-RAT-01', name: 'Ratio Concept & Equivalents' },
      { id: 'P5-RAT-02', name: 'Ratio & Fraction Connection' },
      { id: 'P5-RAT-03', name: 'Ratio Word Problems' },
    ],
  },
  {
    key: 'geometry',
    label: 'Geometry & Angles',
    icon: Triangle,
    color: 'indigo',
    skills: [
      { id: 'P5-GEO-01', name: 'Angles on Line & at Point' },
      { id: 'P5-GEO-02', name: 'Triangle Angle Properties' },
      { id: 'P5-GEO-03', name: 'Parallelogram Properties' },
    ],
  },
  {
    key: 'areavol',
    label: 'Area & Volume',
    icon: Box,
    color: 'emerald',
    skills: [
      { id: 'P5-AV-01', name: 'Area of Triangle' },
      { id: 'P5-AV-02', name: 'Volume of Cube & Cuboid' },
      { id: 'P5-AV-03', name: 'Composite Figures' },
    ],
  },
  {
    key: 'statistics',
    label: 'Statistics',
    icon: BarChart3,
    color: 'cyan',
    skills: [
      { id: 'P5-ST-01', name: 'Average (Mean)' },
      { id: 'P5-ST-02', name: 'Data Interpretation' },
    ],
  },
  {
    key: 'wordprob',
    label: 'Word Problems',
    icon: BookOpen,
    color: 'orange',
    skills: [
      { id: 'P5-WP-01', name: 'Multi-step Problems' },
      { id: 'P5-WP-02', name: 'Before-After Problems' },
      { id: 'P5-WP-03', name: 'Rate & Unit Cost' },
    ],
  },
];

function MasteryBadge({ mastery }) {
  // Stars (1–3) by mastery %, plus a medal once the skill is mastered (>= 90%).
  return <MasteryStars percentage={mastery} showLabel />;
}

export default function P5LearningPathPage() {
  const navigate = useNavigate();
  const [skillStates, setSkillStates] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSkillStates = useCallback(async () => {
    try {
      const res = await mathpathAPI.getP5SkillStates();
      if (res?.data) {
        const stateMap = {};
        (Array.isArray(res.data) ? res.data : []).forEach((s) => { stateMap[s.skillId] = s; });
        setSkillStates(stateMap);
      }
    } catch {
      // Skill states not yet available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSkillStates(); }, [fetchSkillStates]);

  const DOMAIN_PRACTICE_ROUTES = {
    wholenumbers: '/student/mathpath/operations/practice',
    fractions:    '/student/mathpath/practice/recommended-pathway',
    decimals:     '/student/mathpath/decimals/practice',
    percentage:   '/student/mathpath/percentages/practice',
    ratio:        '/student/mathpath/ratio-rate/practice',
    geometry:     '/student/mathpath/geometry/practice',
    areavol:      '/student/mathpath/area-perimeter/practice',
    statistics:   '/student/mathpath/statistics/practice',
    wordprob:     '/student/psl',
  };

  const handleStartPractice = (skillId) => {
    const group = DOMAIN_GROUPS.find((g) => g.skills.some((s) => s.id === skillId));
    const route = (group && DOMAIN_PRACTICE_ROUTES[group.key]) || '/student/mathpath';
    navigate(route);
  };

  const handleDiagnostic = () => {
    navigate('/student/mathpath');
  };

  const totalSkills = DOMAIN_GROUPS.reduce((sum, g) => sum + g.skills.length, 0);
  const masteredCount = Object.values(skillStates).filter((s) => (s.masteryPercentage || 0) >= 90).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <BackLink to="/student/mathpath" className="mb-3">Back to MathPath</BackLink>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
              <Sparkles className="h-6 w-6 text-emerald" />
              Primary 5 Mathematics
            </h1>
            <p className="mt-1 text-body-muted">{totalSkills} skills across {DOMAIN_GROUPS.length} domains — Singapore MOE P5 syllabus</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-2xl font-bold tabular-nums text-emerald">{masteredCount}/{totalSkills}</div>
            <div className="text-xs text-body-muted">skills mastered</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="s" onClick={handleDiagnostic}>Start Diagnostic</Button>
          <Button variant="secondary" size="s" onClick={() => handleStartPractice('P5-WN-01')}>Continue Practice</Button>
        </div>
      </div>

      {/* Domain sections */}
      <div className="space-y-4">
        {DOMAIN_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.key} className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-shell bg-emerald-tint text-emerald">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-semibold text-ink">{group.label}</h2>
                <Badge tone="neutral">{group.skills.length} skills</Badge>
              </div>
              <div className="grid gap-2">
                {group.skills.map((skill) => {
                  const state = skillStates[skill.id];
                  const mastery = state?.masteryPercentage || 0;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => handleStartPractice(skill.id)}
                      className="group flex items-center justify-between rounded-lg border border-transparent bg-surface-raised px-3 py-2.5 text-left transition-all hover:border-line hover:bg-surface-white"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-white text-xs font-medium text-body-muted">
                          {mastery > 0 ? `${Math.round(mastery)}%` : '—'}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-ink">{skill.name}</div>
                          <div className="text-xs text-body-faint">{skill.id}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <MasteryBadge mastery={mastery} />
                        <ChevronRight className="h-4 w-4 text-line-strong transition-colors group-hover:text-body-muted" />
                      </div>
                    </button>
                  );
                })}
              </div>
              {group.deepLink && (
                <button
                  onClick={() => navigate(group.deepLink)}
                  className="mt-2 text-xs font-semibold text-emerald hover:text-emerald-deep"
                >
                  See full {group.label} path →
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
