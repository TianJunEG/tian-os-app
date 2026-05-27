// parent-screens-c.jsx — Parent screens 8-10
// Parent Training, Tutor Booking, Notifications/Settings

const { useState: usePC1 } = React;

// =====================================================================
// 8. PARENT TRAINING
// =====================================================================
function ParentTraining({ onBack }) {
  const modules = [
    {
      id: 'mastery', icon: IconLayers,
      title: 'Understanding mastery learning',
      sub: 'Why we focus on mastery (not grades) and what that means at home',
      time: '5 min', state: 'recommended',
    },
    {
      id: 'mistakes', icon: IconRevise,
      title: 'How to review mistakes with your child',
      sub: 'A calm 3-step pattern that builds confidence, not blame',
      time: '4 min', state: 'available',
    },
    {
      id: 'wordp', icon: IconBrain,
      title: 'How to support word problems',
      sub: 'Singapore-style heuristics in plain language',
      time: '6 min', state: 'available',
    },
    {
      id: 'routines', icon: IconClock,
      title: 'Building a calm study routine',
      sub: 'Short, consistent, kind. What the research suggests.',
      time: '5 min', state: 'available',
    },
    {
      id: 'fluency', icon: IconBolt,
      title: 'Speed vs. understanding',
      sub: 'When fluency drills help — and when they don\'t',
      time: '4 min', state: 'available',
    },
  ];

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ParentScreenHeader onBack={onBack} title="Parent training" subtitle="Optional · 4–6 minutes each" />

      {/* Reassurance note */}
      <div style={{ padding: '0 20px 16px' }}>
        <Card padding={16} style={{
          background: T.gold100, borderColor: T.gold300,
          display: 'flex', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: T.gold500, color: T.navy900,
            display: 'grid', placeItems: 'center',
          }}><IconLightbulb size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: T.navy700, marginBottom: 4,
            }}>Not compulsory.</div>
            <div style={{ fontSize: 12, color: T.ink700, lineHeight: 1.55 }}>
              Tian OS works perfectly well without these. They're here for parents who want
              to understand how their child learns best.
            </div>
          </div>
        </Card>
      </div>

      {/* Module list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modules.map(m => {
          const I = m.icon;
          const isRec = m.state === 'recommended';
          return (
            <Card key={m.id} padding={18} radius={18} style={{
              borderColor: isRec ? T.gold300 : T.hairline,
              background: isRec ? `linear-gradient(180deg, ${T.gold100} 0%, ${T.paper} 60%)` : T.paper,
            }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 13, flexShrink: 0,
                  background: isRec ? T.gold500 : T.navy050,
                  color: isRec ? T.navy900 : T.navy700,
                  display: 'grid', placeItems: 'center',
                }}><I size={20} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {isRec && <Chip size="s" tone="gold">Start here</Chip>}
                  </div>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.25,
                  }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: T.ink500, marginTop: 4, lineHeight: 1.55 }}>{m.sub}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Chip size="s" tone="outline" icon={<IconClock size={11} />}>{m.time}</Chip>
                <div style={{ flex: 1 }} />
                <Button variant={isRec ? 'primary' : 'secondary'} size="s"
                  iconRight={<IconArrowRight size={14} />}>
                  Start 5-min guide
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
// 9. TUTOR / CONSULT BOOKING
// =====================================================================
function ParentTutor({ onBack }) {
  const [tab, setTab] = usePC1('topic');
  const tabs = [
    { id: 'topic',  label: 'Topic consult', sub: '20 min · weak area' },
    { id: 'tutor',  label: '1-to-1 tutor',  sub: '60 min · weekly' },
    { id: 'adhoc',  label: 'Quick help',    sub: '15 min · ad hoc' },
  ];

  const slots = {
    topic: [
      { tutor: 'Ms. Lim',  spec: 'P5/6 Math · regrouping & fractions', avail: 'Thu 7:00pm', price: '$45 / 20 min', recommended: true },
      { tutor: 'Mr. Tan',  spec: 'P5/6 Math · ratio & percentage',     avail: 'Sat 10:30am', price: '$45 / 20 min' },
      { tutor: 'Ms. Chia', spec: 'P3/4 Math · heuristics',             avail: 'Sun 4:00pm', price: '$45 / 20 min' },
    ],
    tutor: [
      { tutor: 'Ms. Lim',  spec: 'MOE-trained · 9 years primary',      avail: 'Wed 7pm slot open', price: '$120 / hr · weekly' },
      { tutor: 'Mr. Tan',  spec: 'MOE-trained · 6 years',              avail: 'Sat morning slot open', price: '$120 / hr · weekly' },
    ],
    adhoc: [
      { tutor: 'Live chat with an MOE-trained teacher', spec: 'Stuck on a question? Ask now.', avail: 'Available now', price: '$15 / 15 min', recommended: true },
    ],
  };

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ParentScreenHeader onBack={onBack} title="Help, when you need it" subtitle="Tian OS works on its own — these are here if Aria needs an extra hand" />

      {/* Tabs */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 6 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '12px 6px', borderRadius: 14,
            background: tab === t.id ? T.navy700 : T.paper,
            color: tab === t.id ? T.paper : T.ink700,
            border: `1px solid ${tab === t.id ? 'transparent' : T.hairline}`,
            textAlign: 'left',
            transition: `all 200ms ${T.easeCalm}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</div>
            <div style={{
              fontSize: 10, marginTop: 2,
              color: tab === t.id ? 'rgba(255,255,255,.7)' : T.ink500,
            }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* Tab-specific intro */}
      <div style={{ padding: '0 20px 14px' }}>
        <Hint label="When is this useful?" title="Tian OS only suggests this if practice alone isn't closing a gap. Most weeks, you won't need it.">
          {tab === 'topic' ? 'A 20-minute, focused session on the one skill that\'s holding Aria back. Less effort than a full tutoring relationship.' :
           tab === 'tutor' ? 'For families who want a weekly, ongoing tutor. We match an MOE-trained teacher to Aria\'s level and learning style.' :
           'Live, on-demand help for when Aria is stuck on a specific question and you can\'t step in.'}
        </Hint>
      </div>

      {/* Slots */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(slots[tab] || []).map((s, i) => (
          <Card key={i} padding={18} radius={18} style={{
            borderColor: s.recommended ? T.gold300 : T.hairline,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: T.navy700, color: T.gold500,
                display: 'grid', placeItems: 'center',
              }}><IconTutor size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                    color: T.navy700, letterSpacing: '-0.01em',
                  }}>{s.tutor}</span>
                  {s.recommended && <Chip size="s" tone="gold">Best fit</Chip>}
                </div>
                <div style={{ fontSize: 12, color: T.ink500, marginTop: 2, lineHeight: 1.45 }}>{s.spec}</div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', background: T.ivory, borderRadius: 10,
              marginBottom: 14,
            }}>
              <IconCalendarDot size={14} color={T.navy700} />
              <span style={{ fontSize: 12, color: T.ink700, fontWeight: 500 }}>{s.avail}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: T.ink500, fontWeight: 500 }}>{s.price}</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="s" style={{ flex: 1 }}>
                See profile
              </Button>
              <Button variant="primary" size="s" style={{ flex: 1.4 }}
                iconRight={<IconArrowRight size={14} />}>
                Book slot
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 10. NOTIFICATIONS / SETTINGS
// =====================================================================
function ParentSettings({ onBack }) {
  const [toggles, setToggles] = usePC1({
    practice: true,
    weakAlerts: true,
    weekly: true,
    daily: false,
    tutor: true,
    training: false,
  });

  const toggle = (k) => setToggles(t => ({ ...t, [k]: !t[k] }));

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ParentScreenHeader onBack={onBack} title="More" subtitle="Settings · notifications · child profile" />

      {/* Child profile card */}
      <Section title="Child">
        <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.navy500}, ${T.navy900})`,
            color: T.paper, display: 'grid', placeItems: 'center',
            fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 22,
          }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600, color: T.navy700, letterSpacing: '-0.01em' }}>Aria Lim</div>
            <div style={{ fontSize: 12, color: T.ink500, marginTop: 2 }}>P5 · Singapore Math · Tampines Primary</div>
          </div>
          <IconChevronRight size={16} color={T.ink300} />
        </Card>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { k: 'practice',   t: 'Practice reminders',           s: 'Reminds Aria to practice each day' },
            { k: 'weakAlerts', t: 'Weak topic alerts',            s: 'When AI spots a sticky pattern' },
            { k: 'weekly',     t: 'Weekly progress report',       s: 'Sunday evening · short summary' },
            { k: 'daily',      t: 'Daily progress summary',       s: 'Once a day · usually too much' },
            { k: 'tutor',      t: 'Tutor session updates',        s: 'Bookings, reminders, summaries' },
            { k: 'training',   t: 'Parent training reminders',    s: 'Optional · once a week' },
          ].map((r, i) => (
            <ToggleRow key={r.k}
              title={r.t} sub={r.s}
              value={toggles[r.k]} onChange={() => toggle(r.k)}
              border={i < 5} />
          ))}
        </Card>
      </Section>

      {/* More */}
      <Section title="Settings">
        <Card padding={0} style={{ overflow: 'hidden' }}>
          {[
            { icon: IconUsers,    t: 'Manage children',           s: '1 child · add another' },
            { icon: IconGear,     t: 'Subscription & billing',    s: 'Tian OS Premium · monthly' },
            { icon: IconBell,     t: 'Notification times',        s: 'Practice 5:00pm · weekly Sun 7pm' },
            { icon: IconMessage,  t: 'Help & feedback',           s: 'Reach out anytime' },
          ].map((r, i) => {
            const I = r.icon;
            return (
              <div key={r.t} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < 3 ? `1px solid ${T.hairline}` : 'none',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: T.navy050, color: T.navy700,
                  display: 'grid', placeItems: 'center',
                }}><I size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{r.t}</div>
                  <div style={{ fontSize: 11, color: T.ink500, marginTop: 1 }}>{r.s}</div>
                </div>
                <IconChevronRight size={16} color={T.ink300} />
              </div>
            );
          })}
        </Card>
      </Section>

      <div style={{ padding: '20px 20px 0', textAlign: 'center', color: T.ink300, fontSize: 11 }}>
        Tian OS v0.1 · Built by Tian Jun Education Group
      </div>
    </div>
  );
}

function ToggleRow({ title, sub, value, onChange, border }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px',
      borderBottom: border ? `1px solid ${T.hairline}` : 'none',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.ink700 }}>{title}</div>
        <div style={{ fontSize: 11, color: T.ink500, marginTop: 1, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <button onClick={onChange} style={{
        width: 44, height: 26, borderRadius: 999,
        background: value ? T.success500 : T.bone,
        border: 'none', cursor: 'pointer', flexShrink: 0,
        position: 'relative',
        transition: `background 200ms ${T.easeCalm}`,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 20 : 2,
          width: 22, height: 22, borderRadius: '50%', background: T.paper,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: `left 200ms ${T.easeCalm}`,
        }} />
      </button>
    </div>
  );
}

Object.assign(window, {
  ParentTraining, ParentTutor, ParentSettings, ToggleRow,
});
