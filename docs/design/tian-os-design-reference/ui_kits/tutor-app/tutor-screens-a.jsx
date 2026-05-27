// tutor-screens-a.jsx — Tutor screens 1-4
// Home · Today's Lessons · Assigned Students · Student Profile

const { useState: useTA } = React;

// ── Demo data — shared across screens
const STUDENTS = [
  { id: 's1', name: 'Aria Lim',     level: 'P5', subject: 'Math',    mastery: 68, weak: 'Regrouping across zero', recent: '4 of 5 days', tone: T.navy500, alert: true, lastLesson: 'Mon · Fractions' },
  { id: 's2', name: 'Ethan Tan',    level: 'P6', subject: 'Math',    mastery: 81, weak: 'Word problems · ratio', recent: '5 of 5 days', tone: T.modScience, lastLesson: 'Tue · Ratio' },
  { id: 's3', name: 'Sophia Wong',  level: 'P4', subject: 'Math',    mastery: 54, weak: 'Equivalent fractions',   recent: '2 of 5 days', tone: T.modSpell, alert: true, lastLesson: 'Last Thu · Tables' },
  { id: 's4', name: 'Daniel Lee',   level: 'P3', subject: 'Math',    mastery: 72, weak: '×7 & ×8 fluency',          recent: '4 of 5 days', tone: T.modRead, lastLesson: 'Sat · Mult. facts' },
];

const LESSONS = [
  { id: 'l1', time: '4:30pm', mins: 60, student: 'Aria Lim',     level: 'P5', subject: 'Math', mode: 'online',  prep: 'ready', preview: 'Regrouping fluency + fraction warm-up' },
  { id: 'l2', time: '6:00pm', mins: 60, student: 'Ethan Tan',    level: 'P6', subject: 'Math', mode: 'centre',  prep: 'todo',  preview: 'Ratio word problems · model method' },
  { id: 'l3', time: '7:30pm', mins: 90, student: 'Sophia Wong',  level: 'P4', subject: 'Math', mode: 'home',    prep: 'todo',  preview: 'Equivalent fractions intro' },
];

// =====================================================================
// 1. TUTOR HOME
// =====================================================================
function TutorHome({ onLessons, onPrep, onStudent, onNotes }) {
  const todoCount = LESSONS.filter(l => l.prep === 'todo').length;
  const nextLesson = LESSONS[0];

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top — greeting */}
      <div style={{ padding: '54px 20px 18px',
        display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`,
          color: T.paper, display: 'grid', placeItems: 'center',
          fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 18,
        }}>L</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: T.ink500, fontWeight: 500 }}>Wednesday, 14 May</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>Good afternoon, Ms. Lim</div>
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 12, background: T.bone,
          display: 'grid', placeItems: 'center', color: T.navy700,
          position: 'relative',
        }}>
          <IconBell size={16} />
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 6, height: 6, borderRadius: '50%', background: T.gold500,
          }} />
        </button>
      </div>

      {/* Next lesson hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={22} onClick={onPrep} active style={{
          background: `linear-gradient(135deg, ${T.navy700}, ${T.navy900})`,
          border: 'none', color: T.paper, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,60,.22), transparent 70%)',
          }} />
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.gold300,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
          }}>Up next · {nextLesson.time}</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 21, fontWeight: 600,
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4,
          }}>{nextLesson.student} · {nextLesson.level} {nextLesson.subject}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 14 }}>
            {nextLesson.preview}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LessonModePill mode={nextLesson.mode} />
            <Chip size="s" tone="success">Prep ready</Chip>
            <div style={{ flex: 1 }} />
            <Button variant="gold" size="s" iconRight={<IconArrowRight size={14} />}
              onClick={onPrep}>Prepare next lesson</Button>
          </div>
        </Card>
      </div>

      {/* Today snapshot */}
      <Section title="Today">
        <Card padding={18}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <Stat label="Lessons" value={String(LESSONS.length)} />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Need prep" value={String(todoCount)} suffix="" tone={todoCount > 0 ? 'down' : undefined} />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Notes due" value="1" />
          </div>
          <Button variant="secondary" size="s" fullWidth onClick={onLessons}
            iconRight={<IconArrowRight size={14} />}>
            See today's lessons
          </Button>
        </Card>
      </Section>

      {/* Urgent student alerts */}
      <Section title="Student alerts" action={<Chip size="s" tone="gold" icon={<IconSparkle size={11} />}>AI</Chip>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {STUDENTS.filter(s => s.alert).map((s, i, arr) => (
            <div key={s.id} onClick={() => onStudent(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.hairline}` : 'none',
              cursor: 'pointer',
            }}>
              <StudentAvatar name={s.name} tone={s.tone} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>
                  {s.level} · sticking on <b style={{ color: T.gold700 }}>{s.weak.toLowerCase()}</b>
                </div>
              </div>
              <IconChevronRight size={16} color={T.ink300} />
            </div>
          ))}
        </Card>
      </Section>

      {/* Pending notes */}
      <Section title="Pending lesson notes">
        <Card padding={16} onClick={onNotes} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          border: `1px solid ${T.gold300}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: T.gold100, color: T.gold700,
            display: 'grid', placeItems: 'center',
          }}><IconClipboard size={16} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink700 }}>Ethan Tan · yesterday's lesson</div>
            <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>1 note · parent waiting for update</div>
          </div>
          <IconChevronRight size={16} color={T.ink300} />
        </Card>
      </Section>
    </div>
  );
}

// =====================================================================
// 2. TODAY'S LESSONS
// =====================================================================
function TutorLessons({ onBack, onPrep, onStudent }) {
  return (
    <div style={{ paddingBottom: 96 }}>
      <TutorScreenHeader title="Today's lessons" subtitle={`${LESSONS.length} sessions · ${LESSONS.reduce((a, l) => a + l.mins, 0)} minutes total`} />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LESSONS.map(l => {
          const isPrepReady = l.prep === 'ready';
          return (
            <Card key={l.id} padding={18} radius={18} style={{
              borderColor: isPrepReady ? T.hairline : T.gold300,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                {/* Time column */}
                <div style={{
                  width: 50, flexShrink: 0, textAlign: 'center',
                  padding: '8px 0',
                  background: T.ivory, borderRadius: 10,
                  border: `1px solid ${T.hairline}`,
                }}>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em',
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                  }}>{l.time.replace('pm', '').replace('am', '')}</div>
                  <div style={{
                    fontSize: 10, color: T.ink500, fontWeight: 600,
                    textTransform: 'uppercase', marginTop: 4,
                  }}>{l.time.includes('pm') ? 'PM' : 'AM'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <LessonModePill mode={l.mode} />
                    <span style={{ fontSize: 10, color: T.ink500, fontWeight: 500 }}>· {l.mins} min</span>
                  </div>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em',
                  }}>{l.student}</div>
                  <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{l.level} · {l.subject}</div>
                </div>
              </div>

              {/* Preview */}
              <div style={{
                padding: '10px 12px', background: T.ivory, borderRadius: 10,
                fontSize: 12, color: T.ink700, lineHeight: 1.5, marginBottom: 12,
              }}>
                {l.preview}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip size="s" tone={isPrepReady ? 'success' : 'gold'}>
                  {isPrepReady ? 'Prep ready' : 'Needs prep'}
                </Chip>
                <Button variant="ghost" size="s" onClick={() => onStudent(l.id)}>View student</Button>
                <div style={{ flex: 1 }} />
                <Button variant={isPrepReady ? 'secondary' : 'primary'} size="s"
                  iconRight={<IconArrowRight size={14} />}
                  onClick={onPrep}>
                  {isPrepReady ? 'Open plan' : 'Prepare lesson'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// 3. ASSIGNED STUDENTS
// =====================================================================
function TutorStudents({ onBack, onStudent }) {
  const [filter, setFilter] = useTA('all');
  const filters = [
    { id: 'all',   label: 'All' },
    { id: 'alert', label: 'Need attention' },
    { id: 'p5',    label: 'P5' },
    { id: 'p6',    label: 'P6' },
  ];

  const shown = filter === 'all' ? STUDENTS
    : filter === 'alert' ? STUDENTS.filter(s => s.alert)
    : STUDENTS.filter(s => s.level.toLowerCase() === filter);

  return (
    <div style={{ paddingBottom: 96 }}>
      <TutorScreenHeader title="My students" subtitle={`${STUDENTS.length} active · ${STUDENTS.filter(s => s.alert).length} need attention this week`} />

      {/* Filter chips */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', gap: 6, overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height: 30, padding: '0 12px', borderRadius: 999,
            background: filter === f.id ? T.navy700 : T.paper,
            color: filter === f.id ? T.paper : T.ink700,
            border: `1px solid ${filter === f.id ? 'transparent' : T.hairline}`,
            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(s => (
          <Card key={s.id} padding={16} onClick={() => onStudent(s.id)} active>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <StudentAvatar name={s.name} tone={s.tone} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em',
                  }}>{s.name}</span>
                  {s.alert && <Chip size="s" tone="gold" icon={<IconSparkle size={9} />}>Attention</Chip>}
                </div>
                <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{s.level} · {s.subject}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                  fontSize: 18, fontWeight: 600,
                  color: s.mastery < 60 ? T.gold700 : T.navy700,
                }}>{s.mastery}%</div>
                <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mastery</div>
              </div>
            </div>

            {/* Two-line meta */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '8px 10px', background: T.ivory, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Weak</div>
                <div style={{ fontSize: 11, color: T.ink700, fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.weak}</div>
              </div>
              <div style={{ flex: 1, padding: '8px 10px', background: T.ivory, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: T.ink500, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Practice</div>
                <div style={{ fontSize: 11, color: T.ink700, fontWeight: 500 }}>{s.recent}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 4. STUDENT PROFILE
// =====================================================================
function TutorStudentProfile({ onBack, onPlan, onAssign, onProgress }) {
  const s = STUDENTS[0]; // Aria

  return (
    <div style={{ paddingBottom: 96 }}>
      <TutorScreenHeader onBack={onBack} title={s.name} subtitle={`${s.level} · ${s.subject} · since Feb 2025`} />

      {/* Profile hero */}
      <div style={{ padding: '0 20px' }}>
        <Card padding={20} radius={22} style={{ background: T.ivory }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <StudentAvatar name={s.name} tone={s.tone} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600,
                color: T.navy700, letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>{s.name}</div>
              <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>
                {s.level} · MathPath · 4 of 5 days this week
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Chip size="s" tone="navy">Math</Chip>
                <Chip size="s" tone="outline">Science (soon)</Chip>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.hairline}` }}>
            <Stat label="Mastery" value={String(s.mastery)} suffix="%" delta="+3" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Speed" value="1.6" suffix="s" delta="-0.3s" />
            <div style={{ width: 1, background: T.hairline }} />
            <Stat label="Accuracy" value="91" suffix="%" />
          </div>
        </Card>
      </div>

      {/* Parent contact */}
      <Section title="Parent contact">
        <Card padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: T.navy050, color: T.navy700,
            display: 'grid', placeItems: 'center',
          }}><IconUser size={16} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>Daniel Lim · father</div>
            <div style={{ fontSize: 11, color: T.ink500 }}>Last update sent Sun</div>
          </div>
          <Button variant="secondary" size="s" icon={<IconMessage size={14} />}>Message</Button>
        </Card>
      </Section>

      {/* Weak topics */}
      <Section title="Weak topics" action={<button onClick={onProgress} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 600, color: T.navy700, cursor: 'pointer' }}>See all</button>}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { name: 'Regrouping across zero', level: 'P5', mastery: 38, urgent: true },
            { name: 'Equivalent fractions',   level: 'P4', mastery: 54 },
            { name: 'Inference (reading)',    level: 'P5', mastery: 48 },
          ].map((w, i, arr) => (
            <div key={w.name} style={{
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.hairline}` : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: w.urgent ? T.gold500 : T.navy300,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: T.ink500 }}>{w.level} · {w.mastery}% mastered</div>
              </div>
              {w.urgent && <Chip size="s" tone="gold">Priority</Chip>}
            </div>
          ))}
        </Card>
      </Section>

      {/* Last lesson summary */}
      <Section title="Last lesson · Mon 12 May">
        <Card padding={16}>
          <div style={{ fontSize: 13, color: T.ink700, lineHeight: 1.55, marginBottom: 12 }}>
            Worked through 6 fraction equivalence problems. <b style={{ color: T.success500 }}>Confident</b> on
            ×2/×3 patterns. <b style={{ color: T.gold700 }}>Slipped</b> when the denominator changed first — needs
            revisiting next session.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip size="s" tone="success">Confident on</Chip>
            <span style={{ fontSize: 11, color: T.ink700 }}>×2/×3 fractions, like fractions</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <Chip size="s" tone="gold">Revisit</Chip>
            <span style={{ fontSize: 11, color: T.ink700 }}>Denominator-first equivalence</span>
          </div>
        </Card>
      </Section>

      {/* Assigned homework */}
      <Section title="Assigned homework">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { title: 'Fractions paper 1', due: 'Today', progress: 60, q: '12 q' },
            { title: 'Subtraction fluency drill', due: 'Fri', progress: 0, q: '20 q' },
          ].map((h, i, arr) => (
            <div key={h.title} style={{
              padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.hairline}` : 'none',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: T.navy050, color: T.navy700,
                display: 'grid', placeItems: 'center',
              }}><IconDoc size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{h.title}</div>
                <div style={{ fontSize: 11, color: T.ink500 }}>{h.q} · due {h.due} · {h.progress}% done</div>
              </div>
            </div>
          ))}
        </Card>
      </Section>

      {/* Sticky CTA */}
      <div style={{
        position: 'sticky', bottom: 88, marginTop: 24, padding: '0 20px',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="l" onClick={onAssign} icon={<IconDoc size={16} />} style={{ flex: 1 }}>
            Assign
          </Button>
          <Button variant="primary" size="l" onClick={onPlan}
            iconRight={<IconArrowRight size={18} />} style={{ flex: 1.6 }}>
            Plan next lesson
          </Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TutorHome, TutorLessons, TutorStudents, TutorStudentProfile, STUDENTS, LESSONS,
});
