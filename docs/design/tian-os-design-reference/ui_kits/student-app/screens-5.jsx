// screens-5.jsx — Skill Pathway / Mastery Graph

// =====================================================================
// SCREEN 5 — Skill Pathway / Mastery Graph
// =====================================================================
function ScreenPathway({ onBack, onOpenRemediation }) {
  const domains = [
    { id: 'numop', name: 'Number & Operations' },
    { id: 'frac',  name: 'Fractions' },
    { id: 'pct',   name: 'Percentage & Ratio' },
    { id: 'geo',   name: 'Geometry & Measurement' },
    { id: 'alg',   name: 'Algebra' },
  ];
  const [domain, setDomain] = useState('frac');
  const [selected, setSelected] = useState('frac-equiv');

  const GRAPHS = {
    numop: [
      { id: 'place', x: 0.18, y: 0.12, label: 'Place value', level: 'P3', state: 'mastered' },
      { id: 'add',   x: 0.50, y: 0.12, label: 'Add & subtract', level: 'P3', state: 'mastered' },
      { id: 'mul',   x: 0.82, y: 0.12, label: 'Tables', level: 'P3', state: 'mastered', gold: true },
      { id: 'div',   x: 0.34, y: 0.42, label: 'Division', level: 'P4', state: 'proficient' },
      { id: 'rem',   x: 0.66, y: 0.42, label: 'Remainders', level: 'P4', state: 'practising' },
      { id: 'lcm',   x: 0.50, y: 0.72, label: 'LCM / HCF', level: 'P5', state: 'introduced' },
      { id: 'order', x: 0.82, y: 0.72, label: 'Order of ops', level: 'P5', state: 'locked' },
    ],
    frac: [
      { id: 'frac-half',  x: 0.20, y: 0.08, label: 'Halves & quarters', level: 'P2', state: 'mastered', gold: true },
      { id: 'frac-like',  x: 0.50, y: 0.08, label: 'Like fractions', level: 'P3', state: 'mastered' },
      { id: 'frac-equiv', x: 0.80, y: 0.08, label: 'Equivalent', level: 'P4', state: 'practising' },
      { id: 'frac-cmp',   x: 0.34, y: 0.36, label: 'Compare', level: 'P4', state: 'practising' },
      { id: 'frac-addun', x: 0.66, y: 0.36, label: 'Add unlike', level: 'P4', state: 'introduced' },
      { id: 'frac-mul',   x: 0.20, y: 0.66, label: '× fractions', level: 'P5', state: 'introduced' },
      { id: 'frac-div',   x: 0.50, y: 0.66, label: '÷ fractions', level: 'P6', state: 'locked' },
      { id: 'frac-alg',   x: 0.82, y: 0.92, label: 'Algebraic frac', level: 'P6', state: 'locked' },
    ],
    pct: [
      { id: 'pct-basic', x: 0.20, y: 0.10, label: 'Percentage basics', level: 'P5', state: 'practising' },
      { id: 'pct-find',  x: 0.50, y: 0.10, label: 'Find % of', level: 'P5', state: 'introduced' },
      { id: 'pct-chg',   x: 0.80, y: 0.10, label: '% change', level: 'P6', state: 'locked' },
      { id: 'rat-basic', x: 0.20, y: 0.50, label: 'Ratio a:b', level: 'P5', state: 'introduced' },
      { id: 'rat-three', x: 0.55, y: 0.50, label: 'Ratio a:b:c', level: 'P6', state: 'locked' },
      { id: 'rat-prop',  x: 0.55, y: 0.85, label: 'Proportion', level: 'P6', state: 'locked' },
    ],
    geo: [
      { id: 'shape',  x: 0.20, y: 0.10, label: 'Shape names', level: 'P2', state: 'mastered' },
      { id: 'angle',  x: 0.55, y: 0.10, label: 'Angles', level: 'P4', state: 'proficient' },
      { id: 'perim',  x: 0.20, y: 0.45, label: 'Perimeter', level: 'P4', state: 'mastered' },
      { id: 'area',   x: 0.55, y: 0.45, label: 'Area', level: 'P5', state: 'proficient' },
      { id: 'vol',    x: 0.82, y: 0.45, label: 'Volume', level: 'P5', state: 'practising' },
      { id: 'circle', x: 0.55, y: 0.82, label: 'Circle', level: 'P6', state: 'locked' },
    ],
    alg: [
      { id: 'letters', x: 0.30, y: 0.18, label: 'Letters for #', level: 'P6', state: 'introduced' },
      { id: 'simp',    x: 0.70, y: 0.18, label: 'Simplify', level: 'P6', state: 'locked' },
      { id: 'eq',      x: 0.50, y: 0.60, label: 'Simple eqns', level: 'P6', state: 'locked' },
    ],
  };

  // Edges: prerequisite chains
  const EDGES = {
    numop: [['place','add'],['add','mul'],['mul','div'],['add','div'],['div','rem'],['rem','lcm'],['mul','order'],['lcm','order']],
    frac: [['frac-half','frac-like'],['frac-like','frac-equiv'],['frac-like','frac-cmp'],['frac-equiv','frac-addun'],['frac-cmp','frac-mul'],['frac-addun','frac-mul'],['frac-mul','frac-div'],['frac-div','frac-alg'],['frac-equiv','frac-alg']],
    pct: [['pct-basic','pct-find'],['pct-find','pct-chg'],['pct-basic','rat-basic'],['rat-basic','rat-three'],['rat-three','rat-prop'],['pct-chg','rat-prop']],
    geo: [['shape','angle'],['shape','perim'],['perim','area'],['angle','area'],['area','vol'],['area','circle'],['angle','circle']],
    alg: [['letters','simp'],['letters','eq'],['simp','eq']],
  };

  const nodes = GRAPHS[domain];
  const edges = EDGES[domain];
  const sel = nodes.find(n => n.id === selected) || nodes[0];

  return (
    <div style={{ paddingBottom: 96, background: T.ivory, minHeight: '100%' }}>
      <ScreenHeader
        onBack={onBack}
        title="Skill pathway"
        subtitle="Mastery graph · prerequisites & progression"
      />

      {/* Domain chips */}
      <div style={{
        padding: '0 20px 12px', display: 'flex', gap: 6,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {domains.map(d => (
          <button key={d.id} onClick={() => { setDomain(d.id); setSelected(GRAPHS[d.id][0].id); }} style={{
            height: 32, padding: '0 12px', borderRadius: 999,
            background: domain === d.id ? T.navy700 : T.paper,
            color: domain === d.id ? T.paper : T.ink700,
            border: `1px solid ${domain === d.id ? 'transparent' : T.hairline}`,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            transition: `all 200ms ${T.easeCalm}`,
          }}>{d.name}</button>
        ))}
      </div>

      {/* Graph card */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: T.paper, border: `1px solid ${T.hairline}`,
          borderRadius: 24, boxShadow: T.shadowResting,
          overflow: 'hidden', position: 'relative',
        }}>
          <PathwayGraph nodes={nodes} edges={edges} selected={selected} onSelect={setSelected} />
        </div>
      </div>

      {/* Selected node detail */}
      <div style={{ padding: '16px 20px 0' }}>
        <NodeDetail node={sel} onOpenRemediation={onOpenRemediation} />
      </div>

      {/* Legend */}
      <Section title="Legend">
        <Card padding={14}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <LegendRow color={T.m5} label="Mastered" />
            <LegendRow color={T.m5} gold label="Distinction" />
            <LegendRow color={T.m3} label="Proficient" />
            <LegendRow color={T.m2} label="Practising" />
            <LegendRow color={T.m1} label="Introduced" />
            <LegendRow locked label="Locked" />
          </div>
        </Card>
      </Section>
    </div>
  );
}

// ── Graph rendering ─────────────────────────────────────────
function PathwayGraph({ nodes, edges, selected, onSelect }) {
  // Card is full width of phone (~370 - 32 padding) - use viewBox-relative coords
  const W = 360, H = 380;

  // State colors
  const stateColor = {
    mastered:   T.m5,
    proficient: T.m3,
    practising: T.m2,
    introduced: T.m1,
    locked:     T.m0,
  };
  const stateRing = {
    mastered:   T.navy700,
    proficient: T.navy500,
    practising: T.navy300,
    introduced: T.ink100,
    locked:     T.ink100,
  };
  const stateText = {
    mastered: T.paper, proficient: T.paper, practising: T.navy700,
    introduced: T.ink700, locked: T.ink300,
  };

  const xy = (n) => ({ x: n.x * W, y: n.y * H });

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ display: 'block', height: 400 }}>
      <defs>
        <linearGradient id="bg-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.ivory} stopOpacity="0" />
          <stop offset="100%" stopColor={T.ivory} stopOpacity="1" />
        </linearGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill={T.ink100} />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill={T.navy500} />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(([a, b], i) => {
        const na = nodes.find(n => n.id === a);
        const nb = nodes.find(n => n.id === b);
        if (!na || !nb) return null;
        const pa = xy(na), pb = xy(nb);
        // Curve via control points (organic look)
        const midY = (pa.y + pb.y) / 2;
        const isActive = selected === a || selected === b;
        const isLocked = nb.state === 'locked';
        return (
          <path
            key={i}
            d={`M${pa.x},${pa.y} C${pa.x},${midY} ${pb.x},${midY} ${pb.x},${pb.y}`}
            stroke={isActive ? T.navy500 : isLocked ? T.ink100 : T.navy100}
            strokeWidth={isActive ? 2 : 1.5}
            strokeDasharray={isLocked ? '4 4' : 'none'}
            fill="none"
            markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
            style={{ transition: `all 240ms ${T.easeCalm}` }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const p = xy(n);
        const isSel = selected === n.id;
        const r = isSel ? 26 : 22;
        const fill = stateColor[n.state];
        const ring = stateRing[n.state];
        const fg = stateText[n.state];
        return (
          <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
            {/* Selection halo */}
            {isSel && (
              <circle cx={p.x} cy={p.y} r={r + 8}
                fill="none" stroke={T.gold500} strokeWidth="2" opacity="0.5" />
            )}
            {isSel && (
              <circle cx={p.x} cy={p.y} r={r + 4}
                fill="none" stroke={T.gold500} strokeWidth="1" opacity="0.3" />
            )}
            {/* Gold distinction ring */}
            {n.gold && (
              <circle cx={p.x} cy={p.y} r={r + 2}
                fill="none" stroke={T.gold500} strokeWidth="2" />
            )}
            <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={ring} strokeWidth="1.5"
              style={{ transition: `r 200ms ${T.easeCalm}` }} />
            {n.state === 'locked' && (
              <g transform={`translate(${p.x - 6}, ${p.y - 7})`}>
                <rect x="1" y="5" width="10" height="8" rx="1.5" fill="none" stroke={T.ink300} strokeWidth="1.4" />
                <path d="M3 5 V3.5 a3 3 0 0 1 6 0 V5" fill="none" stroke={T.ink300} strokeWidth="1.4" />
              </g>
            )}
            {n.state !== 'locked' && (
              <text x={p.x} y={p.y + 4} textAnchor="middle"
                fontFamily={T.fontText} fontWeight="700" fontSize="11"
                fill={fg}>{n.level}</text>
            )}
            {/* Label below node */}
            <text x={p.x} y={p.y + r + 14} textAnchor="middle"
              fontFamily={T.fontText} fontWeight={isSel ? 600 : 500} fontSize="10"
              fill={isSel ? T.navy700 : T.ink700}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function NodeDetail({ node, onOpenRemediation }) {
  if (!node) return null;
  const stateLabel = {
    mastered: 'Mastered', proficient: 'Proficient',
    practising: 'Practising', introduced: 'Introduced', locked: 'Locked',
  }[node.state];
  const masteryPct = {
    mastered: 96, proficient: 78, practising: 52, introduced: 22, locked: 0,
  }[node.state];
  const fluencyLabel = node.state === 'mastered' ? 'Fast' : node.state === 'proficient' ? 'Steady' : 'Building';
  const fluencyColor = node.state === 'mastered' ? T.success500 : node.state === 'proficient' ? T.gold700 : T.error500;

  return (
    <Card padding={18}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: T.navy700, color: node.gold ? T.gold500 : T.paper,
          display: 'grid', placeItems: 'center',
          fontFamily: T.fontText, fontWeight: 700, fontSize: 12,
          border: node.gold ? `2px solid ${T.gold500}` : 'none',
        }}>{node.level}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
            color: T.navy700, letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>{node.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: T.ink500 }}>{stateLabel}</span>
            {node.state !== 'locked' && <>
              <span style={{ color: T.ink300 }}>·</span>
              <span style={{
                fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
                fontSize: 12, color: T.ink700, fontWeight: 600,
              }}>{masteryPct}% mastered</span>
            </>}
          </div>
        </div>
      </div>

      {node.state !== 'locked' && (
        <ProgressBar value={masteryPct} color={T.navy700} gold={node.state === 'mastered'} />
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <DetailMini label="Fluency" value={node.state === 'locked' ? '—' : fluencyLabel} color={fluencyColor} />
        <div style={{ width: 1, background: T.hairline }} />
        <DetailMini label="Speed" value={node.state === 'locked' ? '—' : node.state === 'mastered' ? '1.4s' : '2.8s'} />
        <div style={{ width: 1, background: T.hairline }} />
        <DetailMini label="Accuracy" value={node.state === 'locked' ? '—' : `${Math.round(masteryPct * 0.95 + 5)}%`} />
      </div>

      {node.state === 'locked' && (
        <div style={{
          padding: '10px 12px', background: T.bone, borderRadius: 10,
          fontSize: 12, color: T.ink500, lineHeight: 1.5,
        }}>
          Complete the prerequisite skills first. The path unlocks automatically.
        </div>
      )}
      {node.state === 'mastered' && (
        <div style={{
          padding: '10px 12px', background: T.success100, borderRadius: 10,
          fontSize: 12, color: T.success500, lineHeight: 1.5, fontWeight: 500,
        }}>
          Mastered. Comes back in spaced review every 14 days.
        </div>
      )}
      {(node.state === 'practising' || node.state === 'introduced') && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" size="m" fullWidth onClick={onOpenRemediation}
            iconRight={<IconArrowRight size={16} />}>
            Continue this skill
          </Button>
        </div>
      )}
      {node.state === 'proficient' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="gold" size="m" fullWidth iconRight={<IconArrowRight size={16} />}>
            Push to mastery
          </Button>
        </div>
      )}
    </Card>
  );
}

function DetailMini({ label, value, color = T.navy700 }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 10, color: T.ink500, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontFamily: T.fontText, fontVariantNumeric: 'tabular-nums',
        fontSize: 15, fontWeight: 600, color, letterSpacing: '-0.01em',
      }}>{value}</div>
    </div>
  );
}

function LegendRow({ color, gold, locked, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {locked ? (
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: T.m0,
          border: `1.5px solid ${T.ink100}`, display: 'grid', placeItems: 'center',
        }}>
          <IconLock size={9} color={T.ink300} />
        </div>
      ) : (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: color, boxShadow: gold ? `0 0 0 2px ${T.gold500}` : 'none',
        }} />
      )}
      <span style={{ fontSize: 12, color: T.ink700, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

Object.assign(window, { ScreenPathway, PathwayGraph });
