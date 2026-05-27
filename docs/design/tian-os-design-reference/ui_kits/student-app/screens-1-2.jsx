// screens-1-2.jsx — Dashboard + MathPath module screens

// =====================================================================
// SCREEN 1 — Unified Student Dashboard
// =====================================================================
function ScreenDashboard({ onOpenModule, onOpenFluency }) {
  const modules = [
    { id: 'mathpath', name: 'MathPath',  Mark: MarkMathPath, color: T.modMath,
      mastery: 68, next: 'Equivalent fractions', activity: 'Practised 12 mins yesterday' },
    { id: 'science',  name: 'Science',   Mark: MarkScience,  color: T.modScience,
      mastery: 54, next: 'Magnets — repulsion', activity: 'Diagnostic ready' },
    { id: 'spelling', name: 'Spelling',  Mark: MarkSpell,    color: T.modSpell,
      mastery: 82, next: 'List 14 review', activity: '5 day streak' },
    { id: 'reading',  name: 'Reading',   Mark: MarkRead,     color: T.modRead,
      mastery: 71, next: 'Inference passage 3', activity: 'Last read 2 days ago' },
    { id: 'planner',  name: 'Revision Planner', Mark: MarkPlan, color: T.modPlan,
      mastery: null, next: '3 tasks due this week', activity: 'Updated this morning' },
  ];

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{ padding: '54px 20px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
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

      {/* ── Today's plan hero ─────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{
          background: `linear-gradient(135deg, ${T.navy700} 0%, ${T.navy900} 100%)`,
          border: 'none', color: T.paper, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.22), transparent 70%)',
          }} />
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: T.gold300, marginBottom: 8,
          }}>Today's plan · 3 of 5 done</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 4,
          }}>Fractions fluency, then 8 minutes on geometry</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, lineHeight: 1.45, marginBottom: 16 }}>
            We've queued a quick fluency drill while ratio is fresh, then a short geometry block.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="gold" size="m" onClick={onOpenFluency} iconRight={<IconArrowRight size={16} />}>
              Start daily sprint
            </Button>
            <Button variant="ghost" size="m" style={{ color: 'rgba(255,255,255,.8)' }}>
              View plan
            </Button>
          </div>
        </Card>
      </div>

      {/* ── KPI row ──────────────────────────────────── */}
      <Section title="Today">
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Stat label="Mastery" value="68" suffix="%" delta="+2" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Speed" value="1.6" suffix="s" delta="-0.3s" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Accuracy" value="91" suffix="%" delta="+4" />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: T.ink500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidence</span>
              <span style={{ fontSize: 11, color: T.success500, fontWeight: 600 }}>Rising</span>
            </div>
            <ConfidenceSparkline />
          </div>
        </Card>
      </Section>

      {/* ── Module cards ─────────────────────────────── */}
      <Section title="Modules" action={<Chip size="s" tone="navy">5 active</Chip>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modules.map(m => (
            <Card
              key={m.id} padding={16}
              onClick={() => onOpenModule(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              <m.Mark size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: T.ink700 }}>{m.name}</span>
                  {m.mastery !== null && (
                    <span style={{
                      fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600, fontSize: 13, color: T.navy700,
                    }}>{m.mastery}%</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: T.ink500, marginTop: 2, marginBottom: 8 }}>
                  Next · {m.next}
                </div>
                {m.mastery !== null ? (
                  <ProgressBar value={m.mastery} color={m.color} gold={m.mastery >= 80} />
                ) : (
                  <div style={{ fontSize: 11, color: T.ink500, fontStyle: 'italic' }}>{m.activity}</div>
                )}
              </div>
              <IconChevronRight size={18} color={T.ink300} />
            </Card>
          ))}
        </div>
      </Section>

      {/* ── AI recommendations ───────────────────────── */}
      <Section title="From your AI coach">
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: T.gold100, color: T.gold700,
            display: 'grid', placeItems: 'center',
          }}><IconBrain size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700, lineHeight: 1.3 }}>
              Regrouping in subtraction looks shaky
            </div>
            <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>
              3 misses this week · 4 min to clear
            </div>
          </div>
          <Button variant="primary" size="s" iconRight={<IconArrowRight size={14} />}>Start</Button>
        </Card>
      </Section>

      {/* ── Upcoming ────────────────────────────────── */}
      <Section title="Coming up">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { day: 'Today', time: '6:00pm', title: 'Tutor session with Ms. Lim', sub: 'Science · Light & shadows' },
            { day: 'Thu', time: 'all day', title: 'Spelling list 14 review', sub: 'Revision planner' },
            { day: 'Fri', time: '50 min', title: 'Math mock · paper 1', sub: 'From tutor' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderBottom: i < 2 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 44, flexShrink: 0, textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: i === 0 ? T.gold700 : T.ink500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{r.day}</div>
                <div style={{
                  fontSize: 11, color: T.ink500, marginTop: 2,
                  fontVariantNumeric: 'tabular-nums',
                }}>{r.time}</div>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: T.hairline }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.ink700, lineHeight: 1.3 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>{r.sub}</div>
              </div>
              <IconChevronRight size={16} color={T.ink300} />
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

function ConfidenceSparkline() {
  // 14-day sparkline, gentle upward trend
  const data = [42, 45, 44, 50, 48, 53, 58, 56, 62, 64, 63, 68, 70, 72];
  const w = 320, h = 36, p = 2;
  const min = 38, max = 78;
  const xStep = (w - p * 2) / (data.length - 1);
  const points = data.map((d, i) => [
    p + i * xStep,
    h - p - ((d - min) / (max - min)) * (h - p * 2),
  ]);
  const path = points.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(' ');
  const area = path + ` L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.gold500} stopOpacity="0.18" />
          <stop offset="100%" stopColor={T.gold500} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkfill)" />
      <path d={path} fill="none" stroke={T.gold500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={T.gold500} />
    </svg>
  );
}

// =====================================================================
// SCREEN 2 — MathPath Module Dashboard
// =====================================================================
function ScreenMathPath({ onBack, onOpenFluency, onOpenPathway, onOpenRemediation }) {
  const topics = [
    { name: 'Number Sense', level: 'P5', mastery: 88, fluency: 'fast' },
    { name: 'Operations',   level: 'P5', mastery: 82, fluency: 'fast' },
    { name: 'Fractions',    level: 'P4', mastery: 54, fluency: 'slow' },
    { name: 'Decimals',     level: 'P5', mastery: 71, fluency: 'med'  },
    { name: 'Percentage',   level: 'P5', mastery: 62, fluency: 'med'  },
    { name: 'Ratio',        level: 'P3', mastery: 38, fluency: 'slow' },
    { name: 'Geometry',     level: 'P5', mastery: 76, fluency: 'med'  },
    { name: 'Measurement',  level: 'P5', mastery: 80, fluency: 'fast' },
  ];

  const fluencyColors = {
    fast: { c: T.success500, bg: T.success100, label: 'Fast' },
    med:  { c: T.gold700,    bg: T.gold100,    label: 'Steady' },
    slow: { c: T.error500,   bg: T.error100,   label: 'Building' },
  };

  return (
    <div style={{ paddingBottom: 96 }}>
      <ScreenHeader
        onBack={onBack}
        title="MathPath"
        subtitle="Adaptive math mastery · P3 – P5 range"
        action={<button style={{ width: 36, height: 36, borderRadius: 12, background: T.bone, display: 'grid', placeItems: 'center', marginTop: 2 }}><IconMore size={18} color={T.navy700} /></button>}
      />

      {/* ── Hero: overall + 3 stats ────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={24} style={{
          background: T.ivory, border: `1px solid ${T.hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring value={68} size={86} stroke={9} label="68%" sub="overall" gold />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.ink500,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
              }}>Mastery score</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
                marginBottom: 6,
              }}>Approaching proficient</div>
              <div style={{ fontSize: 12, color: T.ink500, lineHeight: 1.45 }}>
                Strong on number sense and measurement. Ratio and fractions need attention.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.hairline}` }}>
            <Stat label="Fluency" value="72" suffix="%" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Speed" value="1.6" suffix="s" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Accuracy" value="91" suffix="%" />
          </div>
        </Card>
      </div>

      {/* ── Mastery heatmap ───────────────────────── */}
      <Section title="Mastery heatmap" action={<Chip size="s" tone="outline" onClick={onOpenPathway}>Open pathway →</Chip>}>
        <Card padding={18}>
          <MasteryHeatmap />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 14, fontSize: 11, color: T.ink500,
          }}>
            <span>Less</span>
            {[0,1,2,3,4,5].map(l => <MasteryCell key={l} level={l} size={12} />)}
            <span>More</span>
            <div style={{ flex: 1 }} />
            <MasteryCell level={5} size={12} gold />
            <span>Distinction</span>
          </div>
        </Card>
      </Section>

      {/* ── Topic working levels ──────────────────── */}
      <Section title="Topics & fluency">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {topics.map((t, i) => {
            const f = fluencyColors[t.fluency];
            return (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < topics.length - 1 ? `1px solid ${T.hairline}` : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: T.ink700 }}>{t.name}</span>
                    <span style={{
                      fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600, fontSize: 13, color: T.navy700,
                    }}>{t.mastery}%</span>
                  </div>
                  <ProgressBar value={t.mastery} color={T.navy500} height={5} gold={t.mastery >= 85} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: T.ink500,
                      letterSpacing: '0.06em',
                    }}>{t.level} LEVEL</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600,
                      background: f.bg, color: f.c,
                      padding: '2px 8px', borderRadius: 999,
                    }}>
                      <IconBolt size={10} /> {f.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </Section>

      {/* ── Weak prerequisites — calm card, hint pill for explanation ─ */}
      <Section title="Prerequisites to strengthen" action={<Hint label="Why these">
        Ratio mastery is held back by gaps in these earlier skills. Strengthen them first — ratio will follow naturally.
      </Hint>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Equivalent fractions', level: 'P4', mastery: 48 },
            { name: 'Division with remainder', level: 'P3', mastery: 62 },
          ].map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              borderBottom: i === 0 ? `1px solid ${T.hairline}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: T.gold100, color: T.gold700,
                display: 'grid', placeItems: 'center',
                fontFamily: T.fontText, fontWeight: 700, fontSize: 11,
              }}>{p.level}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.ink700 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, maxWidth: 100 }}>
                    <ProgressBar value={p.mastery} color={T.navy500} height={4} />
                  </div>
                  <span style={{
                    fontSize: 11, color: T.ink500, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{p.mastery}%</span>
                </div>
              </div>
              <Button variant="secondary" size="s" iconRight={<IconArrowRight size={14} />} onClick={onOpenRemediation}>Open</Button>
            </div>
          ))}
        </Card>
      </Section>

      {/* ── Recommended next ─────────────────────── */}
      <Section title="Recommended for now">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card padding={16} onClick={onOpenFluency} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: T.navy700, color: T.gold500,
              display: 'grid', placeItems: 'center',
            }}><IconBolt size={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700 }}>Fluency drill · ×7 & ×8 tables</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>30 questions · target 2s · ~4 min</div>
            </div>
            <IconChevronRight size={18} color={T.ink300} />
          </Card>
          <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: T.navy050, color: T.navy700,
              display: 'grid', placeItems: 'center',
            }}><IconBook size={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink700 }}>Concept · Comparing fractions</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>Worked example then guided practice · ~8 min</div>
            </div>
            <IconChevronRight size={18} color={T.ink300} />
          </Card>
        </div>
      </Section>
    </div>
  );
}

// 8x12 heatmap — 8 topics x 12 sub-skills
function MasteryHeatmap() {
  // Deterministic mastery pattern — strong band on left, weakening toward ratio/fractions
  const cols = 12, rows = 8;
  const topicNames = ['Num', 'Op', 'Frac', 'Dec', 'Pct', 'Ratio', 'Geo', 'Meas'];
  // pre-seeded — stronger at left/top, weaker mid
  const data = [
    [5,5,5,5,4,5,4,5,5,4,5,4],
    [5,5,5,4,5,5,4,5,5,4,4,3],
    [3,3,2,2,1,2,3,2,1,1,2,1],
    [4,5,4,4,4,3,3,4,4,3,3,3],
    [4,3,4,4,3,3,2,3,4,3,2,3],
    [2,2,1,1,2,1,1,2,1,0,1,0],
    [4,5,4,4,5,4,3,4,4,3,4,3],
    [5,5,4,5,4,4,5,4,4,4,3,4],
  ];
  const golds = new Set(['0-0','1-0','1-1','7-0','7-1']); // distinction marks
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 0 }}>
        {topicNames.map(n => (
          <div key={n} style={{
            height: 22, fontSize: 10, color: T.ink500, fontWeight: 600,
            display: 'flex', alignItems: 'center', width: 36,
          }}>{n}</div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {row.map((v, ci) => (
              <div key={ci} style={{ flex: 1, aspectRatio: '1' }}>
                <MasteryCell level={v} size="100%" gold={golds.has(`${ri}-${ci}`)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDashboard, ScreenMathPath, MasteryHeatmap, ConfidenceSparkline });
