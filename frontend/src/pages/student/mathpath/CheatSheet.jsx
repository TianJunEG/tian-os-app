import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getMascot } from '../../../config/mascots';

import sgP1Numbers from '../../../config/cheatsheets/sg-p1-numbers';
import sgP1AddSub from '../../../config/cheatsheets/sg-p1-add-sub';
import sgP1Shapes from '../../../config/cheatsheets/sg-p1-shapes';
import sgP2Numbers from '../../../config/cheatsheets/sg-p2-numbers';
import sgP2AddSub from '../../../config/cheatsheets/sg-p2-add-sub';
import sgP2Fractions from '../../../config/cheatsheets/sg-p2-fractions';
import sgP2Measurement from '../../../config/cheatsheets/sg-p2-measurement';
import sgP3Numbers from '../../../config/cheatsheets/sg-p3-numbers';
import sgP3Operations from '../../../config/cheatsheets/sg-p3-operations';
import sgP3Fractions from '../../../config/cheatsheets/sg-p3-fractions';
import sgP3Geometry from '../../../config/cheatsheets/sg-p3-geometry';
import sgP3Data from '../../../config/cheatsheets/sg-p3-data';
import sgP4Fractions from '../../../config/cheatsheets/sg-p4-fractions';
import sgP4WholeNumbers from '../../../config/cheatsheets/sg-p4-whole-numbers';
import sgP4FactorsMultiples from '../../../config/cheatsheets/sg-p4-factors-multiples';
import sgP4FourOperations from '../../../config/cheatsheets/sg-p4-four-operations';
import sgP4Decimals from '../../../config/cheatsheets/sg-p4-decimals';
import sgP4WordProblems from '../../../config/cheatsheets/sg-p4-word-problems';
import sgP4Statistics from '../../../config/cheatsheets/sg-p4-statistics';
import sgP5Fractions from '../../../config/cheatsheets/sg-p5-fractions';
import sgP5Decimals from '../../../config/cheatsheets/sg-p5-decimals';
import sgP5Percentage from '../../../config/cheatsheets/sg-p5-percentage';
import sgP5Ratio from '../../../config/cheatsheets/sg-p5-ratio';
import sgP5Geometry from '../../../config/cheatsheets/sg-p5-geometry';
import sgP5Measurement from '../../../config/cheatsheets/sg-p5-measurement';
import sgP5Operations from '../../../config/cheatsheets/sg-p5-operations';
import sgP6Algebra from '../../../config/cheatsheets/sg-p6-algebra';
import sgP6Fractions from '../../../config/cheatsheets/sg-p6-fractions';
import sgP6Percentage from '../../../config/cheatsheets/sg-p6-percentage';
import sgP6Ratio from '../../../config/cheatsheets/sg-p6-ratio';
import sgP6Geometry from '../../../config/cheatsheets/sg-p6-geometry';
import sgP6Measurement from '../../../config/cheatsheets/sg-p6-measurement';
import sgP6Statistics from '../../../config/cheatsheets/sg-p6-statistics';

const SHEETS = {
  'sg-p1-num': sgP1Numbers,
  'sg-p1-as': sgP1AddSub,
  'sg-p1-sh': sgP1Shapes,
  'sg-p2-num': sgP2Numbers,
  'sg-p2-as': sgP2AddSub,
  'sg-p2-fr': sgP2Fractions,
  'sg-p2-mea': sgP2Measurement,
  'sg-p3-num': sgP3Numbers,
  'sg-p3-ops': sgP3Operations,
  'sg-p3-fr': sgP3Fractions,
  'sg-p3-geo': sgP3Geometry,
  'sg-p3-data': sgP3Data,
  'sg-p4-fr': sgP4Fractions,
  'sg-p4-wn': sgP4WholeNumbers,
  'sg-p4-fm': sgP4FactorsMultiples,
  'sg-p4-fo': sgP4FourOperations,
  'sg-p4-dec': sgP4Decimals,
  'sg-p4-wp': sgP4WordProblems,
  'sg-p4-stat': sgP4Statistics,
  'sg-p5-fr': sgP5Fractions,
  'sg-p5-dec': sgP5Decimals,
  'sg-p5-pct': sgP5Percentage,
  'sg-p5-rr': sgP5Ratio,
  'sg-p5-geo': sgP5Geometry,
  'sg-p5-mea': sgP5Measurement,
  'sg-p5-ops': sgP5Operations,
  'sg-p6-alg': sgP6Algebra,
  'sg-p6-fr': sgP6Fractions,
  'sg-p6-pct': sgP6Percentage,
  'sg-p6-rr': sgP6Ratio,
  'sg-p6-geo': sgP6Geometry,
  'sg-p6-mea': sgP6Measurement,
  'sg-p6-stat': sgP6Statistics,
};

const PANEL_THEMES = [
  { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', accent: '#4f46e5', accentLight: '#c7d2fe', shadow: '#818cf8', label: '#312e81' },
  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', accent: '#d97706', accentLight: '#fde68a', shadow: '#f59e0b', label: '#78350f' },
  { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', accent: '#16a34a', accentLight: '#bbf7d0', shadow: '#22c55e', label: '#14532d' },
  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', accent: '#db2777', accentLight: '#fbcfe8', shadow: '#ec4899', label: '#831843' },
  { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', accent: '#0284c7', accentLight: '#bae6fd', shadow: '#0ea5e9', label: '#0c4a6e' },
  { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', accent: '#9333ea', accentLight: '#e9d5ff', shadow: '#a855f7', label: '#581c87' },
];

export default function CheatSheet() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const sheet = SHEETS[sheetId];
  if (!sheet) return <p className="p-6 text-ink-500">Cheat sheet not found.</p>;

  const mascot = getMascot(sheet.mascot);

  const handleDownloadPDF = async () => {
    if (!sheetRef.current || exporting) return;
    setExporting(true);
    try {
      const el = sheetRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111',
        windowWidth: 720,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sheet.topic}-CheatSheet-${sheet.level.replace(/\s/g, '')}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-navy-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting…' : 'Download PDF'}
        </button>
      </div>

      <div ref={sheetRef} className="cs-wrapper">
        {/* Masthead */}
        <div className="cs-masthead">
          <div className="cs-masthead-burst" />
          <div className="cs-masthead-halftone" />
          <img
            src={`/mascots/${sheet.mascot}-head.png`}
            alt={mascot?.name}
            className="cs-masthead-avatar"
            style={{ background: mascot?.colorLight || '#e2e8f0' }}
          />
          <div className="cs-masthead-text">
            <h1 className="cs-masthead-title">{sheet.topic.toUpperCase()}!</h1>
            <p className="cs-masthead-sub">{sheet.subtitle}</p>
          </div>
          <div className="cs-issue-badge">
            <span className="cs-issue-level">{sheet.level.toUpperCase()}</span>
            <span className="cs-issue-num">ISSUE #{sheet.issue}</span>
          </div>
        </div>

        {/* Panels */}
        <div className="cs-panels">
          {sheet.sections.map((sec, i) => (
            <SectionPanel
              key={i}
              section={sec}
              index={i}
              total={sheet.sections.length}
              mascotKey={sheet.mascot}
              mascotName={mascot?.name || 'Kylo'}
              theme={PANEL_THEMES[i % PANEL_THEMES.length]}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="cs-footer">
          <span className="cs-footer-stars">★ ★ ★</span>
          <span>{mascot?.name?.toUpperCase()}'S CHEAT SHEET &bull; {sheet.topic.toUpperCase()} &bull; TIAN OS</span>
          <span className="cs-footer-stars">★ ★ ★</span>
        </div>
      </div>
    </div>
  );
}

function SectionPanel({ section, index, total, mascotKey, mascotName, theme }) {
  const isWide = section.bossLevel || (index === total - 1 && total % 2 === 1);

  return (
    <div
      className={`cs-panel ${isWide ? 'cs-panel--wide' : ''} ${section.bossLevel ? 'cs-panel--boss' : ''}`}
      style={{ background: theme.bg }}
    >
      {/* Starburst decoration */}
      <div className="cs-panel-burst" style={{ color: theme.accentLight }} />

      {/* Section title banner */}
      <div className="cs-section-banner" style={{ background: theme.accent }}>
        <span className="cs-section-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="cs-section-title">{section.title}</span>
        <span className="cs-section-code">{section.code}</span>
      </div>

      {section.bossLevel && (
        <div className="cs-boss-row">
          <span className="cs-boss-badge">★ BOSS LEVEL ★</span>
        </div>
      )}

      <div className="cs-panel-body">
        {/* Speech bubble */}
        <div className="cs-bubble">
          <span dangerouslySetInnerHTML={{ __html: formatText(section.explanation) }} />
        </div>

        {/* Formula */}
        <div className="cs-formula">
          <div className="cs-formula-label" style={{ background: theme.accent }}>FORMULA</div>
          <p className="cs-formula-text" dangerouslySetInnerHTML={{ __html: formatText(section.formula) }} />
          {section.formulaNote && <p className="cs-formula-note" dangerouslySetInnerHTML={{ __html: formatText(section.formulaNote) }} />}
        </div>

        {/* Example */}
        <div className="cs-example">
          <div className="cs-example-label">WORKED EXAMPLE</div>
          {section.example.steps.map((step, j) => (
            <p key={j} className="cs-example-step" dangerouslySetInnerHTML={{ __html: formatText(step) }} />
          ))}
          <div className="cs-example-answer-row">
            <span className="cs-example-answer" dangerouslySetInnerHTML={{ __html: '= ' + formatText(section.example.answer) }} />
            <span className="cs-sfx" style={{ color: theme.accent }}>{section.sfx}</span>
          </div>
        </div>

        {/* Diagram */}
        {section.diagram && (
          <div className="cs-diagram">
            <Diagram data={section.diagram} theme={theme} />
          </div>
        )}

        {/* Bar model */}
        {section.barModel && (
          <div className="cs-barmodel-wrap">
            <span className="cs-barmodel-label">BAR MODEL</span>
            <div className="cs-barmodel">
              {Array.from({ length: section.barModel.parts }).map((_, j) => (
                <div
                  key={j}
                  className={j < section.barModel.shaded ? 'cs-bar-on' : 'cs-bar-off'}
                  style={j < section.barModel.shaded ? { background: theme.accent } : {}}
                >
                  {section.barModel.value}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        {section.tip && (
          <div className="cs-tip">
            <span className="cs-tip-icon">⚡</span>
            <div>
              <span className="cs-tip-title">{mascotName.toUpperCase()}'S PRO TIP</span>
              <p className="cs-tip-text" dangerouslySetInnerHTML={{ __html: formatText(section.tip) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatText(text) {
  return text
    .replace(/\*([^*]+)\*/g, '<em class="cs-em">$1</em>')
    .replace(/\{\{([^/]+)\/([^}]+)\}\}/g, '<span class="cs-frac"><span class="cs-frac-num">$1</span><span class="cs-frac-den">$2</span></span>');
}

function Diagram({ data, theme }) {
  const renderers = { pieChart: PieChartDiagram, placeValue: PlaceValueDiagram, comparison: ComparisonDiagram, numberLine: NumberLineDiagram, venn: VennDiagram, columnMethod: ColumnMethodDiagram, longDivision: LongDivisionDiagram, fractionStrip: FractionStripDiagram, arrowFlow: ArrowFlowDiagram, lineGraph: LineGraphDiagram, stackedBar: StackedBarDiagram };
  const Renderer = renderers[data.type];
  if (!Renderer) return null;
  return <Renderer data={data} theme={theme} />;
}

function PieChartDiagram({ data, theme }) {
  const n = data.slices.length;
  const r = 40, diam = 100, gap = 12;
  const totalW = n * diam + (n - 1) * gap;
  const h = diam + 24;
  const sliceColors = data.colors || [theme.accent, theme.shadow, theme.accentLight];

  function drawPie(cx, cy, slice, idx) {
    const fraction = slice.num / slice.den;
    const den = slice.den;
    const els = [];
    els.push(<circle key={`bg${idx}`} cx={cx} cy={cy} r={r} fill="#e5e7eb" stroke="#000" strokeWidth="2.5" />);
    for (let j = 0; j < den; j++) {
      const a1 = -90 + (j / den) * 360;
      const a2 = -90 + ((j + 1) / den) * 360;
      if (j < slice.num) {
        const la = (a2 - a1) > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos((a1 * Math.PI) / 180);
        const y1 = cy + r * Math.sin((a1 * Math.PI) / 180);
        const x2 = cx + r * Math.cos((a2 * Math.PI) / 180);
        const y2 = cy + r * Math.sin((a2 * Math.PI) / 180);
        els.push(<path key={`s${idx}_${j}`} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${la},1 ${x2},${y2} Z`} fill={sliceColors[idx % sliceColors.length]} stroke="#000" strokeWidth="2" />);
      }
      if (den > 1) {
        const lx = cx + r * Math.cos((a1 * Math.PI) / 180);
        const ly = cy + r * Math.sin((a1 * Math.PI) / 180);
        els.push(<line key={`d${idx}_${j}`} x1={cx} y1={cy} x2={lx} y2={ly} stroke="#000" strokeWidth="1.5" />);
      }
    }
    if (data.labels?.[idx]) {
      els.push(<text key={`lb${idx}`} x={cx} y={cy + r + 16} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="12" fill="#000">{data.labels[idx]}</text>);
    }
    return els;
  }

  const allEls = data.slices.flatMap((s, i) => {
    const cx = (diam / 2) + i * (diam + gap);
    return drawPie(cx, diam / 2, s, i);
  });

  return <svg viewBox={`0 0 ${totalW} ${h}`} width="100%" style={{ maxWidth: totalW }}>{allEls}</svg>;
}

function PlaceValueDiagram({ data }) {
  const w = data.headers.length * 44 + 8;
  return (
    <svg viewBox={`0 0 ${w} 62`} width="100%" style={{ maxWidth: w }}>
      {data.headers.map((h, i) => (
        <g key={i}>
          <rect x={4 + i * 44} y="0" width="40" height="26" rx="4" fill="#fbbf24" stroke="#000" strokeWidth="2" />
          <text x={24 + i * 44} y="18" textAnchor="middle" fontFamily="Bangers, cursive" fontSize="12" fill="#000">{h}</text>
          <rect x={4 + i * 44} y="30" width="40" height="28" rx="4" fill="#fff" stroke="#000" strokeWidth="2" />
          <text x={24 + i * 44} y="50" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill="#000">{data.digits[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function ComparisonDiagram({ data, theme }) {
  const top = data.top || String(data.numA).split('');
  const bottom = data.bottom || String(data.numB).split('');
  const cols = Math.max(top.length, bottom.length);
  const w = cols * 38 + 8;
  return (
    <svg viewBox={`0 0 ${w} 78`} width="100%" style={{ maxWidth: w }}>
      {top.map((d, i) => {
        const isDiff = i === data.diffIdx;
        return (
          <g key={i}>
            <rect x={4 + i * 38} y="0" width="34" height="32" rx="4" fill={isDiff ? theme.accent : '#fff'} stroke="#000" strokeWidth="2" />
            <text x={21 + i * 38} y="22" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill={isDiff ? '#fff' : '#000'}>{d}</text>
            <rect x={4 + i * 38} y="42" width="34" height="32" rx="4" fill={isDiff ? '#fecaca' : '#fff'} stroke="#000" strokeWidth="2" />
            <text x={21 + i * 38} y="64" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="16" fill="#000">{bottom[i]}</text>
            {isDiff && <text x={21 + i * 38} y="39" textAnchor="middle" fontFamily="Bangers, cursive" fontSize="10" fill={theme.accent}>▲</text>}
          </g>
        );
      })}
    </svg>
  );
}

function NumberLineDiagram({ data, theme }) {
  const pts = data.points;
  const n = pts.length;
  const pad = 30, w = Math.max(320, n * 50 + pad * 2), h = 60;
  const lineY = 28;
  const spacing = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const toX = (val) => {
    if (data.start != null && data.end != null) {
      return pad + ((val - data.start) / (data.end - data.start)) * (w - pad * 2);
    }
    const idx = pts.indexOf(val);
    return idx >= 0 ? pad + idx * spacing : pad;
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }}>
      <line x1={pad - 10} y1={lineY} x2={w - pad + 10} y2={lineY} stroke="#000" strokeWidth="2.5" />
      <polygon points={`${w - pad + 10},${lineY} ${w - pad + 4},${lineY - 4} ${w - pad + 4},${lineY + 4}`} fill="#000" />
      {pts.map((p, i) => {
        const x = pad + i * spacing;
        const isHighlight = data.highlightLast ? i === n - 1 : i === data.highlightIdx;
        const label = data.labels ? data.labels[i] : (typeof p === 'number' && p >= 1000 ? (p / 1000) + 'k' : String(p));
        return (
          <g key={i}>
            <circle cx={x} cy={lineY} r={isHighlight ? 6 : 4} fill={isHighlight ? theme.accent : '#000'} stroke={isHighlight ? '#000' : 'none'} strokeWidth="1.5" />
            <text x={x} y={lineY + 18} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="8" fill={isHighlight ? theme.accent : '#000'}>{label}</text>
            {i === data.arrow && data.highlightIdx != null && (
              <path d={`M${x},${lineY - 10} C${x},${lineY - 22} ${pad + data.highlightIdx * spacing},${lineY - 22} ${pad + data.highlightIdx * spacing},${lineY - 10}`} fill="none" stroke={theme.accent} strokeWidth="1.5" markerEnd="url(#arrowNL)" />
            )}
          </g>
        );
      })}
      {data.jump && pts.slice(0, -1).map((_, i) => {
        const x1 = pad + i * spacing;
        const x2 = pad + (i + 1) * spacing;
        return (
          <g key={`j${i}`}>
            <path d={`M${x1},${lineY - 8} Q${(x1 + x2) / 2},${lineY - 22} ${x2},${lineY - 8}`} fill="none" stroke={theme.accent} strokeWidth="1.5" />
            {i === 0 && <text x={(x1 + x2) / 2} y={lineY - 22} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="7" fill={theme.accent}>{data.jump}</text>}
          </g>
        );
      })}
      {data.jumps && data.jumps.map((j, ji) => {
        const fromIdx = pts.indexOf(j.from);
        const toIdx = pts.indexOf(j.to);
        if (fromIdx < 0 || toIdx < 0) return null;
        const x1 = pad + fromIdx * spacing;
        const x2 = pad + toIdx * spacing;
        const dir = x2 > x1 ? 1 : -1;
        return (
          <g key={`jmp${ji}`}>
            <path d={`M${x1},${lineY - 8} Q${(x1 + x2) / 2},${lineY - 24} ${x2},${lineY - 8}`} fill="none" stroke={theme.accent} strokeWidth="1.5" />
            <text x={(x1 + x2) / 2} y={lineY - 26} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="7" fill={theme.accent}>{j.label}</text>
          </g>
        );
      })}
      <defs><marker id="arrowNL" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={theme.accent} /></marker></defs>
    </svg>
  );
}

function VennDiagram({ data, theme }) {
  return (
    <svg viewBox="0 0 260 130" width="100%" style={{ maxWidth: 260 }}>
      <circle cx="90" cy="65" r="55" fill={theme.accentLight} fillOpacity="0.5" stroke="#000" strokeWidth="2" />
      <circle cx="170" cy="65" r="55" fill="#fde68a" fillOpacity="0.5" stroke="#000" strokeWidth="2" />
      <text x="55" y="20" fontFamily="Bangers, cursive" fontSize="14" fill={theme.accent}>{data.leftLabel}</text>
      <text x="195" y="20" fontFamily="Bangers, cursive" fontSize="14" fill="#b45309">{data.rightLabel}</text>
      <text x="55" y="65" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="9" fill="#000">{data.left.join(', ')}</text>
      <text x="205" y="65" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="9" fill="#000">{data.right.join(', ')}</text>
      <text x="130" y="58" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="8" fill="#000">{data.shared.slice(0, 3).join(', ')}</text>
      <text x="130" y="72" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="8" fill="#000">{data.shared.slice(3).join(', ')}</text>
      <rect x="108" y="90" width="44" height="18" rx="4" fill={theme.accent} stroke="#000" strokeWidth="1.5" />
      <text x="130" y="103" textAnchor="middle" fontFamily="Bangers, cursive" fontSize="11" fill="#fff">GCF = {data.shared[data.shared.length - 1]}</text>
    </svg>
  );
}

function ColumnMethodDiagram({ data, theme }) {
  const cols = Math.max(data.rows[0].length, data.answer.length);
  const cw = 28, ch = 28, pad = 6;
  const partialRows = data.partial || [];
  const totalRows = data.rows.length + partialRows.length + 1;
  const w = cols * cw + pad * 2;
  const h = totalRows * ch + pad * 2 + (data.carries ? 18 : 0) + (partialRows.length ? 6 : 0);
  let y = pad + (data.carries ? 16 : 0);
  const rows = [];
  if (data.carries) {
    data.carries.forEach((c, i) => {
      if (c) rows.push(
        <text key={`c${i}`} x={pad + i * cw + cw / 2} y={pad + 10} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="9" fill={theme.accent}>{c}</text>
      );
    });
  }
  data.rows.forEach((row, ri) => {
    row.forEach((d, ci) => {
      const x = pad + (cols - row.length + ci) * cw;
      rows.push(
        <text key={`r${ri}c${ci}`} x={x + cw / 2} y={y + ch * 0.7} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="15" fill="#000">{d}</text>
      );
    });
    y += ch;
  });
  rows.push(<line key="line1" x1={pad} y1={y} x2={w - pad} y2={y} stroke="#000" strokeWidth="2.5" />);
  y += 4;
  if (partialRows.length) {
    partialRows.forEach((row, ri) => {
      row.forEach((d, ci) => {
        const x = pad + (cols - row.length + ci) * cw;
        rows.push(
          <text key={`p${ri}c${ci}`} x={x + cw / 2} y={y + ch * 0.7} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="13" fill="#555">{d}</text>
        );
      });
      y += ch;
    });
    rows.push(<line key="line2" x1={pad} y1={y} x2={w - pad} y2={y} stroke="#000" strokeWidth="2.5" />);
    y += 4;
  }
  data.answer.forEach((d, ci) => {
    const x = pad + (cols - data.answer.length + ci) * cw;
    rows.push(
      <text key={`a${ci}`} x={x + cw / 2} y={y + ch * 0.7} textAnchor="middle" fontFamily="Bangers, cursive" fontSize="16" fill={theme.accent}>{d}</text>
    );
  });
  return <svg viewBox={`0 0 ${w} ${y + ch + pad}`} width="100%" style={{ maxWidth: w }}>{rows}</svg>;
}

function LongDivisionDiagram({ data, theme }) {
  const n = data.dividend.length;
  const cw = 30, ch = 32, pad = 40;
  const w = pad + n * cw + 20;
  return (
    <svg viewBox={`0 0 ${w} 70`} width="100%" style={{ maxWidth: w }}>
      <text x={10} y={42} fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="18" fill="#000">{data.divisor}</text>
      <line x1={pad - 6} y1={20} x2={pad - 6} y2={50} stroke="#000" strokeWidth="2.5" />
      <line x1={pad - 6} y1={20} x2={pad + n * cw + 4} y2={20} stroke="#000" strokeWidth="2.5" />
      {data.dividend.map((d, i) => (
        <text key={`d${i}`} x={pad + i * cw + cw / 2} y={42} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="18" fill="#000">{d}</text>
      ))}
      {data.quotient.map((d, i) => (
        <text key={`q${i}`} x={pad + i * cw + cw / 2} y={14} textAnchor="middle" fontFamily="Bangers, cursive" fontSize="18" fill={theme.accent}>{d}</text>
      ))}
      <text x={pad + n * cw / 2} y={64} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="8" fill="#666">D → M → S → B ↻</text>
    </svg>
  );
}

function FractionStripDiagram({ data, theme }) {
  const cw = 28, h = 36, pad = 4;
  const w = data.parts * cw + pad * 2;
  let idx = 0;
  const rects = [];
  data.groups.forEach((g, gi) => {
    for (let i = 0; i < g.count; i++) {
      const fill = g.color === 'accent' ? theme.accent : theme.shadow;
      rects.push(
        <rect key={idx} x={pad + idx * cw} y={4} width={cw - 2} height={h - 8} rx="3" fill={fill} stroke="#000" strokeWidth="2" />
      );
      idx++;
    }
    const midX = pad + (idx - g.count / 2) * cw;
    rects.push(
      <text key={`l${gi}`} x={midX - cw / 2} y={h + 8} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="9" fill={g.color === 'accent' ? theme.accent : theme.shadow}>{g.label}</text>
    );
  });
  for (let i = idx; i < data.parts; i++) {
    rects.push(
      <rect key={i} x={pad + i * cw} y={4} width={cw - 2} height={h - 8} rx="3" fill="#fff" stroke="#000" strokeWidth="1.5" />
    );
  }
  return <svg viewBox={`0 0 ${w} ${h + 16}`} width="100%" style={{ maxWidth: w }}>{rects}</svg>;
}

function ArrowFlowDiagram({ data, theme }) {
  const boxes = data.steps.filter(s => !/^→/.test(s) && !/→$/.test(s));
  const stepW = boxes.length > 4 ? 68 : 80;
  const arrowW = 16, h = 42;
  const w = boxes.length * stepW + (boxes.length - 1) * arrowW + 8;
  let x = 4;
  const els = [];
  boxes.forEach((step, i) => {
    if (i > 0) {
      els.push(<text key={`a${i}`} x={x + arrowW / 2} y={h / 2 + 4} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="18" fill={theme.accent}>→</text>);
      x += arrowW;
    }
    const isLast = i === boxes.length - 1;
    const lines = step.split('\n');
    els.push(
      <g key={i}>
        <rect x={x} y={4} width={stepW - 4} height={h - 8} rx="6" fill={isLast ? theme.accent : '#fff'} stroke="#000" strokeWidth="2" />
        {lines.length === 1
          ? <text x={x + (stepW - 4) / 2} y={h / 2 + 4} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="10" fill={isLast ? '#fff' : '#000'}>{step}</text>
          : lines.map((ln, li) => <text key={li} x={x + (stepW - 4) / 2} y={h / 2 - 4 + li * 13} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="9" fill={isLast ? '#fff' : '#000'}>{ln}</text>)
        }
      </g>
    );
    x += stepW;
  });
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: '100%' }}>{els}</svg>;
}

function LineGraphDiagram({ data, theme }) {
  const w = 240, h = 120, pad = 30, top = 15;
  const pts = data.points;
  const yVals = pts.map(p => p.y);
  const yMin = Math.min(...yVals) - 2;
  const yMax = Math.max(...yVals) + 2;
  const xStep = (w - pad * 2) / (pts.length - 1);
  const toY = (v) => top + (h - top - pad) * (1 - (v - yMin) / (yMax - yMin));
  const toX = (i) => pad + i * xStep;
  const polyline = pts.map((p, i) => `${toX(i)},${toY(p.y)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }}>
      <line x1={pad} y1={top} x2={pad} y2={h - pad} stroke="#000" strokeWidth="1.5" />
      <line x1={pad} y1={h - pad} x2={w - pad + 10} y2={h - pad} stroke="#000" strokeWidth="1.5" />
      {[yMin, Math.round((yMin + yMax) / 2), yMax].map((v, i) => (
        <g key={`y${i}`}>
          <line x1={pad - 3} y1={toY(v)} x2={pad} y2={toY(v)} stroke="#000" strokeWidth="1" />
          <text x={pad - 6} y={toY(v) + 3} textAnchor="end" fontFamily="Nunito, sans-serif" fontSize="7" fontWeight="700" fill="#666">{v}</text>
        </g>
      ))}
      <polyline points={polyline} fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.y)} r="4" fill="#fff" stroke={theme.accent} strokeWidth="2" />
          <text x={toX(i)} y={h - pad + 14} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="8" fill="#000">{p.x}</text>
          <text x={toX(i)} y={toY(p.y) - 7} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="8" fill={theme.accent}>{p.y}</text>
        </g>
      ))}
      {data.yLabel && <text x={8} y={top + 4} fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="8" fill="#666">{data.yLabel}</text>}
    </svg>
  );
}

function StackedBarDiagram({ data, theme }) {
  const w = 280, h = 50, barH = 24, pad = 10;
  const colors = [theme.accent, theme.shadow, '#e5e7eb'];
  const fmt = (v) => typeof v === 'number' ? v.toLocaleString() : String(v);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }}>
      <text x={pad} y={12} fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="9" fill="#000">{fmt(data.total)}</text>
      {data.segments.reduce((acc, seg, i) => {
        const segW = Math.max((seg.value / data.total) * (w - pad * 2), 20);
        const x = acc.x;
        acc.els.push(
          <g key={i}>
            <rect x={x} y={18} width={segW} height={barH} fill={colors[i % colors.length]} stroke="#000" strokeWidth="1.5" rx={i === 0 ? 4 : 0} />
            <text x={x + segW / 2} y={18 + barH / 2 + 4} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="9" fill={i < 2 ? '#fff' : '#000'}>{seg.label}</text>
            <text x={x + segW / 2} y={18 + barH + 12} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="7" fill="#555">{fmt(seg.value)}</text>
          </g>
        );
        acc.x += segW;
        return acc;
      }, { x: pad, els: [] }).els}
    </svg>
  );
}
