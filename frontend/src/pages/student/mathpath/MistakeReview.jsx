import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PartyPopper, Wand2 } from 'lucide-react';
import { mathpathAPI } from '../../../services/api';
import { Card, Button, Badge, PageHeader, Spinner, EmptyState } from '../../../components/ui';
import { MathText } from '../../../components/ui/Fraction';
import RemediationPanel from '../../../components/mathpath/RemediationPanel';
import { getModelDrawingTrainerForMistake } from '../../../mathpath/fractions/fractionMistakeToMasteryEngine';

const TYPE_LABEL = {
  concept_gap: 'Concept gap', calculation_error: 'Calculation', careless: 'Careless',
  method_error: 'Method', unknown: 'To review',
};

// Mistake-to-Mastery: recent mistakes with the worked solution, and a one-tap
// route into targeted practice on the same skill.
export default function MistakeReview() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [openHelp, setOpenHelp] = useState(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await mathpathAPI.mistakes(); setMistakes(data.mistakes || []); }
      finally { setLoading(false); }
    })();
  }, []);

  const practiseSimilar = async (skillId) => {
    if (starting) return;
    setStarting(true);
    try {
      const { data } = await mathpathAPI.startSession({ skillId, questionCount: 5, feature: 'Mistake-to-Mastery' });
      navigate(`/student/mathpath/practice/${data.session_id}`, {
        state: {
          items: data.items,
          resultsBase: '/student/mathpath',
          backTo: '/student/mathpath/mistakes',
          homeBase: '/student/mathpath/mistakes',
          homeLabel: 'Back to mistake review',
          mistakesBase: '/student/mathpath/mistakes',
        },
      });
    } catch (_) { setStarting(false); }
  };

  if (loading) return <Spinner label="Loading mistakes…" />;

  return (
    <>
      <PageHeader title="Mistake to mastery" subtitle="Review recent slips, then practise to fix them." />
      {mistakes.length === 0 ? (
        <EmptyState icon={PartyPopper} message="No mistakes to review right now. Keep practising to stay sharp." />
      ) : (
        <div className="space-y-4">
          {mistakes.map((m) => (
            <Card key={m.id} className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-navy-700">{m.skillName}</span>
                <Badge tone="neutral">{m.mistakeTypeLabel || TYPE_LABEL[m.mistakeType] || 'To review'}</Badge>
              </div>
              <div className="space-y-4">
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-error-700">Mistake</p>
                  <div className="mt-2 text-xl leading-8 text-ink-900"><MathText text={m.questionStem} /></div>
                  <p className="mt-2 rounded-xl bg-error-100 px-3 py-2 text-base font-semibold text-error-700">
                    Your answer: <MathText text={m.studentAnswer || '-'} className="font-mono" />
                  </p>
                </section>
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-success-700">Correct Answer</p>
                  <p className="mt-2 rounded-xl bg-success-100 px-3 py-2 text-base font-semibold text-success-700">
                    <MathText text={m.correctAnswer || '-'} className="font-mono" />
                  </p>
                </section>
                <section>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Why</p>
                  {m.workedSolution ? (
                    <p className="mt-2 text-base leading-7 text-ink-700"><MathText text={m.workedSolution} /></p>
                  ) : (
                    <p className="mt-2 text-base leading-7 text-ink-600">Review the method, then try a similar question with guidance.</p>
                  )}
                </section>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" size="s" icon={ArrowRight} onClick={() => setOpenHelp(openHelp === m.id ? null : m.id)}>
                  {openHelp === m.id ? 'Hide Try Together' : 'Try Together'}
                </Button>
                <Button size="s" onClick={() => practiseSimilar(m.skillId)} disabled={starting}>Try Again</Button>
                {(() => {
                  const modelTrainer = getModelDrawingTrainerForMistake({
                    mistakeCode: m.misconceptionTag,
                    skillId: m.skillId,
                    misconceptionTag: m.misconceptionTag,
                  });
                  return modelTrainer?.href ? (
                    <Button
                      size="s"
                      variant="secondary"
                      icon={Wand2}
                      onClick={() => navigate(modelTrainer.href)}
                    >
                      Open model trainer
                    </Button>
                  ) : null;
                })()}
              </div>
              {openHelp === m.id && (
                <div className="mt-4 rounded-xl border border-hairline bg-navy-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-navy-700">Try Together</p>
                  <RemediationPanel
                    skillId={m.skillId}
                    recentAttempts={[{ correct: false, misconceptionTag: m.misconceptionTag }]}
                    onPractise={() => practiseSimilar(m.skillId)}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
