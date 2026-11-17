import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeKline} from '../src/core/binanceMarketData.js';

test('normalizes Binance futures kline into chart OHLCV seconds',()=>{
  assert.deepEqual(normalizeKline([1700000000000,'10','12','9','11','25']),{time:1700000000,open:10,high:12,low:9,close:11,volume:25});
});
test('rejects malformed and impossible OHLCV rows',()=>{
  assert.throws(()=>normalizeKline(['bad','10','12','9','11','25']),/invalid OHLCV/i);
  assert.throws(()=>normalizeKline([1700000000000,'10','8','9','11','25']),/invalid OHLCV/i);
  assert.throws(()=>normalizeKline([1,'10','12','9','11','-1']),/invalid OHLCV/i);
});
