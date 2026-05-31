export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function specData(spec) {
  return spec?.data && typeof spec.data === 'object' ? spec.data : {};
}

export function svgShell(spec, body, ariaLabel = '') {
  const width = Number(spec?.width) > 0 ? Number(spec.width) : 640;
  const height = Number(spec?.height) > 0 ? Number(spec.height) : 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(ariaLabel)}"><rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>${body}</svg>`;
}

export function toFractionString(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && Number.isFinite(value.numerator) && Number.isFinite(value.denominator)) {
    return `${value.numerator}/${value.denominator}`;
  }
  if (Number.isFinite(value)) return String(value);
  return '';
}

export function gridPosition(index, columns, itemWidth, itemHeight, startX, startY, gapX = 12, gapY = 12) {
  const row = Math.floor(index / columns);
  const col = index % columns;
  return {
    x: startX + col * (itemWidth + gapX),
    y: startY + row * (itemHeight + gapY),
  };
}
