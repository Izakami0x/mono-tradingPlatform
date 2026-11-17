import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDrawingHitIndex, queryDrawingHitIndex, queryDrawingsInViewport } from '../src/core/drawingHitIndex.js';
import { FIB_LEVELS, FIB_EXTENSION_LEVELS, calculateFibExtension, rayToBounds, measureRange, countBarsBetween, formatElapsedTime } from '../src/core/drawingGeometry.js';

test('Fibonacci retracement levels are standard and ordered', () => {
  assert.deepEqual(FIB_LEVELS.map(x => x.value), [0, .236, .382, .5, .618, .786, 1]);
});

test('ray clips forward from its anchor to chart bounds', () => {
  const result = rayToBounds({x:20,y:80},{x:40,y:60},100,100,false);
  assert.ok(result);
  assert.equal(result[0].x, 20);
  assert.equal(result[0].y, 80);
  assert.ok(result[1].x > result[0].x);
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
    delta: 12, percent: 12, precision: 3, timeSpan: 60, barCount: 0
  });
  assert.equal(measureRange(0, 2).percent, 0);
});

test('three-point Fibonacci extension projects standard ratios from the third anchor', () => {
  assert.deepEqual(FIB_EXTENSION_LEVELS, [0, .618, 1, 1.618, 2.618]);
  assert.equal(calculateFibExtension(100, 120, 110, 1), 130);
  assert.equal(calculateFibExtension(100, 120, 110, 1.618), 142.36);
  assert.equal(calculateFibExtension(120, 100, 110, 1.618), 77.64);
});


test('bar measurement counts candles inclusively and ignores out-of-range timestamps', () => {
  assert.equal(countBarsBetween([0, 60, 120, 180, 240], 60, 180), 3);
  assert.equal(countBarsBetween([{time: 60}, {time: 120}, {time: 180}], 180, 60), 3);
  assert.equal(countBarsBetween([0, 60, 120], 61, 119), 0);
});

test('elapsed time formatter uses readable day, hour, minute and second units', () => {
  assert.equal(formatElapsedTime(0), '0s');
  assert.equal(formatElapsedTime(125), '2m');
  assert.equal(formatElapsedTime(3660), '1h 1m');
  assert.equal(formatElapsedTime(90000), '1d 1h');
});

test('price measurement includes candle count when candle timestamps are provided', () => {
  assert.equal(measureRange(10, 12, 60, 180, [0, 60, 120, 180, 240]).barCount, 3);
});


test('chart data update classifier distinguishes last-candle updates, appends and resets', async () => {
  const { classifyBarUpdate } = await import('../src/core/chartData.js');
  const old = [{time: 1}, {time: 2}, {time: 3}];
  assert.equal(classifyBarUpdate(old, [{time: 1}, {time: 2}, {time: 3}]), 'last');
  assert.equal(classifyBarUpdate(old, [{time: 1}, {time: 2}, {time: 3}, {time: 4}]), 'append');
  assert.equal(classifyBarUpdate([{time:1,close:10},{time:2,close:20}], [{time:1,close:11},{time:2,close:20}]), 'reset');
  assert.equal(classifyBarUpdate([{time:1,close:10},{time:2,close:20}], [{time:1,close:10},{time:2,close:21}]), 'last');
  assert.equal(classifyBarUpdate([{time:1,close:10}], [{time:1,close:11},{time:2,close:20}]), 'reset');
  assert.equal(classifyBarUpdate(old, [{time: 2}, {time: 3}, {time: 4}]), 'reset');
  assert.equal(classifyBarUpdate([], [{time: 1}]), 'reset');
});

test('drawing spatial index returns nearby candidates in reverse layer order', () => {
  const drawings = [
    { id: 'back', bounds: { left: 10, top: 10, right: 40, bottom: 40 } },
    { id: 'front', bounds: { left: 20, top: 20, right: 50, bottom: 50 } },
    { id: 'far', bounds: { left: 500, top: 500, right: 520, bottom: 520 } }
  ];
  const index = buildDrawingHitIndex(drawings, item => item.bounds, 64);
  assert.deepEqual(queryDrawingHitIndex(index, 25, 25).map(item => item.id), ['front', 'back']);
  assert.deepEqual(queryDrawingHitIndex(index, 100, 100), []);
});

test('drawing spatial index handles large object counts and oversized drawings', () => {
  const drawings = Array.from({ length: 5000 }, (_, i) => ({
    id: i, bounds: { left: (i % 100) * 180, top: Math.floor(i / 100) * 140, right: (i % 100) * 180 + 24, bottom: Math.floor(i / 100) * 140 + 24 }
  }));
  drawings.push({ id: 'long-ray', bounds: { left: 0, top: 0, right: 20000, bottom: 12000 } });
  const index = buildDrawingHitIndex(drawings, item => item.bounds, 128, 256);
  assert.equal(index.entries.length, 5001);
  assert.ok(index.overflow.some(entry => entry.item.id === 'long-ray'));
  assert.deepEqual(queryDrawingHitIndex(index, 18, 18).map(item => item.id), ['long-ray', 0]);
  assert.ok(queryDrawingHitIndex(index, 9000, 6000).some(item => item.id === 'long-ray'));
});

test('viewport query excludes offscreen drawings but keeps intersecting and overscanned objects',()=>{
  const drawings=[
    {id:'visible',bounds:{left:10,top:10,right:40,bottom:40}},
    {id:'partial',bounds:{left:390,top:20,right:430,bottom:60}},
    {id:'near',bounds:{left:-70,top:20,right:-40,bottom:60}},
    {id:'offscreen',bounds:{left:900,top:900,right:950,bottom:950}}
  ];
  const index=buildDrawingHitIndex(drawings,item=>item.bounds,64);
  assert.deepEqual(queryDrawingsInViewport(index,400,300,64).map(item=>item.id),['visible','partial','near']);
});

test('viewport culling remains selective with 5000 drawings',()=>{
  const drawings=Array.from({length:5000},(_,i)=>({id:i,bounds:{left:(i%100)*200,top:Math.floor(i/100)*160,right:(i%100)*200+30,bottom:Math.floor(i/100)*160+30}}));
  const index=buildDrawingHitIndex(drawings,item=>item.bounds,128,256);
  const visible=queryDrawingsInViewport(index,800,600,0);
  assert.ok(visible.length<30);
  assert.ok(visible.every(item=>item.bounds.left<=800&&item.bounds.top<=600));
});
