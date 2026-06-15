import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Brain } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { resolveStudentVisualMode, isLowerPrimary } from '../../../design-os/studentVisualMode';
import { Card, Spinner } from '../../../components/ui';
import MISCONCEPTIONS, { CATEGORY_ORDER, getMisconception } from './utils/misconceptions';


export default function PSLMistakeReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const playful = isLowerPrimary(resolveStudentVisualMode(user || {}));
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pslAPI.mistakes()
      .then((res) => setMistakes(res.data?.mistakes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;

  const tagCounts = {};
  for (const m of mistakes) {
    const tag = m.misconceptionTag || 'unknown';
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  const grouped = {};
  for (const [tag, count] of Object.entries(tagCounts)) {
    const info = getMisconception(tag);
    if (!grouped[info.category]) grouped[info.category] = [];
    grouped[info.category].push({ tag, count, ...info });
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
  if (grouped['Other']) sortedCategories.push('Other');

  return (
    <div className={`bg-dot-grid min-h-screen pb-10${playful ? ' skin-lower-primary' : ''}`}>
      <div className="mx-auto max-w-[780px] px-6 pt-6 sm:px-10">
        <div className="step-shell">
          <div className="mb-5 flex items-center gap-3">
            <button onClick={() => navigate('/student/psl')} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white">
              <ArrowLeft className="h-5 w-5" style={{ color: '#8a93a3' }} />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#232c39' }}>Mistake Review</h1>
              <p className="text-sm" style={{ color: '#8a93a3' }}>{mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} to learn from</p>
            </div>
          </div>

          {mistakes.length === 0 ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-10 text-center">
              <Brain className="mx-auto h-12 w-12" style={{ color: '#d9892e' }} />
              <p className="mt-4 text-base font-semibold" style={{ color: '#232c39' }}>No mistakes yet!</p>
              <p className="mt-1 text-sm" style={{ color: '#8a93a3' }}>Complete some practice sessions to see your learning areas here.</p>
            </div>
          ) : (
            sortedCategories.map((category) => (
              <div key={category} className="mb-5">
                <h2 className="mono-label mb-3" style={{ color: '#d8694f' }}>{category} errors</h2>
                <div className="space-y-3">
                  {grouped[category].map(({ tag, count, label, tip }) => (
                    <div key={tag} className="rounded-2xl border border-ink-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: '#fbece9' }}>
                          <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#d8694f' }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold" style={{ color: '#232c39' }}>{label}</p>
                            <span className="mono-label rounded-full px-2.5 py-0.5" style={{ background: '#fbece9', color: '#d8694f', fontSize: '11px' }}>{count}x</span>
                          </div>
                          {tip && (
                            <div className="mistake-hint-box mt-3">
                              <p className="text-xs leading-relaxed" style={{ color: '#a8743a' }}>{tip}</p>
                            </div>
                          )}
                          {tag === 'psl/arithmetic-error' && (
                            <button
                              onClick={() => navigate('/student/mathpath')}
                              className="btn-gold-outline mt-3"
                            >
                              Practice in MathPath
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <button
            onClick={() => navigate('/student/psl')}
            className="btn-gold mt-4 w-full"
          >
            Back to Skills
          </button>
        </div>
      </div>
    </div>
  );
}
