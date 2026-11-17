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
