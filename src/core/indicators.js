import { classifyBarUpdate } from './chartData.js';

export function calculateIndicatorValues(bars,{type='SMA',period=20}={}) {
  const safePeriod=Math.max(2,Math.min(500,Number(period)||20));
  if(!Array.isArray(bars)||bars.length===0)return [];
  if(type==='VWAP'){
    let cumulativePriceVolume=0,cumulativeVolume=0,session=null;
    return bars.map(bar=>{
      const day=Math.floor(Number(bar.time)/86400);
      if(session!==null&&day!==session){cumulativePriceVolume=0;cumulativeVolume=0;}
      session=day;
      const typical=(Number(bar.high)+Number(bar.low)+Number(bar.close))/3;
      const volume=Math.max(0,Number(bar.volume)||0);
      cumulativePriceVolume+=typical*volume;cumulativeVolume+=volume;
      return {time:bar.time,value:cumulativeVolume?cumulativePriceVolume/cumulativeVolume:typical};
    });
  }
  if(type==='EMA'){
    const multiplier=2/(safePeriod+1);let ema=null;
    return bars.map((bar,index)=>{
      const close=Number(bar.close);
      ema=ema===null?close:close*multiplier+ema*(1-multiplier);
      return index>=safePeriod-1?{time:bar.time,value:ema}:null;
    }).filter(Boolean);
  }
  const result=[];let rolling=0;
  bars.forEach((bar,index)=>{
    rolling+=Number(bar.close);
    if(index>=safePeriod)rolling-=Number(bars[index-safePeriod].close);
    if(index>=safePeriod-1)result.push({time:bar.time,value:rolling/safePeriod});
  });
  return result;
}

export function calculateLatestSMAValue(bars,{period=20}={}) {
  const safePeriod=Math.max(2,Math.min(500,Number(period)||20));
  if(!Array.isArray(bars)||bars.length<safePeriod)return null;
  const window=bars.slice(-safePeriod);
  const sum=window.reduce((total,bar)=>total+Number(bar.close),0);
  return {time:window.at(-1).time,value:sum/safePeriod};
}

const signatureFor=({type,period})=>JSON.stringify({type,period});
const typicalPrice=bar=>(Number(bar.high)+Number(bar.low)+Number(bar.close))/3;
const volumeOf=bar=>Math.max(0,Number(bar.volume)||0);

function buildIncrementalState(bars,options,signature) {
  const type=options.type;
  if(!bars.length)return {signature,times:[],lastTime:null,lastDay:null,baseEma:null,latestEma:null,basePV:0,baseVolume:0,latestPV:0,latestVolume:0};
  if(type==='EMA'){
    const multiplier=2/(Math.max(2,Math.min(500,Number(options.period)||20))+1);
    let ema=null,previous=null;
    for(let i=0;i<bars.length;i++){previous=ema;const close=Number(bars[i].close);ema=ema===null?close:close*multiplier+ema*(1-multiplier);}
    return {signature,times:bars,lastTime:bars.at(-1).time,lastDay:Math.floor(Number(bars.at(-1).time)/86400),baseEma:previous,latestEma:ema};
  }
  let pv=0,vol=0,basePV=0,baseVolume=0,day=null;
  for(let i=0;i<bars.length;i++){
    const bar=bars[i],nextDay=Math.floor(Number(bar.time)/86400);
    if(day!==null&&nextDay!==day){pv=0;vol=0;}
    if(i===bars.length-1){basePV=pv;baseVolume=vol;}
    pv+=typicalPrice(bar)*volumeOf(bar);vol+=volumeOf(bar);day=nextDay;
  }
  return {signature,times:bars,lastTime:bars.at(-1).time,lastDay:day,basePV,baseVolume,latestPV:pv,latestVolume:vol};
}

export function calculateIncrementalIndicatorUpdate(bars,options={},previousState=null) {
  const safeOptions={...options,type:options.type||'EMA'};
  const signature=signatureFor(safeOptions);
  const state=previousState?.signature===signature?previousState:null;
  const mode=state?classifyBarUpdate(state.times,bars):'reset';
  if(mode==='reset'){
    const values=calculateIndicatorValues(bars,safeOptions);
    return {mode,values,latest:null,state:buildIncrementalState(bars,safeOptions,signature)};
  }
  if(!bars.length)return {mode,values:null,latest:null,state:buildIncrementalState(bars,safeOptions,signature)};
  const last=bars.at(-1);
  let latest=null,nextState;
  if(safeOptions.type==='EMA'){
    const period=Math.max(2,Math.min(500,Number(safeOptions.period)||20)),multiplier=2/(period+1);
    const base=mode==='last'?state.baseEma:state.latestEma;
    const ema=base===null||base===undefined?Number(last.close):Number(last.close)*multiplier+base*(1-multiplier);
    if(bars.length>=period)latest={time:last.time,value:ema};
    nextState={...state,times:bars,lastTime:last.time,lastDay:Math.floor(Number(last.time)/86400),baseEma:mode==='last'?state.baseEma:state.latestEma,latestEma:ema};
  }else if(safeOptions.type==='VWAP'){
    const day=Math.floor(Number(last.time)/86400);
    const sameSession=mode==='last'?state.lastDay===day:state.lastDay===day;
    const basePV=mode==='last'?state.basePV:(sameSession?state.latestPV:0);
    const baseVolume=mode==='last'?state.baseVolume:(sameSession?state.latestVolume:0);
    const contribution=typicalPrice(last)*volumeOf(last),volume=volumeOf(last),totalPV=basePV+contribution,totalVolume=baseVolume+volume;
    latest={time:last.time,value:totalVolume?totalPV/totalVolume:typicalPrice(last)};
    nextState={...state,times:bars,lastTime:last.time,lastDay:day,basePV,baseVolume,latestPV:totalPV,latestVolume:totalVolume};
  }else{
    return {mode,values:calculateIndicatorValues(bars,safeOptions),latest:null,state:buildIncrementalState(bars,safeOptions,signature)};
  }
  return {mode,values:null,latest,state:nextState};
}
