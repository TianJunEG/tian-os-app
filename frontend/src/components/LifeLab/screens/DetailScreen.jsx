import React, { useState } from 'react';
import Icon from '../Icon';

// Tone → colour palette (matches design system)
const TONES = {
  gold:  { bg: '#F3EED8', fg: '#B45309', ring: '#F59E0B' },
  leaf:  { bg: '#DEF0E8', fg: '#2F8F6F', ring: '#2F8F6F' },
  sun:   { bg: '#FFEFCC', fg: '#B45309', ring: '#F59E0B' },
  cream: { bg: '#F3EED8', fg: '#B45309', ring: '#F59E0B' },
  blue:  { bg: '#DDE3F0', fg: '#1A2A4F', ring: '#6B7FA8' },
  plum:  { bg: '#EDE5F5', fg: '#A388D2', ring: '#B69FDB' },
};

function Section({ title, accent, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || 'var(--gold-500)' }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-700)', letterSpacing: '-0.01em' }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, color }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%', background: color || 'var(--navy-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--navy-700)', flexShrink: 0, marginTop: 1,
          }}>
            {i + 1}
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ icon, label, value, bg, fg }) {
  return (
    <div style={{ background: bg || 'var(--navy-50)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, color: fg || 'var(--ink-500)', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-700)' }}>{value}</div>
    </div>
  );
}

export default function DetailScreen({ template, onAssign, onBack }) {
  const [activeTab, setActiveTab] = useState('about');
  if (!template) return null;

  const tone = TONES[template.tone] || TONES.gold;

  const tabs = [
    { id: 'about',    label: 'About' },
    { id: 'steps',    label: 'Steps' },
    { id: 'materials', label: 'Materials' },
  ];

  return (
    <>
      {/* Nav */}
      <div className="ll-nav-bar">
        <button className="ll-nav-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="ll-nav-bar-title">
          <h1>Activity Detail</h1>
        </div>
      </div>

      <div className="ll-content">
        <div className="ll-content-scroll" style={{ padding: '0 20px 100px' }}>

          {/* Hero card */}
          <div style={{
            background: `linear-gradient(135deg, ${tone.bg} 0%, var(--paper) 100%)`,
            border: `1.5px solid ${tone.ring}30`,
            borderRadius: 18, padding: 20, marginBottom: 16, marginTop: 12,
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: tone.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${tone.ring}40`, flexShrink: 0,
              }}>
                <Icon name={template.icon || 'sparkle'} size={26} color={tone.fg} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy-700)', lineHeight: 1.25, marginBottom: 5 }}>
                  {template.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  <span className="ll-pill navy">{template.subject}</span>
                  {template.level_tags?.map((t) => (
                    <span key={t} className="ll-pill ghost">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
            <InfoCard label="Duration"    value={template.duration}                    bg="var(--navy-50)" />
            <InfoCard label="Subject"     value={template.subject}                     bg={tone.bg} fg={tone.fg} />
            <InfoCard label="Use case"    value={template.use_case_tags?.[0] || '—'}   bg="var(--navy-100)" />
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 4, margin: '18px 0 12px', borderBottom: '1px solid var(--hairline)', paddingBottom: 0 }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px',
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--navy-700)' : 'var(--ink-500)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold-500)' : '2px solid transparent',
                marginBottom: -1,
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── ABOUT tab ─────────────────────────────────────── */}
          {activeTab === 'about' && (
            <>
              {/* What you will learn */}
              {template.learn_goals?.length > 0 && (
                <Section title="What you will learn" accent="var(--success-500)">
                  {template.learn_goals.map((goal, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, background: 'var(--success-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        <Icon name="check" size={12} color="var(--success-500)" />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>{goal}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* What to submit */}
              {template.what_to_submit?.length > 0 && (
                <Section title="What to submit" accent="var(--navy-300)">
                  {template.what_to_submit.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, background: 'var(--navy-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--navy-700)' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Common mistake */}
              {template.common_mistake && (
                <Section title="Common mistake" accent="#B45309">
                  <div style={{
                    background: 'var(--gold-100)', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: 'var(--gold-700)', lineHeight: 1.55 }}>
                      {template.common_mistake}
                    </span>
                  </div>
                </Section>
              )}

              {/* Tip */}
              {template.tip && (
                <Section title="Tip for parents, teachers &amp; tutors" accent="var(--gold-500)">
                  <div style={{
                    background: '#ECFDF5', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    border: '1px solid #E5D8B5',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 13, color: '#B45309', lineHeight: 1.55 }}>
                      {template.tip}
                    </span>
                  </div>
                </Section>
              )}

              {/* Topics */}
              {template.topic_tags?.length > 0 && (
                <Section title="Topics covered" accent="#94A3B8">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {template.topic_tags.map((tag) => (
                      <span key={tag} className="ll-pill navy">{tag}</span>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ── STEPS tab ─────────────────────────────────────── */}
          {activeTab === 'steps' && (
            <>
              {template.what_to_do?.length > 0 ? (
                <Section title="What to do — step by step" accent={tone.ring}>
                  <BulletList items={template.what_to_do} color={tone.bg} />
                </Section>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.6 }}>
                    {template.instructions}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── MATERIALS tab ─────────────────────────────────── */}
          {activeTab === 'materials' && (
            <>
              {template.materials?.length > 0 && (
                <Section title="What you need" accent={tone.ring}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {template.materials.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', background: 'var(--navy-50)', borderRadius: 10,
                      }}>
                        <span style={{ fontSize: 14 }}>
                          {['🛒', '📏', '💧', '📓', '📷', '⚗️', '🌱'][i % 7]}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--navy-700)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Fixed bottom action */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--hairline)',
          background: 'var(--paper)', display: 'flex', gap: 8,
        }}>
          <button className="ll-btn ll-btn-secondary" style={{ width: 'auto', paddingLeft: 16, paddingRight: 16 }} onClick={onBack}>
            Back
          </button>
          <button className="ll-btn ll-btn-primary" style={{ flex: 1 }} onClick={() => onAssign(template)}>
            <Icon name="check" size={16} />
            Assign This Activity
          </button>
        </div>
      </div>
    </>
  );
}
