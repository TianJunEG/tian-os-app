// screens-mvp.jsx — 10-screen Student MVP additions
// Refined "Today" dashboard + 5 new screens.
// Reuses existing primitives, ios-frame, icons, tokens.

const { useState: useMVPState, useMemo: useMVPMemo } = React;

// =====================================================================
// SCREEN — Today (refined dashboard, single-purpose)
// =====================================================================
function ScreenToday({ onOpenLauncher, onContinue, onOpenAssignments }) {
  const tasks = [
    { id: 't1', title: 'Daily fluency sprint', sub: '12 questions · ~5 min', module: 'Fluency', tone: T.modMath, mark: 'Σ', state: 'next' },
    { id: 't2', title: 'Equivalent fractions', sub: 'Continue · P4 · 54% mastered', module: 'MathPath', tone: T.modMath, mark: 'Σ', state: 'queued' },
    { id: 't3', title: 'Spelling list 14 review', sub: '10 words · spaced revision', module: 'Spelling', tone: T.modSpell, mark: 'Aa', state: 'queued' },
    { id: 't4', title: 'Mistake review · regrouping', sub: '4-min remediation queued by AI', module: 'M-to-M', tone: T.gold500, mark: '!', state: 'queued', flag: true },
  ];

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Greeting */}
      <div style={{ padding: '54px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`,
          color: T.paper, display: 'grid', placeItems: 'center',
          fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 18,
        }}>A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: T.ink500, fontWeight: 500 }}>Wednesday, 14 May</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>Morning, Aria</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.gold100, padding: '8px 12px', borderRadius: 999,
          color: T.gold700, fontWeight: 600, fontSize: 13,
        }}>
          <IconFlame size={14} color={T.gold500} />12
        </div>
      </div>

      {/* Today's plan — one CTA */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={22} radius={24} style={{
          background: `linear-gradient(135deg, ${T.navy700} 0%, ${T.navy900} 100%)`,
          border: 'none', color: T.paper, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -50, right: -40, width: 180, height: 180,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.22), transparent 70%)',
          }} />
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: T.gold300, marginBottom: 10,
          }}>Today's plan · 1 of 4 done</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 14,
          }}>Pick up where you left off — fractions fluency</div>

          {/* Progress strip */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i === 1 ? T.gold500 : 'rgba(255,255,255,.18)',
              }} />
            ))}
          </div>

          <Button variant="gold" size="m" fullWidth onClick={onContinue}
            iconRight={<IconArrowRight size={16} />}>
            Continue learning
          </Button>
        </Card>
      </div>

      {/* Today's tasks — focused list */}
      <Section title="Today's tasks" action={<Chip size="s" tone="navy">{tasks.length}</Chip>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {tasks.map((t, i) => (
            <div key={t.id} onClick={i === 0 ? onContinue : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < tasks.length - 1 ? `1px solid ${T.hairline}` : 'none',
              cursor: i === 0 ? 'pointer' : 'default',
              background: i === 0 ? T.navy050 : 'transparent',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: t.tone, color: t.flag ? T.navy900 : T.paper,
                display: 'grid', placeItems: 'center',
                fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 15,
              }}>{t.mark}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: t.flag ? T.gold700 : T.ink500,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{t.module}</span>
                  {i === 0 && <Chip size="s" tone="navy">Next</Chip>}
                  {t.flag && <Chip size="s" tone="gold" icon={<IconSparkle size={9} />}>AI</Chip>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.ink700, lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: T.ink500, marginTop: 1 }}>{t.sub}</div>
              </div>
              {i === 0
                ? <IconArrowRight size={16} color={T.navy700} />
                : <IconChevronRight size={16} color={T.ink300} />}
            </div>
          ))}
        </Card>
      </Section>

      {/* Quick stats */}
      <Section title="This week">
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat label="Mastery" value="68" suffix="%" delta="+3" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Practice" value="42" suffix="min" delta="+18" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Streak" value="12" suffix="d" />
          </div>
        </Card>
      </Section>

      {/* Open practice launcher */}
      <Section title="Or explore">
        <Card padding={16} onClick={onOpenLauncher} active style={{
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: T.navy050, color: T.navy700,
            display: 'grid', placeItems: 'center',
          }}><IconGrid size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700 }}>All practice modules</div>
            <div style={{ fontSize: 12, color: T.ink500, marginTop: 1 }}>MathPath, Fluency, Spelling, Science…</div>
          </div>
          <IconChevronRight size={16} color={T.ink300} />
        </Card>
      </Section>
    </div>
  );
}

// =====================================================================
// SCREEN — Practice App Launcher
// =====================================================================
function ScreenLauncher({ onBack, onOpenMathPath, onOpenFluency, onOpenRemediation }) {
  const featured = {
    id: 'mathpath', name: 'MathPath', sub: 'Adaptive math mastery',
    mark: 'Σ', tone: T.modMath, mastery: 68,
    blurb: 'Where you left off',
    cta: 'Continue',
  };
  const modules = [
    { id: 'fluency',  name: 'Fluency',  sub: 'Speed + accuracy', mark: '⚡', tone: T.gold500, fg: T.navy900, status: 'Daily sprint ready' },
    { id: 'm2m',      name: 'Mistake-to-Mastery', sub: 'Pattern fix-ups', mark: '!', tone: T.error500, status: '3 queued by AI', flag: true },
    { id: 'spelling', name: 'Spelling', sub: 'Adaptive word lists', mark: 'Aa', tone: T.modSpell, status: 'List 14 today' },
    { id: 'science',  name: 'Science',  sub: 'Concept revision', mark: '⌬', tone: T.modScience, status: 'New chapter' },
    { id: 'lifelab',  name: 'LifeLab',  sub: 'Real-world projects', mark: '◐', tone: T.modPlan, status: 'Coming soon', dim: true },
  ];

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ScreenHeader onBack={onBack} title="Practice" subtitle="Pick a module to work on" />

      {/* Featured */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={22} onClick={onOpenMathPath} active style={{
          background: `linear-gradient(135deg, ${T.navy700} 0%, ${T.navy900} 100%)`,
          border: 'none', color: T.paper, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.18), transparent 70%)',
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: T.gold500, color: T.navy900,
              display: 'grid', placeItems: 'center',
              fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 24,
            }}>{featured.mark}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.gold300,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
              }}>{featured.blurb}</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
                color: T.paper, letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>{featured.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{featured.sub}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
                <div style={{
                  width: `${featured.mastery}%`, height: '100%',
                  background: T.gold500, borderRadius: 999,
                }} />
              </div>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 6,
                fontVariantNumeric: 'tabular-nums',
              }}>{featured.mastery}% mastery</div>
            </div>
            <Button variant="gold" size="s" iconRight={<IconArrowRight size={14} />}>
              {featured.cta}
            </Button>
          </div>
        </Card>
      </div>

      {/* Module grid */}
      <Section title="All modules">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {modules.map(m => (
            <Card key={m.id} padding={16} radius={18} onClick={
              m.dim ? undefined :
              m.id === 'fluency' ? onOpenFluency :
              m.id === 'm2m' ? onOpenRemediation : undefined
            } style={{
              opacity: m.dim ? 0.55 : 1,
              cursor: m.dim ? 'default' : 'pointer',
              position: 'relative',
            }}>
              {m.flag && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 6, height: 6, borderRadius: '50%', background: T.gold500,
                }} />
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: m.tone, color: m.fg || T.paper,
                display: 'grid', placeItems: 'center',
                fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 17,
                marginBottom: 12,
              }}>{m.mark}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.ink500, marginTop: 2, lineHeight: 1.3 }}>{m.sub}</div>
              <div style={{
                marginTop: 12, paddingTop: 10,
                borderTop: `1px solid ${T.hairline}`,
                fontSize: 11, color: m.flag ? T.gold700 : T.ink500,
                fontWeight: 500,
              }}>{m.status}</div>
            </Card>
          ))}
        </div>
      </Section>

      <div style={{ padding: '20px 20px 0' }}>
        <Hint label="What's next" title="More modules">
          LifeLab launches in the next release. Science Adaptive Revision rolls out chapter-by-chapter.
        </Hint>
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN — Topic Detail
// =====================================================================
function ScreenTopicDetail({ onBack, onStartPractice }) {
  const subskills = [
    { name: 'Recognise equivalents', mastery: 78, state: 'proficient' },
    { name: 'Build equivalents (× method)', mastery: 54, state: 'practising', current: true },
    { name: 'Simplify to lowest terms', mastery: 32, state: 'practising' },
    { name: 'Compare via equivalents', mastery: 12, state: 'introduced' },
  ];

  const stateColor = {
    mastered: T.success500,
    proficient: T.navy700,
    practising: T.navy300,
    introduced: T.ink300,
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      <ScreenHeader onBack={onBack} title="Equivalent fractions" subtitle="MathPath · P4 · part of Fractions" />

      {/* Hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={22} style={{ background: T.ivory }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring value={54} size={80} stroke={8} label="54%" sub="mastery" />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.ink500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Diagnostic complete</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.25,
              }}>You're practising</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 4, lineHeight: 1.45 }}>
                3 sessions to proficient · 6 to mastery
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Skill breakdown */}
      <Section title="Sub-skills" action={<span style={{ fontSize: 11, color: T.ink500, fontWeight: 600 }}>4 in this topic</span>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {subskills.map((s, i) => (
            <div key={s.name} style={{
              padding: '14px 18px',
              borderBottom: i < subskills.length - 1 ? `1px solid ${T.hairline}` : 'none',
              background: s.current ? T.gold100 : 'transparent',
              borderLeft: s.current ? `3px solid ${T.gold500}` : '3px solid transparent',
              paddingLeft: s.current ? 15 : 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: stateColor[s.state],
                }} />
                <span style={{
                  flex: 1, fontSize: 13, fontWeight: s.current ? 600 : 500, color: T.ink700,
                }}>{s.name}</span>
                {s.current && <Chip size="s" tone="gold">Now</Chip>}
                <span style={{
                  fontSize: 11, color: T.ink500, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>{s.mastery}%</span>
              </div>
              <ProgressBar value={s.mastery} color={stateColor[s.state]} height={4} />
            </div>
          ))}
        </Card>
      </Section>

      {/* Recommended practice */}
      <Section title="Recommended">
        <Card padding={16} style={{
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: T.navy050, color: T.navy700,
            display: 'grid', placeItems: 'center',
          }}><IconBolt size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>Build equivalents — 8 q</div>
            <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>~5 min · adaptive difficulty</div>
          </div>
          <Chip size="s" tone="navy">Best fit</Chip>
        </Card>
      </Section>

      {/* Sticky CTA */}
      <div style={{
        position: 'sticky', bottom: 88, marginTop: 24, padding: '0 20px',
      }}>
        <Button variant="primary" size="l" fullWidth onClick={onStartPractice}
          iconRight={<IconArrowRight size={18} />}>
          Start practice
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN — Question Practice (non-timed, hint + check)
// =====================================================================
function ScreenQuestion({ onBack, onMistake }) {
  const [selected, setSelected] = useMVPState(null);
  const [checked, setChecked] = useMVPState(false);
  const [showHint, setShowHint] = useMVPState(false);

  const options = [
    { id: 'a', label: '4/6', correct: false },
    { id: 'b', label: '6/9', correct: true },
    { id: 'c', label: '3/5', correct: false },
    { id: 'd', label: '5/8', correct: false },
  ];

  const isCorrect = selected && options.find(o => o.id === selected)?.correct;

  return (
    <div style={{ background: T.paper, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '54px 20px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 12,
          background: T.bone, display: 'grid', placeItems: 'center', color: T.navy700,
        }}><IconX size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, color: T.ink500, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Equivalent fractions</div>
          <div style={{
            fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
            fontSize: 13, color: T.ink700, fontWeight: 600, marginTop: 1,
          }}>Question 3 of 8</div>
        </div>
        <button onClick={() => setShowHint(h => !h)} style={{
          height: 36, padding: '0 10px', borderRadius: 999,
          background: showHint ? T.gold500 : T.gold100,
          color: showHint ? T.navy900 : T.gold700,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600,
        }}>
          <IconLightbulb size={14} /> Hint
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 4 }}>
        {[1,2,3,4,5,6,7,8].map(n => (
          <div key={n} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: n < 3 ? T.success500 : n === 3 ? T.navy700 : T.bone,
          }} />
        ))}
      </div>

      {/* Question */}
      <div style={{ padding: '32px 24px 20px', textAlign: 'center' }}>
        <div style={{
          fontSize: 11, color: T.ink500, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
        }}>Find an equivalent</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 500,
          color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>Which fraction equals <span style={{
          display: 'inline-block', verticalAlign: 'middle',
          margin: '0 6px', textAlign: 'center',
        }}>
          <span style={{ display: 'block', fontSize: 24, lineHeight: 1, fontWeight: 600 }}>2</span>
          <span style={{
            display: 'block', height: 2, background: T.navy700, margin: '4px 0',
          }} />
          <span style={{ display: 'block', fontSize: 24, lineHeight: 1, fontWeight: 600 }}>3</span>
        </span> ?</div>
      </div>

      {/* Hint */}
      {showHint && (
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{
            background: T.gold100, border: `1px solid ${T.gold300}`,
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <IconLightbulb size={16} color={T.gold700} />
            <div style={{ fontSize: 12, color: T.ink700, lineHeight: 1.5 }}>
              Multiply the top and bottom by the <b>same number</b>. Try ×2, ×3, ×4…
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div style={{
        flex: 1, padding: '12px 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {options.map(o => {
          const isSel = selected === o.id;
          const isThisCorrect = checked && o.correct;
          const isThisWrong = checked && isSel && !o.correct;
          const bg = isThisCorrect ? T.success100
                   : isThisWrong ? T.error100
                   : isSel ? T.navy050
                   : T.paper;
          const border = isThisCorrect ? T.success500
                       : isThisWrong ? T.error500
                       : isSel ? T.navy500
                       : T.hairline;
          const color = isThisCorrect ? T.success500
                      : isThisWrong ? T.error500
                      : isSel ? T.navy700
                      : T.ink700;
          return (
            <button key={o.id}
              onClick={() => !checked && setSelected(o.id)}
              disabled={checked}
              style={{
                height: 56, padding: '0 18px',
                background: bg, border: `1.5px solid ${border}`,
                borderRadius: 16, color,
                fontFamily: T.fontText, fontSize: 18, fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: `all 200ms ${T.easeCalm}`,
                cursor: checked ? 'default' : 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isSel ? T.navy700 : T.bone,
                  color: isSel ? T.paper : T.ink500,
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>{o.id.toUpperCase()}</span>
                {o.label}
              </span>
              {isThisCorrect && <IconCheck size={20} />}
              {isThisWrong && <IconX size={20} />}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ padding: '0 20px 28px' }}>
        {!checked ? (
          <Button variant="primary" size="l" fullWidth
            onClick={() => selected && setChecked(true)}
            style={{ opacity: selected ? 1 : 0.4, pointerEvents: selected ? 'auto' : 'none' }}>
            Check answer
          </Button>
        ) : isCorrect ? (
          <Button variant="primary" size="l" fullWidth
            iconRight={<IconArrowRight size={18} />}
            onClick={() => { setChecked(false); setSelected(null); setShowHint(false); }}>
            Next question
          </Button>
        ) : (
          <Button variant="primary" size="l" fullWidth
            iconRight={<IconArrowRight size={18} />}
            onClick={onMistake}>
            See how it works
          </Button>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN — Mistake Review (calmer, structured)
// =====================================================================
function ScreenMistakeReview({ onBack, onPractice }) {
  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      {/* Banner */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', background: T.gold100, borderRadius: 12,
          margin: '8px 0 16px',
        }}>
          <IconRevise size={14} color={T.gold700} />
          <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: T.gold700 }}>
            Reviewing a mistake from <b>yesterday</b>
          </div>
        </div>
      </div>

      <ScreenHeader onBack={onBack} title="Let's revisit this" subtitle="One question · clear method · short practice" />

      {/* Question recap */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={20}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.ink500,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
          }}>The question</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 500,
            color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}>305 − 178 = ?</div>

          {/* Two-answer comparison */}
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: T.error100, border: `1px solid ${T.error500}20`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: T.error500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Your answer</div>
              <div style={{
                fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                fontSize: 22, fontWeight: 600, color: T.error500,
                textDecoration: 'line-through', textDecorationThickness: 1,
              }}>237</div>
            </div>
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: T.success100, border: `1px solid ${T.success500}20`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: T.success500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Correct</div>
              <div style={{
                fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                fontSize: 22, fontWeight: 600, color: T.success500,
              }}>127</div>
            </div>
          </div>
        </Card>
      </div>

      {/* The method */}
      <Section title="The method">
        <Card padding={18}>
          <div style={{
            fontSize: 13, color: T.ink700, lineHeight: 1.55, marginBottom: 14,
          }}>
            When we regroup across a zero, the zero doesn't stay a zero — it becomes a nine as the regroup ripples through.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { i: 1, t: 'Ones', d: '5 − 8 doesn\'t work. We need to regroup from the tens.' },
              { i: 2, t: 'Cascade', d: 'Tens are 0 — keep walking left. Hundreds: 3 → 2. Tens: 0 → 10.' },
              { i: 3, t: 'Subtract', d: 'Tens (10) give 1 to ones: 9 and 15. Now subtract right-to-left.' },
            ].map(s => (
              <div key={s.i} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: T.navy700, color: T.gold500,
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>{s.i}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: T.ink500, marginTop: 2, lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Similar practice */}
      <Section title="Similar practice">
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: T.gold100, color: T.gold700,
            display: 'grid', placeItems: 'center',
          }}><IconLayers size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>5 quick problems</div>
            <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>Regrouping across zero · ~2 min</div>
          </div>
          <Chip size="s" tone="gold">Recommended</Chip>
        </Card>
      </Section>

      {/* Sticky CTA */}
      <div style={{
        position: 'sticky', bottom: 88, marginTop: 24, padding: '0 20px',
      }}>
        <Button variant="primary" size="l" fullWidth onClick={onPractice}
          iconRight={<IconArrowRight size={18} />}>
          Try similar problems
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN — Assignments
// =====================================================================
function ScreenAssignments({ onBack }) {
  const [filter, setFilter] = useMVPState('all');
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'tutor', label: 'Tutor' },
    { id: 'parent', label: 'Parent' },
    { id: 'school', label: 'School' },
  ];
  const assignments = [
    { id: 1, src: 'tutor', srcName: 'Ms. Lim', title: 'Fractions paper 1', module: 'MathPath', due: 'Today', urgent: true, progress: 60, total: '12 q', subname: 'Worked: 7 of 12' },
    { id: 2, src: 'parent', srcName: 'Mom', title: 'Daily spelling list', module: 'Spelling', due: 'Today', progress: 100, total: '10 words', subname: 'Done · review later' },
    { id: 3, src: 'school', srcName: 'P5 Math', title: 'Mid-term review pack', module: 'MathPath', due: 'Fri', progress: 25, total: '24 q', subname: 'Worked: 6 of 24' },
    { id: 4, src: 'tutor', srcName: 'Ms. Lim', title: 'Science: Light & shadows', module: 'Science', due: 'Next Tue', progress: 0, total: '8 q', subname: 'Not started' },
  ];

  const shown = filter === 'all' ? assignments : assignments.filter(a => a.src === filter);

  const sourceTone = {
    tutor:  { bg: T.gold100, fg: T.gold700, mark: '◆' },
    parent: { bg: T.navy050, fg: T.navy700, mark: '♥' },
    school: { bg: T.success100, fg: T.success500, mark: '◼' },
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      <ScreenHeader onBack={onBack} title="Assignments" subtitle={`${assignments.filter(a => a.progress < 100).length} active · ${assignments.filter(a => a.progress === 100).length} done`} />

      {/* Filter chips */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', gap: 6,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height: 32, padding: '0 14px', borderRadius: 999,
            background: filter === f.id ? T.navy700 : T.paper,
            color: filter === f.id ? T.paper : T.ink700,
            border: `1px solid ${filter === f.id ? 'transparent' : T.hairline}`,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            transition: `all 200ms ${T.easeCalm}`,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Urgent banner */}
      {filter === 'all' && (
        <div style={{ padding: '0 20px 12px' }}>
          <Card padding={16} radius={18} style={{
            background: `linear-gradient(135deg, ${T.navy700}, ${T.navy900})`,
            border: 'none', color: T.paper,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: T.gold500, color: T.navy900,
              display: 'grid', placeItems: 'center',
            }}><IconClock size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, color: T.gold300, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1,
              }}>Due today</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Fractions paper 1</div>
            </div>
            <Button variant="gold" size="s" iconRight={<IconArrowRight size={14} />}>Continue</Button>
          </Card>
        </div>
      )}

      {/* List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(a => {
          const tone = sourceTone[a.src];
          const done = a.progress === 100;
          return (
            <Card key={a.id} padding={16}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: tone.bg, color: tone.fg,
                  display: 'grid', placeItems: 'center',
                  fontFamily: T.fontText, fontWeight: 700, fontSize: 13,
                }}>{tone.mark}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: tone.fg,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>From {a.srcName}</span>
                    <span style={{ color: T.ink300 }}>·</span>
                    <span style={{ fontSize: 10, color: T.ink500, fontWeight: 500 }}>{a.module}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{a.subname}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: a.urgent ? T.error500 : done ? T.success500 : T.ink500,
                  whiteSpace: 'nowrap',
                }}>{done ? 'Done' : a.due}</div>
              </div>
              {!done && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={a.progress} color={a.urgent ? T.gold500 : T.navy700} height={5} />
                  </div>
                  <Button variant="secondary" size="s"
                    iconRight={<IconArrowRight size={14} />}>
                    {a.progress > 0 ? 'Continue' : 'Start'}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN — Progress Overview
// =====================================================================
function ScreenProgress({ onBack, onOpenPathway }) {
  const weeklyBars = [
    { d: 'M', m: 18 }, { d: 'T', m: 32 }, { d: 'W', m: 42 },
    { d: 'T', m: 28 }, { d: 'F', m: 38 }, { d: 'S', m: 12 }, { d: 'S', m: 0 },
  ];
  const maxM = Math.max(...weeklyBars.map(b => b.m));

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ScreenHeader onBack={onBack} title="Progress" subtitle="Mastery, practice, and what to work on" />

      {/* Hero — overall mastery */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={22} radius={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring value={68} size={96} stroke={10} label="68%" sub="mastery" gold />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.success500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Up 3 this week</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>Approaching proficient</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 4, lineHeight: 1.45 }}>
                Across MathPath, Spelling, and Reading
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly practice bars */}
      <Section title="This week" action={<span style={{ fontSize: 11, color: T.success500, fontWeight: 600 }}>+18 min</span>}>
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <Stat label="Practice" value="170" suffix="min" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Accuracy" value="89" suffix="%" delta="+4" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Speed" value="1.6" suffix="s" delta="-0.3s" />
          </div>

          {/* Mini bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
            {weeklyBars.map((b, i) => {
              const h = b.m === 0 ? 4 : (b.m / maxM) * 64;
              const isToday = i === 2;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', height: h,
                    borderRadius: 6,
                    background: b.m === 0 ? T.bone : isToday ? T.gold500 : T.navy500,
                    transition: `all 600ms ${T.easeCalm}`,
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isToday ? T.gold700 : T.ink500,
                  }}>{b.d}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      {/* Strongest */}
      <Section title="Strongest skills">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Like fractions', module: 'MathPath', val: 96 },
            { name: '×7 & ×8 tables', module: 'MathPath', val: 92 },
            { name: 'Spelling list 12', module: 'Spelling', val: 90 },
          ].map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                background: T.success100, color: T.success500,
                display: 'grid', placeItems: 'center',
              }}><IconCheck size={14} stroke={2.5} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{s.module}</div>
              </div>
              <span style={{
                fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                fontSize: 13, fontWeight: 600, color: T.success500,
              }}>{s.val}%</span>
            </div>
          ))}
        </Card>
      </Section>

      {/* Weak topics */}
      <Section title="Work on next" action={<Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>AI pick</Chip>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Regrouping across zero', module: 'MathPath', val: 38, urgent: true },
            { name: 'Equivalent fractions', module: 'MathPath', val: 54 },
            { name: 'Inference (passages)', module: 'Reading', val: 48 },
          ].map((s, i) => (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                background: s.urgent ? T.gold100 : T.navy050,
                color: s.urgent ? T.gold700 : T.navy700,
                display: 'grid', placeItems: 'center',
              }}><IconBolt size={14} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{s.module} · {s.val}% mastered</div>
              </div>
              <IconChevronRight size={16} color={T.ink300} />
            </div>
          ))}
        </Card>
      </Section>

      <div style={{ padding: '20px 20px 0' }}>
        <Button variant="secondary" size="m" fullWidth onClick={onOpenPathway}
          iconRight={<IconArrowRight size={16} />}>
          View full skill graph
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenToday, ScreenLauncher, ScreenTopicDetail,
  ScreenQuestion, ScreenMistakeReview, ScreenAssignments, ScreenProgress,
});
