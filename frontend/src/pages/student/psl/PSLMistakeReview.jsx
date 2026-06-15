import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import MISCONCEPTIONS, { CATEGORY_ORDER, getMisconception } from './utils/misconceptions';
import { useAuth } from '../../../context/AuthContext';
import { resolveStudentVisualMode, getVisualModeStyles } from '../../../design-os/studentVisualMode';

export default function PSLMistakeReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const visualStyles = getVisualModeStyles(resolveStudentVisualMode(user || {}));
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    pslAPI.mistakes()
      .then((res) => setMistakes(res.data?.mistakes || []))
      .catch((e) => console.warn("PSLMistakeReview: fetch failed", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-dot-grid min-h-screen">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#dde1e8] border-t-[#d9892e]" />
          <p className="text-sm font-medium" style={{ color: '#6b7585' }}>Loading mistakes…</p>
        </div>
      </div>
    );
  }

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

  const totalCategories = sortedCategories.length;

  return (
    <div className={`bg-dot-grid min-h-screen pb-8 ${visualStyles.page}`}>
      <div className="mx-auto max-w-[1180px] px-3 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="step-shell">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <button
              onClick={() => navigate('/student/psl')}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
              style={{ border: '1px solid #dde1e8', background: '#fff' }}
            >
              <ArrowLeft className="h-4 w-4" style={{ color: '#5a6675' }} />
            </button>
            <div>
              <h1 className="text-lg font-bold sm:text-xl" style={{ color: '#232c39' }}>Mistake Review</h1>
              <p className="text-sm" style={{ color: '#6b7585' }}>
                {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} to learn from
              </p>
            </div>
          </div>

          {mistakes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#fbf1e1' }}>
                <Brain className="h-8 w-8" style={{ color: '#d9892e' }} />
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: '#232c39' }}>No mistakes yet!</p>
                <p className="mt-1 text-sm" style={{ color: '#6b7585' }}>
                  Complete some practice sessions to see your learning areas here.
                </p>
              </div>
              <button onClick={() => navigate('/student/psl')} className="btn-gold mt-2">
                Start Practising
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: '#dde1e8', background: '#f5f6f8' }}>
                  <p className="font-mono text-xl font-bold" style={{ color: '#232c39' }}>{mistakes.length}</p>
                  <p className="text-[11px] font-medium" style={{ color: '#8a93a3' }}>Total mistakes</p>
                </div>
                <div className="rounded-xl border p-3 text-center" style={{ borderColor: '#dde1e8', background: '#f5f6f8' }}>
                  <p className="font-mono text-xl font-bold" style={{ color: '#232c39' }}>{totalCategories}</p>
                  <p className="text-[11px] font-medium" style={{ color: '#8a93a3' }}>Categories</p>
                </div>
                <div className="col-span-2 rounded-xl border p-3 text-center sm:col-span-1" style={{ borderColor: '#dde1e8', background: '#f5f6f8' }}>
                  <p className="font-mono text-xl font-bold" style={{ color: '#232c39' }}>{Object.keys(tagCounts).length}</p>
                  <p className="text-[11px] font-medium" style={{ color: '#8a93a3' }}>Unique types</p>
                </div>
              </div>

              {/* Category groups */}
              {sortedCategories.map((category) => {
                const isOpen = expanded[category] !== false;
                const items = grouped[category];
                return (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [category]: !isOpen }))}
                      className="mb-2 flex w-full items-center gap-2 text-left"
                    >
                      {isOpen
                        ? <ChevronDown className="h-4 w-4" style={{ color: '#8a93a3' }} />
                        : <ChevronRight className="h-4 w-4" style={{ color: '#8a93a3' }} />}
                      <span className="mono-label" style={{ color: '#5a6675' }}>{category} errors</span>
                      <span className="mono-label" style={{ color: '#8a93a3' }}>
                        {items.reduce((s, i) => s + i.count, 0)}x
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-2 pl-6">
                        {items.map(({ tag, count, label, tip }) => (
                          <div
                            key={tag}
                            className="mistake-hint-box flex items-start gap-3"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#d9892e' }} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold" style={{ color: '#232c39' }}>{label}</p>
                                <span className="mono-label shrink-0" style={{ color: '#b06f1f' }}>{count}x</span>
                              </div>
                              {tip && <p className="mt-1 text-xs" style={{ color: '#5a6675' }}>{tip}</p>}
                              {tag === 'psl/arithmetic-error' && (
                                <button
                                  onClick={() => navigate('/student/mathpath')}
                                  className="btn-gold-outline mt-2 !h-9 !px-3 !text-xs"
                                >
                                  Practice in MathPath
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* CTA */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <button onClick={() => navigate('/student/psl')} className="btn-gold-outline w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Skills
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
