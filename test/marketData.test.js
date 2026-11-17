import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDemoBars, getBarRange } from '../src/core/marketData.js';

test('demo bars are deterministic for a symbol and reference price', () => {
  assert.deepEqual(generateDemoBars('BTCUSDT', 20, 96482.4), generateDemoBars('BTCUSDT', 20, 96482.4));
  assert.notDeepEqual(generateDemoBars('BTCUSDT', 20), generateDemoBars('ETHUSDT', 20));
});

test('generated bars are anchored to the instrument price at the latest close', () => {
  for (const [symbol, price] of [['BTCUSDT', 96482.4], ['ETHUSDT', 3284.16], ['XRPUSDT', 2.1846], ['DOGEUSDT', 0.2468]]) {
    const bars = generateDemoBars(symbol, 150, price);
    assert.equal(bars.length, 150);
    assert.ok(Math.abs(bars.at(-1).close - price) < Math.max(price * 1e-12, 1e-12));
    for (const bar of bars) {
      assert.ok(Number.isFinite(bar.open) && Number.isFinite(bar.close));
      assert.ok(bar.high >= Math.max(bar.open, bar.close));
      assert.ok(bar.low <= Math.min(bar.open, bar.close));
      assert.ok(bar.volume >= 30 && bar.volume <= 200);
      assert.ok(bar.low > 0);
    }
  }
});

test('bar count, symbol and reference price validation reject invalid input', () => {
  assert.throws(() => generateDemoBars('BTCUSDT', 0), RangeError);
  assert.throws(() => generateDemoBars('', 10), TypeError);
  assert.throws(() => generateDemoBars('BTCUSDT', 10, 0), RangeError);
  assert.throws(() => generateDemoBars('BTCUSDT', 10, Infinity), RangeError);
});

test('range helper returns the full visible price range', () => {
  assert.deepEqual(getBarRange([{ low: 8, high: 12 }, { low: 4, high: 15 }]), { low: 4, high: 15 });
  assert.equal(getBarRange([]), null);
  assert.throws(() => getBarRange([{ low: 5, high: 2 }]), TypeError);
});
