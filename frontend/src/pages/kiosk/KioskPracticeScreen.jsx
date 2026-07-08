import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MathText } from '../../components/ui/Fraction';
import QuestionDiagram, { canRenderQuestionDiagram } from '../student/mathpath/components/QuestionDiagram';
import { kioskAPI, clearAttempt, getAttemptToken } from '../../services/kioskApi';

// Practice kiosk: walks a FIXED items[] list (served up front by /practice-begin),
// POSTing one attempt per question, then /complete. Unlike the diagnostic screen,
// the client drives its own index — there is no adaptive next-question from the
// server. Correct/wrong is NOT shown per item (shared iPad); the score appears at
// the end.
export default function KioskPracticeScreen() {
  const { code, sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const studentName = location.state?.studentName || '';
  const [skillName, setSkillName] = useState(location.state?.skillName || '');
  const [items, setItems] = useState(() => location.state?.items || []);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // A mid-set refresh loses the in-memory items, but the attempt token survives in
  // sessionStorage — so rehydrate the fixed set + resume at the first unanswered
  // item rather than dumping the student back to the name list.
  const [resuming, setResuming] = useState(() => !(location.state?.items?.length) && Boolean(getAttemptToken()));
  const [resumeFailed, setResumeFailed] = useState(false);
  const startedAt = useRef(Date.now());

  const question = items[index] || null;
  // Only truly lost if the token is gone too, or the resume attempt failed.
  const lostState = (!items.length && !getAttemptToken()) || resumeFailed;

  useEffect(() => { startedAt.current = Date.now(); setAnswer(''); }, [index]);

  useEffect(() => {
    if (!resuming) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await kioskAPI.resume(sessionId);
        if (cancelled) return;
        if (data?.sessionComplete) {
          navigate(`/kiosk/${code}/result/${sessionId}`, { state: { studentName, code }, replace: true });
          return;
        }
        const resumedItems = data?.items || [];
        if (!resumedItems.length) { clearAttempt(); setResumeFailed(true); return; }
        setItems(resumedItems);
        if (data.skillName) setSkillName(data.skillName);
        const answered = data.answeredCount || 0;
        if (answered >= resumedItems.length) {
          // All answered but the completion POST never landed — finish it now.
          const { data: done } = await kioskAPI.practiceComplete(sessionId);
          if (cancelled) return;
          navigate(`/kiosk/${code}/result/${sessionId}`, { state: { summary: done?.summary || null, studentName, code }, replace: true });
          return;
        }
        setIndex(answered);
      } catch {
        if (!cancelled) { clearAttempt(); setResumeFailed(true); }
      } finally {
        if (!cancelled) setResuming(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resuming, sessionId, code, navigate, studentName]);

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
      await kioskAPI.practiceAttempt(sessionId, {
        questionId: question.questionId,
        answer: skipped ? '' : answer,
        timeTakenSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        skipped,
      });
      const isLast = index >= items.length - 1;
      if (!isLast) {
        setIndex((i) => i + 1);
        return;
      }
      const { data } = await kioskAPI.practiceComplete(sessionId);
      navigate(`/kiosk/${code}/result/${sessionId}`, {
        state: { summary: data?.summary || null, studentName, code },
        replace: true,
      });
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
          <p style={{ fontSize: 18, color: '#5a6675' }}>This practice needs to start from your name.</p>
          <button type="button" style={primaryBtn} onClick={() => navigate(`/kiosk/${code}`)}>Back to the name list</button>
        </div>
      </div>
    );
  }

  if (!question) {
    return <div style={shell}><p style={{ fontSize: 20, color: '#5a6675' }}>Loading…</p></div>;
  }

  const stem = question.prompt || question.stem || '';

  return (
    <div style={shell}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3f8f6f' }}>{studentName}{skillName ? ` · ${skillName}` : ''}</span>
          <span style={{ fontSize: 14, color: '#8a94a3' }}>Question {index + 1} of {items.length}</span>
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

          {error && <p style={{ color: '#b23b54', marginTop: 14 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button type="button" onClick={() => submit(true)} disabled={busy} style={skipBtn}>Skip</button>
            <button type="button" onClick={() => submit(false)} disabled={busy || !canAnswer} style={{ ...primaryBtn, flex: 1, opacity: busy || !canAnswer ? 0.5 : 1 }}>
              {busy ? 'Saving…' : (index >= items.length - 1 ? 'Finish' : 'Next')}
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
