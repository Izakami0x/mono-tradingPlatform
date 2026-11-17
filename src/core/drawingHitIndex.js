export function buildDrawingHitIndex(items, boundsFor, cellSize = 128, maxCellsPerItem = 256) {
  const cells = new Map();
  const overflow = [];
  const entries = [];
  for (let order = 0; order < items.length; order += 1) {
    const item = items[order];
    const bounds = boundsFor(item);
    if (!bounds || ![bounds.left, bounds.top, bounds.right, bounds.bottom].every(Number.isFinite)) continue;
    const normalized = { left: Math.min(bounds.left, bounds.right), top: Math.min(bounds.top, bounds.bottom), right: Math.max(bounds.left, bounds.right), bottom: Math.max(bounds.top, bounds.bottom) };
    const entry = { item, order, bounds: normalized };
    entries.push(entry);
    const minX = Math.floor(normalized.left / cellSize), maxX = Math.floor(normalized.right / cellSize);
    const minY = Math.floor(normalized.top / cellSize), maxY = Math.floor(normalized.bottom / cellSize);
    const count = (maxX - minX + 1) * (maxY - minY + 1);
    if (count > maxCellsPerItem) { overflow.push(entry); continue; }
    for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
      const key = x + ':' + y;
      const bucket = cells.get(key);
      if (bucket) bucket.push(entry); else cells.set(key, [entry]);
    }
  }
  return { cells, overflow, entries, cellSize };
}

export function queryDrawingHitIndex(index, x, y, tolerance = 0) {
  if (!index || !Number.isFinite(x) || !Number.isFinite(y)) return [];
  const key = Math.floor(x / index.cellSize) + ':' + Math.floor(y / index.cellSize);
  const candidates = new Set([...(index.cells.get(key) || []), ...index.overflow]);
  return [...candidates]
    .filter(entry => x >= entry.bounds.left - tolerance && x <= entry.bounds.right + tolerance && y >= entry.bounds.top - tolerance && y <= entry.bounds.bottom + tolerance)
    .sort((a, b) => b.order - a.order)
    .map(entry => entry.item);
}

export function queryDrawingsInViewport(index, width, height, overscan = 64) {
  if (!index || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return [];
  const left = -overscan, top = -overscan, right = width + overscan, bottom = height + overscan;
  return index.entries
    .filter(({bounds}) => bounds.right >= left && bounds.left <= right && bounds.bottom >= top && bounds.top <= bottom)
    .sort((a,b) => a.order - b.order)
    .map(entry => entry.item);
}
