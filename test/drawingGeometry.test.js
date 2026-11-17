import test from 'node:test';
import assert from 'node:assert/strict';
import { FIB_LEVELS, rayToBounds, measureRange } from '../src/core/drawingGeometry.js';

test('Fibonacci retracement levels are standard and ordered', () => {
  assert.deepEqual(FIB_LEVELS.map(x => x.value), [0, .236, .382, .5, .618, .786, 1]);
});

test('ray clips forward from its anchor to chart bounds', () => {
  const result = rayToBounds({x:20,y:80},{x:40,y:60},100,100,false);
  assert.ok(result);
  assert.ok(result[0].x >= 20 - 1e-6);
  assert.ok(result[1].x <= 100);
  assert.ok(result.every(p => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
});

test('extended line clips both directions', () => {
  const result = rayToBounds({x:50,y:50},{x:60,y:40},100,100,true);
  assert.ok(result);
  assert.ok(result[0].x < 50);
  assert.ok(result[1].x > 60);
});

test('price range reports signed delta, percentage and elapsed time', () => {
  assert.deepEqual(measureRange(100, 112, 10, 70), {
    delta: 12, percent: 12, precision: 3, timeSpan: 60
  });
  assert.equal(measureRange(0, 2).percent, 0);
});
