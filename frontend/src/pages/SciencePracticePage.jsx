import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy, FlaskConical } from 'lucide-react';
import { scienceAPI, learningAPI } from '../services/api';

// P6 Science revision module. Open-ended Q&A: the learner checks their answer
// against the model answer, self-marks, and the score is recorded to the unified
// learning profile (so it surfaces on the student/parent dashboards).
export default function SciencePracticePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('pick'); // 'pick' | 'quiz' | 'done'
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [marks, setMarks] = useState([]);
  const [startedAt, setStartedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('');

  useEffect(() => {
    scienceAPI
      .topics()
      .then((res) => setTopics(res.data.topics || []))
      .catch(() => setError('Could not load science topics.'));
  }, []);

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scienceAPI.questions(topic, count);
      const qs = res.data.questions || [];
      if (!qs.length) {
        setError('No questions found for that topic.');
        return;
      }
      setQuestions(qs);
      setIdx(0);
      setRevealed(false);
      setMarks([]);
      setStartedAt(Date.now());
      setSaveState('');
      setPhase('quiz');
    } catch {
      setError('Could not load questions.');
    } finally {
      setLoading(false);
    }
  };

  const finish = async (finalMarks) => {
    setPhase('done');
    const correct = finalMarks.filter(Boolean).length;
    const accuracy = Math.round((correct / questions.length) * 100);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    setSaveState('saving');
    try {
      await learningAPI.postResult({
        source: 'science',
        subject: 'sci',
        topic: topic || 'P6 Science',
        accuracy,
        mastered: accuracy >= 80,
        minutes,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const mark = (correct) => {
    const next = [...marks];
    next[idx] = correct;
    setMarks(next);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setRevealed(false);
    } else {
      finish(next);
    }
  };

  const restart = () => {
    setPhase('pick');
    setQuestions([]);
    setIdx(0);
    setRevealed(false);
    setMarks([]);
    setError('');
  };

  const q = questions[idx];
  const correctCount = marks.filter(Boolean).length;
  const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-deep"
          >
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </button>
          <div className="flex items-center gap-2 font-extrabold text-emerald-deep">
            <FlaskConical className="w-5 h-5 text-gold-500" /> P6 Science
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {phase === 'pick' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-extrabold text-emerald-deep mb-1">Science Revision</h1>
            <p className="text-gray-600 mb-6">
              Open-ended P6 questions, MOE-aligned. Check your answer against the model answer and
              mark yourself honestly — your score feeds your learning profile.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full mb-4 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.topic} value={t.topic}>
                  {t.topic} ({t.count})
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full mb-6 border border-gray-300 rounded-lg px-3 py-2"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button
              onClick={start}
              disabled={loading}
              className="w-full bg-emerald-deep text-white font-medium py-2.5 rounded-lg hover:bg-emerald-deep disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Start practice'}
            </button>
          </div>
        )}

        {phase === 'quiz' && q && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>
                Question {idx + 1} of {questions.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-tint text-emerald-deep">{q.topic}</span>
            </div>
            {q.heading && <h2 className="text-lg font-semibold text-gray-900 mb-2">{q.heading}</h2>}
            <p className="text-gray-800 mb-6">{q.question}</p>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full border-2 border-emerald-deep text-emerald-deep font-medium py-2.5 rounded-lg hover:bg-emerald-tint"
              >
                Show model answer
              </button>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-gold-50 border border-gold-200 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 mb-1">
                    Model answer
                  </p>
                  <p className="text-gray-800">{q.answer}</p>
                  {q.keywords && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Keywords:</span> {q.keywords}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">Did your answer match?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => mark(false)}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-700 font-medium py-2.5 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-5 h-5" /> Not yet
                  </button>
                  <button
                    onClick={() => mark(true)}
                    className="flex-1 flex items-center justify-center gap-2 border border-green-300 text-green-700 font-medium py-2.5 rounded-lg hover:bg-green-50"
                  >
                    <Check className="w-5 h-5" /> I got it
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Trophy
              className={`w-12 h-12 mx-auto mb-3 ${accuracy >= 80 ? 'text-gold-500' : 'text-gray-300'}`}
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-deep mb-1">{accuracy}%</h1>
            <p className="text-gray-600 mb-1">
              {correctCount} of {questions.length} correct{accuracy >= 80 ? ' — mastered!' : ''}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {saveState === 'saving' && 'Saving to your learning profile…'}
              {saveState === 'saved' && 'Saved to your learning profile ✓'}
              {saveState === 'error' && 'Could not save your result (are you logged in?).'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={restart}
                className="flex items-center gap-2 border border-emerald-deep text-emerald-deep font-medium px-4 py-2 rounded-lg hover:bg-emerald-tint"
              >
                <RotateCcw className="w-4 h-4" /> Practice again
              </button>
              <button
                onClick={() => navigate('/learning')}
                className="flex items-center gap-2 bg-emerald-deep text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-deep"
              >
                View my progress <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
