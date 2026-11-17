import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateIndicatorValues,calculateLatestSMAValue,calculateIncrementalIndicatorUpdate} from '../src/core/indicators.js';

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

test('latest SMA remains correct on a 50k-bar history',()=>{
  const input=Array.from({length:50000},(_,index)=>({time:1700000000+index*60,open:index,high:index+1,low:index-1,close:index,volume:10}));
  const latest=calculateLatestSMAValue(input,{period:50});
  assert.equal(latest.time,input.at(-1).time);
  assert.equal(latest.value,49974.5);
});

test('incremental EMA matches full calculation across repeated ticks, append and history reset',()=>{
  let input=bars(Array.from({length:30},(_,i)=>100+i));
  let update=calculateIncrementalIndicatorUpdate(input,{type:'EMA',period:9});
  assert.equal(update.mode,'reset');
  assert.deepEqual(update.values,calculateIndicatorValues(input,{type:'EMA',period:9}));
  input=input.map((bar,i)=>i===29?{...bar,close:145,high:146}:bar);
  update=calculateIncrementalIndicatorUpdate(input,{type:'EMA',period:9},update.state);
  assert.equal(update.mode,'last');
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'EMA',period:9}).at(-1));
  input=input.map((bar,i)=>i===29?{...bar,close:147,high:148}:bar);
  update=calculateIncrementalIndicatorUpdate(input,{type:'EMA',period:9},update.state);
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'EMA',period:9}).at(-1));
  input=[...input,{...input.at(-1),time:input.at(-1).time+60,open:149,high:150,low:148,close:149}];
  update=calculateIncrementalIndicatorUpdate(input,{type:'EMA',period:9},update.state);
  assert.equal(update.mode,'append');
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'EMA',period:9}).at(-1));
  input=input.map((bar,i)=>i===0?{...bar,close:999}:bar);
  update=calculateIncrementalIndicatorUpdate(input,{type:'EMA',period:9},update.state);
  assert.equal(update.mode,'reset');
  assert.deepEqual(update.values,calculateIndicatorValues(input,{type:'EMA',period:9}));
});

test('incremental VWAP matches full calculation on live revisions, appends and UTC session reset',()=>{
  const day=86400*22000;
  let input=[
    {time:day+60,high:12,low:10,close:11,volume:2},
    {time:day+120,high:22,low:20,close:21,volume:3},
    {time:day+180,high:32,low:30,close:31,volume:4}
  ];
  let update=calculateIncrementalIndicatorUpdate(input,{type:'VWAP'});
  assert.deepEqual(update.values,calculateIndicatorValues(input,{type:'VWAP'}));
  input=input.map((bar,i)=>i===2?{...bar,high:42,close:41,volume:6}:bar);
  update=calculateIncrementalIndicatorUpdate(input,{type:'VWAP'},update.state);
  assert.equal(update.mode,'last');
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'VWAP'}).at(-1));
  input=[...input,{time:day+240,high:52,low:50,close:51,volume:2}];
  update=calculateIncrementalIndicatorUpdate(input,{type:'VWAP'},update.state);
  assert.equal(update.mode,'append');
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'VWAP'}).at(-1));
  input=[...input,{time:day+86400+60,high:62,low:60,close:61,volume:5}];
  update=calculateIncrementalIndicatorUpdate(input,{type:'VWAP'},update.state);
  assert.equal(update.mode,'append');
  assert.deepEqual(update.latest,calculateIndicatorValues(input,{type:'VWAP'}).at(-1));
});
