import React, { useState } from 'react';
import Icon from '../Icon';

// Tone → colour palette (matches design system)
const TONES = {
  gold:  { bg: '#F5EDD8', fg: '#9A7A23', ring: '#C8A042' },
  leaf:  { bg: '#E6F1E8', fg: '#2E6B43', ring: '#4A9B62' },
  sun:   { bg: '#FBEEDD', fg: '#B86B1A', ring: '#D4892A' },
  cream: { bg: '#F4EFE2', fg: '#7A5A1A', ring: '#A07030' },
  blue:  { bg: '#E6EEF7', fg: '#13315C', ring: '#3B6AB5' },
  plum:  { bg: '#EFE6F0', fg: '#6B3A6F', ring: '#9A5AA0' },
};

function Section({ title, accent, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent || '#C8A042' }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1F3F', letterSpacing: '-0.01em' }}>
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
            width: 18, height: 18, borderRadius: '50%', background: color || '#EEF2FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#0B2545', flexShrink: 0, marginTop: 1,
          }}>
            {i + 1}
          </span>
          <span style={{ fontSize: 13, color: '#2C3E60', lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ icon, label, value, bg, fg }) {
  return (
    <div style={{ background: bg || '#F4F6FB', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, color: fg || '#6B7A95', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3F' }}>{value}</div>
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
    <div className="lifelab-phone">
      {/* Status bar */}
      <div className="status-bar">
        <span>9:41</span>
        <div className="status-bar-right">
          <Icon name="signal" size={14} />
          <Icon name="wifi" size={14} />
        </div>
      </div>

      {/* Nav */}
      <div className="ll-nav-bar">
        <button className="ll-nav-btn" onClick={onBack}>
          <Icon name="arrow_left" size={20} />
        </button>
        <div className="ll-nav-bar-title">
          <h1>Activity Detail</h1>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="ll-content-scroll" style={{ padding: '0 20px 100px' }}>

          {/* Hero card */}
          <div style={{
            background: `linear-gradient(135deg, ${tone.bg} 0%, #fff 100%)`,
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
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0B1F3F', lineHeight: 1.25, marginBottom: 5 }}>
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
            <InfoCard label="Duration"    value={template.duration}                    bg="#F4F6FB" />
            <InfoCard label="Subject"     value={template.subject}                     bg={tone.bg} fg={tone.fg} />
            <InfoCard label="Use case"    value={template.use_case_tags?.[0] || '—'}   bg="#EEF2FA" />
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 4, margin: '18px 0 12px', borderBottom: '1px solid #F1F3F8', paddingBottom: 0 }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px',
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#0B2545' : '#6B7A95',
                borderBottom: activeTab === tab.id ? '2px solid #C8A042' : '2px solid transparent',
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
                <Section title="What you will learn" accent="#2E7A5A">
                  {template.learn_goals.map((goal, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, background: '#E7F3EC',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        <Icon name="check" size={12} color="#2E7A5A" />
                      </div>
                      <span style={{ fontSize: 13, color: '#2C3E60', lineHeight: 1.5 }}>{goal}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* What to submit */}
              {template.what_to_submit?.length > 0 && (
                <Section title="What to submit" accent="#3B6AB5">
                  {template.what_to_submit.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, background: '#EEF2FA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#13315C' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#2C3E60', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Common mistake */}
              {template.common_mistake && (
                <Section title="Common mistake" accent="#B86B1A">
                  <div style={{
                    background: '#FBEEDD', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: 13, color: '#7A4010', lineHeight: 1.55 }}>
                      {template.common_mistake}
                    </span>
                  </div>
                </Section>
              )}

              {/* Tip */}
              {template.tip && (
                <Section title="Tip for parents, teachers &amp; tutors" accent="#C8A042">
                  <div style={{
                    background: '#FAF7EE', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    border: '1px solid #E5D8B5',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 13, color: '#5A4010', lineHeight: 1.55 }}>
                      {template.tip}
                    </span>
                  </div>
                </Section>
              )}

              {/* Topics */}
              {template.topic_tags?.length > 0 && (
                <Section title="Topics covered" accent="#A7B1C2">
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
                  <p style={{ fontSize: 13, color: '#6B7A95', lineHeight: 1.6 }}>
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
                        padding: '9px 12px', background: '#F4F6FB', borderRadius: 10,
                      }}>
                        <span style={{ fontSize: 14 }}>
                          {['🛒', '📏', '💧', '📓', '📷', '⚗️', '🌱'][i % 7]}
                        </span>
                        <span style={{ fontSize: 13, color: '#0B1F3F' }}>{m}</span>
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
          padding: '12px 20px', borderTop: '1px solid #F1F3F8',
          background: '#fff', display: 'flex', gap: 8,
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
    </div>
  );
}
