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

export function diagramFor(p) {
  if (!p || !p.parts) return '';
  const a = p.parts;
  switch (p.kind) {
    case 'rectArea':
    case 'rectPerimeter': return rectangle(a.l, a.w);
    case 'triArea': return triangle(a.base, a.height);
    case 'cuboidVolume': return cuboid(a.l, a.b, a.h);
    case 'circleArea':
    case 'circleCircumference': return circle(a.r);
    default: return '';
  }
}
