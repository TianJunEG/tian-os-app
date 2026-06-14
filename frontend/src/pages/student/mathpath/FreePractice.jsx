import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { taxonomyAPI, mathpathAPI } from '../../../services/api';
import { Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';

const STRAND_COLORS = {
  'Number & Algebra': { color: '#6366f1', bg: '#eef2ff' },
  'Measurement & Geometry': { color: '#059669', bg: '#ecfdf5' },
  'Statistics': { color: '#d97706', bg: '#fffbeb' },
};

export default function FreePractice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [levels, setLevels] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [levelsRes, topicsRes, skillsRes] = await Promise.all([
          taxonomyAPI.levels(),
          taxonomyAPI.topics(),
          taxonomyAPI.skills(),
        ]);
        setLevels(levelsRes.data);
        setAllTopics(topicsRes.data.topics || []);
        setAllSkills(skillsRes.data.skills || []);
        const inferred = user?.studentLevel || user?.moeLevel || 'P4';
        setSelectedLevel(inferred);
      } catch {
        setError('Could not load topics.');
      }
    })();
  }, [user]);

  const skillsByTopic = useMemo(() => {
    const map = {};
    for (const s of allSkills) {
      if (!map[s.topicId]) map[s.topicId] = [];
      map[s.topicId].push(s);
    }
    return map;
  }, [allSkills]);

  const filteredTopics = useMemo(() => {
    let topics = selectedLevel ? allTopics.filter((t) => t.level === selectedLevel) : allTopics;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchingTopicIds = new Set();
      for (const t of topics) {
        if (t.topicName.toLowerCase().includes(q)) matchingTopicIds.add(t.topicId);
      }
      for (const s of allSkills) {
        if (s.skillName.toLowerCase().includes(q) && topics.some((t) => t.topicId === s.topicId)) {
          matchingTopicIds.add(s.topicId);
        }
      }
      topics = topics.filter((t) => matchingTopicIds.has(t.topicId));
    }
    return topics;
  }, [allTopics, allSkills, selectedLevel, search]);

  const startPractice = async (skill) => {
    if (starting) return;
    setStarting(skill.skillId);
    setError('');
    try {
      const { data } = await mathpathAPI.startSession({
        mode: 'free_practice',
        feature: 'Free Practice',
        skillId: skill.skillId,
        questionCount: 10,
      });
      navigate(`/student/mathpath/practice/${data.session_id}`, {
        state: {
          items: data.items,
          sessionType: 'free_practice',
          source: 'free-practice',
          backTo: '/student/mathpath/free-practice',
        },
      });
    } catch (e) {
      setError(e?.response?.data?.error || 'No questions available for this skill yet.');
      setStarting(null);
    }
  };

  if (!levels) return <Spinner label="Loading topics..." />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <button
        onClick={() => navigate('/student/mathpath/practice-modes')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Free Practice</h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>Browse and practise any skill you want.</p>

      {/* Level pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {(levels.levels || []).map((lvl) => (
          <button
            key={lvl}
            onClick={() => { setSelectedLevel(lvl); setExpandedTopic(null); }}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: selectedLevel === lvl ? '#6366f1' : '#f3f4f6',
              color: selectedLevel === lvl ? '#fff' : '#374151',
            }}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Search topics or skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
            border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Topic accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTopics.map((topic) => {
          const skills = skillsByTopic[topic.topicId] || [];
          const isExpanded = expandedTopic === topic.topicId;
          const strandStyle = STRAND_COLORS[topic.strand] || { color: '#6b7280', bg: '#f9fafb' };

          return (
            <div key={topic.topicId} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedTopic(isExpanded ? null : topic.topicId)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', background: isExpanded ? '#f9fafb' : '#fff',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {isExpanded ? <ChevronDown size={16} color="#6b7280" /> : <ChevronRight size={16} color="#6b7280" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{topic.topicName}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{skills.length} skills</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: strandStyle.bg, color: strandStyle.color,
                }}>
                  {topic.strand.replace(' & ', ' & ')}
                </span>
              </button>

              {isExpanded && (
                <div style={{ padding: '4px 14px 12px', borderTop: '1px solid #f3f4f6' }}>
                  {skills.map((skill) => (
                    <div
                      key={skill.skillId}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 0', borderBottom: '1px solid #f9fafb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{skill.skillName}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {skill.questionTypes.slice(0, 3).join(' · ')}
                        </div>
                      </div>
                      <button
                        onClick={() => startPractice(skill)}
                        disabled={starting === skill.skillId}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', borderRadius: 8, border: 'none',
                          background: '#6366f1', color: '#fff', fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', opacity: starting === skill.skillId ? 0.6 : 1,
                        }}
                      >
                        <Play size={12} /> Practise
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filteredTopics.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40, fontSize: 14 }}>
            No topics found{search ? ` for "${search}"` : ''}.
          </div>
        )}
      </div>
    </div>
  );
}
