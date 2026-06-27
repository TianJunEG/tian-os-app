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

function fractionTriangle(spec) {
  const { parts, shaded } = spec.data;
  const w = spec.width || 640;
  const h = spec.height || 220;
  const cx = w / 2;
  const apexY = 20;
  const baseY = h - 32;
  const triH = baseY - apexY;
  const baseHalfW = Math.min(cx - 40, triH * 0.72);

  // Only render proper equal sub-triangles when parts is a perfect square (n²).
  // Supported: 4 (n=2) and 9 (n=3). Other denominators fall back to fraction bar.
  const n = Math.round(Math.sqrt(parts));
  if (n * n !== parts || n < 2 || n > 3) {
    return fractionBar({ ...spec, width: w, height: h });
  }

  // Main triangle vertices: A = apex (top), B = bottom-left, C = bottom-right.
  const A = [cx, apexY];
  const B = [cx - baseHalfW, baseY];
  const C = [cx + baseHalfW, baseY];

  // Barycentric grid point P(i, j): i steps toward B, j toward C, rest toward A.
  const P = (i, j) => {
    const k = n - i - j;
    return [(k * A[0] + i * B[0] + j * C[0]) / n, (k * A[1] + i * B[1] + j * C[1]) / n];
  };
  const toPts = (...ps) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Build all small triangles in visual bottom-to-top, left-to-right order.
  // Visual row r (r=n at bottom, r=1 at top):
  //   Upward triangles with i+j = n-r, ordered left-to-right (j=0..n-r).
  //   Between consecutive upward triangles, insert a downward triangle.
  // Down triangle between Up(i,j) and Up(i-1,j+1): vertices P(i,j), P(i-1,j+1), P(i,j+1).
  const allTriangles = [];
  for (let r = n; r >= 1; r--) {
    const upSum = n - r;
    for (let j = 0; j <= upSum; j++) {
      const i = upSum - j;
      // Upward triangle
      allTriangles.push([P(i, j), P(i + 1, j), P(i, j + 1)]);
      // Downward triangle between this and next upward (if not last in row)
      if (j < upSum) {
        allTriangles.push([P(i, j + 1), P(i - 1, j + 1), P(i, j + 2)]);
      }
    }
  }
  // total triangles = n² ✓

  let body = '';
  allTriangles.forEach((pts, idx) => {
    const isShaded = idx < shaded;
    const fill = isShaded ? SHADED_FILL : UNSHADED_FILL;
    const ptsStr = toPts(...pts);
    if (REDUCE_MOTION) {
      body += `<polygon points="${ptsStr}" fill="${fill}" stroke="${PARTITION_STROKE}" stroke-width="1.5"/>`;
    } else {
      const delay = isShaded ? (idx * 0.1).toFixed(2) : 0;
      body += isShaded
        ? `<polygon points="${ptsStr}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}" stroke-width="1.5"><animate attributeName="fill" from="${UNSHADED_FILL}" to="${SHADED_FILL}" dur="0.25s" begin="${delay}s" fill="freeze"/></polygon>`
        : `<polygon points="${ptsStr}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}" stroke-width="1.5"/>`;
    }
  });

  const labelDelay = REDUCE_MOTION ? 0 : (shaded * 0.1 + 0.15).toFixed(2);
  body += REDUCE_MOTION
    ? `<text x="${cx}" y="${baseY + 24}" font-size="18" text-anchor="middle" fill="#111">${shaded}/${parts}</text>`
    : `<text x="${cx}" y="${baseY + 24}" font-size="18" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${labelDelay}s" fill="freeze"/>${shaded}/${parts}</text>`;

  return svgShell({ ...spec, width: w, height: h }, body, 'fraction triangle');
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
  const { totalLabel } = spec.data;
  const total = parts.reduce((s, p) => s + Number(p.value || 0), 0) || 1;
  const w = spec.width; const h = spec.height;
  // Reserve extra height at bottom when totalLabel is present
  const bracketH = totalLabel ? 36 : 0;
  const x = 40; const y = (h - bracketH) / 2 - 20; const bw = w - 80; const bh = 40;
  if (REDUCE_MOTION) {
    let cursor = x; let body = '';
    for (const p of parts) {
      const pw = bw * (Number(p.value || 0) / total);
      body += `<rect x="${cursor}" y="${y}" width="${pw}" height="${bh}" fill="${esc(p.fill || '#dbeafe')}" stroke="#111"/><text x="${cursor + pw / 2}" y="${y + 25}" font-size="13" text-anchor="middle">${esc(p.label || '')}</text>`;
      cursor += pw;
    }
    if (totalLabel) {
      const by = y + bh + 8;
      body += `<line x1="${x}" y1="${by}" x2="${x}" y2="${by + 10}" stroke="#111"/>`;
      body += `<line x1="${x + bw}" y1="${by}" x2="${x + bw}" y2="${by + 10}" stroke="#111"/>`;
      body += `<line x1="${x}" y1="${by + 10}" x2="${x + bw}" y2="${by + 10}" stroke="#111"/>`;
      body += `<text x="${x + bw / 2}" y="${by + 26}" font-size="16" font-weight="700" text-anchor="middle" fill="#1d4ed8">${esc(totalLabel)}</text>`;
    }
    return svgShell(spec, body, 'part whole bar');
  }
  const perPart = Math.min(0.2, 1.0 / (parts.length || 1));
  const allPartsEnd = (parts.length - 1) * perPart + 0.3;
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
  if (totalLabel) {
    const by = y + bh + 8;
    const bracketDelay = (allPartsEnd + 0.1).toFixed(2);
    const labelDelay2 = (allPartsEnd + 0.3).toFixed(2);
    body += `<line x1="${x}" y1="${by}" x2="${x}" y2="${by + 10}" stroke="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.15s" begin="${bracketDelay}s" fill="freeze"/></line>`;
    body += `<line x1="${x + bw}" y1="${by}" x2="${x + bw}" y2="${by + 10}" stroke="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.15s" begin="${bracketDelay}s" fill="freeze"/></line>`;
    body += `<line x1="${x}" y1="${by + 10}" x2="${x + bw}" y2="${by + 10}" stroke="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${bracketDelay}s" fill="freeze"/></line>`;
    body += `<text x="${x + bw / 2}" y="${by + 26}" font-size="16" font-weight="700" text-anchor="middle" fill="#1d4ed8" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${labelDelay2}s" fill="freeze"/>${esc(totalLabel)}</text>`;
  }
  return svgShell(spec, body, 'part whole bar');
}

function comparisonBar(spec) {
  const { leftValue, rightValue, leftLabel = 'A', rightLabel = 'B', diffLabel } = spec.data;
  const max = Math.max(leftValue, rightValue);
  const w = spec.width; const h = spec.height; const x = 130; const bw = w - 170;
  const h1 = (leftValue / max) * bw; const h2 = (rightValue / max) * bw;
  const y1 = h / 2 - 45; const y2 = h / 2 + 15;
  // diff bracket runs from the end of the shorter bar to the end of the longer bar
  const shorter = Math.min(h1, h2); const longer = Math.max(h1, h2);
  const diffY = (h1 <= h2 ? y1 : y2); // row of the shorter bar
  if (REDUCE_MOTION) {
    let body = `<text x="40" y="${y1 + 18}" font-size="14">${esc(leftLabel)}</text><rect x="${x}" y="${y1}" width="${h1}" height="28" fill="#bfdbfe" stroke="#111"/><text x="${x + h1 + 8}" y="${y1 + 18}" font-size="14">${leftValue}</text><text x="40" y="${y2 + 18}" font-size="14">${esc(rightLabel)}</text><rect x="${x}" y="${y2}" width="${h2}" height="28" fill="#ddd6fe" stroke="#111"/><text x="${x + h2 + 8}" y="${y2 + 18}" font-size="14">${rightValue}</text>`;
    if (diffLabel) {
      const dx1 = x + shorter; const dx2 = x + longer; const dy = diffY;
      body += `<rect x="${dx1}" y="${dy}" width="${dx2 - dx1}" height="28" fill="#fef9c3" stroke="#111" stroke-dasharray="4 2"/>`;
      body += `<text x="${(dx1 + dx2) / 2}" y="${dy + 18}" font-size="14" font-weight="700" text-anchor="middle" fill="#1d4ed8">${esc(diffLabel)}</text>`;
    }
    return svgShell(spec, body, 'comparison bar');
  }
  let body = '';
  body += `<text x="40" y="${y1 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" fill="freeze"/>${esc(leftLabel)}</text>`;
  body += `<text x="40" y="${y2 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.15s" fill="freeze"/>${esc(rightLabel)}</text>`;
  body += `<rect x="${x}" y="${y1}" width="0" height="28" fill="#bfdbfe" stroke="#111"><animate attributeName="width" from="0" to="${h1}" dur="0.4s" begin="0.2s" fill="freeze"/></rect>`;
  body += `<rect x="${x}" y="${y2}" width="0" height="28" fill="#ddd6fe" stroke="#111"><animate attributeName="width" from="0" to="${h2}" dur="0.4s" begin="0.4s" fill="freeze"/></rect>`;
  body += `<text x="${x + h1 + 8}" y="${y1 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.6s" fill="freeze"/>${leftValue}</text>`;
  body += `<text x="${x + h2 + 8}" y="${y2 + 18}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.8s" fill="freeze"/>${rightValue}</text>`;
  if (diffLabel) {
    const dx1 = x + shorter; const dx2 = x + longer; const dy = diffY;
    body += `<rect x="${dx1}" y="${dy}" width="0" height="28" fill="#fef9c3" stroke="#111" stroke-dasharray="4 2"><animate attributeName="width" from="0" to="${dx2 - dx1}" dur="0.3s" begin="0.9s" fill="freeze"/></rect>`;
    body += `<text x="${(dx1 + dx2) / 2}" y="${dy + 18}" font-size="14" font-weight="700" text-anchor="middle" fill="#1d4ed8" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="1.1s" fill="freeze"/>${esc(diffLabel)}</text>`;
  }
  return svgShell(spec, body, 'comparison bar');
}

function fractionBarPair(spec) {
  const { bars = [] } = spec.data;
  const w = spec.width || 640;
  const h = spec.height || 260;
  const x = 40; const bw = w - 80; const bh = 44; const rowH = 110;
  let body = '';
  if (REDUCE_MOTION) {
    bars.forEach((bar, i) => {
      const { parts, shaded, label } = bar;
      const y = 30 + i * rowH;
      const seg = bw / parts;
      for (let j = 0; j < parts; j++) body += `<rect x="${x + j * seg}" y="${y}" width="${seg}" height="${bh}" fill="${j < shaded ? SHADED_FILL : UNSHADED_FILL}" stroke="${PARTITION_STROKE}"/>`;
      if (label) body += `<text x="${w / 2}" y="${y + bh + 22}" font-size="18" text-anchor="middle" fill="#111">${esc(label)}</text>`;
    });
  } else {
    bars.forEach((bar, i) => {
      const { parts, shaded, label } = bar;
      const y = 30 + i * rowH;
      const seg = bw / parts;
      const perSeg = Math.min(0.18, 1.2 / (shaded || 1));
      const barDelay = i * 0.65;
      for (let j = 0; j < parts; j++) {
        if (j < shaded) {
          const delay = (barDelay + j * perSeg).toFixed(2);
          body += `<rect x="${x + j * seg}" y="${y}" width="${seg}" height="${bh}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}"><animate attributeName="fill" from="${UNSHADED_FILL}" to="${SHADED_FILL}" dur="0.3s" begin="${delay}s" fill="freeze"/></rect>`;
        } else {
          body += `<rect x="${x + j * seg}" y="${y}" width="${seg}" height="${bh}" fill="${UNSHADED_FILL}" stroke="${PARTITION_STROKE}"/>`;
        }
      }
      if (label) {
        const labelDelay = (barDelay + shaded * perSeg + 0.15).toFixed(2);
        body += `<text x="${w / 2}" y="${y + bh + 22}" font-size="18" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${labelDelay}s" fill="freeze"/>${esc(label)}</text>`;
      }
    });
  }
  return svgShell({ ...spec, width: w, height: h }, body, 'fraction bar pair');
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
  if (REDUCE_MOTION) {
    let body = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#fff" stroke="#111"/>`;
    for (let i = 1; i < widthUnits; i += 1) body += `<line x1="${x + (rw * i) / widthUnits}" y1="${y}" x2="${x + (rw * i) / widthUnits}" y2="${y + rh}" stroke="#9ca3af"/>`;
    for (let j = 1; j < heightUnits; j += 1) body += `<line x1="${x}" y1="${y + (rh * j) / heightUnits}" x2="${x + rw}" y2="${y + (rh * j) / heightUnits}" stroke="#9ca3af"/>`;
    body += `<text x="${x + rw / 2}" y="${y + rh + 28}" text-anchor="middle" font-size="14">${widthUnits} units</text><text x="${x - 14}" y="${y + rh / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 ${x - 14} ${y + rh / 2})">${heightUnits} units</text>`;
    return svgShell(spec, body, 'rectangle area');
  }
  const perim = 2 * (rw + rh);
  let body = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#fff" stroke="#111" stroke-dasharray="${perim}" stroke-dashoffset="${perim}"><animate attributeName="stroke-dashoffset" from="${perim}" to="0" dur="0.5s" fill="freeze"/></rect>`;
  const gridTotal = (widthUnits - 1) + (heightUnits - 1);
  const perGrid = Math.min(0.06, 0.6 / (gridTotal || 1));
  let gi = 0;
  for (let i = 1; i < widthUnits; i += 1) {
    const gx = x + (rw * i) / widthUnits;
    const delay = (0.5 + gi * perGrid).toFixed(2);
    body += `<line x1="${gx}" y1="${y}" x2="${gx}" y2="${y + rh}" stroke="#9ca3af" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="${delay}s" fill="freeze"/></line>`;
    gi += 1;
  }
  for (let j = 1; j < heightUnits; j += 1) {
    const gy = y + (rh * j) / heightUnits;
    const delay = (0.5 + gi * perGrid).toFixed(2);
    body += `<line x1="${x}" y1="${gy}" x2="${x + rw}" y2="${gy}" stroke="#9ca3af" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="${delay}s" fill="freeze"/></line>`;
    gi += 1;
  }
  const labelDelay = (0.5 + gridTotal * perGrid + 0.15).toFixed(2);
  body += `<text x="${x + rw / 2}" y="${y + rh + 28}" text-anchor="middle" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="${labelDelay}s" fill="freeze"/>${widthUnits} units</text>`;
  body += `<text x="${x - 14}" y="${y + rh / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 ${x - 14} ${y + rh / 2})" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="${labelDelay}s" fill="freeze"/>${heightUnits} units</text>`;
  return svgShell(spec, body, 'rectangle area');
}

function triangleArea(spec) {
  const { base, height } = spec.data;
  const w = spec.width; const h = spec.height;
  const x0 = 100; const y0 = h - 70; const x1 = w - 100; const y1 = h - 70; const xt = (x0 + x1) / 2; const yt = 70;
  if (REDUCE_MOTION) {
    const body = `<polygon points="${x0},${y0} ${x1},${y1} ${xt},${yt}" fill="#eff6ff" stroke="#111"/><line x1="${xt}" y1="${yt}" x2="${xt}" y2="${y0}" stroke="#1d4ed8" stroke-dasharray="5 4"/><text x="${(x0 + x1) / 2}" y="${y0 + 24}" text-anchor="middle" font-size="14">base ${base}</text><text x="${xt + 12}" y="${(yt + y0) / 2}" font-size="14">height ${height}</text>`;
    return svgShell(spec, body, 'triangle area');
  }
  const s1 = Math.hypot(x1 - x0, y1 - y0);
  const s2 = Math.hypot(xt - x1, yt - y1);
  const s3 = Math.hypot(x0 - xt, y0 - yt);
  const perim = s1 + s2 + s3;
  const hLine = y0 - yt;
  let body = `<polygon points="${x0},${y0} ${x1},${y1} ${xt},${yt}" fill="#eff6ff" stroke="#111" stroke-dasharray="${perim}" stroke-dashoffset="${perim}"><animate attributeName="stroke-dashoffset" from="${perim}" to="0" dur="0.5s" fill="freeze"/></polygon>`;
  body += `<line x1="${xt}" y1="${yt}" x2="${xt}" y2="${y0}" stroke="#1d4ed8" stroke-dasharray="${hLine}" stroke-dashoffset="${hLine}"><animate attributeName="stroke-dashoffset" from="${hLine}" to="0" dur="0.3s" begin="0.5s" fill="freeze"/></line>`;
  body += `<text x="${(x0 + x1) / 2}" y="${y0 + 24}" text-anchor="middle" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.8s" fill="freeze"/>base ${base}</text>`;
  body += `<text x="${xt + 12}" y="${(yt + y0) / 2}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.8s" fill="freeze"/>height ${height}</text>`;
  return svgShell(spec, body, 'triangle area');
}

function cuboid(spec) {
  const { length, width, height } = spec.data;
  const w = spec.width; const h = spec.height;
  const x = 120; const y = 90; const fw = 220; const fh = 140; const ox = 70; const oy = -45;
  if (REDUCE_MOTION) {
    const body = `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="#fff" stroke="#111"/><rect x="${x + ox}" y="${y + oy}" width="${fw}" height="${fh}" fill="#f8fafc" stroke="#111"/><line x1="${x}" y1="${y}" x2="${x + ox}" y2="${y + oy}" stroke="#111"/><line x1="${x + fw}" y1="${y}" x2="${x + fw + ox}" y2="${y + oy}" stroke="#111"/><line x1="${x}" y1="${y + fh}" x2="${x + ox}" y2="${y + fh + oy}" stroke="#111"/><line x1="${x + fw}" y1="${y + fh}" x2="${x + fw + ox}" y2="${y + fh + oy}" stroke="#111"/><text x="${x + fw / 2}" y="${y + fh + 24}" font-size="14" text-anchor="middle">length ${length}</text><text x="${x - 30}" y="${y + fh / 2}" font-size="14">height ${height}</text><text x="${x + fw + ox + 12}" y="${y + oy + fh / 2}" font-size="14">width ${width}</text>`;
    return svgShell(spec, body, 'cuboid');
  }
  const frontPerim = 2 * (fw + fh);
  const backPerim = 2 * (fw + fh);
  let body = '';
  body += `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="#fff" stroke="#111" stroke-dasharray="${frontPerim}" stroke-dashoffset="${frontPerim}"><animate attributeName="stroke-dashoffset" from="${frontPerim}" to="0" dur="0.4s" fill="freeze"/></rect>`;
  body += `<rect x="${x + ox}" y="${y + oy}" width="${fw}" height="${fh}" fill="#f8fafc" stroke="#111" stroke-dasharray="${backPerim}" stroke-dashoffset="${backPerim}"><animate attributeName="stroke-dashoffset" from="${backPerim}" to="0" dur="0.4s" begin="0.3s" fill="freeze"/></rect>`;
  const edges = [[x, y, x + ox, y + oy], [x + fw, y, x + fw + ox, y + oy], [x, y + fh, x + ox, y + fh + oy], [x + fw, y + fh, x + fw + ox, y + fh + oy]];
  edges.forEach(([lx1, ly1, lx2, ly2]) => {
    body += `<line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.6s" fill="freeze"/></line>`;
  });
  body += `<text x="${x + fw / 2}" y="${y + fh + 24}" font-size="14" text-anchor="middle" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.8s" fill="freeze"/>length ${length}</text>`;
  body += `<text x="${x - 30}" y="${y + fh / 2}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.8s" fill="freeze"/>height ${height}</text>`;
  body += `<text x="${x + fw + ox + 12}" y="${y + oy + fh / 2}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.8s" fill="freeze"/>width ${width}</text>`;
  return svgShell(spec, body, 'cuboid');
}

function angleOnLine(spec) {
  const { angleDegrees } = spec.data;
  const w = spec.width; const h = spec.height; const cx = w / 2; const cy = h / 2 + 30; const r = Math.min(w, h) * 0.28;
  const rad = (Math.PI * angleDegrees) / 180;
  const x2 = cx + r * Math.cos(Math.PI - rad); const y2 = cy - r * Math.sin(Math.PI - rad);
  if (REDUCE_MOTION) {
    const body = `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#111" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#1d4ed8" stroke-width="2"/><path d="M ${cx - 40} ${cy} A 40 40 0 0 1 ${cx - 40 * Math.cos(rad)} ${cy - 40 * Math.sin(rad)}" fill="none" stroke="#111"/><text x="${cx - 24}" y="${cy - 16}" font-size="14">${angleDegrees}°</text>`;
    return svgShell(spec, body, 'angle on line');
  }
  const baseLen = 2 * r;
  const armLen = Math.hypot(x2 - cx, y2 - cy);
  const arcLen = 40 * rad;
  let body = '';
  body += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#111" stroke-width="2" stroke-dasharray="${baseLen}" stroke-dashoffset="${baseLen}"><animate attributeName="stroke-dashoffset" from="${baseLen}" to="0" dur="0.3s" fill="freeze"/></line>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="${armLen}" stroke-dashoffset="${armLen}"><animate attributeName="stroke-dashoffset" from="${armLen}" to="0" dur="0.3s" begin="0.3s" fill="freeze"/></line>`;
  body += `<path d="M ${cx - 40} ${cy} A 40 40 0 0 1 ${cx - 40 * Math.cos(rad)} ${cy - 40 * Math.sin(rad)}" fill="none" stroke="#111" stroke-dasharray="${arcLen}" stroke-dashoffset="${arcLen}"><animate attributeName="stroke-dashoffset" from="${arcLen}" to="0" dur="0.3s" begin="0.6s" fill="freeze"/></path>`;
  body += `<text x="${cx - 24}" y="${cy - 16}" font-size="14" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.85s" fill="freeze"/>${angleDegrees}°</text>`;
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
  if (REDUCE_MOTION) {
    let body = `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111"/>`;
    bars.forEach((b, i) => {
      const bh = (Number(b.value || 0) / max) * ch;
      const bx = x0 + i * bw + 8;
      body += `<rect x="${bx}" y="${y0 - bh}" width="${bw - 16}" height="${bh}" fill="#93c5fd" stroke="#111"/><text x="${bx + (bw - 16) / 2}" y="${y0 + 16}" text-anchor="middle" font-size="12">${esc(b.label || '')}</text>`;
    });
    return svgShell(spec, body, 'bar chart');
  }
  const xAxisLen = w - 20 - x0;
  const yAxisLen = y0 - 20;
  let body = '';
  body += `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111" stroke-dasharray="${xAxisLen}" stroke-dashoffset="${xAxisLen}"><animate attributeName="stroke-dashoffset" from="${xAxisLen}" to="0" dur="0.3s" fill="freeze"/></line>`;
  body += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111" stroke-dasharray="${yAxisLen}" stroke-dashoffset="${yAxisLen}"><animate attributeName="stroke-dashoffset" from="${yAxisLen}" to="0" dur="0.3s" fill="freeze"/></line>`;
  const perBar = Math.min(0.18, 1.0 / (bars.length || 1));
  bars.forEach((b, i) => {
    const bh = (Number(b.value || 0) / max) * ch;
    const bx = x0 + i * bw + 8;
    const delay = (0.3 + i * perBar).toFixed(2);
    const labelDelay = (0.3 + i * perBar + 0.2).toFixed(2);
    body += `<rect x="${bx}" y="${y0}" width="${bw - 16}" height="0" fill="#93c5fd" stroke="#111"><animate attributeName="height" from="0" to="${bh}" dur="0.3s" begin="${delay}s" fill="freeze"/><animate attributeName="y" from="${y0}" to="${y0 - bh}" dur="0.3s" begin="${delay}s" fill="freeze"/></rect>`;
    body += `<text x="${bx + (bw - 16) / 2}" y="${y0 + 16}" text-anchor="middle" font-size="12" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${labelDelay}s" fill="freeze"/>${esc(b.label || '')}</text>`;
  });
  return svgShell(spec, body, 'bar chart');
}

function lineGraph(spec) {
  const { points = [] } = spec.data;
  const w = spec.width; const h = spec.height; const x0 = 50; const y0 = h - 45; const cw = w - 90; const ch = h - 80;
  const isLabeled = points.length > 0 && 'value' in points[0];
  const pts = isLabeled ? points.map((p, i) => ({ x: i, y: Number(p.value) || 0, label: p.label })) : points;
  const maxX = isLabeled ? Math.max(pts.length - 1, 1) : Math.max(...pts.map((p) => p.x), 1);
  const maxY = Math.max(...pts.map((p) => p.y), 1);
  const toX = (px) => x0 + (px / maxX) * cw; const toY = (py) => y0 - (py / maxY) * ch;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${toX(p.x)} ${toY(p.y)}`).join(' ');
  if (REDUCE_MOTION) {
    let body = `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111"/><path d="${d}" fill="none" stroke="#1d4ed8" stroke-width="2"/>`;
    pts.forEach((p) => { body += `<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="3" fill="#1d4ed8"/>`; if (p.label) body += `<text x="${toX(p.x)}" y="${y0 + 16}" font-size="11" text-anchor="middle" fill="#111">${esc(p.label)}</text>`; });
    return svgShell(spec, body, 'line graph');
  }
  const xAxisLen = w - 20 - x0;
  const yAxisLen = y0 - 20;
  let body = '';
  body += `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111" stroke-dasharray="${xAxisLen}" stroke-dashoffset="${xAxisLen}"><animate attributeName="stroke-dashoffset" from="${xAxisLen}" to="0" dur="0.3s" fill="freeze"/></line>`;
  body += `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111" stroke-dasharray="${yAxisLen}" stroke-dashoffset="${yAxisLen}"><animate attributeName="stroke-dashoffset" from="${yAxisLen}" to="0" dur="0.3s" fill="freeze"/></line>`;
  let pathLen = 0;
  for (let i = 1; i < pts.length; i += 1) {
    pathLen += Math.hypot(toX(pts[i].x) - toX(pts[i - 1].x), toY(pts[i].y) - toY(pts[i - 1].y));
  }
  pathLen = Math.max(pathLen, 1);
  body += `<path d="${d}" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="${pathLen}" stroke-dashoffset="${pathLen}"><animate attributeName="stroke-dashoffset" from="${pathLen}" to="0" dur="0.6s" begin="0.3s" fill="freeze"/></path>`;
  const perDot = Math.min(0.12, 0.6 / (pts.length || 1));
  pts.forEach((p, i) => {
    const delay = (0.9 + i * perDot).toFixed(2);
    body += `<circle cx="${toX(p.x)}" cy="${toY(p.y)}" r="0" fill="#1d4ed8"><animate attributeName="r" from="0" to="4" dur="0.12s" begin="${delay}s" fill="freeze"/><animate attributeName="r" from="4" to="3" dur="0.08s" begin="${(0.9 + i * perDot + 0.12).toFixed(2)}s" fill="freeze"/></circle>`;
    if (p.label) body += `<text x="${toX(p.x)}" y="${y0 + 16}" font-size="11" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${delay}s" fill="freeze"/>${esc(p.label)}</text>`;
  });
  return svgShell(spec, body, 'line graph');
}

// ---------- Circle family renderers (P6 Circles domain) ----------
// Shared styling with the geometry renderers above: pale-blue fill, #111
// outline, blue (#1d4ed8) dimension line, 14px labels.
const CIRCLE_FILL = '#eff6ff';
const DIM_STROKE = '#1d4ed8';

// A labeled circle. data: { radius?, diameter?, label?, show: 'radius'|'diameter' }.
function circle(spec) {
  const d = spec.data || {};
  const show = d.show || (Number.isFinite(d.diameter) && !Number.isFinite(d.radius) ? 'diameter' : 'radius');
  const radius = Number.isFinite(d.radius)
    ? d.radius
    : (Number.isFinite(d.diameter) ? d.diameter / 2 : 7);
  const label = d.label != null
    ? d.label
    : (show === 'diameter' ? `${radius * 2} cm` : `${radius} cm`);
  const w = spec.width || 360; const h = spec.height || 280;
  const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * 0.32;

  function dimension(animate) {
    const isDia = show === 'diameter';
    const x1 = isDia ? cx - r : cx;
    const x2 = cx + r;
    const len = isDia ? 2 * r : r;
    const labelX = isDia ? cx : cx + r / 2;
    let out;
    if (animate) {
      out = `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="${DIM_STROKE}" stroke-width="2" stroke-dasharray="${len}" stroke-dashoffset="${len}"><animate attributeName="stroke-dashoffset" from="${len}" to="0" dur="0.3s" begin="0.4s" fill="freeze"/></line>`;
    } else {
      out = `<line x1="${x1}" y1="${cy}" x2="${x2}" y2="${cy}" stroke="${DIM_STROKE}" stroke-width="2"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="3" fill="${DIM_STROKE}"/>`;
    out += animate
      ? `<text x="${labelX}" y="${cy - 8}" font-size="14" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.75s" fill="freeze"/>${esc(label)}</text>`
      : `<text x="${labelX}" y="${cy - 8}" font-size="14" text-anchor="middle" fill="#111">${esc(label)}</text>`;
    return out;
  }

  if (REDUCE_MOTION) {
    let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${CIRCLE_FILL}" stroke="${BORDER_STROKE}"/>`;
    body += dimension(false);
    return svgShell(spec, body, 'circle');
  }
  const circ = 2 * Math.PI * r;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${CIRCLE_FILL}" stroke="${BORDER_STROKE}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"><animate attributeName="stroke-dashoffset" from="${circ}" to="0" dur="0.5s" fill="freeze"/></circle>`;
  body += dimension(true);
  return svgShell(spec, body, 'circle');
}

// Semicircle / quarter circle (quadrant). data: { radius?, diameter?, label?, note? }.
// The straight edge (diameter for semicircle, radius for quadrant) is labeled.
function partialCircle(spec, kind) {
  const d = spec.data || {};
  const radius = Number.isFinite(d.radius)
    ? d.radius
    : (Number.isFinite(d.diameter) ? d.diameter / 2 : 7);
  const w = spec.width || 360; const h = spec.height || 280;
  const r = Math.min(w, h) * 0.34;
  const cx = w / 2;

  let path; let dim; let labelPos; let label;
  if (kind === 'quarter_circle') {
    // Quadrant with the right angle at the bottom-left: two straight radii + arc.
    const ox = cx - r / 2; const oy = h / 2 + r / 2;
    path = `M ${ox} ${oy} L ${ox + r} ${oy} A ${r} ${r} 0 0 0 ${ox} ${oy - r} Z`;
    dim = { x1: ox, y1: oy, x2: ox + r, y2: oy };
    labelPos = { x: ox + r / 2, y: oy + 18 };
    label = d.label != null ? d.label : `${radius} cm`;
  } else {
    // Semicircle: flat (diameter) edge along the bottom, arc on top.
    const ox = cx - r; const oy = h / 2 + r / 2;
    path = `M ${ox} ${oy} A ${r} ${r} 0 0 1 ${ox + 2 * r} ${oy} Z`;
    dim = { x1: ox, y1: oy, x2: ox + 2 * r, y2: oy };
    labelPos = { x: cx, y: oy + 18 };
    label = d.label != null ? d.label : `${radius * 2} cm`;
  }
  const aria = kind === 'quarter_circle' ? 'quarter circle' : 'semicircle';

  if (REDUCE_MOTION) {
    let body = `<path d="${path}" fill="${CIRCLE_FILL}" stroke="${BORDER_STROKE}"/>`;
    body += `<line x1="${dim.x1}" y1="${dim.y1}" x2="${dim.x2}" y2="${dim.y2}" stroke="${DIM_STROKE}" stroke-width="2"/>`;
    body += `<text x="${labelPos.x}" y="${labelPos.y}" font-size="14" text-anchor="middle" fill="#111">${esc(label)}</text>`;
    if (d.note) body += `<text x="${cx}" y="${h - 12}" font-size="12" text-anchor="middle" fill="#475569">${esc(d.note)}</text>`;
    return svgShell(spec, body, aria);
  }
  let body = `<path d="${path}" fill="${CIRCLE_FILL}" stroke="${BORDER_STROKE}" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze"/></path>`;
  const len = Math.hypot(dim.x2 - dim.x1, dim.y2 - dim.y1);
  body += `<line x1="${dim.x1}" y1="${dim.y1}" x2="${dim.x2}" y2="${dim.y2}" stroke="${DIM_STROKE}" stroke-width="2" stroke-dasharray="${len}" stroke-dashoffset="${len}"><animate attributeName="stroke-dashoffset" from="${len}" to="0" dur="0.3s" begin="0.4s" fill="freeze"/></line>`;
  body += `<text x="${labelPos.x}" y="${labelPos.y}" font-size="14" text-anchor="middle" fill="#111" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.75s" fill="freeze"/>${esc(label)}</text>`;
  if (d.note) body += `<text x="${cx}" y="${h - 12}" font-size="12" text-anchor="middle" fill="#475569" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="0.9s" fill="freeze"/>${esc(d.note)}</text>`;
  return svgShell(spec, body, aria);
}

function semicircle(spec) { return partialCircle(spec, 'semicircle'); }
function quarterCircle(spec) { return partialCircle(spec, 'quarter_circle'); }

// L-shaped (rectilinear) figure. data: { overallW, overallH, notchW, notchH }.
// The notch is removed from the TOP-RIGHT corner, giving the classic L. Each
// edge is labelled with its length so area/perimeter is solvable from the figure.
function lShape(spec) {
  const { overallW, overallH, notchW, notchH } = spec.data;
  const w = spec.width; const h = spec.height;
  // Fit the figure into the drawing box with padding; scale by the larger dim.
  const pad = 60; const maxW = w - pad * 2; const maxH = h - pad * 2;
  const s = Math.min(maxW / overallW, maxH / overallH);
  const ox = (w - overallW * s) / 2; const oy = (h - overallH * s) / 2;
  const X = (u) => ox + u * s; const Y = (u) => oy + u * s;
  const pts = [
    [0, 0], [overallW - notchW, 0], [overallW - notchW, notchH],
    [overallW, notchH], [overallW, overallH], [0, overallH],
  ].map(([u, v]) => `${X(u)},${Y(v)}`).join(' ');
  let body = `<polygon points="${pts}" fill="#eff6ff" stroke="#111" stroke-width="2"/>`;
  // All labels sit OUTSIDE the figure (above/below/left/right of the edges, or
  // in the empty notch cut-out), never on top of an edge stroke.
  const txt = (px, py, t, anchor = 'middle') => `<text x="${px}" y="${py}" text-anchor="${anchor}" font-size="13" fill="#1e293b">${t} cm</text>`;
  body += txt(X((overallW - notchW) / 2), Y(0) - 9, overallW - notchW);                       // top — above
  body += txt(X(0) - 10, Y(overallH / 2) + 4, overallH, 'end');                                // left — outside left
  body += txt(X(overallW / 2), Y(overallH) + 22, overallW, 'middle');                          // bottom — below
  body += txt(X(overallW) + 10, Y((notchH + overallH) / 2) + 4, overallH - notchH, 'start');   // right — outside right
  body += txt(X(overallW - notchW) + 8, Y(notchH / 2) + 4, notchH, 'start');                   // notch vertical — in cut-out
  body += txt(X((overallW - notchW + overallW) / 2), Y(notchH) - 7, notchW);                   // notch horizontal — in cut-out
  return svgShell(spec, body, 'L-shaped figure');
}

// Parallelogram. data: { base, height, slant }. Drawn with the perpendicular
// height as a dashed line so "area = base × height" is clear.
function parallelogram(spec) {
  const { base, height, slant } = spec.data;
  const w = spec.width; const h = spec.height;
  const pad = 70; const slantShift = Math.min(slant, base) * 0.5;
  const spanW = base + slantShift; const spanH = height;
  const s = Math.min((w - pad * 2) / spanW, (h - pad * 2) / spanH);
  const ox = (w - spanW * s) / 2; const oy = (h - spanH * s) / 2;
  const X = (u) => ox + u * s; const Y = (u) => oy + u * s;
  // bottom-left, bottom-right, top-right, top-left
  const bl = [0, height]; const br = [base, height];
  const tr = [base + slantShift, 0]; const tl = [slantShift, 0];
  const pts = [bl, br, tr, tl].map(([u, v]) => `${X(u)},${Y(v)}`).join(' ');
  let body = `<polygon points="${pts}" fill="#eff6ff" stroke="#111" stroke-width="2"/>`;
  // Perpendicular height (dashed) from top-left down to the base line.
  body += `<line x1="${X(tl[0])}" y1="${Y(0)}" x2="${X(tl[0])}" y2="${Y(height)}" stroke="#1d4ed8" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  // base label below the figure; height label outside to the LEFT of the figure.
  body += `<text x="${X(base / 2)}" y="${Y(height) + 22}" text-anchor="middle" font-size="13" fill="#1e293b">base ${base} cm</text>`;
  body += `<text x="${X(0) - 10}" y="${Y(height / 2) + 4}" text-anchor="end" font-size="13" fill="#1d4ed8">height ${height} cm</text>`;
  return svgShell(spec, body, 'parallelogram');
}

// Trapezium. data: { a (top parallel side), b (bottom parallel side), height }.
// Isosceles layout with the top centred over the bottom; dashed height line.
function trapezium(spec) {
  const { a, b, height } = spec.data;
  const w = spec.width; const h = spec.height;
  const pad = 70; const span = Math.max(a, b);
  const s = Math.min((w - pad * 2) / span, (h - pad * 2) / height);
  const ox = (w - b * s) / 2; const oy = (h - height * s) / 2;
  const X = (u) => ox + u * s; const Y = (u) => oy + u * s;
  const inset = (b - a) / 2;
  // bottom-left, bottom-right, top-right, top-left
  const pts = [[0, height], [b, height], [inset + a, 0], [inset, 0]]
    .map(([u, v]) => `${X(u)},${Y(v)}`).join(' ');
  let body = `<polygon points="${pts}" fill="#eff6ff" stroke="#111" stroke-width="2"/>`;
  body += `<line x1="${X(inset)}" y1="${Y(0)}" x2="${X(inset)}" y2="${Y(height)}" stroke="#1d4ed8" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  // top side above, bottom side below, height outside to the LEFT.
  body += `<text x="${X(inset + a / 2)}" y="${Y(0) - 9}" text-anchor="middle" font-size="13" fill="#1e293b">${a} cm</text>`;
  body += `<text x="${X(b / 2)}" y="${Y(height) + 22}" text-anchor="middle" font-size="13" fill="#1e293b">${b} cm</text>`;
  body += `<text x="${X(0) - 10}" y="${Y(height / 2) + 4}" text-anchor="end" font-size="13" fill="#1d4ed8">h ${height} cm</text>`;
  return svgShell(spec, body, 'trapezium');
}

// Analogue clock face. data: { hour, minute }. Numbers 1–12, hour ticks, and
// hour + minute hands pointing to the time so "what time does the clock show?"
// is actually readable.
function clockFace(spec) {
  const { hour = 12, minute = 0 } = spec.data;
  const w = spec.width; const h = spec.height;
  const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) / 2 - 26;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#111" stroke-width="3"/>`;
  for (let i = 1; i <= 12; i += 1) {
    const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + Math.cos(a) * (r - 7); const y1 = cy + Math.sin(a) * (r - 7);
    const x2 = cx + Math.cos(a) * r; const y2 = cy + Math.sin(a) * r;
    body += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="${i % 3 === 0 ? 3 : 1.5}"/>`;
    const nx = cx + Math.cos(a) * (r - 24); const ny = cy + Math.sin(a) * (r - 24) + 6;
    body += `<text x="${nx}" y="${ny}" text-anchor="middle" font-size="17" font-weight="600" fill="#1e293b">${i}</text>`;
  }
  const minA = (minute / 60) * 2 * Math.PI - Math.PI / 2;
  const hrA = (((hour % 12) + minute / 60) / 12) * 2 * Math.PI - Math.PI / 2;
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(hrA) * r * 0.52}" y2="${cy + Math.sin(hrA) * r * 0.52}" stroke="#111" stroke-width="5" stroke-linecap="round"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(minA) * r * 0.8}" y2="${cy + Math.sin(minA) * r * 0.8}" stroke="#1d4ed8" stroke-width="3" stroke-linecap="round"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="5" fill="#111"/>`;
  return svgShell(spec, body, `clock showing ${hour}:${String(minute).padStart(2, '0')}`);
}

// Linear measuring scale (weighing scale / gauge). data:
// { start, interval, marks, unit }. Evenly-spaced ticks labelled in the unit,
// with a red pointer at the `marks`-th tick past start so the student reads it.
function measuringScale(spec) {
  const { start = 0, interval = 10, marks = 1, unit = 'g' } = spec.data;
  const w = spec.width; const h = spec.height;
  const pad = 46; const trackY = h - 64; const x0 = pad; const x1 = w - pad;
  const totalTicks = Math.max(Number(marks) + 4, 6);
  const step = (x1 - x0) / totalTicks;
  let body = `<line x1="${x0}" y1="${trackY}" x2="${x1}" y2="${trackY}" stroke="#111" stroke-width="2"/>`;
  for (let i = 0; i <= totalTicks; i += 1) {
    const x = x0 + i * step;
    body += `<line x1="${x}" y1="${trackY}" x2="${x}" y2="${trackY - 14}" stroke="#111" stroke-width="1.5"/>`;
    body += `<text x="${x}" y="${trackY + 22}" text-anchor="middle" font-size="12" fill="#475569">${start + i * interval}</text>`;
  }
  const px = x0 + Number(marks) * step;
  body += `<polygon points="${px - 9},${trackY - 38} ${px + 9},${trackY - 38} ${px},${trackY - 17}" fill="#dc2626"/>`;
  body += `<text x="${w / 2}" y="24" text-anchor="middle" font-size="13" fill="#1e293b">Each mark = ${interval} ${unit}</text>`;
  return svgShell(spec, body, 'measuring scale');
}

export const renderers = {
  ...sharedRenderers,
  circle,
  semicircle,
  quarter_circle: quarterCircle,
  fraction_bar: fractionBar,
  fraction_bar_pair: fractionBarPair,
  fraction_circle: fractionCircle,
  fraction_triangle: fractionTriangle,
  number_line: numberLine,
  part_whole_bar: partWholeBar,
  comparison_bar: comparisonBar,
  before_after_bar: beforeAfterBar,
  ratio_bar: ratioBar,
  rectangle_area: rectangleArea,
  triangle_area: triangleArea,
  l_shape: lShape,
  parallelogram,
  trapezium,
  clock_face: clockFace,
  measuring_scale: measuringScale,
  cuboid: cuboid,
  angle_on_line: angleOnLine,
  table,
  bar_chart: barChart,
  line_graph: lineGraph,
};
