export function generateDemoBars(symbol, count = 150, basePrice = 100) {
  if (typeof symbol !== 'string' || !symbol.trim()) throw new TypeError('symbol must be a non-empty string');
  if (!Number.isInteger(count) || count < 1 || count > 10000) throw new RangeError('count must be an integer between 1 and 10000');
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new RangeError('basePrice must be a finite number greater than zero');

  let seed = [...symbol].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Generate percentage-based movement so BTC, ETH and sub-dollar assets all
  // use the same realistic relative scale instead of sharing a $60-$90 range.
  let previous = basePrice * 0.965;
  const rawBars = Array.from({ length: count }, (_, index) => {
    const open = previous;
    const wave = Math.sin(index * 0.19) * 0.0018 + Math.cos(index * 0.071) * 0.0011;
    const noise = (random() - 0.5) * 0.0024;
    const close = open * (1 + wave + noise);
    const high = Math.max(open, close) * (1 + random() * 0.0018);
    const low = Math.min(open, close) * (1 - random() * 0.0018);
    const volume = 30 + random() * 170;
    previous = close;
    return { time: index, open, high, low, close, volume };
  });

  // Anchor the latest close to the instrument's displayed reference price.
  const scale = basePrice / rawBars[rawBars.length - 1].close;
  return rawBars.map(bar => ({
    ...bar,
    open: bar.open * scale,
    high: bar.high * scale,
    low: bar.low * scale,
    close: bar.close * scale
  }));
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
