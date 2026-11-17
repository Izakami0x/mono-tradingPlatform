import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDemoBars, getBarRange } from '../src/core/marketData.js';

test('demo bars are deterministic for a symbol', () => {
  assert.deepEqual(generateDemoBars('BTCUSDT', 20), generateDemoBars('BTCUSDT', 20));
  assert.notDeepEqual(generateDemoBars('BTCUSDT', 20), generateDemoBars('ETHUSDT', 20));
});

test('generated bars have valid OHLCV relationships', () => {
  const bars = generateDemoBars('ETHUSDT', 150);
  assert.equal(bars.length, 150);
  for (const bar of bars) {
    assert.ok(Number.isFinite(bar.open) && Number.isFinite(bar.close));
    assert.ok(bar.high >= Math.max(bar.open, bar.close));
    assert.ok(bar.low <= Math.min(bar.open, bar.close));
    assert.ok(bar.volume >= 30 && bar.volume <= 200);
  }
});

test('bar count validation rejects invalid input', () => {
  assert.throws(() => generateDemoBars('BTCUSDT', 0), RangeError);
  assert.throws(() => generateDemoBars('', 10), TypeError);
});

test('range helper returns the full visible price range', () => {
  assert.deepEqual(getBarRange([{ low: 8, high: 12 }, { low: 4, high: 15 }]), { low: 4, high: 15 });
  assert.equal(getBarRange([]), null);
  assert.throws(() => getBarRange([{ low: 5, high: 2 }]), TypeError);
});
