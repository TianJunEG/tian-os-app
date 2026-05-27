// parent-screens-a.jsx — Parent screens 1-4
// Home, Progress, Weak Topics, Recommended Actions

const { useState: usePA1 } = React;

// =====================================================================
// 1. PARENT HOME
// =====================================================================
function ParentHome({ onActions, onWeak, onProgress, onMistake }) {
  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top — greeting + child selector */}
      <div style={{ padding: '54px 20px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: T.ink500, fontWeight: 500 }}>Wednesday, 14 May</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>Evening, Daniel</div>
        </div>
        <ChildSelector />
      </div>

      {/* Status hero — calm, parent-friendly */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={22} radius={24} style={{
          background: `linear-gradient(135deg, ${T.navy700}, ${T.navy900})`,
          border: 'none', color: T.paper, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -50, right: -40, width: 180, height: 180,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.22), transparent 70%)',
          }} />
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.gold300,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
          }}>Aria's week · so far</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 4,
          }}>Steady progress. Up <span style={{ color: T.gold500 }}>3 points</span> this week.</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, lineHeight: 1.5, marginTop: 6, marginBottom: 16 }}>
            Mastery: 68%. Practice on 4 of 5 days. Confidence rising.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, padding: '10px 12px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mastery</div>
              <div style={{ fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                68<span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>%</span>
              </div>
            </div>
            <div style={{
              flex: 1, padding: '10px 12px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Practice</div>
              <div style={{ fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                42<span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>min</span>
              </div>
            </div>
            <div style={{
              flex: 1, padding: '10px 12px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Streak</div>
              <div style={{ fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                12<span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>d</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's recommended action — single, prominent */}
      <Section title="Today" action={<Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>AI</Chip>}>
        <Card padding={18} onClick={onActions} active style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13, flexShrink: 0,
              background: T.gold500, color: T.navy900,
              display: 'grid', placeItems: 'center',
            }}><IconLightbulb size={20} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.3,
              }}>Aria slipped on fractions 3 times.</div>
              <div style={{ fontSize: 13, color: T.ink500, marginTop: 4, lineHeight: 1.45 }}>
                A short 10-minute fraction practice today would close it for good.
              </div>
            </div>
          </div>
          <Button variant="primary" size="m" fullWidth onClick={onActions}
            iconRight={<IconArrowRight size={16} />}>
            View recommended actions
          </Button>
        </Card>
      </Section>

      {/* Recent practice — minimal line */}
      <Section title="Recent practice" action={<button onClick={onProgress} style={{ background: 'none', border: 'none', fontSize: 11, color: T.navy700, fontWeight: 600, cursor: 'pointer' }}>See all</button>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { time: '6:12pm', title: 'Fluency drill · subtraction', meta: '12q · 91% · 1.6s', tone: 'good' },
            { time: '8:40am', title: 'Equivalent fractions', meta: 'Practised 8 mins', tone: 'good' },
            { time: 'Yesterday', title: 'Spelling list 14', meta: 'Completed', tone: 'done' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: T.success500,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{r.meta}</div>
              </div>
              <span style={{
                fontSize: 11, color: T.ink500, fontWeight: 500,
                whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
              }}>{r.time}</span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Weak topic alert */}
      <Section title="Worth a look">
        <Card padding={16} onClick={onWeak} active style={{
          display: 'flex', alignItems: 'center', gap: 12,
          border: `1px solid ${T.gold300}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: T.gold100, color: T.gold700,
            display: 'grid', placeItems: 'center',
          }}><IconBolt size={16} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: T.gold700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Weak topic</span>
              <span style={{ color: T.ink300 }}>·</span>
              <span style={{ fontSize: 10, color: T.ink500, fontWeight: 500 }}>MathPath · P5</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>Regrouping across zero</div>
            <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>Mastery 38% — could use 10 minutes</div>
          </div>
          <IconChevronRight size={16} color={T.ink300} />
        </Card>
      </Section>
    </div>
  );
}

// =====================================================================
// 2. CHILD PROGRESS OVERVIEW
// =====================================================================
function ParentProgress({ onBack }) {
  const [tab, setTab] = usePA1('math');
  const subjects = [
    { id: 'math',    label: 'Math',    mastery: 68, delta: '+3' },
    { id: 'english', label: 'English', mastery: 74, delta: '+1' },
    { id: 'science', label: 'Science', mastery: 61, delta: '+5' },
  ];
  const current = subjects.find(s => s.id === tab);

  const weeklyBars = [
    { d: 'Mon', m: 18 }, { d: 'Tue', m: 32 }, { d: 'Wed', m: 42 },
    { d: 'Thu', m: 28 }, { d: 'Fri', m: 38 }, { d: 'Sat', m: 12 }, { d: 'Sun', m: 0 },
  ];
  const maxM = Math.max(...weeklyBars.map(b => b.m));

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ParentScreenHeader title="Aria's progress" subtitle="Mastery, practice, what's strengthening" />

      {/* Subject tabs */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', gap: 6,
      }}>
        {subjects.map(s => (
          <button key={s.id} onClick={() => setTab(s.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 14,
            background: tab === s.id ? T.navy700 : T.paper,
            color: tab === s.id ? T.paper : T.ink700,
            border: `1px solid ${tab === s.id ? 'transparent' : T.hairline}`,
            transition: `all 200ms ${T.easeCalm}`,
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
            <div style={{
              fontSize: 11, fontWeight: 500,
              color: tab === s.id ? 'rgba(255,255,255,.7)' : T.ink500,
              marginTop: 2, fontVariantNumeric: 'tabular-nums',
            }}>{s.mastery}% · {s.delta}</div>
          </button>
        ))}
      </div>

      {/* Mastery hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={22} radius={22}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring value={current.mastery} size={92} stroke={9}
              label={`${current.mastery}%`} sub="mastery" gold={current.mastery >= 70} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.success500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>This week {current.delta}</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.25,
              }}>{current.mastery >= 75 ? 'Strong and steady' :
                  current.mastery >= 60 ? 'Approaching proficient' :
                  'Building momentum'}</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 4, lineHeight: 1.45 }}>
                {current.label === 'Math' ? '4 of 5 days practised · 91% accuracy' :
                 current.label === 'English' ? '5 of 5 days practised · 88% accuracy' :
                 '3 of 5 days practised · 84% accuracy'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Practice consistency */}
      <Section title="Practice consistency"
        action={<span style={{ fontSize: 11, color: T.success500, fontWeight: 600 }}>4 of 5 days</span>}>
        <Card padding={18}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {weeklyBars.map((b, i) => {
              const h = b.m === 0 ? 4 : (b.m / maxM) * 64;
              const isToday = i === 2;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', height: h, borderRadius: 6,
                    background: b.m === 0 ? T.bone :
                      isToday ? T.gold500 : T.navy500,
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isToday ? T.gold700 : T.ink500,
                  }}>{b.d[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      {/* What's strengthening */}
      <Section title="What's strengthening">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Multi-digit subtraction', delta: '+8' },
            { name: 'Equivalent fractions', delta: '+5' },
            { name: '×7 & ×8 fluency', delta: '+3' },
          ].map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                background: T.success100, color: T.success500,
                display: 'grid', placeItems: 'center',
              }}><IconCheck size={14} stroke={2.5} /></div>
              <span style={{ flex: 1, fontSize: 13, color: T.ink700, fontWeight: 500 }}>{s.name}</span>
              <span style={{
                fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                fontSize: 12, fontWeight: 600, color: T.success500,
              }}>{s.delta}</span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Hint for parents */}
      <div style={{ padding: '20px 20px 0' }}>
        <Hint label="How to read this" title="Mastery, not grades">
          We measure mastery (how solid a skill is) rather than test marks. Steady mastery
          gains usually translate to better results — and far less stress at exam time.
        </Hint>
      </div>
    </div>
  );
}

// =====================================================================
// 3. WEAK TOPICS SCREEN
// =====================================================================
function ParentWeakTopics({ onBack, onAssign, onMistakes, onWorksheet }) {
  const topics = [
    { id: 't1', name: 'Regrouping across zero', module: 'MathPath',  level: 'P5', mastery: 38, urgent: true,
      suggestion: '10-min fluency on subtraction across zero' },
    { id: 't2', name: 'Equivalent fractions',   module: 'MathPath',  level: 'P4', mastery: 54,
      suggestion: 'Worked examples then 8-question practice' },
    { id: 't3', name: 'Inference (passages)',   module: 'Reading',   level: 'P5', mastery: 48,
      suggestion: 'Read aloud + 3 inference questions' },
    { id: 't4', name: 'Forces & magnets',       module: 'Science',   level: 'P3', mastery: 51,
      suggestion: 'Diagnostic + concept revision' },
  ];

  const modTone = {
    'MathPath': { bg: T.navy050, fg: T.navy700, mark: 'Σ' },
    'Reading':  { bg: '#F4E6D9', fg: T.modRead, mark: 'Aa' },
    'Science':  { bg: '#DAE9EE', fg: T.modScience, mark: '⌬' },
    'Spelling': { bg: '#E8DAEE', fg: T.modSpell, mark: 'Sp' },
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      <ParentScreenHeader onBack={onBack} title="Weak topics"
        subtitle={`${topics.length} skills worth attention · ranked by impact`} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics.map(t => {
          const tone = modTone[t.module] || modTone['MathPath'];
          return (
            <Card key={t.id} padding={18} radius={18}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: tone.bg, color: tone.fg,
                  display: 'grid', placeItems: 'center',
                  fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 17,
                }}>{tone.mark}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: tone.fg,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{t.module}</span>
                    <span style={{ color: T.ink300 }}>·</span>
                    <span style={{ fontSize: 10, color: T.ink500, fontWeight: 500 }}>{t.level}</span>
                    {t.urgent && <Chip size="s" tone="gold" icon={<IconSparkle size={9} />}>Priority</Chip>}
                  </div>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em',
                  }}>{t.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                    fontSize: 18, fontWeight: 600,
                    color: t.mastery < 50 ? T.error500 : T.navy700,
                  }}>{t.mastery}%</div>
                  <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mastery</div>
                </div>
              </div>

              {/* Suggested action */}
              <div style={{
                padding: '10px 12px', background: T.ivory, borderRadius: 10,
                fontSize: 12, color: T.ink700, lineHeight: 1.5, marginBottom: 12,
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <IconLightbulb size={14} color={T.gold500} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><b style={{ color: T.navy700 }}>Suggested:</b> {t.suggestion}</span>
              </div>

              {/* 3 button actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <ActionMini icon={<IconBolt size={14} />} label="Assign" onClick={onAssign} primary />
                <ActionMini icon={<IconDoc size={14} />} label="Worksheet" onClick={onWorksheet} />
                <ActionMini icon={<IconRevise size={14} />} label="Mistakes" onClick={onMistakes} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ActionMini({ icon, label, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      height: 36, padding: '0 4px', borderRadius: 10,
      background: primary ? T.navy700 : T.paper,
      color: primary ? T.paper : T.navy700,
      border: primary ? 'none' : `1px solid ${T.hairline}`,
      fontSize: 11, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      {icon}{label}
    </button>
  );
}

// =====================================================================
// 4. RECOMMENDED ACTIONS
// =====================================================================
function ParentActions({ onBack, onAssign, onWorksheet, onTutor, onMistakes }) {
  const actions = [
    {
      group: 'Today', tone: 'gold',
      items: [
        { id: 'a1', icon: IconBolt, title: 'Do 10 minutes of fraction practice', why: 'Aria slipped on equivalents 3 times — short, focused practice will close the gap.',
          time: '10 min', cta: 'Assign now', action: 'assign', priority: true },
        { id: 'a2', icon: IconRevise, title: 'Review 3 recent mistakes together', why: 'Going through them with you makes the pattern click sooner.',
          time: '8 min', cta: 'Open mistakes', action: 'mistakes' },
      ],
    },
    {
      group: 'This week', tone: 'navy',
      items: [
        { id: 'a3', icon: IconDoc, title: 'Send a mastery worksheet for the weekend', why: 'Aria practices best with a paper sheet on Sundays.',
          time: '2 pages · 15 min', cta: 'Generate', action: 'worksheet' },
        { id: 'a4', icon: IconUsers, title: 'Book a tutor consult if regrouping doesn\'t click', why: '20-min focused session with a P5 specialist. Only if practice alone doesn\'t resolve it.',
          time: 'optional', cta: 'See slots', action: 'tutor' },
      ],
    },
  ];

  const handle = {
    assign: onAssign, mistakes: onMistakes, worksheet: onWorksheet, tutor: onTutor,
  };

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ParentScreenHeader onBack={onBack} title="Recommended actions"
        subtitle="AI-suggested · ranked by impact for Aria" />

      {/* Note */}
      <div style={{ padding: '0 20px 16px' }}>
        <Hint label="How this works" title="Plain English, parent-friendly">
          We watch Aria's practice and surface the one or two things that would help most.
          You're in charge — assign, ignore, or do later. There's no pressure.
        </Hint>
      </div>

      {actions.map(group => (
        <Section key={group.group} title={group.group}
          action={group.tone === 'gold' ?
            <Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>Priority</Chip> :
            <Chip size="s" tone="navy">{group.items.length}</Chip>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.items.map(a => {
              const I = a.icon;
              return (
                <Card key={a.id} padding={18} radius={18} style={{
                  borderColor: a.priority ? T.gold300 : T.hairline,
                  background: a.priority ? `linear-gradient(180deg, ${T.gold100} 0%, ${T.paper} 60%)` : T.paper,
                }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                      background: a.priority ? T.gold500 : T.navy050,
                      color: a.priority ? T.navy900 : T.navy700,
                      display: 'grid', placeItems: 'center',
                    }}><I size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                        color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.3,
                      }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: T.ink500, marginTop: 4, lineHeight: 1.55 }}>{a.why}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Chip size="s" tone="outline" icon={<IconClock size={11} />}>{a.time}</Chip>
                    <div style={{ flex: 1 }} />
                    <Button variant={a.priority ? 'primary' : 'secondary'} size="s"
                      iconRight={<IconArrowRight size={14} />}
                      onClick={handle[a.action]}>
                      {a.cta}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}

Object.assign(window, {
  ParentHome, ParentProgress, ParentWeakTopics, ParentActions,
});
