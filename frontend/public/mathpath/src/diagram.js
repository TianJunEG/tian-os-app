// diagram.js — procedural SVG figures for geometry items.
//
// Each diagram is drawn from the same `parts` the generator produced, so the picture always
// matches the numbers (and therefore the answer). Returns an SVG string, or '' for problems
// that don't have a figure. Pure string output — no DOM, no dependencies, works offline.

function svg(w, h, label, body) {
  return `<svg class="diagram" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function rectangle(l, w) {
  const unit = Math.min(130 / l, 78 / w);
  const rw = Math.max(28, l * unit), rh = Math.max(22, w * unit);
  const x = (200 - rw) / 2, y = 16;
  return svg(200, y + rh + 34, `Rectangle, length ${l} cm by width ${w} cm`, `
    <rect x="${x}" y="${y}" width="${rw}" height="${rh}" class="d-shape"/>
    <text x="${x + rw / 2}" y="${y + rh + 20}" class="d-label" text-anchor="middle">${l} cm</text>
    <text x="${x - 8}" y="${y + rh / 2}" class="d-label" text-anchor="end" dominant-baseline="middle">${w} cm</text>`);
}

function triangle(base, height) {
  const unit = Math.min(118 / base, 76 / height);
  const bpx = Math.max(46, base * unit), hpx = Math.max(28, height * unit);
  const x0 = (200 - bpx) / 2, yBase = 16 + hpx;
  const apexX = x0 + bpx * 0.34, apexY = 16;
  return svg(200, yBase + 34, `Triangle, base ${base} cm and height ${height} cm`, `
    <polygon points="${x0},${yBase} ${x0 + bpx},${yBase} ${apexX},${apexY}" class="d-shape"/>
    <line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${yBase}" class="d-dash"/>
    <rect x="${apexX}" y="${yBase - 9}" width="9" height="9" class="d-rt"/>
    <text x="${x0 + bpx / 2}" y="${yBase + 20}" class="d-label" text-anchor="middle">${base} cm</text>
    <text x="${apexX + 7}" y="${(apexY + yBase) / 2}" class="d-label" dominant-baseline="middle">h = ${height} cm</text>`);
}

function cuboid(l, b, h) {
  const x = 32, y = 58, fw = 98, fh = 56, d = 30; // oblique projection; labels carry the values
  return svg(200, 158, `Cuboid, ${l} cm by ${b} cm by ${h} cm`, `
    <polygon points="${x},${y} ${x + fw},${y} ${x + fw + d},${y - d} ${x + d},${y - d}" class="d-shape d-face2"/>
    <polygon points="${x + fw},${y} ${x + fw + d},${y - d} ${x + fw + d},${y - d + fh} ${x + fw},${y + fh}" class="d-shape d-face2"/>
    <rect x="${x}" y="${y}" width="${fw}" height="${fh}" class="d-shape"/>
    <text x="${x + fw / 2}" y="${y + fh + 20}" class="d-label" text-anchor="middle">${l} cm</text>
    <text x="${x + fw + 12}" y="${y + fh / 2}" class="d-label" dominant-baseline="middle">${h} cm</text>
    <text x="${x + fw + d / 2 + 4}" y="${y - d / 2 - 3}" class="d-label">${b} cm</text>`);
}

function circle(r) {
  const cx = 82, cy = 80, rad = 56;
  return svg(168, 166, `Circle with radius ${r} cm`, `
    <circle cx="${cx}" cy="${cy}" r="${rad}" class="d-shape"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + rad}" y2="${cy}" class="d-radius"/>
    <circle cx="${cx}" cy="${cy}" r="2.6" class="d-dot"/>
    <text x="${cx + rad / 2}" y="${cy - 6}" class="d-label" text-anchor="middle">r = ${r} cm</text>`);
}

// Angles on a straight line (total 180) or at a point (total 360). `segments` are the
// consecutive angles around the centre; the last one is the unknown, drawn as "x°".
function angleDiagram(segments, total) {
  const cx = 100, cy = total === 180 ? 98 : 90, R = 62, lr = 40;
  const xy = (deg, rad) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy - rad * Math.sin((deg * Math.PI) / 180)];
  let body = '';
  if (total === 180) body += `<line x1="${cx - R - 6}" y1="${cy}" x2="${cx + R + 6}" y2="${cy}" class="d-base"/>`;
  const bounds = [0];
  segments.forEach((s) => bounds.push(bounds[bounds.length - 1] + s));
  const start = total === 360 ? 0 : 1; // for a point, also draw the 0° ray as reference
  for (let i = start; i < bounds.length - 1; i++) {
    const [x, y] = xy(bounds[i], R);
    body += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="d-radius"/>`;
  }
  if (total === 360) { const [x, y] = xy(0, R); body += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="d-radius"/>`; }
  segments.forEach((s, i) => {
    const [lx, ly] = xy((bounds[i] + bounds[i + 1]) / 2, lr);
    const t = i === segments.length - 1 ? 'x°' : `${s}°`;
    body += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="d-label" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
  });
  body += `<circle cx="${cx}" cy="${cy}" r="2.4" class="d-dot"/>`;
  return svg(200, total === 180 ? 132 : 182, `Angles around a ${total === 180 ? 'line' : 'point'} summing to ${total}°`, body);
}

// Triangle with two known interior angles and the third unknown (x°).
function triAngles(a, b) {
  return svg(200, 148, `Triangle, angles ${a}° and ${b}° with one unknown`, `
    <polygon points="28,118 172,118 118,26" class="d-shape"/>
    <text x="48" y="110" class="d-label">${a}°</text>
    <text x="150" y="110" class="d-label" text-anchor="end">${b}°</text>
    <text x="118" y="48" class="d-label" text-anchor="middle">x°</text>`);
}

function semicircle(r) {
  const cx = 100, cy = 104, rad = 64;
  return svg(200, 132, `Semicircle, radius ${r} cm`, `
    <path d="M ${cx - rad} ${cy} A ${rad} ${rad} 0 0 1 ${cx + rad} ${cy} Z" class="d-shape"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + rad}" y2="${cy}" class="d-radius"/>
    <circle cx="${cx}" cy="${cy}" r="2.4" class="d-dot"/>
    <text x="${cx + rad / 2}" y="${cy - 6}" class="d-label" text-anchor="middle">r = ${r} cm</text>`);
}

function quarterCircle(r) {
  const ox = 52, oy = 116, rad = 88;
  return svg(200, 150, `Quarter circle, radius ${r} cm`, `
    <path d="M ${ox} ${oy} L ${ox + rad} ${oy} A ${rad} ${rad} 0 0 0 ${ox} ${oy - rad} Z" class="d-shape"/>
    <rect x="${ox}" y="${oy - 9}" width="9" height="9" class="d-rt"/>
    <text x="${ox + rad / 2}" y="${oy + 18}" class="d-label" text-anchor="middle">r = ${r} cm</text>`);
}

// L-shaped composite: outer W×H rectangle with a notch (nw×nh) removed from the top-right.
function lshape(W, H, nw, nh) {
  const unit = Math.min(120 / W, 86 / H), pw = W * unit, ph = H * unit, nwp = nw * unit, nhp = nh * unit;
  const x0 = (200 - pw) / 2, y0 = 14;
  const pts = [
    [x0, y0], [x0 + pw - nwp, y0], [x0 + pw - nwp, y0 + nhp], [x0 + pw, y0 + nhp], [x0 + pw, y0 + ph], [x0, y0 + ph],
  ].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return svg(200, y0 + ph + 30, `L-shaped figure, ${W} by ${H} cm with a ${nw} by ${nh} cm notch`, `
    <polygon points="${pts}" class="d-shape"/>
    <text x="${x0 + pw / 2}" y="${y0 + ph + 18}" class="d-label" text-anchor="middle">${W} cm</text>
    <text x="${x0 - 8}" y="${y0 + ph / 2}" class="d-label" text-anchor="end" dominant-baseline="middle">${H} cm</text>
    <text x="${(x0 + pw - nwp + x0 + pw) / 2}" y="${y0 + nhp + 14}" class="d-label" text-anchor="middle">${nw} cm</text>
    <text x="${x0 + pw - nwp - 5}" y="${y0 + nhp / 2}" class="d-label" text-anchor="end" dominant-baseline="middle">${nh} cm</text>`);
}

// Bar model for word problems. Driven by a data model so every problem structure
// (part-whole, comparison, equal units, multi-step) reuses one renderer.
//   model = { rows: [{ caption?, cells: [{ value, label, accent? }] }],
//             braces: [{ row, start, end, label, side:'top'|'bottom' }] }
// Bars are drawn to scale from the true values; unknown cells/braces are labelled "?".
function barModel(m) {
  const rows = m.rows, braces = m.braces || [];
  const capW = rows.some((r) => r.caption) ? 50 : 6;
  const x0 = capW, barMax = 150, rightPad = 14, rowH = 30, rowGap = 20;
  const maxTotal = Math.max(...rows.map((r) => r.cells.reduce((s, c) => s + c.value, 0)));
  const ppu = barMax / maxTotal;
  const cw = (c) => Math.max(16, c.value * ppu);
  const rowHasTop = (ri) => braces.some((b) => b.side === 'top' && b.row === ri);
  // A narrow labelled cell is placed opposite its row's top brace: below if the row has a
  // top brace, otherwise above — so cell labels never collide with brace labels.
  let anyAbove = false, anyBelow = false;
  rows.forEach((row, ri) => row.cells.forEach((c) => { if (c.label && cw(c) < 20) { if (rowHasTop(ri)) anyBelow = true; else anyAbove = true; } }));
  const topBand = Math.max(braces.some((b) => b.side === 'top') ? 22 : 0, anyAbove ? 16 : 0, 6);
  const botBand = Math.max(braces.some((b) => b.side === 'bottom') ? 26 : 0, anyBelow ? 18 : 0, 6);
  const rowTop = (i) => topBand + i * (rowH + rowGap);
  const W = x0 + barMax + rightPad, H = topBand + rows.length * rowH + (rows.length - 1) * rowGap + botBand;
  let body = '';
  rows.forEach((row, ri) => {
    const y = rowTop(ri);
    let x = x0;
    if (row.caption) body += `<text x="${capW - 6}" y="${y + rowH / 2}" class="d-cap" text-anchor="end" dominant-baseline="middle">${row.caption}</text>`;
    row.cells.forEach((c) => {
      const w = cw(c);
      body += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH}" class="d-cell${c.accent ? ' d-cell-accent' : ''}"/>`;
      if (c.label) {
        const cxm = (x + w / 2).toFixed(1);
        if (w >= 20) body += `<text x="${cxm}" y="${y + rowH / 2}" class="d-label" text-anchor="middle" dominant-baseline="middle">${c.label}</text>`;
        else if (rowHasTop(ri)) body += `<text x="${cxm}" y="${y + rowH + 13}" class="d-label" text-anchor="middle">${c.label}</text>`;
        else body += `<text x="${cxm}" y="${y - 4}" class="d-label" text-anchor="middle">${c.label}</text>`;
      }
      x += w;
    });
  });
  const cellX = (ri, ci) => x0 + rows[ri].cells.slice(0, ci).reduce((s, c) => s + cw(c), 0);
  braces.forEach((br) => {
    const xL = cellX(br.row, br.start), xR = cellX(br.row, br.end + 1), mid = (xL + xR) / 2;
    if (br.side === 'bottom') {
      const y = rowTop(br.row) + rowH + 6;
      body += `<path d="M ${xL.toFixed(1)} ${y - 5} V ${y} H ${xR.toFixed(1)} V ${y - 5}" class="d-brace" fill="none"/>`;
      body += `<text x="${mid.toFixed(1)}" y="${y + 15}" class="d-label" text-anchor="middle">${br.label}</text>`;
    } else {
      const y = rowTop(br.row) - 6;
      body += `<path d="M ${xL.toFixed(1)} ${y + 5} V ${y} H ${xR.toFixed(1)} V ${y + 5}" class="d-brace" fill="none"/>`;
      body += `<text x="${mid.toFixed(1)}" y="${y - 4}" class="d-label" text-anchor="middle">${br.label}</text>`;
    }
  });
  return svg(W, H, 'Bar model for the word problem', body);
}

// Bar graph: vertical bars with a value axis. `c` = { cats:[{label,value}], scale }.
function barChart(c) {
  const cats = c.cats, n = cats.length, W = 210, x0 = 26, yBase = 112, plotH = 86, scale = c.scale;
  const top = Math.max(scale, Math.ceil(Math.max(...cats.map((d) => d.value)) / scale) * scale);
  const sx = (W - x0 - 10) / n;
  let body = '';
  for (let v = 0; v <= top; v += scale) {
    const y = yBase - (v / top) * plotH;
    body += `<line x1="${x0}" y1="${y.toFixed(1)}" x2="${W - 6}" y2="${y.toFixed(1)}" class="d-grid"/>`;
    body += `<text x="${x0 - 4}" y="${(y + 3).toFixed(1)}" class="d-axisn" text-anchor="end">${v}</text>`;
  }
  body += `<line x1="${x0}" y1="${yBase}" x2="${W - 6}" y2="${yBase}" class="d-axis"/>`;
  body += `<line x1="${x0}" y1="${yBase - plotH}" x2="${x0}" y2="${yBase}" class="d-axis"/>`;
  cats.forEach((d, i) => {
    const cx = x0 + sx * (i + 0.5), bw = Math.min(32, sx * 0.6), h = (d.value / top) * plotH;
    body += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${(yBase - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" class="d-cell"/>`;
    body += `<text x="${cx.toFixed(1)}" y="${(yBase - h - 3).toFixed(1)}" class="d-axisn" text-anchor="middle">${d.value}</text>`;
    body += `<text x="${cx.toFixed(1)}" y="${yBase + 13}" class="d-cap" text-anchor="middle">${d.label}</text>`;
  });
  return svg(W, 150, 'Bar graph', body);
}

// Picture graph: rows of unit icons with a key ("= scale"). `c` = { cats:[{label,value}], scale }.
function pictureGraph(c) {
  const cats = c.cats, scale = c.scale, x0 = 58, icon = 13, gap = 4, rowH = 22;
  const maxCount = Math.max(...cats.map((d) => d.value / scale));
  const W = Math.max(180, x0 + maxCount * (icon + gap) + 8), H = 12 + cats.length * rowH + 26;
  let body = '';
  cats.forEach((d, i) => {
    const y = 12 + i * rowH;
    body += `<text x="${x0 - 6}" y="${y + icon - 2}" class="d-cap" text-anchor="end">${d.label}</text>`;
    for (let k = 0; k < d.value / scale; k++) body += `<rect x="${x0 + k * (icon + gap)}" y="${y}" width="${icon}" height="${icon}" rx="2" class="d-icon"/>`;
  });
  const ky = 12 + cats.length * rowH + 6;
  body += `<rect x="${x0}" y="${ky}" width="${icon}" height="${icon}" rx="2" class="d-icon"/>`;
  body += `<text x="${x0 + icon + 6}" y="${ky + icon - 2}" class="d-axisn">= ${scale}</text>`;
  return svg(W, H, 'Picture graph', body);
}

// Stylised coins (circles) and notes (rounded rectangles). These are generic, labelled
// tokens — NOT reproductions of real currency. `tokens` = [{ value (cents), kind:'coin'|'note' }].
// Note colours evoke Singapore denominations ($2 purple, $5 green, $10 red, $50 blue, $100 amber).
const NOTE_FILL = { 200: '#8a6dff', 500: '#34d399', 1000: '#f87171', 5000: '#5b8cff', 10000: '#fbbf24' };
const tokenLabel = (v) => (v >= 100 ? `$${v / 100}` : `${v}¢`);
function moneyTokens(tokens) {
  const maxW = 232, padX = 6, padY = 8, gap = 7;
  const tw = (t) => (t.kind === 'note' ? 52 : 34), th = (t) => (t.kind === 'note' ? 30 : 34);
  let x = padX, y = padY, rowH = 0, usedW = 0, body = '';
  tokens.forEach((t) => {
    const w = tw(t), h = th(t);
    if (x + w > maxW - padX) { x = padX; y += rowH + gap; rowH = 0; }
    if (t.kind === 'note') {
      const col = NOTE_FILL[t.value] || '#5b8cff';
      body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${col}" fill-opacity="0.85" stroke="${col}" stroke-width="1.5"/>`;
      body += `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f1729">${tokenLabel(t.value)}</text>`;
    } else {
      const r = h / 2 - 1, cx = x + w / 2, cy = y + h / 2, col = t.value === 100 ? '#e3c454' : '#cfd6e0';
      body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" stroke="#8a8f9c" stroke-width="1.5"/>`;
      body += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#1e2a48">${tokenLabel(t.value)}</text>`;
    }
    x += w + gap; rowH = Math.max(rowH, h); usedW = Math.max(usedW, x - gap);
  });
  return svg(Math.min(maxW, Math.max(usedW + padX, 60)), y + rowH + padY, 'Coins and notes', body);
}

const polar = (cx, cy, r, deg) => `${(cx + r * Math.cos((deg * Math.PI) / 180)).toFixed(1)} ${(cy + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)}`;
const CHART_COLORS = ['#5b8cff', '#8a6dff', '#34d399', '#fbbf24', '#f87171'];

// Pie chart with a legend. `c` = { cats:[{label,value}] }; each sector is labelled with its value.
function pieChart(c) {
  const cats = c.cats, total = cats.reduce((s, d) => s + d.value, 0);
  const cx = 78, cy = 88, R = 62;
  let ang = -90, body = '';
  cats.forEach((d, i) => {
    const a1 = ang + (d.value / total) * 360, large = a1 - ang > 180 ? 1 : 0, col = CHART_COLORS[i % CHART_COLORS.length];
    body += `<path d="M ${cx} ${cy} L ${polar(cx, cy, R, ang)} A ${R} ${R} 0 ${large} 1 ${polar(cx, cy, R, a1)} Z" fill="${col}" fill-opacity="0.95" stroke="#0f1729" stroke-width="1.5"/>`;
    const lp = polar(cx, cy, R * 0.62, (ang + a1) / 2).split(' ');
    body += `<text x="${lp[0]}" y="${lp[1]}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#0f1729">${d.value}</text>`;
    ang = a1;
  });
  let ly = 26;
  cats.forEach((d, i) => {
    body += `<rect x="156" y="${ly - 9}" width="11" height="11" rx="2" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>`;
    body += `<text x="172" y="${ly}" font-size="11" font-weight="600" fill="#eef2ff" font-family="sans-serif">${d.label}</text>`;
    ly += 18;
  });
  return svg(232, 176, 'Pie chart', body);
}

// Line graph: points joined by a line, with a value axis. `c` = { cats:[{label,value}], scale }.
function lineChart(c) {
  const cats = c.cats, n = cats.length, W = 220, x0 = 26, yBase = 110, plotH = 84, scale = c.scale;
  const top = Math.max(scale, Math.ceil(Math.max(...cats.map((d) => d.value)) / scale) * scale);
  const sx = (W - x0 - 14) / (n - 1 || 1);
  const px = (i) => x0 + sx * i, py = (v) => yBase - (v / top) * plotH;
  let body = '';
  for (let v = 0; v <= top; v += scale) { const y = yBase - (v / top) * plotH; body += `<line x1="${x0}" y1="${y.toFixed(1)}" x2="${W - 6}" y2="${y.toFixed(1)}" class="d-grid"/>`; body += `<text x="${x0 - 4}" y="${(y + 3).toFixed(1)}" class="d-axisn" text-anchor="end">${v}</text>`; }
  body += `<line x1="${x0}" y1="${yBase}" x2="${W - 6}" y2="${yBase}" class="d-axis"/><line x1="${x0}" y1="${yBase - plotH}" x2="${x0}" y2="${yBase}" class="d-axis"/>`;
  body += `<polyline points="${cats.map((d, i) => `${px(i).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')}" fill="none" stroke="#5b8cff" stroke-width="2"/>`;
  cats.forEach((d, i) => {
    body += `<circle cx="${px(i).toFixed(1)}" cy="${py(d.value).toFixed(1)}" r="3" fill="#5b8cff"/>`;
    body += `<text x="${px(i).toFixed(1)}" y="${(py(d.value) - 7).toFixed(1)}" class="d-axisn" text-anchor="middle">${d.value}</text>`;
    body += `<text x="${px(i).toFixed(1)}" y="${yBase + 13}" class="d-cap" text-anchor="middle">${d.label}</text>`;
  });
  return svg(W, 150, 'Line graph', body);
}

// A named 2D shape (no measurements) for shape-recognition multiple-choice items.
function shape2D(name) {
  const cx = 70, cy = 66, R = 46;
  const reg = (sides, rot) => { let p = ''; for (let i = 0; i < sides; i++) p += `${polar(cx, cy, R, rot + (i * 360) / sides)} `; return `<polygon points="${p.trim()}" class="d-shape"/>`; };
  let body;
  if (name === 'circle') body = `<circle cx="${cx}" cy="${cy}" r="${R}" class="d-shape"/>`;
  else if (name === 'square') body = `<rect x="${cx - 42}" y="${cy - 42}" width="84" height="84" class="d-shape"/>`;
  else if (name === 'rectangle') body = `<rect x="${cx - 54}" y="${cy - 34}" width="108" height="68" class="d-shape"/>`;
  else if (name === 'triangle') body = reg(3, -90);
  else if (name === 'pentagon') body = reg(5, -90);
  else body = reg(6, -90);
  return svg(140, 132, `A ${name}`, body);
}

// Analogue clock face showing h:mm, for telling-time multiple-choice items.
function clockFace(h, m) {
  const cx = 72, cy = 72, R = 60;
  let body = `<circle cx="${cx}" cy="${cy}" r="${R}" class="d-shape" fill-opacity="0.06"/>`;
  for (let t = 0; t < 12; t++) {
    const o = polar(cx, cy, R - 3, t * 30 - 90).split(' '), i = polar(cx, cy, R - 9, t * 30 - 90).split(' ');
    body += `<line x1="${o[0]}" y1="${o[1]}" x2="${i[0]}" y2="${i[1]}" class="d-axis"/>`;
  }
  const hp = polar(cx, cy, R * 0.5, (h % 12) * 30 + m * 0.5 - 90).split(' ');
  const mp = polar(cx, cy, R * 0.82, m * 6 - 90).split(' ');
  body += `<line x1="${cx}" y1="${cy}" x2="${hp[0]}" y2="${hp[1]}" class="d-hand-h"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${mp[0]}" y2="${mp[1]}" class="d-hand-m"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="3" class="d-dot"/>`;
  return svg(146, 150, 'Clock face', body);
}

// A named 3D solid (oblique sketch) for solid-recognition multiple-choice items.
function solid3D(name) {
  const box = (w, h) => {
    const x = (140 - w - 24) / 2, y = (132 - h - 24) / 2 + 6, d = 24;
    return `<polygon points="${x},${y} ${x + w},${y} ${x + w + d},${y - d} ${x + d},${y - d}" class="d-shape d-face2"/>
      <polygon points="${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y - d + h} ${x + w},${y + h}" class="d-shape d-face2"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="d-shape"/>`;
  };
  let body;
  if (name === 'cube') body = box(72, 72);
  else if (name === 'cuboid') body = box(94, 54);
  else if (name === 'sphere') body = `<circle cx="70" cy="66" r="46" class="d-shape"/><ellipse cx="70" cy="66" rx="46" ry="15" class="d-dash" fill="none"/>`;
  else if (name === 'cylinder') body = `<ellipse cx="70" cy="98" rx="30" ry="10" class="d-shape"/><rect x="40" y="30" width="60" height="68" class="d-shape"/><ellipse cx="70" cy="30" rx="30" ry="10" class="d-shape"/>`;
  else body = `<ellipse cx="70" cy="100" rx="32" ry="10" class="d-shape"/><path d="M 38 100 L 70 22 L 102 100" class="d-shape"/>`; // cone
  return svg(140, 132, `A ${name}`, body);
}

// A row of shapes with one highlighted, for ordinal-position multiple-choice items.
function ordinalRow(n, pos) {
  const r = 13, gap = 10, x0 = 14, y = 26;
  let body = '';
  for (let i = 0; i < n; i++) body += `<circle cx="${x0 + i * (2 * r + gap) + r}" cy="${y}" r="${r}" class="d-cell${i === pos - 1 ? ' d-cell-accent' : ''}"/>`;
  return svg(x0 * 2 + n * (2 * r + gap) - gap, 52, `A row of ${n} shapes with position ${pos} highlighted`, body);
}

// A bar split into d equal parts with n shaded, for "what fraction is shaded?" items.
function fractionShape(d, n) {
  const x0 = 12, y = 32, W = 120, H = 50, cw = W / d;
  let body = '';
  for (let i = 0; i < d; i++) body += `<rect x="${(x0 + i * cw).toFixed(1)}" y="${y}" width="${cw.toFixed(1)}" height="${H}" class="d-cell${i < n ? ' d-cell-accent' : ''}"/>`;
  return svg(x0 * 2 + W, y + H + 14, `A shape split into ${d} equal parts with ${n} shaded`, body);
}

export function diagramFor(p) {
  if (!p || !p.parts) return '';
  const a = p.parts;
  switch (p.kind) {
    case 'barModel': return barModel(a.model);
    case 'moneyCount': return moneyTokens(a.tokens);
    case 'shapeName': return shape2D(a.shape);
    case 'solidName': return solid3D(a.shape);
    case 'ordinal': return ordinalRow(a.n, a.pos);
    case 'fractionOfWhole': return fractionShape(a.d, a.n);
    case 'clockRead': return clockFace(a.h, a.m);
    case 'barChart':
    case 'chartCategory': {
      const m = a.chart.mode;
      return m === 'picture' ? pictureGraph(a.chart) : m === 'pie' ? pieChart(a.chart) : m === 'line' ? lineChart(a.chart) : barChart(a.chart);
    }
    case 'rectArea':
    case 'rectPerimeter': return rectangle(a.l, a.w);
    case 'triArea': return triangle(a.base, a.height);
    case 'cuboidVolume': return cuboid(a.l, a.b, a.h);
    case 'circleArea':
    case 'circleCircumference': return circle(a.r);
    case 'angleLine':
    case 'anglePoint': return angleDiagram(a.segments, a.total);
    case 'angleTriangle': return triAngles(a.a, a.b);
    case 'semicircleArea':
    case 'semicirclePerimeter': return semicircle(a.r);
    case 'quarterArea':
    case 'quarterPerimeter': return quarterCircle(a.r);
    case 'compositeArea': return lshape(a.W, a.H, a.nw, a.nh);
    default: return '';
  }
}
