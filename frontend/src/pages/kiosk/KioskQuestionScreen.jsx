import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MathText } from '../../components/ui/Fraction';
import QuestionDiagram, { canRenderQuestionDiagram } from '../student/mathpath/components/QuestionDiagram';
import { kioskAPI, clearAttempt, getAttemptToken } from '../../services/kioskApi';

const CONFIDENCE = [
  { value: 'i_know_this', label: "I know it", emoji: '😀' },
  { value: 'not_sure', label: 'Not sure', emoji: '🤔' },
  { value: 'i_dont_know', label: "Don't know", emoji: '🤷' },
];

export default function KioskQuestionScreen() {
  const { code, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const studentName = location.state?.studentName || '';
  const [question, setQuestion] = useState(location.state?.currentQuestion || location.state?.questions?.[0] || null);
  const [progress, setProgress] = useState(location.state?.progress || null);
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now());

  // If the page is refreshed mid-attempt we lose the in-memory question (the kiosk
  // has no per-question rehydrate endpoint in P1). Send them back to the name list.
  const lostState = !question && !getAttemptToken();

  useEffect(() => { startedAt.current = Date.now(); setAnswer(''); setConfidence(''); }, [question?.questionId]);

  const stem = useMemo(() => question?.prompt || question?.stem || '', [question]);
  const choices = useMemo(
    () => (question?.type === 'mcq' ? [...new Set(question?.choices || [])] : []),
    [question],
  );
  const canAnswer = choices.length ? Boolean(answer) : Boolean(String(answer).trim());

  async function submit(skipped = false) {
    if (busy || !question) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        questionId: question.questionId,
        answer: skipped ? '' : answer,
        confidence: confidence || 'not_sure',
        timeTakenMs: Date.now() - startedAt.current,
        skipped,
      };
      const { data } = await kioskAPI.answer(sessionId, body);
      if (data?.sessionComplete) {
        navigate(`/kiosk/${code}/result/${sessionId}`, {
          state: { result: data.result, studentName, code },
          replace: true,
        });
        return;
      }
      setProgress(data?.progress || null);
      if (data?.nextQuestion) setQuestion(data.nextQuestion);
      else setError('No more questions were returned. Tell your teacher.');
    } catch (e) {
      setError(e?.response?.data?.error || 'Something went wrong. Try Submit again.');
    } finally {
      setBusy(false);
    }
  }

  if (lostState) {
    return (
      <div style={shell}>
        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <p style={{ fontSize: 18, color: '#5a6675' }}>This check-in needs to start from your name.</p>
          <button type="button" style={primaryBtn} onClick={() => navigate(`/kiosk/${code}`)}>Back to the name list</button>
        </div>
      </div>
    );
  }

  if (!question) {
    return <div style={shell}><p style={{ fontSize: 20, color: '#5a6675' }}>Loading…</p></div>;
  }

  const answered = progress?.answeredCount ?? 0;
  const estimate = progress?.estimatedQuestionCount ?? null;

  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3f8f6f' }}>{studentName}</span>
          <span style={{ fontSize: 14, color: '#8a94a3' }}>
            {estimate ? `Question ${answered + 1} of ~${estimate}` : `Question ${answered + 1}`}
          </span>
        </div>

        <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 2px 14px rgba(28,36,51,0.06)' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#1c2433', lineHeight: 1.4 }}>
            <MathText text={stem} />
          </div>

          {canRenderQuestionDiagram(question) && (
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
              <QuestionDiagram diagram={question.diagram} />
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            {choices.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAnswer(c)}
                    style={{
                      padding: '16px', borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: 'pointer',
                      border: '2px solid', borderColor: answer === c ? '#3f8f6f' : '#dfe4ea',
                      background: answer === c ? '#eaf5ef' : '#fff', color: '#1c2433',
                    }}
                  >
                    <MathText text={String(c)} />
                  </button>
                ))}
              </div>
            ) : (
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer"
                autoFocus
                style={{
                  width: '100%', padding: '16px 18px', fontSize: 20, borderRadius: 12,
                  border: '2px solid #cfe3d8', outline: 'none', boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: '#8a94a3', marginBottom: 8 }}>How sure are you?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {CONFIDENCE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setConfidence(c.value)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    border: '2px solid', borderColor: confidence === c.value ? '#3f8f6f' : '#e3e7eb',
                    background: confidence === c.value ? '#eaf5ef' : '#fff', color: '#1c2433',
                  }}
                >
                  <span style={{ fontSize: 20, marginRight: 6 }}>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#b23b54', marginTop: 14 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="button" onClick={() => submit(true)} disabled={busy} style={skipBtn}>Skip</button>
            <button type="button" onClick={() => submit(false)} disabled={busy || !canAnswer} style={{ ...primaryBtn, flex: 1, opacity: busy || !canAnswer ? 0.5 : 1 }}>
              {busy ? 'Checking…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const shell = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 24, background: 'linear-gradient(160deg, #f3f7f5, #eef1f6)',
};
const primaryBtn = {
  padding: '16px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: '#2f8f5b', color: '#fff', fontSize: 18, fontWeight: 700,
};
const skipBtn = {
  padding: '16px 22px', borderRadius: 12, border: '2px solid #e3e7eb', cursor: 'pointer',
  background: '#fff', color: '#8a94a3', fontSize: 16, fontWeight: 600,
};

export { clearAttempt };
