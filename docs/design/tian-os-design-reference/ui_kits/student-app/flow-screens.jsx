// flow-screens.jsx — Screens specific to the guided MathPath flow prototype
// Reuses existing primitives + composes new screens for the journey

// =====================================================================
// SKILL INTRO — the recommended skill before practice
// =====================================================================
function FlowSkillIntro({ onBack, onStart }) {
  return (
    <div style={{ paddingBottom: 96, background: T.paper, minHeight: '100%' }}>
      <ScreenHeader
        onBack={onBack}
        title="Equivalent fractions"
        subtitle="P4 level · 5 min · adaptive"
      />

      {/* Hero card — why this now */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{
          background: T.ivory, border: `1px solid ${T.hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring value={54} size={76} stroke={8} label="54%" sub="mastery" />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.gold700,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Recommended for you</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.25,
              }}>This unlocks ratio mastery</div>
              <div style={{ fontSize: 12, color: T.ink500, lineHeight: 1.5, marginTop: 4 }}>
                Strengthen equivalent fractions first — your ratio progress is waiting on it.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Prerequisites status */}
      <Section title="Prerequisites">
        <Card padding={16}>
          {[
            { name: 'Like fractions', state: 'mastered' },
            { name: 'Times tables ×2–×10', state: 'mastered' },
            { name: 'Common factors', state: 'proficient' },
          ].map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: p.state === 'mastered' ? T.success500 : T.navy300,
                display: 'grid', placeItems: 'center', color: T.paper,
              }}><IconCheck size={12} stroke={2.5} /></div>
              <span style={{ flex: 1, fontSize: 13, color: T.ink700, fontWeight: 500 }}>{p.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: T.ink500,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{p.state === 'mastered' ? 'Mastered' : 'Proficient'}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="This session">
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.hairline}` }}>
            <Stat label="Questions" value="12" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Target" value="4" suffix="s" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Length" value="~5" suffix="min" />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: T.ink700, lineHeight: 1.5 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
              background: T.navy050, color: T.navy700,
              display: 'grid', placeItems: 'center',
            }}><IconSparkle size={11} /></div>
            <span>Difficulty rises with each correct streak. If you slip, we'll pause and help.</span>
          </div>
        </Card>
      </Section>

      {/* CTA */}
      <div style={{
        position: 'sticky', bottom: 88, padding: '20px',
        background: `linear-gradient(180deg, transparent, ${T.paper} 40%)`,
      }}>
        <Button variant="primary" size="l" fullWidth onClick={onStart}
          iconRight={<IconArrowRight size={18} />}>
          Start practice
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// FLOW PRACTICE — fluency screen with scripted mistake detection
// =====================================================================
function FlowPractice({ onBack, onMistakeDetected, forceMistake = false }) {
  // Subtraction deck — regrouping across zero is the misconception we surface
  const deck = [
    { q: '46 − 19', a: 27, target: 3 },
    { q: '83 − 47', a: 36, target: 3 },
    { q: '305 − 178', a: 127, target: 4 }, // ← mistake trigger
  ];

  // Demo state — defaults to showing the troublesome 305 − 178 question if
  // we are entering directly at "Mistake detected" (step 5 of the guided flow).
  const [idx, setIdx] = useState(forceMistake ? 2 : 0);
  const [input, setInput] = useState(forceMistake ? '237' : '');
  const [feedback, setFeedback] = useState(forceMistake ? 'no' : null);
  const [streak, setStreak] = useState(forceMistake ? 0 : 2);
  const [correct, setCorrect] = useState(forceMistake ? 8 : 8);
  const [done, setDone] = useState(forceMistake ? 9 : 8);
  const [elapsed, setElapsed] = useState(forceMistake ? 132 : 74);
  const [showMistake, setShowMistake] = useState(forceMistake);

  const total = 12;
  const q = deck[idx % deck.length];

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function submit(val) {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) return;
    // For the demo: questions 1 and 2 are "correct" no matter what.
    // Question 3 (305 - 178) is always marked WRONG to trigger remediation.
    const ok = idx < 2;
    setFeedback(ok ? 'ok' : 'no');
    if (ok) {
      setCorrect(c => c + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    setDone(d => d + 1);
    setTimeout(() => {
      if (idx >= 2) {
        // Trigger mistake overlay
        setShowMistake(true);
      } else {
        setIdx(i => i + 1);
        setInput('');
        setFeedback(null);
      }
    }, 1100);
  }

  function tapKey(k) {
    if (feedback) return;
    if (k === 'back') setInput(input.slice(0, -1));
    else if (k === 'enter') submit(input);
    else if (input.length < 4) setInput(input + k);
  }

  const pct = (done / total) * 100;
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{ background: T.paper, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: '54px 20px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
            fontSize: 13, color: T.ink700, fontWeight: 600, marginTop: 1,
          }}>{done} / {total}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.navy050, padding: '6px 10px', borderRadius: 999,
          color: T.navy700, fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
          fontWeight: 600, fontSize: 13,
        }}>
          <IconClock size={13} />{mm}:{ss}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ height: 3, borderRadius: 999, background: T.bone, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${T.navy700}, ${T.gold500})`,
            transition: `width 400ms ${T.easeCalm}`,
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
        <StreakRow streak={streak} />
      </div>

      {/* Big question */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 20px',
      }}>
        <div style={{
          fontSize: 11, color: T.ink500, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18,
        }}>Question {done + 1}</div>
        <div style={{
          fontFamily: T.fontDisplay, fontWeight: 500,
          fontSize: 60, color: T.navy700, letterSpacing: '-0.04em',
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          opacity: feedback ? 0.6 : 1,
          transition: `opacity 200ms ${T.easeCalm}`,
        }}>
          {q.q} <span style={{ color: T.ink300 }}>=</span>
        </div>

        <div style={{
          marginTop: 28, minHeight: 80, width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 50, fontWeight: 500,
            color: feedback === 'ok' ? T.success500 : feedback === 'no' ? T.error500 : T.navy700,
            letterSpacing: '-0.04em', minHeight: 58, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {input || <span style={{ color: T.ink100 }}>·</span>}
            {feedback === 'ok' && <IconCheck size={32} color={T.success500} />}
            {feedback === 'no' && <IconX size={32} color={T.error500} />}
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9'].map(k => (
            <KeyBtn key={k} onClick={() => tapKey(k)}>{k}</KeyBtn>
          ))}
          <KeyBtn onClick={() => tapKey('back')} muted><IconX size={20} /></KeyBtn>
          <KeyBtn onClick={() => tapKey('0')}>0</KeyBtn>
          <KeyBtn onClick={() => tapKey('enter')} primary><IconCheck size={20} /></KeyBtn>
        </div>
      </div>

      {/* Mistake overlay */}
      {showMistake && <MistakeOverlay onGetHelp={onMistakeDetected} onContinue={() => setShowMistake(false)} />}
    </div>
  );
}

// =====================================================================
// MISTAKE DETECTED — bottom-sheet intervention
// =====================================================================
function MistakeOverlay({ onGetHelp, onContinue }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(14,26,54,.45)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: T.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '20px 24px 28px', boxShadow: T.shadowOverlay,
      }}>
        {/* handle */}
        <div style={{ width: 36, height: 4, background: T.bone, borderRadius: 4, margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: T.gold500, color: T.navy900,
            display: 'grid', placeItems: 'center',
          }}><IconLightbulb size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 600,
              color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>Let's revisit this together</div>
            <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>
              Same pattern — 3 times this week
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: T.bone, borderRadius: 12,
          marginBottom: 18,
        }}>
          <div style={{
            fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
            fontSize: 15, fontWeight: 600, color: T.navy700,
          }}>305 − 178</div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
            fontSize: 13, color: T.error500, fontWeight: 600,
            textDecoration: 'line-through', opacity: 0.7,
          }}>237</div>
          <div style={{
            fontFamily: T.fontMono, fontVariantNumeric: 'tabular-nums',
            fontSize: 15, fontWeight: 600, color: T.success500,
          }}>127</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="l" onClick={onContinue}
            style={{ color: T.ink500, flex: 1 }}>
            Push through
          </Button>
          <Button variant="primary" size="l" onClick={onGetHelp}
            style={{ flex: 1.6 }}
            iconRight={<IconArrowRight size={18} />}>
            Get help — 4 min
          </Button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// MASTERY UPDATED — post-remediation confidence-builder
// =====================================================================
function FlowMasteryUpdated({ onContinue }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 240);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: T.ivory, height: '100%', overflow: 'auto', paddingBottom: 40 }}>
      <div style={{ padding: '70px 20px 16px', textAlign: 'center' }}>
        <div style={{
          position: 'relative', width: 80, height: 80,
          margin: '0 auto 14px',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1.5px solid ${T.gold500}`,
            opacity: 0.6,
            animation: `pulseRing 1800ms ${T.easeCalm} infinite`,
          }} />
          <style>{`@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.5 } 100% { transform: scale(1.18); opacity: 0 } }`}</style>
          <div style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            background: T.success100, color: T.success500,
            display: 'grid', placeItems: 'center',
            boxShadow: `0 0 0 4px ${T.paper}, 0 0 0 5px ${T.gold300}, 0 12px 28px -8px ${T.success500}40`,
          }}><IconCheck size={30} stroke={2.5} /></div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: T.gold700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>Mastery gained</div>
        <div style={{
          fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 28,
          color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>The pattern clicked.</div>
        <div style={{
          fontSize: 14, color: T.ink500, marginTop: 8, lineHeight: 1.5,
          maxWidth: 300, margin: '8px auto 0',
        }}>
          Regrouping across zero went from a sticking point to a solved pattern in 4 minutes.
        </div>
      </div>

      {/* Skill delta hero */}
      <div style={{ padding: '8px 20px 0' }}>
        <Card padding={20} radius={24}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.ink500,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
          }}>Regrouping across zero</div>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16,
          }}>
            <span style={{
              fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
              fontSize: 32, fontWeight: 600, color: T.navy700, letterSpacing: '-0.02em',
            }}>{animated ? 67 : 38}%</span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: T.success500,
              transition: `opacity 600ms ${T.easeCalm} 400ms`,
              opacity: animated ? 1 : 0,
            }}>↑ +29</span>
            <div style={{ flex: 1 }} />
            <span style={{
              fontSize: 11, fontWeight: 600, color: T.ink500,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Practising</span>
          </div>

          {/* Animated dual bar */}
          <div style={{ position: 'relative', height: 10, borderRadius: 999, background: T.bone, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '38%', background: T.navy300, borderRadius: 999,
            }} />
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: animated ? '67%' : '38%',
              background: T.navy700, borderRadius: 999,
              transition: `width 1000ms ${T.easeCalm}`,
            }} />
            {/* From-marker */}
            <div style={{
              position: 'absolute', left: '38%', top: -2, bottom: -2,
              width: 2, background: T.ink300,
            }} />
          </div>
          <div style={{
            display: 'flex', alignItems: 'baseline',
            fontSize: 10, color: T.ink500, marginTop: 6,
            fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}>
            <span style={{ width: '38%' }}>38%</span>
            <span style={{ width: '29%', textAlign: 'center', color: T.success500 }}>→ +29</span>
            <span style={{ flex: 1, textAlign: 'right' }}>now 67%</span>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: T.ink700, lineHeight: 1.5 }}>
            <b>Three more sessions</b> on this pattern and it becomes automatic.
          </div>
        </Card>
      </div>

      {/* Side effects on related skills */}
      <Section title="Knock-on effects">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Multi-digit subtraction', d: '+8', from: 71, to: 79 },
            { name: 'Money problems', d: '+5', from: 64, to: 69 },
            { name: 'Equivalent fractions', d: '+2', from: 54, to: 56, soft: true },
          ].map((s, i) => (
            <div key={s.name} style={{
              padding: '14px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: T.ink700, fontWeight: 500 }}>{s.name}</span>
                <span style={{
                  fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                  fontSize: 12, color: s.soft ? T.ink500 : T.success500, fontWeight: 600,
                }}>{s.d}</span>
              </div>
              <DualBar before={s.from} after={s.to} />
            </div>
          ))}
        </Card>
      </Section>

      <div style={{ padding: '22px 20px 0' }}>
        <Button variant="primary" size="l" fullWidth onClick={onContinue}
          iconRight={<IconArrowRight size={18} />}>
          See what's next
        </Button>
      </div>
    </div>
  );
}

// =====================================================================
// NEXT RECOMMENDATION — re-render MathPath with new highlighted skill
// =====================================================================
function FlowNextRecommendation({ onBack, onTapNext }) {
  return (
    <div style={{ paddingBottom: 96 }}>
      <ScreenHeader
        onBack={onBack}
        title="MathPath"
        subtitle="Adaptive math mastery · P3 – P5 range"
      />

      {/* Banner — what just happened */}
      <div style={{ padding: '0 20px 16px' }}>
        <Card padding={14} style={{
          background: T.success100, borderColor: '#BFE0D2',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9, flexShrink: 0,
            background: T.success500, color: T.paper,
            display: 'grid', placeItems: 'center',
          }}><IconCheck size={14} stroke={2.5} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.success500 }}>
              Regrouping across zero — mastered
            </div>
            <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
              Subtraction +12 · ratio path unlocked
            </div>
          </div>
        </Card>
      </div>

      {/* Hero: updated mastery */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{
          background: T.ivory, border: `1px solid ${T.hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring value={71} size={86} stroke={9} label="71%" sub="overall" gold />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.success500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Up 3 points today</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>Approaching proficient</div>
              <div style={{ fontSize: 12, color: T.ink500, lineHeight: 1.45, marginTop: 4 }}>
                Subtraction is solid now. Ratio is next.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Next skill — highlighted with gold glow */}
      <Section title="Your next skill" action={<Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>Ready</Chip>}>
        <div style={{
          position: 'relative', padding: 2,
          background: `linear-gradient(135deg, ${T.gold500}, ${T.gold300}, ${T.gold500})`,
          borderRadius: 22, boxShadow: `0 0 24px -8px ${T.gold500}`,
        }}>
          <Card padding={18} onClick={onTapNext} radius={20} active style={{
            background: T.paper, border: 'none',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 15, flexShrink: 0,
              background: T.navy700, color: T.gold500,
              display: 'grid', placeItems: 'center',
            }}><IconLayers size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.gold700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                Recommended next
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.ink700 }}>
                Introduction to ratio
              </div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>
                P5 · ~6 min · prerequisites just cleared
              </div>
            </div>
            <IconChevronRight size={18} color={T.navy700} />
          </Card>
        </div>
      </Section>

      <Section title="Also recommended">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: '×7 & ×8 fluency drill', sub: 'Keep the speed', icon: IconBolt, tone: 'navy' },
            { name: 'Equivalent fractions', sub: 'Continue · 56% mastered', icon: IconLayers, tone: 'navy' },
          ].map((r, i) => {
            const I = r.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < 1 ? `1px solid ${T.hairline}` : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: T.navy050, color: T.navy700,
                  display: 'grid', placeItems: 'center',
                }}><I size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.ink700 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: T.ink500, marginTop: 1 }}>{r.sub}</div>
                </div>
                <IconChevronRight size={16} color={T.ink300} />
              </div>
            );
          })}
        </Card>
      </Section>

      <div style={{ padding: '14px 20px 0', textAlign: 'center', color: T.ink500, fontSize: 12 }}>
        Loop complete — practice → spot → remediate → master → next.
      </div>
    </div>
  );
}

Object.assign(window, {
  FlowSkillIntro, FlowPractice, MistakeOverlay,
  FlowMasteryUpdated, FlowNextRecommendation,
});
