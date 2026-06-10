import { diagramSvgRenderers as sharedRenderers } from '../../../../shared/diagramEngine/svg/renderers.js';

function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function svgShell(spec, body, ariaLabel = '') {
  const w = spec.width || 640;
  const h = spec.height || 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(ariaLabel)}"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
}

// Respect OS-level reduced-motion preference — render the final state instantly.
const REDUCE_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const SHADED_FILL = '#bfdbfe';
const UNSHADED_FILL = '#fff';
const BORDER_STROKE = '#111';
const PARTITION_STROKE = '#111';

function fractionBar(spec) {
  const { parts, shaded, labelMode = 'fraction' } = spec.data;
  const w = spec.width; const h = spec.height;
  const x = 40; const y = h / 2 - 24; const bw = w - 80; const bh = 48;
  const seg = bw / parts;
  if (REDUCE_MOTION) {
    let body = '';
    for (let i = 0; i < parts; i += 1) body += `<rect x="${x + i * seg}" y="${y}" width="${seg}" height="${bh}" fill="${i < shaded ? SHADED_FILL : UNSHADED_FILL}" stroke="${PARTITION_STROKE}"/>`;
    if (labelMode !== 'none') body += `<text x="${w / 2}" y="${y + bh + 28}" font-size="18" text-anchor="middle" fill="#111">${shaded}/${parts}</text>`;
    return svgShell(spec, body, 'fraction bar');
  }
  const perSeg = Math.min(0.18, 1.2 / (shaded || 1));
  const shadeEnd = shaded * perSeg;
  let body = '';
  for (let i = 0; i < parts; i += 1) {
    if (i < shaded) {
      const delay = (i * perSeg).toFixed(2);
      body += `<rect x="${x + i * seg}" y="${y}" width="${seg}" height="${bh}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}"><animate attributeName="fill" from="${UNSHADED_FILL}" to="${SHADED_FILL}" dur="0.3s" begin="${delay}s" fill="freeze"/></rect>`;
    } else {
      body += `<rect x="${x + i * seg}" y="${y}" width="${seg}" height="${bh}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}"/>`;
    }
  }
  if (labelMode !== 'none') {
    const labelDelay = (shadeEnd + 0.15).toFixed(2);
    body += `<text x="${w / 2}" y="${y + bh + 28}" font-size="18" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${labelDelay}s" fill="freeze"/>${shaded}/${parts}</text>`;
  }
  return svgShell(spec, body, 'fraction bar');
}

function fractionCircle(spec) {
  const { parts, shaded } = spec.data;
  const w = spec.width; const h = spec.height;
  const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * 0.32;
  if (REDUCE_MOTION) {
    let body = '';
    for (let i = 0; i < parts; i += 1) {
      const a0 = (i / parts) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / parts) * Math.PI * 2 - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0); const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
      body += `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${i < shaded ? SHADED_FILL : UNSHADED_FILL}" stroke="${BORDER_STROKE}"/>`;
    }
    body += `<text x="${cx}" y="${cy + r + 28}" font-size="18" text-anchor="middle" fill="#111">${shaded}/${parts}</text>`;
    return svgShell(spec, body, 'fraction circle');
  }
  const perSlice = Math.min(0.18, 1.2 / (shaded || 1));
  const shadeEnd = shaded * perSlice;
  let body = '';
  for (let i = 0; i < parts; i += 1) {
    const a0 = (i / parts) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / parts) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0); const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    if (i < shaded) {
      const delay = (i * perSlice).toFixed(2);
      body += `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${UNSHADED_FILL}" stroke="${BORDER_STROKE}"><animate attributeName="fill" from="${UNSHADED_FILL}" to="${SHADED_FILL}" dur="0.3s" begin="${delay}s" fill="freeze"/></path>`;
    } else {
      body += `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${UNSHADED_FILL}" stroke="${BORDER_STROKE}"/>`;
    }
  }
  const labelDelay = (shadeEnd + 0.15).toFixed(2);
  body += `<text x="${cx}" y="${cy + r + 28}" font-size="18" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${labelDelay}s" fill="freeze"/>${shaded}/${parts}</text>`;
  return svgShell(spec, body, 'fraction circle');
}

function numberLine(spec) {
  const { points = [], minStepCount = 10, min = 0, max = 1, endpointLabels = [] } = spec.data;
  const w = spec.width; const h = spec.height; const x0 = 50; const x1 = w - 50; const y = h / 2;
  const steps = minStepCount;
  if (REDUCE_MOTION) {
    let body = `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#111" stroke-width="2"/>`;
    for (let i = 0; i <= steps; i += 1) { const t = i / steps; const tx = x0 + (x1 - x0) * t; body += `<line x1="${tx}" x2="${tx}" y1="${y - 8}" y2="${y + 8}" stroke="#111"/>`; }
    const leftLabel = endpointLabels[0] ?? min; const rightLabel = endpointLabels[1] ?? max;
    body += `<text x="${x0}" y="${y + 34}" font-size="16" text-anchor="middle" fill="#111">${esc(leftLabel)}</text>`;
    body += `<text x="${x1}" y="${y + 34}" font-size="16" text-anchor="middle" fill="#111">${esc(rightLabel)}</text>`;
    for (const p of points) { const t = (p.value - min) / (max - min || 1); const px = x0 + (x1 - x0) * t; body += `<circle cx="${px}" cy="${y}" r="7" fill="#17345f"/><text x="${px}" y="${y - 18}" font-size="18" font-weight="700" text-anchor="middle" fill="#17345f">${esc(p.label ?? p.value)}</text>`; }
    return svgShell(spec, body, 'number line');
  }
  const lineLen = x1 - x0;
  const tickEnd = 0.5 + steps * 0.03;
  const labelT = tickEnd + 0.1;
  const pointT = labelT + 0.25;
  let body = '';
  body += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#111" stroke-width="2" stroke-dasharray="${lineLen}" stroke-dashoffset="${lineLen}"><animate attributeName="stroke-dashoffset" from="${lineLen}" to="0" dur="0.5s" fill="freeze"/></line>`;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps; const tx = x0 + (x1 - x0) * t;
    const tickDelay = (0.5 + i * 0.03).toFixed(2);
    body += `<line x1="${tx}" x2="${tx}" y1="${y - 8}" y2="${y + 8}" stroke="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.12s" begin="${tickDelay}s" fill="freeze"/></line>`;
  }
  const leftLabel = endpointLabels[0] ?? min;
  const rightLabel = endpointLabels[1] ?? max;
  body += `<text x="${x0}" y="${y + 34}" font-size="16" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${labelT.toFixed(2)}s" fill="freeze"/>${esc(leftLabel)}</text>`;
  body += `<text x="${x1}" y="${y + 34}" font-size="16" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${labelT.toFixed(2)}s" fill="freeze"/>${esc(rightLabel)}</text>`;
  for (const p of points) {
    const t = (p.value - min) / (max - min || 1);
    const px = x0 + (x1 - x0) * t;
    body += `<circle cx="${px}" cy="${y}" r="0" fill="#17345f"><animate attributeName="r" from="0" to="9" dur="0.15s" begin="${pointT.toFixed(2)}s" fill="freeze"/><animate attributeName="r" from="9" to="7" dur="0.12s" begin="${(pointT + 0.15).toFixed(2)}s" fill="freeze"/></circle>`;
    body += `<text x="${px}" y="${y - 18}" font-size="18" font-weight="700" text-anchor="middle" fill="#17345f" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="${(pointT + 0.2).toFixed(2)}s" fill="freeze"/>${esc(p.label ?? p.value)}</text>`;
  }
  return svgShell(spec, body, 'number line');
}

function partWholeBar(spec) {
  const parts = spec.data.parts || [];
  const total = parts.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
  const w = spec.width; const h = spec.height; const x = 40; const y = h / 2 - 20; const bw = w - 80; const bh = 40;
  if (REDUCE_MOTION) {
    let cursor = x; let body = '';
    for (const p of parts) {
      const pw = bw * (Number(p.value || 0) / total);
      body += `<rect x="${cursor}" y="${y}" width="${pw}" height="${bh}" fill="${esc(p.fill || '#dbeafe')}" stroke="#111"/><text x="${cursor + pw / 2}" y="${y + 25}" font-size="13" text-anchor="middle">${esc(p.label || '')}</text>`;
      cursor += pw;
    }
    return svgShell(spec, body, 'part whole bar');
  }
  const perPart = Math.min(0.2, 1.0 / (parts.length || 1));
  let cursor = x; let body = ''; let idx = 0;
  for (const p of parts) {
    const pw = bw * (Number(p.value || 0) / total);
    const delay = (idx * perPart).toFixed(2);
    const labelDelay = (idx * perPart + 0.25).toFixed(2);
    body += `<rect x="${cursor}" y="${y}" width="0" height="${bh}" fill="${esc(p.fill || '#dbeafe')}" stroke="#111"><animate attributeName="width" from="0" to="${pw}" dur="0.3s" begin="${delay}s" fill="freeze"/></rect>`;
    body += `<text x="${cursor + pw / 2}" y="${y + 25}" font-size="13" text-anchor="middle" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${labelDelay}s" fill="freeze"/>${esc(p.label || '')}</text>`;
    cursor += pw;
    idx += 1;
  }
  return svgShell(spec, body, 'part whole bar');
}

function comparisonBar(spec) {
  const { leftValue, rightValue, leftLabel = 'A', rightLabel = 'B' } = spec.data;
  const max = Math.max(leftValue, rightValue);
  const w = spec.width; const h = spec.height; const x = 130; const bw = w - 170;
  const h1 = (leftValue / max) * (bw); const h2 = (rightValue / max) * (bw);
  const y1 = h / 2 - 45; const y2 = h / 2 + 15;
  if (REDUCE_MOTION) {
    const body = `<text x="40" y="${y1 + 18}" font-size="14">${esc(leftLabel)}</text><rect x="${x}" y="${y1}" width="${h1}" height="28" fill="#bfdbfe" stroke="#111"/><text x="${x + h1 + 8}" y="${y1 + 18}" font-size="14">${leftValue}</text><text x="40" y="${y2 + 18}" font-size="14">${esc(rightLabel)}</text><rect x="${x}" y="${y2}" width="${h2}" height="28" fill="#ddd6fe" stroke="#111"/><text x="${x + h2 + 8}" y="${y2 + 18}" font-size="14">${rightValue}</text>`;
    return svgShell(spec, body, 'comparison bar');
  }
  let body = '';
  // Labels fade in first
  body += `<text x="40" y="${y1 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" fill="freeze"/>${esc(leftLabel)}</text>`;
  body += `<text x="40" y="${y2 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.15s" fill="freeze"/>${esc(rightLabel)}</text>`;
  // Top bar grows, then bottom bar
  body += `<rect x="${x}" y="${y1}" width="0" height="28" fill="#bfdbfe" stroke="#111"><animate attributeName="width" from="0" to="${h1}" dur="0.4s" begin="0.2s" fill="freeze"/></rect>`;
  body += `<rect x="${x}" y="${y2}" width="0" height="28" fill="#ddd6fe" stroke="#111"><animate attributeName="width" from="0" to="${h2}" dur="0.4s" begin="0.4s" fill="freeze"/></rect>`;
  // Values fade in after their bar finishes
  body += `<text x="${x + h1 + 8}" y="${y1 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.6s" fill="freeze"/>${leftValue}</text>`;
  body += `<text x="${x + h2 + 8}" y="${y2 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.8s" fill="freeze"/>${rightValue}</text>`;
  return svgShell(spec, body, 'comparison bar');
}

function beforeAfterBar(spec) {
  const { before, after } = spec.data;
  return comparisonBar({ ...spec, data: { leftValue: before, rightValue: after, leftLabel: 'Before', rightLabel: 'After' } });
}

function ratioBar(spec) {
  const { a, b, aLabel = 'A', bLabel = 'B' } = spec.data;
  return comparisonBar({ ...spec, data: { leftValue: a, rightValue: b, leftLabel: aLabel, rightLabel: bLabel } });
}

function rectangleArea(spec) {
  const { widthUnits, heightUnits } = spec.data;
  const w = spec.width; const h = spec.height; const x = 90; const y = 50; const rw = w - 180; const rh = h - 120;
  let body = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#fff" stroke="#111"/>`;
  for (let i = 1; i < widthUnits; i += 1) {
    body += `<line x1="${x + (rw * i) / widthUnits}" y1="${y}" x2="${x + (rw * i) / widthUnits}" y2="${y + rh}" stroke="#9ca3af"/>`;
  }
  for (let j = 1; j < heightUnits; j += 1) {
    body += `<line x1="${x}" y1="${y + (rh * j) / heightUnits}" x2="${x + rw}" y2="${y + (rh * j) / heightUnits}" stroke="#9ca3af"/>`;
  }
  body += `<text x="${x + rw / 2}" y="${y + rh + 28}" text-anchor="middle" font-size="14">${widthUnits} units</text><text x="${x - 14}" y="${y + rh / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 ${x - 14} ${y + rh / 2})">${heightUnits} units</text>`;
  return svgShell(spec, body, 'rectangle area');
}

function triangleArea(spec) {
  const { base, height } = spec.data;
  const w = spec.width; const h = spec.height;
  const x0 = 100; const y0 = h - 70; const x1 = w - 100; const y1 = h - 70; const xt = (x0 + x1) / 2; const yt = 70;
  const body = `<polygon points="${x0},${y0} ${x1},${y1} ${xt},${yt}" fill="#eff6ff" stroke="#111"/><line x1="${xt}" y1="${yt}" x2="${xt}" y2="${y0}" stroke="#1d4ed8" stroke-dasharray="5 4"/><text x="${(x0 + x1) / 2}" y="${y0 + 24}" text-anchor="middle" font-size="14">base ${base}</text><text x="${xt + 12}" y="${(yt + y0) / 2}" font-size="14">height ${height}</text>`;
  return svgShell(spec, body, 'triangle area');
}

function cuboid(spec) {
  const { length, width, height } = spec.data;
  const w = spec.width; const h = spec.height;
  const x = 120; const y = 90; const fw = 220; const fh = 140; const ox = 70; const oy = -45;
  const body = `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="#fff" stroke="#111"/><rect x="${x + ox}" y="${y + oy}" width="${fw}" height="${fh}" fill="#f8fafc" stroke="#111"/><line x1="${x}" y1="${y}" x2="${x + ox}" y2="${y + oy}" stroke="#111"/><line x1="${x + fw}" y1="${y}" x2="${x + fw + ox}" y2="${y + oy}" stroke="#111"/><line x1="${x}" y1="${y + fh}" x2="${x + ox}" y2="${y + fh + oy}" stroke="#111"/><line x1="${x + fw}" y1="${y + fh}" x2="${x + fw + ox}" y2="${y + fh + oy}" stroke="#111"/><text x="${x + fw / 2}" y="${y + fh + 24}" font-size="14" text-anchor="middle">length ${length}</text><text x="${x - 30}" y="${y + fh / 2}" font-size="14">height ${height}</text><text x="${x + fw + ox + 12}" y="${y + oy + fh / 2}" font-size="14">width ${width}</text>`;
  return svgShell(spec, body, 'cuboid');
}

function angleOnLine(spec) {
  const { angleDegrees } = spec.data;
  const w = spec.width; const h = spec.height; const cx = w / 2; const cy = h / 2 + 30; const r = Math.min(w, h) * 0.28;
  const rad = (Math.PI * angleDegrees) / 180;
  const x2 = cx + r * Math.cos(Math.PI - rad); const y2 = cy - r * Math.sin(Math.PI - rad);
  const body = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#111" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#1d4ed8" stroke-width="2"/><path d="M ${cx - 40} ${cy} A 40 40 0 0 1 ${cx - 40 * Math.cos(rad)} ${cy - 40 * Math.sin(rad)}" fill="none" stroke="#111"/><text x="${cx - 24}" y="${cy - 16}" font-size="14">${angleDegrees}°</text>`;
  return svgShell(spec, body, 'angle on line');
}

function table(spec) {
  const { headers = [], rows = [] } = spec.data;
  const w = spec.width; const h = spec.height; const x = 20; const y = 30; const cols = headers.length; const rowsCount = rows.length + 1;
  const cw = (w - 40) / cols; const ch = (h - 50) / rowsCount;
  let body = `<rect x="${x}" y="${y}" width="${w - 40}" height="${h - 50}" fill="#fff" stroke="#111"/>`;
  for (let c = 1; c < cols; c += 1) body += `<line x1="${x + c * cw}" y1="${y}" x2="${x + c * cw}" y2="${y + rowsCount * ch}" stroke="#111"/>`;
  for (let r = 1; r < rowsCount; r += 1) body += `<line x1="${x}" y1="${y + r * ch}" x2="${x + cols * cw}" y2="${y + r * ch}" stroke="#111"/>`;
  headers.forEach((h1, i) => { body += `<text x="${x + i * cw + cw / 2}" y="${y + 20}" font-size="13" text-anchor="middle">${esc(h1)}</text>`; });
  rows.forEach((row, r) => row.forEach((cell, c) => { body += `<text x="${x + c * cw + cw / 2}" y="${y + (r + 1) * ch + 20}" font-size="13" text-anchor="middle">${esc(cell)}</text>`; }));
  return svgShell(spec, body, 'table');
}

function barChart(spec) {
  const { bars = [] } = spec.data;
  const w = spec.width; const h = spec.height; const x0 = 50; const y0 = h - 45; const cw = w - 90; const ch = h - 80;
  const max = Math.max(...bars.map((b) => Number(b.value || 0)), 1);
  const bw = cw / bars.length;
  let body = `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111"/>`;
  bars.forEach((b, i) => {
    const bh = (Number(b.value || 0) / max) * ch;
    const x = x0 + i * bw + 8;
    body += `<rect x="${x}" y="${y0 - bh}" width="${bw - 16}" height="${bh}" fill="#93c5fd" stroke="#111"/><text x="${x + (bw - 16) / 2}" y="${y0 + 16}" text-anchor="middle" font-size="12">${esc(b.label || '')}</text>`;
  });
  return svgShell(spec, body, 'bar chart');
}

function lineGraph(spec) {
  const { points = [] } = spec.data;
  const w = spec.width; const h = spec.height; const x0 = 50; const y0 = h - 45; const cw = w - 90; const ch = h - 80;
  const maxX = Math.max(...points.map((p) => p.x), 1); const maxY = Math.max(...points.map((p) => p.y), 1);
  const toX = (x) => x0 + (x / maxX) * cw; const toY = (y) => y0 - (y / maxY) * ch;
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${toX(p.x)} ${toY(p.y)}`).join(' ');
  let body = `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111"/><path d="${d}" fill="none" stroke="#1d4ed8" stroke-width="2"/>`;
  points.forEach((p) => { body += `<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="3" fill="#1d4ed8"/>`; });
  return svgShell(spec, body, 'line graph');
}

export const renderers = {
  ...sharedRenderers,
  fraction_bar: fractionBar,
  fraction_circle: fractionCircle,
  number_line: numberLine,
  part_whole_bar: partWholeBar,
  comparison_bar: comparisonBar,
  before_after_bar: beforeAfterBar,
  ratio_bar: ratioBar,
  rectangle_area: rectangleArea,
  triangle_area: triangleArea,
  cuboid: cuboid,
  angle_on_line: angleOnLine,
  table,
  bar_chart: barChart,
  line_graph: lineGraph,
};
