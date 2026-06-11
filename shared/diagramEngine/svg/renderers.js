import { clamp, esc, gridPosition, specData, svgShell, toFractionString } from './common.js';

function renderNumberLine(spec) {
  const d = specData(spec);
  const start = Number.isFinite(d.start) ? d.start : 0;
  const end = Number.isFinite(d.end) ? d.end : 1;
  const step = Number.isFinite(d.step) && d.step > 0 ? d.step : 0.1;
  const marks = [];
  const maxTicks = 240;

  let value = start;
  let guard = 0;
  while (value <= end + 1e-9 && guard < maxTicks) {
    marks.push(Number(value.toFixed(6)));
    value += step;
    guard += 1;
  }
  if (marks.length === 0 || marks[marks.length - 1] < end) marks.push(end);

  const points = Array.isArray(d.points) ? d.points : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const x0 = 40;
  const x1 = w - 40;
  const y = Math.round(h * 0.6);
  const scale = (val) => x0 + ((val - start) / ((end - start) || 1)) * (x1 - x0);

  let body = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#111111" stroke-width="2"/>`;
  marks.forEach((tick) => {
    const x = scale(tick);
    body += `<line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}" stroke="#111111" stroke-width="1.3"/>`;
    body += `<text x="${x}" y="${y + 27}" font-size="12" text-anchor="middle" fill="#111111">${esc(tick)}</text>`;
  });
  points.forEach((point) => {
    const x = scale(Number(point.value));
    const label = point.label ?? toFractionString(point.value);
    body += `<circle cx="${x}" cy="${y}" r="4.5" fill="#111111"/><text x="${x}" y="${y - 14}" font-size="12" text-anchor="middle" fill="#111111">${esc(label)}</text>`;
  });
  return svgShell(spec, body, spec.title || 'Number line diagram');
}

function renderFractionModel(spec) {
  const d = specData(spec);
  const parts = Math.max(1, Number(d.parts) || 1);
  const shaded = clamp(Math.round(Number(d.shaded) || 0), 0, parts);
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const x = 40;
  const y = Math.round(h * 0.44);
  const bw = w - 80;
  const bh = Math.round(h * 0.18);
  const segment = bw / parts;
  let body = '';
  for (let i = 0; i < parts; i += 1) {
    body += `<rect x="${x + i * segment}" y="${y}" width="${segment}" height="${bh}" fill="${i < shaded ? '#dbeafe' : '#ffffff'}" stroke="#111111" stroke-width="1.2"/>`;
  }
  body += `<text x="${w / 2}" y="${y + bh + 30}" text-anchor="middle" font-size="16" fill="#111111">${shaded}/${parts}</text>`;
  return svgShell(spec, body, spec.title || 'Fraction model diagram');
}

function renderFractionCircle(spec) {
  const d = specData(spec);
  const parts = Math.max(1, Number(d.parts) || 1);
  const shaded = clamp(Math.round(Number(d.shaded) || 0), 0, parts);
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.27;
  let body = '';
  for (let i = 0; i < parts; i += 1) {
    const a0 = ((i / parts) * Math.PI * 2) - (Math.PI / 2);
    const a1 = (((i + 1) / parts) * Math.PI * 2) - (Math.PI / 2);
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    body += `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${i < shaded ? '#dbeafe' : '#ffffff'}" stroke="#111111" stroke-width="1.2"/>`;
  }
  body += `<text x="${cx}" y="${cy + r + 30}" text-anchor="middle" font-size="16" fill="#111111">${shaded}/${parts}</text>`;
  return svgShell(spec, body, spec.title || 'Fraction circle diagram');
}

function renderEqualGroups(spec) {
  const d = specData(spec);
  const groups = Math.max(1, Number(d.groups) || 1);
  const itemsPerGroup = Math.max(1, Number(d.itemsPerGroup) || 1);
  const w = Number(spec.width) || 640;
  const padding = 22;
  const usableW = w - (padding * 2);
  const groupW = usableW / groups;
  const maxRows = Math.ceil(itemsPerGroup / 5);
  const rowGap = 16;
  const dotR = 5;
  const groupTop = 16;
  const totalH = Math.max(60, maxRows * rowGap + 30);
  let body = '';

  for (let g = 0; g < groups; g += 1) {
    const gx = padding + (g * groupW);
    body += `<rect x="${gx + 4}" y="${groupTop}" width="${groupW - 8}" height="${totalH}" fill="#ffffff" stroke="#111111" stroke-width="1"/>`;
    for (let i = 0; i < itemsPerGroup; i += 1) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const cx = gx + 16 + col * ((groupW - 32) / 5);
      const cy = groupTop + 20 + row * rowGap;
      body += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#111111"/>`;
    }
    body += `<text x="${gx + groupW / 2}" y="${groupTop + totalH + 18}" font-size="11" text-anchor="middle" fill="#111111">Group ${g + 1}</text>`;
  }
  const summaryY = groupTop + totalH + 40;
  body += `<text x="${w / 2}" y="${summaryY}" font-size="14" text-anchor="middle" fill="#111111">${groups} groups of ${itemsPerGroup}</text>`;
  const tightH = summaryY + 16;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Equal groups diagram');
}

function renderArrays(spec) {
  const d = specData(spec);
  const rows = Math.max(1, Number(d.rows) || 1);
  const columns = Math.max(1, Number(d.columns) || 1);
  const filled = clamp(Number(d.filled ?? rows * columns), 0, rows * columns);
  const w = Number(spec.width) || 640;
  const margin = 36;
  const cellSize = Math.min((w - margin * 2) / columns, 40);
  const cellW = cellSize;
  const cellH = cellSize;
  let body = '';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const idx = r * columns + c;
      const x = margin + c * cellW;
      const y = margin + r * cellH;
      body += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${idx < filled ? '#dbeafe' : '#ffffff'}" stroke="#111111" stroke-width="1"/>`;
    }
  }
  const gridBottom = margin + rows * cellH;
  body += `<text x="${w / 2}" y="${gridBottom + 24}" font-size="14" text-anchor="middle" fill="#111111">${rows} rows × ${columns} columns</text>`;
  const tightH = gridBottom + 40;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Array diagram');
}

function renderPictureCollections(spec) {
  const d = specData(spec);
  const categories = Array.isArray(d.categories) ? d.categories : [];
  const symbol = d.symbol || '●';
  const w = Number(spec.width) || 640;
  const top = 24;
  const lineH = 36;
  let body = '';
  let maxY = top;
  categories.forEach((cat, idx) => {
    const y = top + idx * lineH;
    const count = Math.max(0, Number(cat.count) || 0);
    body += `<text x="20" y="${y + 14}" font-size="13" fill="#111111">${esc(cat.label || `Group ${idx + 1}`)}</text>`;
    for (let i = 0; i < count; i += 1) {
      const maxCols = 16;
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const x = 120 + col * 22;
      const yy = y + 6 + row * 16;
      body += `<text x="${x}" y="${yy}" font-size="13" fill="#111111">${esc(symbol)}</text>`;
      maxY = Math.max(maxY, yy + 16);
    }
    maxY = Math.max(maxY, y + 20);
  });
  const tightH = maxY + 16;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Picture collection diagram');
}

function renderPlaceValueBlocks(spec) {
  const d = specData(spec);
  const hundreds = clamp(Math.round(Number(d.hundreds) || 0), 0, 9);
  const tens = clamp(Math.round(Number(d.tens) || 0), 0, 9);
  const ones = clamp(Math.round(Number(d.ones) || 0), 0, 9);
  const w = Number(spec.width) || 640;
  const topY = 20;
  let maxBottom = topY;
  let body = '';

  for (let i = 0; i < hundreds; i += 1) {
    const pos = gridPosition(i, 3, 44, 44, 28, topY, 10, 10);
    body += `<rect x="${pos.x}" y="${pos.y}" width="44" height="44" fill="#fef3c7" stroke="#111111" stroke-width="1"/>`;
    maxBottom = Math.max(maxBottom, pos.y + 44);
  }

  for (let i = 0; i < tens; i += 1) {
    const pos = gridPosition(i, 3, 14, 56, 250, topY, 10, 10);
    body += `<rect x="${pos.x}" y="${pos.y}" width="14" height="56" fill="#e0f2fe" stroke="#111111" stroke-width="1"/>`;
    maxBottom = Math.max(maxBottom, pos.y + 56);
  }

  for (let i = 0; i < ones; i += 1) {
    const pos = gridPosition(i, 3, 14, 14, 470, topY + 20, 12, 12);
    body += `<rect x="${pos.x}" y="${pos.y}" width="14" height="14" fill="#dcfce7" stroke="#111111" stroke-width="1"/>`;
    maxBottom = Math.max(maxBottom, pos.y + 14);
  }

  const labelY = maxBottom + 20;
  body += `<text x="90" y="${labelY}" text-anchor="middle" font-size="12" fill="#111111">Hundreds</text>`;
  body += `<text x="280" y="${labelY}" text-anchor="middle" font-size="12" fill="#111111">Tens</text>`;
  body += `<text x="500" y="${labelY}" text-anchor="middle" font-size="12" fill="#111111">Ones</text>`;
  body += `<text x="${w / 2}" y="${labelY + 22}" text-anchor="middle" font-size="14" fill="#111111">${hundreds}${tens}${ones}</text>`;
  const tightH = labelY + 38;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Place value blocks diagram');
}

function renderBarGraph(spec) {
  const d = specData(spec);
  const bars = Array.isArray(d.bars) ? d.bars : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const x0 = 54;
  const y0 = h - 46;
  const chartW = w - 90;
  const chartH = h - 88;
  const maxValue = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
  const band = chartW / Math.max(bars.length, 1);
  let body = `<line x1="${x0}" y1="${y0}" x2="${w - 20}" y2="${y0}" stroke="#111111" stroke-width="1.6"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="20" stroke="#111111" stroke-width="1.6"/>`;

  bars.forEach((bar, idx) => {
    const height = (Math.max(0, Number(bar.value) || 0) / maxValue) * chartH;
    const x = x0 + idx * band + 8;
    const bw = Math.max(14, band - 16);
    const y = y0 - height;
    body += `<rect x="${x}" y="${y}" width="${bw}" height="${height}" fill="#e5e7eb" stroke="#111111" stroke-width="1"/>`;
    body += `<text x="${x + bw / 2}" y="${y0 + 15}" text-anchor="middle" font-size="11" fill="#111111">${esc(bar.label || '')}</text>`;
    body += `<text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#111111">${Number(bar.value) || 0}</text>`;
  });
  if (d.title) body += `<text x="${w / 2}" y="16" text-anchor="middle" font-size="13" font-weight="600" fill="#111111">${esc(d.title)}</text>`;
  if (d.xLabel) body += `<text x="${w / 2}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#111111">${esc(d.xLabel)}</text>`;
  if (d.yLabel) body += `<text x="16" y="${h / 2}" text-anchor="middle" font-size="11" transform="rotate(-90 16 ${h / 2})" fill="#111111">${esc(d.yLabel)}</text>`;
  return svgShell(spec, body, spec.title || 'Bar graph diagram');
}

function renderPictureGraph(spec) {
  const d = specData(spec);
  const categories = Array.isArray(d.categories) ? d.categories : [];
  const symbol = esc(d.symbol || '●');
  const symbolValue = Number(d.symbolValue) > 0 ? Number(d.symbolValue) : 1;
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const lineH = categories.length ? (h - 90) / categories.length : 20;
  let body = `<text x="20" y="20" font-size="12" fill="#111111">Key: ${symbol} = ${symbolValue}</text>`;
  categories.forEach((cat, idx) => {
    const count = Math.max(0, Number(cat.count) || 0);
    const symbolsNeeded = Math.round(count / symbolValue);
    const y = 42 + idx * lineH;
    body += `<text x="20" y="${y}" font-size="12" fill="#111111">${esc(cat.label || `Category ${idx + 1}`)}</text>`;
    for (let i = 0; i < symbolsNeeded; i += 1) {
      const x = 170 + i * 20;
      body += `<text x="${x}" y="${y}" font-size="14" fill="#111111">${symbol}</text>`;
    }
  });
  return svgShell(spec, body, spec.title || 'Picture graph diagram');
}

function renderTable(spec) {
  const d = specData(spec);
  const headers = Array.isArray(d.headers) ? d.headers : [];
  const rows = Array.isArray(d.rows) ? d.rows : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const x = 18;
  const y = 28;
  const cols = Math.max(headers.length, 1);
  const totalRows = rows.length + 1;
  const tw = w - 36;
  const th = h - 50;
  const cw = tw / cols;
  const ch = th / Math.max(totalRows, 1);
  let body = `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="#ffffff" stroke="#111111" stroke-width="1.3"/>`;
  for (let c = 1; c < cols; c += 1) body += `<line x1="${x + c * cw}" y1="${y}" x2="${x + c * cw}" y2="${y + th}" stroke="#111111" stroke-width="1"/>`;
  for (let r = 1; r < totalRows; r += 1) body += `<line x1="${x}" y1="${y + r * ch}" x2="${x + tw}" y2="${y + r * ch}" stroke="#111111" stroke-width="1"/>`;
  headers.forEach((head, idx) => {
    body += `<text x="${x + idx * cw + cw / 2}" y="${y + ch / 2 + 5}" text-anchor="middle" font-size="11" font-weight="600" fill="#111111">${esc(head)}</text>`;
  });
  rows.forEach((row, ridx) => {
    (Array.isArray(row) ? row : []).forEach((cell, cidx) => {
      body += `<text x="${x + cidx * cw + cw / 2}" y="${y + (ridx + 1) * ch + ch / 2 + 4}" text-anchor="middle" font-size="11" fill="#111111">${esc(cell)}</text>`;
    });
  });
  return svgShell(spec, body, spec.title || 'Table diagram');
}

function shapePath(type, x, y, size) {
  const s = size;
  if (type === 'square') return `<rect x="${x}" y="${y}" width="${s}" height="${s}" />`;
  if (type === 'rectangle') return `<rect x="${x}" y="${y + s * 0.15}" width="${s}" height="${s * 0.7}" />`;
  if (type === 'triangle') return `<polygon points="${x + s / 2},${y} ${x + s},${y + s} ${x},${y + s}" />`;
  if (type === 'circle') return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2}" />`;
  if (type === 'oval') return `<ellipse cx="${x + s / 2}" cy="${y + s / 2}" rx="${s / 2}" ry="${s * 0.35}" />`;
  if (type === 'semi-circle') return `<path d="M ${x} ${y + s} A ${s / 2} ${s / 2} 0 0 1 ${x + s} ${y + s} L ${x} ${y + s} Z" />`;
  if (type === 'quarter-circle') return `<path d="M ${x} ${y + s} A ${s} ${s} 0 0 1 ${x + s} ${y} L ${x} ${y} Z" />`;
  if (type === 'rhombus') return `<polygon points="${x + s / 2},${y} ${x + s},${y + s / 2} ${x + s / 2},${y + s} ${x},${y + s / 2}" />`;
  if (type === 'trapezium') return `<polygon points="${x + s * 0.2},${y} ${x + s * 0.8},${y} ${x + s},${y + s} ${x},${y + s}" />`;
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" />`;
}

function renderShapeLibrary(spec) {
  const d = specData(spec);
  const shapes = Array.isArray(d.shapes) ? d.shapes : [];
  const w = Number(spec.width) || 640;
  const cols = 5;
  const size = 56;
  let body = '';
  let maxBottom = 28;
  shapes.forEach((shape, idx) => {
    const pos = gridPosition(idx, cols, 108, 84, 24, 28, 10, 14);
    body += `<g fill="#f3f4f6" stroke="#111111" stroke-width="1.2">${shapePath(shape.type, pos.x + 24, pos.y + 6, size)}</g>`;
    body += `<text x="${pos.x + 52}" y="${pos.y + 78}" font-size="10" text-anchor="middle" fill="#111111">${esc(shape.label || shape.type)}</text>`;
    maxBottom = Math.max(maxBottom, pos.y + 90);
  });
  const tightH = maxBottom + 10;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Shape library diagram');
}

function renderShapeComposition(spec) {
  const d = specData(spec);
  const components = Array.isArray(d.components) ? d.components : [];
  let body = '';
  components.forEach((component) => {
    const x = Number(component.x) || 100;
    const y = Number(component.y) || 100;
    const size = Number(component.size) || 60;
    const shape = component.shape || 'square';
    const fill = component.fill || '#f3f4f6';
    const rotation = Number(component.rotation) || 0;
    body += `<g transform="rotate(${rotation} ${x + size / 2} ${y + size / 2})" fill="${esc(fill)}" stroke="#111111" stroke-width="1.2">${shapePath(shape, x, y, size)}</g>`;
  });
  if (d.question) body += `<text x="20" y="24" font-size="12" fill="#111111">${esc(d.question)}</text>`;
  return svgShell(spec, body, spec.title || 'Shape composition diagram');
}

function renderDotGrid(spec) {
  const d = specData(spec);
  const rows = Math.max(2, Number(d.rows) || 5);
  const columns = Math.max(2, Number(d.columns) || 5);
  const highlights = Array.isArray(d.pointsHighlighted) ? d.pointsHighlighted : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const paddingX = 50;
  const paddingY = 40;
  const gx = (w - paddingX * 2) / (columns - 1);
  const gy = (h - paddingY * 2) / (rows - 1);
  let body = '';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const x = paddingX + c * gx;
      const y = paddingY + r * gy;
      body += `<circle cx="${x}" cy="${y}" r="2.6" fill="#111111"/>`;
    }
  }
  highlights.forEach((p) => {
    const c = clamp(Number(p.x), 0, columns - 1);
    const r = clamp(Number(p.y), 0, rows - 1);
    const x = paddingX + c * gx;
    const y = paddingY + r * gy;
    body += `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="#1f2937" stroke-width="2"/>`;
  });
  if (d.symmetryLine === 'vertical') body += `<line x1="${w / 2}" y1="${paddingY - 10}" x2="${w / 2}" y2="${h - paddingY + 10}" stroke="#111111" stroke-dasharray="4 3"/>`;
  if (d.symmetryLine === 'horizontal') body += `<line x1="${paddingX - 10}" y1="${h / 2}" x2="${w - paddingX + 10}" y2="${h / 2}" stroke="#111111" stroke-dasharray="4 3"/>`;
  return svgShell(spec, body, spec.title || 'Dot grid diagram');
}

function renderClock(spec) {
  const d = specData(spec);
  const hour = clamp(Math.floor(Number(d.hour) || 0), 0, 12);
  const minute = clamp(Math.floor(Number(d.minute) || 0), 0, 59);
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.28;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#111111" stroke-width="2"/>`;
  for (let n = 1; n <= 12; n += 1) {
    const angle = (Math.PI / 6) * (n - 3);
    const x = cx + Math.cos(angle) * (r - 18);
    const y = cy + Math.sin(angle) * (r - 18);
    body += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" fill="#111111">${n}</text>`;
  }
  const minuteAngle = ((minute / 60) * Math.PI * 2) - (Math.PI / 2);
  const hourAngle = ((((hour % 12) + (minute / 60)) / 12) * Math.PI * 2) - (Math.PI / 2);
  const minX = cx + Math.cos(minuteAngle) * (r * 0.78);
  const minY = cy + Math.sin(minuteAngle) * (r * 0.78);
  const hourX = cx + Math.cos(hourAngle) * (r * 0.5);
  const hourY = cy + Math.sin(hourAngle) * (r * 0.5);
  body += `<line x1="${cx}" y1="${cy}" x2="${hourX}" y2="${hourY}" stroke="#111111" stroke-width="4" stroke-linecap="round"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${minX}" y2="${minY}" stroke="#111111" stroke-width="2.3" stroke-linecap="round"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="4" fill="#111111"/>`;
  body += `<text x="${cx}" y="${h - 14}" text-anchor="middle" font-size="12" fill="#111111">${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</text>`;
  return svgShell(spec, body, spec.title || 'Clock diagram');
}

function renderLengthMeasurement(spec) {
  const d = specData(spec);
  const start = Number.isFinite(d.start) ? d.start : 0;
  const end = Number.isFinite(d.end) ? d.end : 20;
  const unit = d.unit || 'cm';
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const x0 = 40;
  const x1 = w - 40;
  const y = Math.round(h * 0.6);
  const length = Math.max(1, end - start);
  const stepPx = (x1 - x0) / length;
  let body = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#111111" stroke-width="2"/>`;
  for (let mark = start; mark <= end; mark += 1) {
    const x = x0 + ((mark - start) * stepPx);
    const tick = mark % 5 === 0 ? 12 : 8;
    body += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - tick}" stroke="#111111" stroke-width="1"/>`;
    if (mark % 2 === 0) body += `<text x="${x}" y="${y + 16}" text-anchor="middle" font-size="10" fill="#111111">${mark}</text>`;
  }
  const objects = Array.isArray(d.objects) ? d.objects : [];
  objects.forEach((obj, idx) => {
    const s = clamp(Number(obj.start), start, end);
    const e = clamp(Number(obj.end), s, end);
    const ox = x0 + ((s - start) * stepPx);
    const ow = (e - s) * stepPx;
    const oy = y - 30 - idx * 22;
    body += `<rect x="${ox}" y="${oy}" width="${ow}" height="14" fill="#f3f4f6" stroke="#111111" stroke-width="1"/>`;
    body += `<text x="${ox + ow / 2}" y="${oy - 4}" text-anchor="middle" font-size="10" fill="#111111">${esc(obj.label || `Object ${idx + 1}`)}</text>`;
  });
  body += `<text x="${w - 36}" y="${y + 30}" text-anchor="end" font-size="11" fill="#111111">${esc(unit)}</text>`;
  return svgShell(spec, body, spec.title || 'Length measurement diagram');
}

function renderComparisonModels(spec) {
  const d = specData(spec);
  const leftValue = Math.max(0, Number(d.leftValue) || 0);
  const rightValue = Math.max(0, Number(d.rightValue) || 0);
  const maxValue = Math.max(leftValue, rightValue, 1);
  const leftLabel = d.leftLabel || 'A';
  const rightLabel = d.rightLabel || 'B';
  const mode = d.mode || 'difference';
  const w = Number(spec.width) || 640;
  const x = 140;
  const usable = w - 200;
  const topY = 50;
  const bottomY = topY + 46;
  const leftW = (leftValue / maxValue) * usable;
  const rightW = (rightValue / maxValue) * usable;
  let body = '';
  body += `<text x="24" y="${topY + 18}" font-size="12" fill="#111111">${esc(leftLabel)}</text>`;
  body += `<rect x="${x}" y="${topY}" width="${leftW}" height="26" fill="#e5e7eb" stroke="#111111" stroke-width="1.2"/>`;
  body += `<text x="24" y="${bottomY + 18}" font-size="12" fill="#111111">${esc(rightLabel)}</text>`;
  body += `<rect x="${x}" y="${bottomY}" width="${rightW}" height="26" fill="#ffffff" stroke="#111111" stroke-width="1.2"/>`;
  if (mode === 'difference') {
    const minW = Math.min(leftW, rightW);
    const maxW = Math.max(leftW, rightW);
    body += `<line x1="${x + minW}" y1="${topY - 14}" x2="${x + maxW}" y2="${topY - 14}" stroke="#111111" stroke-width="1.2"/>`;
    body += `<line x1="${x + minW}" y1="${topY - 18}" x2="${x + minW}" y2="${topY - 10}" stroke="#111111" stroke-width="1.2"/>`;
    body += `<line x1="${x + maxW}" y1="${topY - 18}" x2="${x + maxW}" y2="${topY - 10}" stroke="#111111" stroke-width="1.2"/>`;
    body += `<text x="${x + (minW + maxW) / 2}" y="${topY - 20}" text-anchor="middle" font-size="11" fill="#111111">difference</text>`;
  }
  body += `<text x="${x + leftW + 8}" y="${topY + 18}" font-size="11" fill="#111111">${leftValue}</text>`;
  body += `<text x="${x + rightW + 8}" y="${bottomY + 18}" font-size="11" fill="#111111">${rightValue}</text>`;
  const tightH = bottomY + 46;
  const tightSpec = { ...spec, width: w, height: tightH };
  return svgShell(tightSpec, body, spec.title || 'Comparison model diagram');
}

function renderMoneyDisplay(spec) {
  const d = specData(spec);
  const items = Array.isArray(d.items) ? d.items : [];
  const w = Number(spec.width) || 640;
  const gap = 12;
  const coinR = 22;
  const noteW = 60;
  const noteH = 32;
  let cursor = 30;
  const cy = 60;
  let body = '';

  for (const item of items) {
    const count = Math.max(0, Number(item.count) || 1);
    const label = item.label || '';
    const isCoin = /cent|¢|coin|c$/i.test(label);
    for (let i = 0; i < count; i += 1) {
      if (isCoin) {
        body += `<circle cx="${cursor + coinR}" cy="${cy}" r="${coinR}" fill="#fef3c7" stroke="#a16207" stroke-width="1.5"/>`;
        body += `<text x="${cursor + coinR}" y="${cy + 5}" text-anchor="middle" font-size="11" fill="#92400e">${esc(label)}</text>`;
        cursor += coinR * 2 + gap;
      } else {
        body += `<rect x="${cursor}" y="${cy - noteH / 2}" width="${noteW}" height="${noteH}" rx="4" fill="#dcfce7" stroke="#166534" stroke-width="1.5"/>`;
        body += `<text x="${cursor + noteW / 2}" y="${cy + 5}" text-anchor="middle" font-size="11" fill="#166534">${esc(label)}</text>`;
        cursor += noteW + gap;
      }
    }
  }

  // Label row below the coins/notes for accessibility and visual consistency.
  const labelY = cy + coinR + 18;
  if (spec.title) {
    body += `<text x="${Math.max(cursor, 200) / 2}" y="${labelY}" text-anchor="middle" font-size="13" fill="#111111">${esc(spec.title)}</text>`;
  }
  const totalW = Math.max(cursor + 20, 200);
  const totalH = labelY + 16;
  const tightSpec = { ...spec, width: totalW, height: totalH };
  return svgShell(tightSpec, body, spec.title || 'Money display diagram');
}

function renderPieChart(spec) {
  const d = specData(spec);
  const segments = Array.isArray(d.segments) ? d.segments : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const cx = w * 0.38;
  const cy = h / 2;
  const r = Math.min(w * 0.35, h * 0.38);
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0) || 1;
  const fills = ['#bfdbfe', '#fde68a', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa'];
  let angle = -Math.PI / 2;
  let body = '';
  segments.forEach((seg, idx) => {
    const val = Math.max(0, Number(seg.value) || 0);
    const sweep = (val / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const fill = fills[idx % fills.length];
    body += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${fill}" stroke="#111111" stroke-width="1.2"/>`;
    if (val / total > 0.04) {
      const midAngle = angle + sweep / 2;
      const lx = cx + r * 0.6 * Math.cos(midAngle);
      const ly = cy + r * 0.6 * Math.sin(midAngle);
      body += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="10" fill="#111111">${esc(seg.label || '')}</text>`;
    }
    angle += sweep;
  });
  const legendX = w * 0.72;
  segments.forEach((seg, idx) => {
    const ly = 30 + idx * 22;
    body += `<rect x="${legendX}" y="${ly - 10}" width="14" height="14" fill="${fills[idx % fills.length]}" stroke="#111111" stroke-width="0.8"/>`;
    body += `<text x="${legendX + 20}" y="${ly + 2}" font-size="11" fill="#111111">${esc(seg.label || '')} (${Number(seg.value) || 0})</text>`;
  });
  if (d.title) body += `<text x="${cx}" y="${h - 10}" text-anchor="middle" font-size="13" font-weight="600" fill="#111111">${esc(d.title)}</text>`;
  return svgShell(spec, body, spec.title || 'Pie chart');
}

function renderAngleDisplay(spec) {
  const d = specData(spec);
  const angleDeg = clamp(Number(d.angle) || 90, 1, 359);
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const cx = w * 0.4;
  const cy = h * 0.65;
  const rayLen = Math.min(w, h) * 0.45;
  const rad = (angleDeg * Math.PI) / 180;
  const x1 = cx + rayLen;
  const y1 = cy;
  const x2 = cx + rayLen * Math.cos(-rad);
  const y2 = cy + rayLen * Math.sin(-rad);
  let body = '';
  body += `<line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#111111" stroke-width="2"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#111111" stroke-width="2"/>`;
  const arcR = rayLen * 0.25;
  const ax1 = cx + arcR;
  const ay1 = cy;
  const ax2 = cx + arcR * Math.cos(-rad);
  const ay2 = cy + arcR * Math.sin(-rad);
  const large = angleDeg > 180 ? 1 : 0;
  body += `<path d="M ${ax1} ${ay1} A ${arcR} ${arcR} 0 ${large} 0 ${ax2} ${ay2}" fill="none" stroke="#3b82f6" stroke-width="1.5"/>`;
  const midRad = -rad / 2;
  const labelR = arcR + 16;
  const lx = cx + labelR * Math.cos(midRad);
  const ly = cy + labelR * Math.sin(midRad);
  body += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="13" fill="#111111">${angleDeg}°</text>`;
  if (d.label) body += `<text x="${cx - 12}" y="${cy + 18}" font-size="12" fill="#111111">${esc(d.label)}</text>`;
  if (angleDeg === 90) {
    const sq = 14;
    body += `<path d="M ${cx + sq} ${cy} L ${cx + sq} ${cy - sq} L ${cx} ${cy - sq}" fill="none" stroke="#111111" stroke-width="1.2"/>`;
  }
  return svgShell(spec, body, spec.title || 'Angle diagram');
}

function renderLinePairs(spec) {
  const d = specData(spec);
  const lines = Array.isArray(d.lines) ? d.lines : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];
  let body = '';
  if (d.showGrid) {
    const gs = 30;
    for (let x = 0; x <= w; x += gs) body += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#e5e7eb" stroke-width="0.5"/>`;
    for (let y = 0; y <= h; y += gs) body += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  }
  lines.forEach((ln, idx) => {
    const color = colors[idx % colors.length];
    body += `<line x1="${ln.x1}" y1="${ln.y1}" x2="${ln.x2}" y2="${ln.y2}" stroke="${color}" stroke-width="2.5"/>`;
    body += `<circle cx="${ln.x1}" cy="${ln.y1}" r="3" fill="#111111"/>`;
    body += `<circle cx="${ln.x2}" cy="${ln.y2}" r="3" fill="#111111"/>`;
    if (ln.label) {
      const mx = (ln.x1 + ln.x2) / 2;
      const my = (ln.y1 + ln.y2) / 2;
      body += `<text x="${mx}" y="${my - 8}" text-anchor="middle" font-size="13" font-weight="600" fill="${color}">${esc(ln.label)}</text>`;
    }
  });
  return svgShell(spec, body, spec.title || 'Line pairs diagram');
}

function renderSolid3D(spec) {
  const d = specData(spec);
  const solid = d.solid || 'cube';
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.32;
  let body = '';
  const stroke = '#111111';
  const dash = 'stroke-dasharray="5 4"';
  const fill = '#dbeafe';
  if (solid === 'cube' || solid === 'cuboid') {
    const sx = solid === 'cuboid' ? s * 1.3 : s;
    const sy = s;
    const off = s * 0.35;
    const fl = cx - sx / 2;
    const ft = cy - sy / 2 + off / 2;
    body += `<polygon points="${fl},${ft} ${fl + sx},${ft} ${fl + sx},${ft + sy} ${fl},${ft + sy}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<polygon points="${fl},${ft} ${fl + off},${ft - off} ${fl + sx + off},${ft - off} ${fl + sx},${ft}" fill="#bfdbfe" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<polygon points="${fl + sx},${ft} ${fl + sx + off},${ft - off} ${fl + sx + off},${ft + sy - off} ${fl + sx},${ft + sy}" fill="#93c5fd" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${fl}" y1="${ft + sy}" x2="${fl + off}" y2="${ft + sy - off}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
    body += `<line x1="${fl + off}" y1="${ft + sy - off}" x2="${fl + sx + off}" y2="${ft + sy - off}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
    body += `<line x1="${fl + off}" y1="${ft - off}" x2="${fl + off}" y2="${ft + sy - off}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
  } else if (solid === 'cylinder') {
    const rx = s * 0.5;
    const ry = s * 0.18;
    const ch = s * 0.9;
    const top = cy - ch / 2;
    const bot = cy + ch / 2;
    body += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<rect x="${cx - rx}" y="${top}" width="${rx * 2}" height="${ch}" fill="${fill}" stroke="none"/>`;
    body += `<line x1="${cx - rx}" y1="${top}" x2="${cx - rx}" y2="${bot}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${cx + rx}" y1="${top}" x2="${cx + rx}" y2="${bot}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="#bfdbfe" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (solid === 'cone') {
    const rx = s * 0.45;
    const ry = s * 0.16;
    const ch = s * 1.0;
    const bot = cy + ch * 0.35;
    const tip = cy - ch * 0.65;
    body += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${cx - rx}" y1="${bot}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${cx + rx}" y1="${bot}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<path d="M ${cx - rx} ${bot} A ${rx} ${ry} 0 0 1 ${cx + rx} ${bot}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (solid === 'sphere') {
    const r = s * 0.5;
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.35}" fill="none" stroke="${stroke}" stroke-width="1" ${dash}/>`;
  } else if (solid === 'triangular_prism') {
    const pw = s * 0.8;
    const ph = s * 0.8;
    const off = s * 0.4;
    const bx = cx - pw / 2;
    const by = cy + ph / 3;
    const ax = bx + pw / 2;
    const ay = cy - ph * 0.6;
    body += `<polygon points="${bx},${by} ${bx + pw},${by} ${ax},${ay}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${bx}" y1="${by}" x2="${bx + off}" y2="${by - off * 0.5}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${bx + pw}" y1="${by}" x2="${bx + pw + off}" y2="${by - off * 0.5}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${ax}" y1="${ay}" x2="${ax + off}" y2="${ay - off * 0.5}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<polygon points="${bx + off},${by - off * 0.5} ${bx + pw + off},${by - off * 0.5} ${ax + off},${ay - off * 0.5}" fill="#bfdbfe" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${bx + off}" y1="${by - off * 0.5}" x2="${bx}" y2="${by}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
  } else if (solid === 'square_pyramid') {
    const bw = s * 0.8;
    const off = s * 0.3;
    const fl = cx - bw / 2;
    const ft = cy + s * 0.15;
    const tip = cy - s * 0.55;
    body += `<polygon points="${fl},${ft} ${fl + bw},${ft} ${fl + bw + off},${ft - off} ${fl + off},${ft - off}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${fl}" y1="${ft}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${fl + bw}" y1="${ft}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${fl + bw + off}" y1="${ft - off}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<line x1="${fl + off}" y1="${ft - off}" x2="${cx}" y2="${tip}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
    body += `<line x1="${fl}" y1="${ft}" x2="${fl + off}" y2="${ft - off}" stroke="${stroke}" stroke-width="1" ${dash}/>`;
  }
  if (d.label) body += `<text x="${cx}" y="${h - 12}" text-anchor="middle" font-size="14" font-weight="600" fill="#111111">${esc(d.label)}</text>`;
  return svgShell(spec, body, spec.title || `${solid} 3D diagram`);
}

function renderCompassGrid(spec) {
  const d = specData(spec);
  const gridSize = Math.max(2, Math.min(Number(d.gridSize) || 5, 10));
  const objects = Array.isArray(d.objects) ? d.objects : [];
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 360;
  const margin = 50;
  const gridW = Math.min(w - 140, h - margin * 2);
  const cellSize = gridW / gridSize;
  const gx = margin;
  const gy = (h - gridW) / 2;
  let body = '';
  for (let r = 0; r <= gridSize; r++) {
    body += `<line x1="${gx}" y1="${gy + r * cellSize}" x2="${gx + gridSize * cellSize}" y2="${gy + r * cellSize}" stroke="#cbd5e1" stroke-width="1"/>`;
    body += `<line x1="${gx + r * cellSize}" y1="${gy}" x2="${gx + r * cellSize}" y2="${gy + gridSize * cellSize}" stroke="#cbd5e1" stroke-width="1"/>`;
  }
  const fills = ['#bfdbfe', '#fde68a', '#bbf7d0', '#fecaca', '#ddd6fe', '#fed7aa', '#e0e7ff', '#fce7f3'];
  objects.forEach((obj, idx) => {
    const ox = gx + (obj.col || 0) * cellSize + cellSize / 2;
    const oy = gy + (obj.row || 0) * cellSize + cellSize / 2;
    const fill = fills[idx % fills.length];
    body += `<circle cx="${ox}" cy="${oy}" r="${cellSize * 0.3}" fill="${fill}" stroke="#111111" stroke-width="1.2"/>`;
    body += `<text x="${ox}" y="${oy + 4}" text-anchor="middle" font-size="${Math.min(11, cellSize * 0.3)}" fill="#111111">${esc(obj.label || '')}</text>`;
  });
  const compassX = gx + gridSize * cellSize + 60;
  const compassY = h / 2;
  const cr = 28;
  body += `<circle cx="${compassX}" cy="${compassY}" r="${cr}" fill="none" stroke="#111111" stroke-width="1.2"/>`;
  body += `<line x1="${compassX}" y1="${compassY - cr + 4}" x2="${compassX}" y2="${compassY + cr - 4}" stroke="#111111" stroke-width="1"/>`;
  body += `<line x1="${compassX - cr + 4}" y1="${compassY}" x2="${compassX + cr - 4}" y2="${compassY}" stroke="#111111" stroke-width="1"/>`;
  body += `<text x="${compassX}" y="${compassY - cr - 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#111111">N</text>`;
  body += `<text x="${compassX}" y="${compassY + cr + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#111111">S</text>`;
  body += `<text x="${compassX + cr + 8}" y="${compassY + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#111111">E</text>`;
  body += `<text x="${compassX - cr - 8}" y="${compassY + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#111111">W</text>`;
  return svgShell(spec, body, spec.title || 'Compass grid');
}

function renderNets3D(spec) {
  const d = specData(spec);
  const solid = d.solid || 'cube';
  const w = Number(spec.width) || 640;
  const h = Number(spec.height) || 400;
  const stroke = '#111111';
  const fills = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#e0e7ff', '#c7d2fe'];
  let body = '';

  if (solid === 'cube' || solid === 'cuboid') {
    const faceW = solid === 'cuboid' ? Math.min(w / 6, h / 5) * 1.3 : Math.min(w / 6, h / 5);
    const faceH = Math.min(w / 6, h / 5);
    const cx = w / 2;
    const topY = (h - faceH * 4) / 2;
    const faces = [
      { x: cx - faceW / 2, y: topY, w: faceW, h: faceH, label: 'Top' },
      { x: cx - faceW / 2, y: topY + faceH, w: faceW, h: faceH, label: 'Front' },
      { x: cx - faceW / 2, y: topY + faceH * 2, w: faceW, h: faceH, label: 'Bottom' },
      { x: cx - faceW / 2, y: topY + faceH * 3, w: faceW, h: faceH, label: 'Back' },
      { x: cx - faceW / 2 - faceW, y: topY + faceH, w: faceW, h: faceH, label: 'Left' },
      { x: cx + faceW / 2, y: topY + faceH, w: faceW, h: faceH, label: 'Right' },
    ];
    faces.forEach((f, i) => {
      body += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${fills[i % fills.length]}" stroke="${stroke}" stroke-width="1.5"/>`;
      if (d.showLabels !== false) {
        body += `<text x="${f.x + f.w / 2}" y="${f.y + f.h / 2 + 4}" text-anchor="middle" font-size="11" fill="#1e3a5f">${esc(f.label)}</text>`;
      }
    });
  } else if (solid === 'cylinder') {
    const r = Math.min(w / 6, h / 6);
    const rectW = Math.PI * r;
    const rectH = r * 1.6;
    const cx = w / 2;
    const rectY = (h - rectH) / 2;
    body += `<rect x="${cx - rectW / 2}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${fills[0]}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<ellipse cx="${cx - rectW / 2}" cy="${rectY + rectH / 2}" rx="${r * 0.35}" ry="${rectH / 2}" fill="${fills[1]}" stroke="${stroke}" stroke-width="1.5"/>`;
    body += `<ellipse cx="${cx + rectW / 2}" cy="${rectY + rectH / 2}" rx="${r * 0.35}" ry="${rectH / 2}" fill="${fills[2]}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (d.showLabels !== false) {
      body += `<text x="${cx}" y="${rectY + rectH / 2 + 4}" text-anchor="middle" font-size="11" fill="#1e3a5f">Curved surface</text>`;
      body += `<text x="${cx - rectW / 2}" y="${rectY - 8}" text-anchor="middle" font-size="11" fill="#1e3a5f">Circle</text>`;
      body += `<text x="${cx + rectW / 2}" y="${rectY - 8}" text-anchor="middle" font-size="11" fill="#1e3a5f">Circle</text>`;
    }
  } else if (solid === 'triangular_prism') {
    const s = Math.min(w / 7, h / 5);
    const cx = w / 2;
    const triH = s * Math.sqrt(3) / 2;
    const topY = (h - triH - s * 1.8) / 2;
    const triPts = `${cx},${topY} ${cx - s / 2},${topY + triH} ${cx + s / 2},${topY + triH}`;
    body += `<polygon points="${triPts}" fill="${fills[0]}" stroke="${stroke}" stroke-width="1.5"/>`;
    const rectTop = topY + triH;
    const rects = [
      { x: cx - s * 1.5, y: rectTop, w: s, h: s * 1.8 },
      { x: cx - s / 2, y: rectTop, w: s, h: s * 1.8 },
      { x: cx + s / 2, y: rectTop, w: s, h: s * 1.8 },
    ];
    rects.forEach((r, i) => {
      body += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fills[i + 1]}" stroke="${stroke}" stroke-width="1.5"/>`;
    });
    const botTriY = rectTop + s * 1.8;
    const botTriPts = `${cx},${botTriY + triH} ${cx - s / 2},${botTriY} ${cx + s / 2},${botTriY}`;
    body += `<polygon points="${botTriPts}" fill="${fills[4]}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (d.showLabels !== false) {
      body += `<text x="${cx}" y="${topY + triH / 2 + 4}" text-anchor="middle" font-size="10" fill="#1e3a5f">Triangle</text>`;
      body += `<text x="${cx}" y="${botTriY + triH / 2 + 4}" text-anchor="middle" font-size="10" fill="#1e3a5f">Triangle</text>`;
    }
  } else if (solid === 'square_pyramid') {
    const s = Math.min(w / 5, h / 5);
    const cx = w / 2;
    const baseTop = (h - s) / 2;
    body += `<rect x="${cx - s / 2}" y="${baseTop}" width="${s}" height="${s}" fill="${fills[0]}" stroke="${stroke}" stroke-width="1.5"/>`;
    const triH = s * 0.8;
    const tris = [
      { pts: `${cx - s / 2},${baseTop} ${cx + s / 2},${baseTop} ${cx},${baseTop - triH}` },
      { pts: `${cx + s / 2},${baseTop} ${cx + s / 2},${baseTop + s} ${cx + s / 2 + triH},${baseTop + s / 2}` },
      { pts: `${cx - s / 2},${baseTop + s} ${cx + s / 2},${baseTop + s} ${cx},${baseTop + s + triH}` },
      { pts: `${cx - s / 2},${baseTop} ${cx - s / 2},${baseTop + s} ${cx - s / 2 - triH},${baseTop + s / 2}` },
    ];
    tris.forEach((t, i) => {
      body += `<polygon points="${t.pts}" fill="${fills[i + 1]}" stroke="${stroke}" stroke-width="1.5"/>`;
    });
    if (d.showLabels !== false) {
      body += `<text x="${cx}" y="${baseTop + s / 2 + 4}" text-anchor="middle" font-size="11" fill="#1e3a5f">Base</text>`;
    }
  } else if (solid === 'cone') {
    const r = Math.min(w / 5, h / 5);
    const cx = w / 2;
    const cy = h / 2;
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fills[0]}" stroke="${stroke}" stroke-width="1.5"/>`;
    const sectorR = r * 1.5;
    const angle = (2 * Math.PI * r) / sectorR;
    const halfAngle = angle / 2;
    const sectorCx = cx;
    const sectorCy = cy - r - r * 0.3;
    const x1 = sectorCx + sectorR * Math.sin(halfAngle);
    const y1 = sectorCy + sectorR * (1 - Math.cos(halfAngle));
    const x2 = sectorCx - sectorR * Math.sin(halfAngle);
    const y2 = y1;
    const largeArc = angle > Math.PI ? 1 : 0;
    body += `<path d="M ${sectorCx} ${sectorCy} L ${x1} ${y1} A ${sectorR} ${sectorR} 0 ${largeArc} 0 ${x2} ${y2} Z" fill="${fills[1]}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (d.showLabels !== false) {
      body += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="#1e3a5f">Circle</text>`;
      body += `<text x="${sectorCx}" y="${sectorCy + sectorR * 0.4}" text-anchor="middle" font-size="11" fill="#1e3a5f">Sector</text>`;
    }
  }

  if (d.label) body += `<text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-size="14" font-weight="600" fill="#111111">${esc(d.label)}</text>`;
  return svgShell(spec, body, spec.title || `Net of a ${solid.replace(/_/g, ' ')}`);
}

export const diagramSvgRenderers = {
  number_line: renderNumberLine,
  fraction_model: renderFractionModel,
  fraction_circle: renderFractionCircle,
  equal_groups: renderEqualGroups,
  arrays: renderArrays,
  picture_collections: renderPictureCollections,
  place_value_blocks: renderPlaceValueBlocks,
  bar_graph: renderBarGraph,
  picture_graph: renderPictureGraph,
  table: renderTable,
  shape_library: renderShapeLibrary,
  shape_composition: renderShapeComposition,
  dot_grid: renderDotGrid,
  clock: renderClock,
  length_measurement: renderLengthMeasurement,
  comparison_model: renderComparisonModels,
  comparison_models: renderComparisonModels,
  money_display: renderMoneyDisplay,
  pie_chart: renderPieChart,
  angle_display: renderAngleDisplay,
  line_pairs: renderLinePairs,
  solid_3d: renderSolid3D,
  compass_grid: renderCompassGrid,
  nets_3d: renderNets3D,
};
