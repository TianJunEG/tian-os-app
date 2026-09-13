// Dependency-free celebration effects. confettiBurst() is the single public
// trigger every section calls on a correct answer — it dispatches to the
// student's chosen style (confetti / fireworks / off), so the preference applies
// everywhere without changing call sites.

const CELEBRATION_KEY = 'celebrationStyle'; // 'confetti' | 'fireworks' | 'off'

export function getCelebrationStyle() {
  try { return localStorage.getItem(CELEBRATION_KEY) || 'confetti'; } catch { return 'confetti'; }
}
export function setCelebrationStyle(style) {
  try { localStorage.setItem(CELEBRATION_KEY, style); } catch { /* ignore */ }
}

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  return canvas;
}

const COLORS = ['#10B981', '#34D399', '#F59E0B', '#FBBF24', '#8B5CF6', '#0EA5E9', '#F43F5E'];

// Falling-paper confetti.
function runConfetti({ count = 120, duration = 1800, origin } = {}) {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const ox = origin?.x ?? canvas.width / 2;
  const oy = origin?.y ?? canvas.height / 3;
  const parts = Array.from({ length: count }, () => ({
    x: ox + (Math.random() - 0.5) * 240,
    y: oy + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 13,
    vy: Math.random() * -13 - 3,
    size: Math.random() * 8 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));
  const start = performance.now();
  const tick = (t) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

// Radial-burst fireworks: a few staggered explosions of glowing particles.
function runFireworks({ count = 120, duration = 2200 } = {}) {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const particles = [];
  const burst = (cx, cy) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const n = Math.max(24, Math.round(count / 4));
    for (let i = 0; i < n; i += 1) {
      const ang = (i / n) * Math.PI * 2;
      const speed = Math.random() * 4 + 3;
      particles.push({
        x: cx, y: cy, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        color, life: 0, max: 60 + Math.random() * 24, size: Math.random() * 2 + 2,
      });
    }
  };
  [0, 220, 460, 700].forEach((delay, i) => setTimeout(() => {
    if (!canvas.isConnected) return;
    burst(canvas.width * (0.22 + 0.18 * i + Math.random() * 0.08), canvas.height * (0.22 + Math.random() * 0.28));
  }, delay));
  const start = performance.now();
  const tick = (t) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += 0.06; p.x += p.vx; p.y += p.vy; p.life += 1;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (elapsed < duration) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

// Public trigger — respects the celebration preference + reduced-motion.
export function confettiBurst(opts = {}) {
  if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const style = getCelebrationStyle();
  if (style === 'off') return;
  if (style === 'fireworks') runFireworks(opts);
  else runConfetti(opts);
}

// Preview a specific style regardless of the saved preference (for the picker).
export function celebrationPreview(style, opts = {}) {
  if (typeof document === 'undefined') return;
  if (style === 'fireworks') runFireworks(opts);
  else if (style !== 'off') runConfetti(opts);
}
