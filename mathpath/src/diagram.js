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

export function diagramFor(p) {
  if (!p || !p.parts) return '';
  const a = p.parts;
  switch (p.kind) {
    case 'barModel': return barModel(a.model);
    case 'barChart': return a.chart.mode === 'picture' ? pictureGraph(a.chart) : barChart(a.chart);
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
