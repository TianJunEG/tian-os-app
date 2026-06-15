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
  Star,
  Zap,
  Trophy,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { mathpathAPI } from '../../../services/api';

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

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', icon: 'text-purple-500' },
  teal: { bg: 'bg-emerald-tint', border: 'border-teal-200', text: 'text-emerald-deep', badge: 'bg-emerald-tint text-teal-800', icon: 'text-teal-500' },
  rose: { bg: 'bg-danger-tint', border: 'border-danger-border', text: 'text-danger-deep', badge: 'bg-danger-tint text-rose-800', icon: 'text-rose-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', icon: 'text-amber-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800', icon: 'text-indigo-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', icon: 'text-emerald-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800', icon: 'text-cyan-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', icon: 'text-orange-500' },
};

function MasteryBadge({ mastery }) {
  if (!mastery || mastery < 50) return null;
  if (mastery >= 90) return <span className="flex items-center gap-0.5 text-xs font-medium text-yellow-600"><Trophy className="w-3 h-3" /> Mastered</span>;
  if (mastery >= 70) return <span className="flex items-center gap-0.5 text-xs font-medium text-blue-600"><Star className="w-3 h-3" /> Proficient</span>;
  return <span className="flex items-center gap-0.5 text-xs font-medium text-gray-500"><Zap className="w-3 h-3" /> In Progress</span>;
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

  const handleStartPractice = (skillId) => {
    navigate(`/student/mathpath/practice?level=P5&skillId=${skillId}`);
  };

  const handleDiagnostic = () => {
    navigate('/student/mathpath/practice?level=P5&mode=diagnostic');
  };

  const totalSkills = DOMAIN_GROUPS.reduce((sum, g) => sum + g.skills.length, 0);
  const masteredCount = Object.values(skillStates).filter((s) => (s.masteryPercentage || 0) >= 90).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/mathpath')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to MathPath
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-500" />
                Primary 5 Mathematics
              </h1>
              <p className="text-gray-500 mt-1">{totalSkills} skills across {DOMAIN_GROUPS.length} domains — Singapore MOE P5 syllabus</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{masteredCount}/{totalSkills}</div>
              <div className="text-xs text-gray-500">skills mastered</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDiagnostic}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Diagnostic
            </button>
            <button
              onClick={() => handleStartPractice('P5-WN-01')}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue Practice
            </button>
          </div>
        </div>

        {/* Domain sections */}
        <div className="space-y-4">
          {DOMAIN_GROUPS.map((group) => {
            const colors = COLOR_MAP[group.color];
            const Icon = group.icon;
            return (
              <div key={group.key} className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <h2 className={`font-semibold ${colors.text}`}>{group.label}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>{group.skills.length} skills</span>
                </div>
                <div className="grid gap-2">
                  {group.skills.map((skill) => {
                    const state = skillStates[skill.id];
                    const mastery = state?.masteryPercentage || 0;
                    return (
                      <button
                        key={skill.id}
                        onClick={() => handleStartPractice(skill.id)}
                        className="flex items-center justify-between bg-white/70 hover:bg-white rounded-lg px-3 py-2.5 border border-transparent hover:border-gray-200 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                            {mastery > 0 ? `${Math.round(mastery)}%` : '—'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{skill.name}</div>
                            <div className="text-xs text-gray-400">{skill.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <MasteryBadge mastery={mastery} />
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {group.deepLink && (
                  <button
                    onClick={() => navigate(group.deepLink)}
                    className="mt-2 text-xs font-semibold text-emerald-deep hover:text-teal-900"
                  >
                    See full {group.label} path →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
