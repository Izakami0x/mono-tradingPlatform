export function generateDemoBars(symbol, count = 150) {
  if (typeof symbol !== 'string' || !symbol.trim()) throw new TypeError('symbol must be a non-empty string');
  if (!Number.isInteger(count) || count < 1 || count > 10000) throw new RangeError('count must be an integer between 1 and 10000');
  let seed = [...symbol].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let previous = 60 + (seed % 2500) / 100;
  return Array.from({ length: count }, (_, index) => {
    const open = previous;
    const close = open + Math.sin(index * 0.19) * 0.7 + Math.cos(index * 0.071) * 0.5 + (random() - 0.48) * 0.9;
    const high = Math.max(open, close) + random();
    const low = Math.min(open, close) - random();
    const volume = 30 + random() * 170;
    previous = close;
    return { time: index, open, high, low, close, volume };
  });
}

export function getBarRange(bars) {
  if (!Array.isArray(bars) || bars.length === 0) return null;
  let low = Infinity;
  let high = -Infinity;
  for (const bar of bars) {
    if (![bar?.low, bar?.high].every(Number.isFinite) || bar.low > bar.high) {
      throw new TypeError('bars must contain finite low/high values with low <= high');
    }
    low = Math.min(low, bar.low);
    high = Math.max(high, bar.high);
  }
  return { low, high };
}
