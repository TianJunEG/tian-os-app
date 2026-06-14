import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckSquare, Square, Play, Minus, Plus } from 'lucide-react';
import { taxonomyAPI, mathpathAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';

const TIMER_OPTIONS = [
  { label: 'No timer', value: null },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

const QUESTION_COUNTS = [10, 15, 20, 25, 30, 40, 50];

export default function ExamPrepSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [levels, setLevels] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [examTopics, setExamTopics] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState(new Set());
  const [questionCount, setQuestionCount] = useState(20);
  const [timerMinutes, setTimerMinutes] = useState(45);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await taxonomyAPI.levels();
        setLevels(res.data);
        const inferred = user?.studentLevel || user?.moeLevel || 'P4';
        setSelectedLevel(inferred);
      } catch {
        setError('Could not load levels.');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedLevel) return;
    setLoadingTopics(true);
    setSelectedTopicIds(new Set());
    (async () => {
      try {
        const res = await taxonomyAPI.examPrep({ level: selectedLevel });
        setExamTopics(res.data.topics || []);
      } catch {
        setError('Could not load topics.');
      } finally {
        setLoadingTopics(false);
      }
    })();
  }, [selectedLevel]);

  const totalExamSkills = useMemo(() => {
    return examTopics
      .filter((t) => selectedTopicIds.has(t.topicId))
      .reduce((sum, t) => sum + t.examSkillCount, 0);
  }, [examTopics, selectedTopicIds]);

  const toggleTopic = (topicId) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTopicIds(new Set(examTopics.map((t) => t.topicId)));
  };

  const clearAll = () => {
    setSelectedTopicIds(new Set());
  };

  const startExamPrep = async () => {
    if (starting || selectedTopicIds.size === 0) return;
    setStarting(true);
    setError('');
    try {
      const selectedSkillIds = examTopics
        .filter((t) => selectedTopicIds.has(t.topicId))
        .flatMap((t) => t.skills.map((s) => s.skillId));

      const { data } = await mathpathAPI.startSession({
        mode: 'exam_prep',
        feature: 'Exam Prep',
        skillIds: selectedSkillIds,
        questionCount,
        timeLimitMinutes: timerMinutes,
        taxonomyTopicIds: [...selectedTopicIds],
      });
      navigate(`/student/mathpath/practice/${data.session_id}`, {
        state: {
          items: data.items,
          sessionType: 'exam_prep',
          source: 'exam-prep',
          backTo: '/student/mathpath/exam-prep',
          timeLimitMinutes: timerMinutes,
          examLevel: selectedLevel,
          topicCount: selectedTopicIds.size,
        },
      });
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not start exam prep session.');
      setStarting(false);
    }
  };

  if (!levels) return <Spinner label="Loading..." />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <button
        onClick={() => navigate('/student/mathpath/practice-modes')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Exam Prep</h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>Set up a timed practice paper. Pick your level, topics, and timer.</p>

      {/* Level selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Level</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(levels.levels || []).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: selectedLevel === lvl ? '#d97706' : '#f3f4f6',
                color: selectedLevel === lvl ? '#fff' : '#374151',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Topics {selectedTopicIds.size > 0 && <span style={{ color: '#d97706' }}>({selectedTopicIds.size} selected)</span>}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={selectAll} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Select all</button>
            <button onClick={clearAll} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
          </div>
        </div>

        {loadingTopics ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading topics...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {examTopics.map((topic) => {
              const selected = selectedTopicIds.has(topic.topicId);
              return (
                <button
                  key={topic.topicId}
                  onClick={() => toggleTopic(topic.topicId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: selected ? '#fffbeb' : '#fff', border: `1.5px solid ${selected ? '#d97706' : '#e5e7eb'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {selected ? <CheckSquare size={18} color="#d97706" /> : <Square size={18} color="#d1d5db" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{topic.topicName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{topic.examSkillCount} exam skills · {topic.strand}</div>
                  </div>
                </button>
              );
            })}
            {examTopics.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 20, fontSize: 13 }}>No topics for {selectedLevel}.</div>
            )}
          </div>
        )}
      </div>

      {/* Question count */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
          Questions
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setQuestionCount((c) => Math.max(5, c - 5))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={14} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827', minWidth: 40, textAlign: 'center' }}>{questionCount}</span>
          <button
            onClick={() => setQuestionCount((c) => Math.min(50, c + 5))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={14} />
          </button>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 8 }}>
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500,
                  background: questionCount === n ? '#d97706' : '#f3f4f6',
                  color: questionCount === n ? '#fff' : '#6b7280',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Clock size={14} /> Timer
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setTimerMinutes(opt.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: timerMinutes === opt.value ? '#d97706' : '#f3f4f6',
                color: timerMinutes === opt.value ? '#fff' : '#374151',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary + Start */}
      <div style={{
        padding: 16, borderRadius: 12, background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
          <strong>{selectedLevel}</strong> · {selectedTopicIds.size} topic{selectedTopicIds.size !== 1 ? 's' : ''} · {questionCount} questions
          {timerMinutes ? ` · ${timerMinutes} min timer` : ' · No timer'}
          {totalExamSkills > 0 && ` · ${totalExamSkills} skills covered`}
        </div>
      </div>

      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <button
        onClick={startExamPrep}
        disabled={starting || selectedTopicIds.size === 0}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
          background: selectedTopicIds.size === 0 ? '#d1d5db' : '#d97706',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: selectedTopicIds.size === 0 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: starting ? 0.7 : 1,
        }}
      >
        <Play size={18} /> {starting ? 'Starting...' : 'Start Exam Prep'}
      </button>
    </div>
  );
}
