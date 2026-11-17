import { performance } from 'node:perf_hooks';
import { buildDrawingHitIndex, queryDrawingHitIndex, queryDrawingsInViewport } from '../src/core/drawingHitIndex.js';

const count=50000;
const drawings=Array.from({length:count},(_,i)=>{
  const left=(i%500)*180,top=Math.floor(i/500)*140;
  return {id:i,bounds:{left,top,right:left+36,bottom:top+28}};
});
drawings.push({id:'long-ray',bounds:{left:0,top:0,right:90000,bottom:14000}});
const start=performance.now();
const index=buildDrawingHitIndex(drawings,item=>item.bounds,128,256);
const buildMs=performance.now()-start;
const hitStart=performance.now();
let candidateCount=0;
for(let i=0;i<1000;i++)candidateCount+=queryDrawingHitIndex(index,(i%20)*180+12,Math.floor(i/20)*140+10,12).length;
const hitMs=performance.now()-hitStart;
const renderStart=performance.now();
let visibleCount=0;
for(let i=0;i<100;i++)visibleCount+=queryDrawingsInViewport(index,1400,900,80).length;
const renderMs=performance.now()-renderStart;
console.log(JSON.stringify({drawings:drawings.length,buildIndexMs:Number(buildMs.toFixed(2)),hitQueries:1000,hitQueryMs:Number(hitMs.toFixed(2)),averageCandidates:Number((candidateCount/1000).toFixed(2)),viewportQueries:100,viewportQueryMs:Number(renderMs.toFixed(2)),averageVisibleDrawings:Number((visibleCount/100).toFixed(2))},null,2));
