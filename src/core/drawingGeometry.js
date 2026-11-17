export const FIB_LEVELS = [
  { value: 0, label: '0.000' },
  { value: 0.236, label: '0.236' },
  { value: 0.382, label: '0.382' },
  { value: 0.5, label: '0.500' },
  { value: 0.618, label: '0.618' },
  { value: 0.786, label: '0.786' },
  { value: 1, label: '1.000' }
];

export function rayToBounds(a, b, width, height, extendBoth = false) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < 1e-9) return null;
  const candidates = [];
  const add = (x, y, t) => {
    if (x >= -0.01 && x <= width + 0.01 && y >= -0.01 && y <= height + 0.01 &&
        (extendBoth || t >= -1e-9)) candidates.push({ x: Math.max(0, Math.min(width, x)), y: Math.max(0, Math.min(height, y)), t });
  };
  if (Math.abs(dx) > 1e-9) {
    let t = (0 - a.x) / dx; add(0, a.y + t * dy, t);
    t = (width - a.x) / dx; add(width, a.y + t * dy, t);
  }
  if (Math.abs(dy) > 1e-9) {
    let t = (0 - a.y) / dy; add(a.x + t * dx, 0, t);
    t = (height - a.y) / dy; add(a.x + t * dx, height, t);
  }
  candidates.sort((p, q) => p.t - q.t);
  const unique = candidates.filter((p, i) => !i || Math.hypot(p.x-candidates[i-1].x,p.y-candidates[i-1].y) > 0.1);
  if (extendBoth) return unique.length >= 2 ? [unique[0], unique[unique.length-1]] : null;
  if (!unique.length) return null;
  const end = unique[unique.length-1];
  return [{ x: a.x, y: a.y }, { x: end.x, y: end.y }];
}

export function measureRange(startPrice, endPrice, startTime = 0, endTime = 0) {
  const delta = endPrice - startPrice;
  const percent = startPrice === 0 ? 0 : delta / Math.abs(startPrice) * 100;
  const magnitude = Math.max(Math.abs(startPrice), Math.abs(endPrice));
  const precision = magnitude >= 1000 ? 2 : magnitude >= 1 ? 3 : 5;
  return { delta, percent, precision, timeSpan: Math.abs(endTime - startTime) };
}
