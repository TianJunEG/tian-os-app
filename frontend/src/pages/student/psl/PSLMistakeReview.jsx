import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Brain } from 'lucide-react';
import { pslAPI } from '../../../services/api';
import { Card, Spinner } from '../../../components/ui';

const TAG_LABELS = {
  'psl/missed-number': { label: 'Missed a number', category: 'Reading', tip: 'Re-read the story and underline every number.' },
  'psl/included-irrelevant': { label: 'Used wrong number', category: 'Reading', tip: 'Not every number in the story is needed. Identify which numbers answer the question.' },
  'psl/confused-question': { label: 'Confused the question', category: 'Understanding', tip: 'Focus on the last sentence — it usually tells you what to find.' },
  'psl/misread-unknown': { label: 'Misread what\'s unknown', category: 'Understanding', tip: 'Identify which quantity is missing before choosing a model.' },
  'psl/wrong-model-type': { label: 'Wrong model type', category: 'Planning', tip: 'Ask: are parts combining into a whole, or are we comparing two things?' },
  'psl/wrong-unknown-position': { label: 'Wrong unknown position', category: 'Planning', tip: 'Draw the model first, then place the "?" where the unknown goes.' },
  'psl/wrong-operation': { label: 'Wrong operation', category: 'Solving', tip: 'The bar model tells you which operation to use: finding a whole = add, finding a part = subtract.' },
  'psl/used-wrong-numbers': { label: 'Used wrong numbers', category: 'Solving', tip: 'Check the numbers in your model match the numbers in the story.' },
  'psl/arithmetic-error': { label: 'Arithmetic error', category: 'Solving', tip: 'Your method was right! Practice the calculation in MathPath.' },
  'psl/skipped-check': { label: 'Skipped checking', category: 'Checking', tip: 'Always ask: does my answer make sense in the story?' },
};

const CATEGORY_ORDER = ['Reading', 'Understanding', 'Planning', 'Solving', 'Checking'];

export default function PSLMistakeReview() {
  const navigate = useNavigate();
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
    const info = TAG_LABELS[tag] || { label: tag.replace('psl/', '').replace(/-/g, ' '), category: 'Other', tip: '' };
    if (!grouped[info.category]) grouped[info.category] = [];
    grouped[info.category].push({ tag, count, ...info });
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
  if (grouped['Other']) sortedCategories.push('Other');

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 sm:p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/student/psl')} className="rounded-lg p-1.5 hover:bg-ink-100">
          <ArrowLeft className="h-5 w-5 text-ink-500" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-ink-800">Mistake Review</h1>
          <p className="text-sm text-ink-500">{mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} to learn from</p>
        </div>
      </div>

      {mistakes.length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="mx-auto h-10 w-10 text-gold-400" />
          <p className="mt-3 text-sm font-medium text-ink-600">No mistakes yet!</p>
          <p className="mt-1 text-xs text-ink-400">Complete some practice sessions to see your learning areas here.</p>
        </Card>
      ) : (
        sortedCategories.map((category) => (
          <div key={category}>
            <h2 className="mb-2 text-sm font-semibold text-ink-500">{category} errors</h2>
            <div className="space-y-2">
              {grouped[category].map(({ tag, count, label, tip }) => (
                <Card key={tag} className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink-700">{label}</p>
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-mono text-ink-500">{count}x</span>
                      </div>
                      {tip && <p className="mt-1 text-xs text-ink-500">{tip}</p>}
                      {tag === 'psl/arithmetic-error' && (
                        <button
                          onClick={() => navigate('/student/mathpath')}
                          className="mt-2 rounded-lg bg-gold-100 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:bg-gold-200"
                        >
                          Practice in MathPath
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
