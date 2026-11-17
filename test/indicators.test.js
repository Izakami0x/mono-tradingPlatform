import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateIndicatorValues,calculateLatestSMAValue} from '../src/core/indicators.js';

const bars=closes=>closes.map((close,index)=>({time:1700000000+index*60,open:close,high:close+1,low:close-1,close,volume:10}));

test('SMA emits values only after a full period and averages the rolling window',()=>{
  const result=calculateIndicatorValues(bars([1,2,3,4,5]),{type:'SMA',period:3});
  assert.deepEqual(result.map(x=>x.value),[2,3,4]);
});
test('EMA uses the configured period and returns aligned timestamps',()=>{
  const result=calculateIndicatorValues(bars([10,10,16,16]),{type:'EMA',period:3});
  assert.deepEqual(result.map(x=>x.time),[1700000120,1700000180]);
  assert.deepEqual(result.map(x=>x.value),[13,14.5]);
});
test('VWAP weights typical price by volume and resets at UTC day boundary',()=>{
  const input=[
    {time:86400*20000+1,high:12,low:10,close:11,volume:2},
    {time:86400*20000+61,high:22,low:20,close:21,volume:1},
    {time:86400*20001+1,high:32,low:30,close:31,volume:4}
  ];
  const result=calculateIndicatorValues(input,{type:'VWAP'});
  assert.equal(result[0].value,11);
  assert.equal(result[1].value,(11*2+21)/3);
  assert.equal(result[2].value,31);
});
test('empty and short input are safe',()=>{
  assert.deepEqual(calculateIndicatorValues([],{type:'SMA',period:5}),[]);
  assert.deepEqual(calculateIndicatorValues(bars([1,2]),{type:'SMA',period:5}),[]);
});

test('latest SMA calculation matches the final full-series value',()=>{
  const input=bars([3,4,5,6,7,8]);
  const latest=calculateLatestSMAValue(input,{period:4});
  const full=calculateIndicatorValues(input,{type:'SMA',period:4});
  assert.deepEqual(latest,full.at(-1));
  assert.equal(calculateLatestSMAValue(input.slice(0,2),{period:4}),null);
});
