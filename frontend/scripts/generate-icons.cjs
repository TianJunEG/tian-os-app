// Generates PWA/app icons from scratch (no native image deps).
// Renders the Tutor Match mark (a graduation cap on the brand gradient)
// with 4x supersampling, then encodes PNGs with a hand-rolled encoder.
// Regenerate with: npm run icons
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public');

// ---- PNG encoder (RGBA, 8-bit, filter 0) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- geometry helpers ----
function inPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distSeg(px, py, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const c = vx * vx + vy * vy;
  let t = c ? ((px - a[0]) * vx + (py - a[1]) * vy) / c : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(a[0] + t * vx - px, a[1] + t * vy - py);
}
function roundedRectContains(px, py, w, r) {
  if (px < 0 || px > w || py < 0 || py > w) return false;
  const lo = r, hi = w - r;
  if (px < lo && py < lo) return Math.hypot(px - lo, py - lo) <= r;
  if (px > hi && py < lo) return Math.hypot(px - hi, py - lo) <= r;
  if (px < lo && py > hi) return Math.hypot(px - lo, py - hi) <= r;
  if (px > hi && py > hi) return Math.hypot(px - hi, py - hi) <= r;
  return true;
}

const C1 = [0x93, 0x33, 0xea]; // purple-600
const C2 = [0x25, 0x63, 0xeb]; // blue-600

function renderIcon(size, maskable) {
  const SS = 4;
  const W = size * SS;
  const px = Buffer.alloc(W * W * 4);
  const cx = W / 2, cy = W / 2;
  const cf = maskable ? 0.8 : 0.66; // content scale (maskable keeps logo in safe zone)
  const L = W * cf;
  const radius = maskable ? 0 : W * 0.22;

  const dy = -0.1 * L;
  const halfW = 0.4 * L, halfH = 0.17 * L;
  const diamond = [[0, dy - halfH], [halfW, dy], [0, dy + halfH], [-halfW, dy]];
  const head = [[-0.26 * L, dy + 0.02 * L], [0.26 * L, dy + 0.02 * L], [0.22 * L, dy + 0.3 * L], [-0.22 * L, dy + 0.3 * L]];
  const segs = [[[0, dy], [halfW, dy]], [[halfW, dy], [halfW, dy + 0.34 * L]]];
  const tasselThick = 0.018 * L;
  const knot = [halfW, dy + 0.36 * L, 0.05 * L];
  const button = [0, dy, 0.045 * L];

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      const inBg = radius > 0 ? roundedRectContains(x + 0.5, y + 0.5, W, radius) : true;
      if (inBg) {
        const t = (x + y) / (2 * W);
        r = Math.round(C1[0] + (C2[0] - C1[0]) * t);
        g = Math.round(C1[1] + (C2[1] - C1[1]) * t);
        b = Math.round(C1[2] + (C2[2] - C1[2]) * t);
        a = 255;
        const ox = x - cx, oy = y - cy;
        let logo = inPoly(diamond, ox, oy) || inPoly(head, ox, oy)
          || Math.hypot(ox - knot[0], oy - knot[1]) <= knot[2]
          || Math.hypot(ox - button[0], oy - button[1]) <= button[2];
        if (!logo) for (const s of segs) if (distSeg(ox, oy, s[0], s[1]) <= tasselThick) { logo = true; break; }
        if (logo) { r = 255; g = 255; b = 255; }
      }
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }

  // downsample with premultiplied-alpha averaging
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let yy = 0; yy < SS; yy++)
        for (let xx = 0; xx < SS; xx++) {
          const i = ((y * SS + yy) * W + (x * SS + xx)) * 4;
          const al = px[i + 3];
          R += px[i] * al; G += px[i + 1] * al; B += px[i + 2] * al; A += al;
        }
      const o = (y * size + x) * 4;
      if (A > 0) { out[o] = Math.round(R / A); out[o + 1] = Math.round(G / A); out[o + 2] = Math.round(B / A); out[o + 3] = Math.round(A / (SS * SS)); }
    }
  }
  return encodePNG(size, size, out);
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true]
];
for (const [name, size, maskable] of targets) {
  fs.writeFileSync(path.join(OUT, name), renderIcon(size, maskable));
  console.log('wrote', name);
}
