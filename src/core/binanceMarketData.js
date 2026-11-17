const REST_BASE = 'https://fapi.binance.com';
const WS_BASE = 'wss://fstream.binance.com/ws';
const VALID_INTERVALS = new Set(['1m','3m','5m','15m','30m','1h','2h','4h','1d','1w','1M']);

export function normalizeKline(row) {
  if (!Array.isArray(row) || row.length < 6) throw new TypeError('Invalid exchange kline payload');
  const [openTime, open, high, low, close, volume] = row;
  const bar = { time: Math.floor(Number(openTime) / 1000), open:Number(open), high:Number(high), low:Number(low), close:Number(close), volume:Number(volume) };
  if (!Number.isFinite(bar.time) || ![bar.open,bar.high,bar.low,bar.close,bar.volume].every(Number.isFinite) || bar.volume < 0 || bar.high < Math.max(bar.open,bar.close,bar.low) || bar.low > Math.min(bar.open,bar.close,bar.high)) throw new TypeError('Exchange returned invalid OHLCV values');
  return bar;
}

export async function fetchFuturesKlines(symbol, interval, {limit=500, signal, startTime, endTime}={}) {
  if (!/^[A-Z0-9]{3,20}$/.test(symbol)) throw new TypeError('Invalid market symbol');
  if (!VALID_INTERVALS.has(interval)) throw new TypeError('Unsupported candle interval');
  if (!Number.isInteger(limit) || limit < 1 || limit > 1500) throw new RangeError('Kline limit must be between 1 and 1500');
  const url = new URL('/fapi/v1/klines', REST_BASE);
  const params={symbol,interval,limit:String(limit)};if(Number.isFinite(startTime))params.startTime=String(startTime);if(Number.isFinite(endTime))params.endTime=String(endTime);url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, {signal,headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Market history request failed ('+response.status+')');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new TypeError('Unexpected market history response');
  return rows.map(normalizeKline);
}

export function subscribeFuturesKlines(symbol, interval, onBar, onStatus=()=>{}) {
  if (!/^[A-Z0-9]{3,20}$/.test(symbol) || !VALID_INTERVALS.has(interval)) throw new TypeError('Invalid market stream');
  let socket=null, stopped=false, retry=0, timer=null,lastMessageAt=0;const watchdog=setInterval(()=>{if(!stopped&&socket?.readyState===1&&lastMessageAt&&Date.now()-lastMessageAt>15000)onStatus('stale')},5000);
  const connect=()=>{
    if(stopped)return;
    onStatus('connecting');
    try {
      socket=new WebSocket(WS_BASE+'/'+symbol.toLowerCase()+'@kline_'+interval);
      socket.onopen=()=>{retry=0;lastMessageAt=Date.now();onStatus('live')};
      socket.onmessage=event=>{
        lastMessageAt=Date.now();
        try {
          const message=JSON.parse(event.data), k=message.k;
          if(!k)return;
          onBar(normalizeKline([k.t,k.o,k.h,k.l,k.c,k.v]));
        } catch(error) { onStatus('error'); }
      };
      socket.onerror=()=>onStatus('reconnecting');
      socket.onclose=()=>{
        socket=null;
        if(stopped)return;
        onStatus('reconnecting');
        const delay=Math.min(30000,1000*Math.pow(2,Math.min(retry++,5)));
        timer=setTimeout(connect,delay);
      };
    } catch(error) {
      onStatus('reconnecting');
      const delay=Math.min(30000,1000*Math.pow(2,Math.min(retry++,5)));
      timer=setTimeout(connect,delay);
    }
  };
  connect();
  return ()=>{
    stopped=true;
    if(timer)clearTimeout(timer);clearInterval(watchdog);
    if(socket){socket.onclose=null;socket.close();socket=null}
    onStatus('disconnected');
  };
}

const INTERVAL_MS = {'1m':60000,'3m':180000,'5m':300000,'15m':900000,'30m':1800000,'1h':3600000,'2h':7200000,'4h':14400000,'1d':86400000,'1w':604800000,'1M':2592000000};

export async function fetchHistoricalKlines(symbol, interval, {limit=1500, signal}={}) {
  if(!Number.isInteger(limit)||limit<1||limit>20000)throw new RangeError('Historical bar count must be between 1 and 20000');
  const step=INTERVAL_MS[interval];
  if(!step)throw new TypeError('Unsupported candle interval');
  const result=[];
  let startTime;
  while(result.length<limit) {
    const batch=await fetchFuturesKlines(symbol,interval,{limit:Math.min(1500,limit-result.length),signal,startTime});
    if(!batch.length)break;
    result.push(...batch);
    const nextStart=batch[batch.length-1].time*1000+step;
    if(!Number.isFinite(nextStart)||nextStart<= (startTime??0))break;
    startTime=nextStart;
    if(batch.length<Math.min(1500,limit-result.length+batch.length))break;
  }
  return result.slice(0,limit);
}
