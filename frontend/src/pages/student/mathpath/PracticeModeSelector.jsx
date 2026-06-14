import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, BookOpen, Clock, Stethoscope } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const MODES = [
  {
    key: 'diagnostic',
    icon: Stethoscope,
    title: 'Diagnostic',
    subtitle: 'Find your starting point',
    description: 'Take a placement check to identify your strengths and gaps.',
    color: '#6366f1',
    bg: '#eef2ff',
    route: '/student/mathpath/diagnostic',
  },
  {
    key: 'free_practice',
    icon: Compass,
    title: 'Free Practice',
    subtitle: 'Practice any skill',
    description: 'Browse all topics and skills across every level. Pick what you want to practise.',
    color: '#059669',
    bg: '#ecfdf5',
    route: '/student/mathpath/free-practice',
  },
  {
    key: 'exam_prep',
    icon: Clock,
    title: 'Exam Prep',
    subtitle: 'Timed practice papers',
    description: 'Pick your level and topics, set a timer, and simulate exam conditions.',
    color: '#d97706',
    bg: '#fffbeb',
    route: '/student/mathpath/exam-prep',
  },
];

export default function PracticeModeSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <button
        onClick={() => navigate('/student/mathpath')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, marginBottom: 16, padding: 0 }}
      >
        <ArrowLeft size={16} /> Back to MathPath
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Practice Modes</h1>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>Choose how you want to practise today.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.key}
              onClick={() => navigate(mode.route, { state: { source: 'practice-modes' } })}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18,
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14,
                cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = mode.color; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: mode.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={22} color={mode.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{mode.title}</div>
                <div style={{ fontSize: 13, color: mode.color, fontWeight: 500, marginBottom: 4 }}>{mode.subtitle}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>{mode.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
