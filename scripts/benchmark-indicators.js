import {performance} from 'node:perf_hooks';
import {calculateIndicatorValues,calculateLatestSMAValue} from '../src/core/indicators.js';

const bars=Array.from({length:50000},(_,index)=>{
  const close=50000+Math.sin(index/80)*250+index*.002;
  return {time:1700000000+index*60,open:close,high:close+4,low:close-4,close,volume:100+(index%37)};
});
const measure=(label,fn,iterations)=>{
  fn();
  const start=performance.now();
  for(let i=0;i<iterations;i++)fn();
  const elapsed=performance.now()-start;
  console.log(label+': '+elapsed.toFixed(2)+' ms total / '+(elapsed/iterations).toFixed(3)+' ms per run ('+iterations+' runs)');
};
console.log('MONO indicator benchmark — 50,000 candles; timings are informational, not CI thresholds.');
measure('Full SMA(20) series',()=>calculateIndicatorValues(bars,{type:'SMA',period:20}),5);
measure('Full EMA(20) series',()=>calculateIndicatorValues(bars,{type:'EMA',period:20}),5);
measure('Full VWAP series',()=>calculateIndicatorValues(bars,{type:'VWAP'}),5);
measure('Latest SMA(20) update',()=>calculateLatestSMAValue(bars,{period:20}),1000);
