// parent-screens-b.jsx — Parent screens 5-7
// Assign Practice, Mistake History, Worksheet Generator

const { useState: usePB1 } = React;

// =====================================================================
// 5. ASSIGN PRACTICE
// =====================================================================
function ParentAssign({ onBack, onAssigned }) {
  const [subject, setSubject] = usePB1('math');
  const [topic, setTopic] = usePB1('regroup0');
  const [difficulty, setDifficulty] = usePB1('on-level');
  const [qCount, setQCount] = usePB1(10);
  const [schedule, setSchedule] = usePB1('today');

  const subjects = [
    { id: 'math', label: 'Math', mark: 'Σ', tone: T.modMath },
    { id: 'english', label: 'English', mark: 'Aa', tone: T.modRead },
    { id: 'science', label: 'Science', mark: '⌬', tone: T.modScience },
  ];

  const topicsBySubject = {
    math: [
      { id: 'regroup0', name: 'Regrouping across zero', level: 'P5', mastery: 38, recommended: true },
      { id: 'equivfr',  name: 'Equivalent fractions',   level: 'P4', mastery: 54 },
      { id: 'mul78',    name: '×7 & ×8 tables',         level: 'P4', mastery: 76 },
      { id: 'area',     name: 'Area & perimeter',       level: 'P5', mastery: 62 },
    ],
    english: [
      { id: 'infer', name: 'Inference', level: 'P5', mastery: 48 },
      { id: 'voc',   name: 'Vocabulary list 14', level: 'P5', mastery: 70 },
    ],
    science: [
      { id: 'magnet', name: 'Magnets — repulsion', level: 'P3', mastery: 54 },
    ],
  };

  return (
    <div style={{ background: T.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ParentScreenHeader onBack={onBack} title="Assign practice"
        subtitle="3 quick choices — Aria will see it on her dashboard" />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {/* Step 1: subject */}
        <FormStep n={1} label="Subject">
          <div style={{ display: 'flex', gap: 8 }}>
            {subjects.map(s => (
              <button key={s.id} onClick={() => setSubject(s.id)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 14,
                background: subject === s.id ? T.navy050 : T.paper,
                border: `1px solid ${subject === s.id ? T.navy500 : T.hairline}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: `all 200ms ${T.easeCalm}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: s.tone, color: T.paper,
                  display: 'grid', placeItems: 'center',
                  fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 14,
                }}>{s.mark}</div>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: subject === s.id ? T.navy700 : T.ink500,
                }}>{s.label}</span>
              </button>
            ))}
          </div>
        </FormStep>

        {/* Step 2: topic */}
        <FormStep n={2} label="Topic">
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {(topicsBySubject[subject] || []).map((t, i) => {
              const sel = topic === t.id;
              return (
                <div key={t.id} onClick={() => setTopic(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < topicsBySubject[subject].length - 1 ? `1px solid ${T.hairline}` : 'none',
                  background: sel ? T.navy050 : T.paper,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? T.navy700 : T.hairline}`,
                    background: sel ? T.navy700 : T.paper,
                    display: 'grid', placeItems: 'center',
                  }}>
                    {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.paper }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>{t.name}</span>
                      {t.recommended && <Chip size="s" tone="gold" icon={<IconSparkle size={9} />}>AI pick</Chip>}
                    </div>
                    <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
                      {t.level} · {t.mastery}% mastered
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </FormStep>

        {/* Step 3: difficulty */}
        <FormStep n={3} label="Difficulty">
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'easier',   label: 'Easier',   sub: 'For confidence' },
              { id: 'on-level', label: 'On level', sub: 'Recommended' },
              { id: 'stretch',  label: 'Stretch',  sub: 'A bit harder' },
            ].map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                background: difficulty === d.id ? T.navy050 : T.paper,
                border: `1px solid ${difficulty === d.id ? T.navy500 : T.hairline}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: difficulty === d.id ? T.navy700 : T.ink700,
                }}>{d.label}</span>
                <span style={{ fontSize: 10, color: T.ink500 }}>{d.sub}</span>
              </button>
            ))}
          </div>
        </FormStep>

        {/* Step 4: question count */}
        <FormStep n={4} label="Number of questions">
          <Card padding={16}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
            }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{qCount}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>
                  ~{Math.round(qCount * 0.7)} minutes
                </div>
                <div style={{ fontSize: 11, color: T.ink500 }}>
                  {qCount <= 8 ? 'Short focus' : qCount <= 15 ? 'Standard session' : 'Long session'}
                </div>
              </div>
            </div>
            <input type="range" min="5" max="20" value={qCount}
              onChange={(e) => setQCount(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: T.navy700 }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 10, color: T.ink500, fontWeight: 600, marginTop: 4,
            }}>
              <span>5</span><span>12</span><span>20</span>
            </div>
          </Card>
        </FormStep>

        {/* Step 5: schedule */}
        <FormStep n={5} label="When">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { id: 'today',    label: 'Today',          sub: 'Available now' },
              { id: 'tonight',  label: 'Tonight',        sub: 'After dinner' },
              { id: 'tomorrow', label: 'Tomorrow',       sub: 'Morning' },
              { id: 'weekend',  label: 'This weekend',   sub: 'Saturday' },
            ].map(s => (
              <button key={s.id} onClick={() => setSchedule(s.id)} style={{
                padding: '12px 12px', borderRadius: 12,
                background: schedule === s.id ? T.navy050 : T.paper,
                border: `1px solid ${schedule === s.id ? T.navy500 : T.hairline}`,
                textAlign: 'left',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: schedule === s.id ? T.navy700 : T.ink700,
                }}>{s.label}</div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{s.sub}</div>
              </button>
            ))}
          </div>
        </FormStep>
      </div>

      {/* Sticky bottom CTA — summary + assign */}
      <div style={{
        padding: '14px 20px 22px',
        background: T.paper, borderTop: `1px solid ${T.hairline}`,
      }}>
        <div style={{
          padding: '10px 12px', background: T.ivory, borderRadius: 10,
          fontSize: 12, color: T.ink700, lineHeight: 1.5, marginBottom: 12,
        }}>
          <b style={{ color: T.navy700 }}>{qCount} questions</b> · {difficulty.replace('-', ' ')} · {schedule === 'today' ? 'today' : schedule}
        </div>
        <Button variant="primary" size="l" fullWidth onClick={onAssigned}
          iconRight={<IconCheck size={18} />}>
          Assign to Aria
        </Button>
      </div>
    </div>
  );
}

function FormStep({ n, label, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0,
          background: T.navy700, color: T.gold500,
          display: 'grid', placeItems: 'center',
          fontFamily: T.fontText, fontWeight: 700, fontSize: 11,
        }}>{n}</div>
        <span style={{
          fontSize: 12, fontWeight: 700, color: T.ink500,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// =====================================================================
// 6. MISTAKE HISTORY
// =====================================================================
function ParentMistakes({ onBack, onAssign }) {
  const mistakes = [
    {
      id: 'm1', when: 'Today · 6:14pm',
      module: 'MathPath', skill: 'Regrouping across zero', level: 'P5',
      q: '305 − 178', wrong: '237', right: '127',
      summary: 'Aria didn\'t carry the regroup across the 0 in the tens column.',
      similar: 5,
    },
    {
      id: 'm2', when: 'Today · 6:08pm',
      module: 'MathPath', skill: 'Regrouping across zero', level: 'P5',
      q: '407 − 159', wrong: '352', right: '248',
      summary: 'Same pattern — same column.',
      similar: 5,
    },
    {
      id: 'm3', when: 'Yesterday',
      module: 'MathPath', skill: 'Equivalent fractions', level: 'P4',
      q: '2/3 = ?/9', wrong: '3', right: '6',
      summary: 'Multiplied bottom by 3 but kept the top the same. The "×same" rule slipped.',
      similar: 3,
    },
  ];

  return (
    <div style={{ paddingBottom: 96 }}>
      <ParentScreenHeader onBack={onBack} title="Recent mistakes"
        subtitle="The last few slips · pattern by topic" />

      {/* Filter chips */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', gap: 6,
      }}>
        {['All', 'Math', 'English', 'Science', 'This week'].map((f, i) => (
          <button key={f} style={{
            height: 28, padding: '0 12px', borderRadius: 999,
            background: i === 0 ? T.navy700 : T.paper,
            color: i === 0 ? T.paper : T.ink700,
            border: `1px solid ${i === 0 ? 'transparent' : T.hairline}`,
            fontSize: 11, fontWeight: 600,
          }}>{f}</button>
        ))}
      </div>

      {/* Pattern summary banner */}
      <div style={{ padding: '0 20px 12px' }}>
        <Card padding={14} style={{
          background: T.gold100, borderColor: T.gold300,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: T.gold500, color: T.navy900,
            display: 'grid', placeItems: 'center',
          }}><IconLightbulb size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.navy700 }}>
              Pattern: regrouping across zero · 3 misses this week
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mistakes.map(m => (
          <Card key={m.id} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: T.ink500,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{m.module} · {m.level}</span>
              <span style={{ color: T.ink300 }}>·</span>
              <span style={{ fontSize: 11, color: T.ink500 }}>{m.when}</span>
            </div>

            {/* Question + answers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 500,
                color: T.navy700, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>{m.q}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                  fontSize: 16, fontWeight: 600, color: T.error500,
                  textDecoration: 'line-through', textDecorationThickness: 1,
                }}>{m.wrong}</span>
                <IconArrowRight size={14} color={T.ink300} />
                <span style={{
                  fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                  fontSize: 16, fontWeight: 600, color: T.success500,
                }}>{m.right}</span>
              </div>
            </div>

            <div style={{
              padding: '10px 12px', background: T.ivory, borderRadius: 10,
              fontSize: 12, color: T.ink700, lineHeight: 1.5, marginBottom: 12,
            }}>
              <b style={{ color: T.navy700 }}>{m.skill}.</b> {m.summary}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="s" style={{ flex: 1 }}>
                See explanation
              </Button>
              <Button variant="primary" size="s" style={{ flex: 1.2 }}
                iconRight={<IconArrowRight size={14} />}
                onClick={onAssign}>
                {m.similar} similar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 7. WORKSHEET GENERATOR
// =====================================================================
function ParentWorksheet({ onBack, onGenerated }) {
  const [topic, setTopic] = usePB1('regroup0');
  const [length, setLength] = usePB1(20);
  const [diff, setDiff] = usePB1('on-level');
  const [type, setType] = usePB1('practice-solutions');

  const topics = [
    { id: 'regroup0', name: 'Regrouping across zero', level: 'P5', recommended: true },
    { id: 'equivfr',  name: 'Equivalent fractions',   level: 'P4' },
    { id: 'mixed',    name: 'Mixed P5 review',         level: 'P5' },
    { id: 'custom',   name: 'Choose from skill graph', level: '—' },
  ];

  return (
    <div style={{ background: T.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ParentScreenHeader onBack={onBack} title="Worksheet generator"
        subtitle="Printable PDF · ready in 10 seconds" />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {/* Topic */}
        <FormStep n={1} label="Topic">
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {topics.map((t, i) => {
              const sel = topic === t.id;
              return (
                <div key={t.id} onClick={() => setTopic(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < topics.length - 1 ? `1px solid ${T.hairline}` : 'none',
                  background: sel ? T.navy050 : T.paper,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? T.navy700 : T.hairline}`,
                    background: sel ? T.navy700 : T.paper,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>{t.name}</span>
                      {t.recommended && <Chip size="s" tone="gold" icon={<IconSparkle size={9} />}>AI pick</Chip>}
                    </div>
                    <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{t.level}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </FormStep>

        {/* Length */}
        <FormStep n={2} label="Length">
          <Card padding={16}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
            }}>
              <div>
                <div style={{
                  fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 600,
                  color: T.navy700, letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>{length}</div>
                <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>questions</div>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: T.hairline }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>
                  ~{Math.round(length / 4)} pages · {Math.round(length * 0.8)} min
                </div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 2 }}>
                  {length <= 15 ? 'Quick review' : length <= 25 ? 'Standard sheet' : 'Long-form practice'}
                </div>
              </div>
            </div>
            <input type="range" min="10" max="40" value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: T.navy700 }} />
          </Card>
        </FormStep>

        {/* Difficulty */}
        <FormStep n={3} label="Difficulty">
          <div style={{ display: 'flex', gap: 8 }}>
            {['Easier', 'On level', 'Stretch'].map((d, i) => {
              const id = ['easier','on-level','stretch'][i];
              return (
                <button key={d} onClick={() => setDiff(id)} style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: diff === id ? T.navy050 : T.paper,
                  border: `1px solid ${diff === id ? T.navy500 : T.hairline}`,
                  fontSize: 12, fontWeight: 600,
                  color: diff === id ? T.navy700 : T.ink700,
                }}>{d}</button>
              );
            })}
          </div>
        </FormStep>

        {/* Worksheet type */}
        <FormStep n={4} label="Type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'practice', icon: IconDoc, label: 'Practice only', sub: 'Questions and answer space' },
              { id: 'practice-solutions', icon: IconLightbulb, label: 'Practice with worked solutions', sub: 'Step-by-step at the back', recommended: true },
              { id: 'mastery', icon: IconLayers, label: 'Mastery revision', sub: 'Mixed difficulty + cumulative review' },
            ].map(t => {
              const I = t.icon;
              const sel = type === t.id;
              return (
                <Card key={t.id} padding={14} onClick={() => setType(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: sel ? T.navy050 : T.paper,
                  border: `1px solid ${sel ? T.navy500 : T.hairline}`,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    background: sel ? T.navy700 : T.bone,
                    color: sel ? T.gold500 : T.navy700,
                    display: 'grid', placeItems: 'center',
                  }}><I size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>{t.label}</span>
                      {t.recommended && <Chip size="s" tone="gold">Most useful</Chip>}
                    </div>
                    <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{t.sub}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? T.navy700 : T.hairline}`,
                    background: sel ? T.navy700 : T.paper,
                  }} />
                </Card>
              );
            })}
          </div>
        </FormStep>
      </div>

      {/* Sticky bottom — 3 actions */}
      <div style={{
        padding: '14px 20px 22px',
        background: T.paper, borderTop: `1px solid ${T.hairline}`,
      }}>
        <Button variant="primary" size="l" fullWidth onClick={onGenerated}
          iconRight={<IconArrowRight size={18} />}
          style={{ marginBottom: 8 }}>
          Generate PDF
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="m" style={{ flex: 1 }}
            icon={<IconArrowRight size={14} />}>
            Send to Aria
          </Button>
          <Button variant="secondary" size="m" style={{ flex: 1 }}
            icon={<IconPrint size={14} />}>
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ParentAssign, ParentMistakes, ParentWorksheet, FormStep });
