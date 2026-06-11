// Dependency-free confetti burst. Drops a temporary full-screen canvas, animates
// falling paper, then removes itself. Safe to call repeatedly.

export function confettiBurst({ count = 120, duration = 1800, origin } = {}) {
  if (typeof document === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const ox = origin?.x ?? canvas.width / 2;
  const oy = origin?.y ?? canvas.height / 3;
  const colors = ['#10B981', '#34D399', '#F59E0B', '#FBBF24', '#8B5CF6', '#0EA5E9', '#F43F5E'];

  const parts = Array.from({ length: count }, () => ({
    x: ox + (Math.random() - 0.5) * 240,
    y: oy + (Math.random() - 0.5) * 80,
    vx: (Math.random() - 0.5) * 13,
    vy: Math.random() * -13 - 3,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3
  }));

  const start = performance.now();
  const tick = (t) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += 0.3;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
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
