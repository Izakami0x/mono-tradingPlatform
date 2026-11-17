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

export async function fetchFuturesKlines(symbol, interval, {limit=500, signal}={}) {
  if (!/^[A-Z0-9]{3,20}$/.test(symbol)) throw new TypeError('Invalid market symbol');
  if (!VALID_INTERVALS.has(interval)) throw new TypeError('Unsupported candle interval');
  if (!Number.isInteger(limit) || limit < 1 || limit > 1500) throw new RangeError('Kline limit must be between 1 and 1500');
  const url = new URL('/fapi/v1/klines', REST_BASE);
  url.search = new URLSearchParams({symbol,interval,limit:String(limit)}).toString();
  const response = await fetch(url, {signal,headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Market history request failed ('+response.status+')');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new TypeError('Unexpected market history response');
  return rows.map(normalizeKline);
}

export function subscribeFuturesKlines(symbol, interval, onBar, onStatus=()=>{}) {
  if (!/^[A-Z0-9]{3,20}$/.test(symbol) || !VALID_INTERVALS.has(interval)) throw new TypeError('Invalid market stream');
  let socket=null, stopped=false, retry=0, timer=null;
  const connect=()=>{
    if(stopped)return;
    onStatus('connecting');
    try {
      socket=new WebSocket(WS_BASE+'/'+symbol.toLowerCase()+'@kline_'+interval);
      socket.onopen=()=>{retry=0;onStatus('live')};
      socket.onmessage=event=>{
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
    if(timer)clearTimeout(timer);
    if(socket){socket.onclose=null;socket.close();socket=null}
    onStatus('disconnected');
  };
}
