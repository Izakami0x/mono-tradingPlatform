import React, { useMemo, useState } from 'react';
import { Activity, AlignLeft, Bell, Bookmark, CandlestickChart, Check, ChevronDown, CircleHelp, Crosshair, Eye, FileText, Grid2X2, Layers, Maximize2, Minus, MoreHorizontal, PanelRightClose, PanelRightOpen, Plus, Search, Settings2, SlidersHorizontal, Square, Star, TrendingUp, Waves, X, ZoomIn, ZoomOut } from 'lucide-react';

const instruments = [
  ['BTCUSDT','Bitcoin / Tether','96,482.40','+2.41%',true],
  ['ETHUSDT','Ethereum / Tether','3,284.16','+1.08%',true],
  ['SOLUSDT','Solana / Tether','184.72','-0.64%',false],
  ['BNBUSDT','BNB / Tether','642.80','+0.32%',true],
  ['XRPUSDT','XRP / Tether','2.1846','-1.24%',false],
  ['DOGEUSDT','Dogecoin / Tether','0.2468','+3.82%',true],
  ['AVAXUSDT','Avalanche / Tether','36.92','-0.18%',false],
  ['LINKUSDT','Chainlink / Tether','18.43','+0.76%',true]
].map(([symbol,name,price,change,up])=>({symbol,name,price,change,up}));
const drawingTools = [
  [Crosshair,'Crosshair'],[TrendingUp,'Trend line'],[Minus,'Horizontal line'],
  [Waves,'Parallel channel'],[Square,'Rectangle'],[AlignLeft,'Text note'],
  [Activity,'Brush'],[SlidersHorizontal,'Measure']
];
function Chart({volume, tool}) {
  const bars=useMemo(()=>{let p=61;return Array.from({length:76},(_,i)=>{const o=p;const c=o+Math.sin(i*.43)*2.1+Math.cos(i*.17)*1.1+(Math.random()-.48)*2;p=c;return {o,c,h:Math.max(o,c)+Math.random()*2+.4,l:Math.min(o,c)-Math.random()*2-.4};});},[]);
  const lo=Math.min(...bars.map(b=>b.l))-2, hi=Math.max(...bars.map(b=>b.h))+2;
  const y=v=>16+(hi-v)/(hi-lo)*470;
  return <div className="chart-canvas">
    <svg viewBox="0 0 1100 550" preserveAspectRatio="none" aria-label="Illustrative candlestick chart">
      {Array.from({length:9},(_,i)=><g key={'h'+i}><line className="grid" x1="0" x2="1055" y1={16+i*58.75} y2={16+i*58.75}/><text className="axis" x="1062" y={20+i*58.75}>{(hi-i*(hi-lo)/8).toFixed(1)}</text></g>)}
      {Array.from({length:13},(_,i)=><g key={'v'+i}><line className="grid" x1={i*87.5} x2={i*87.5} y1="0" y2="510"/><text className="axis" x={i*87.5+3} y="544">{['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00'][i]}</text></g>)}
      {bars.map((b,i)=>{const x=12+i*13.55,up=b.c>=b.o,color=up?'#16c7a0':'#f05b78';return <g key={i}><line x1={x+4} x2={x+4} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth="1.2"/><rect x={x} y={Math.min(y(b.o),y(b.c))} width="8" height={Math.max(2,Math.abs(y(b.o)-y(b.c)))} rx="1" fill={color}/>{volume&&<rect x={x} y={520-(i*17%34)} width="8" height={i*17%34} fill={color} opacity=".38"/>}</g>;})}
      <line className="price-line" x1="0" x2="1055" y1={y(bars[68].c)} y2={y(bars[68].c)}/>
      <rect x="1058" y={y(bars[68].c)-10} width="42" height="20" rx="3" fill="#12b994"/><text className="price-tag" x="1061" y={y(bars[68].c)+4}>96,482</text>
    </svg>
    <div className="watermark">BTCUSDT <span>·</span> 15m</div>
    <div className="ohlc">O 96,210.4　 H 96,590.2　 L 96,108.8　 C 96,482.4　 <b>+0.28%</b></div>
    {tool!=='Crosshair'&&<div className="tool-hint"><Check size={12}/>{tool} selected · click chart to place</div>}
  </div>;
}
export default function App(){
 const [symbol,setSymbol]=useState('BTCUSDT'),[tf,setTf]=useState('15m'),[tool,setTool]=useState('Crosshair');
 const [watchOpen,setWatchOpen]=useState(true),[inspector,setInspector]=useState(false),[floating,setFloating]=useState(false);
 const [filter,setFilter]=useState(''),[volume,setVolume]=useState(true),[tab,setTab]=useState('Object tree');
 const current=instruments.find(x=>x.symbol===symbol)||instruments[0];
 const visible=instruments.filter(x=>(x.symbol+x.name).toLowerCase().includes(filter.toLowerCase()));
 return <main className="app">
  <header className="topbar"><div className="brand"><span className="brand-mark">M</span> MONO <small>BETA</small></div><i className="divider"/><button className="symbol-select">◈ <b>{symbol}</b><ChevronDown size={13}/></button><div className="market-meta"><b>{current.price}</b><span className={current.up?'up':'down'}>{current.change}</span></div><div className="spacer"/><button className="icon"><Search/></button><button className="icon"><Bell/></button><button className="icon"><Bookmark/></button><div className="avatar">IZ</div></header>
  <div className="workspace">
   <nav className="rail"><button className="rail-active" title="Watchlist" onClick={()=>setWatchOpen(!watchOpen)}><Layers/></button><button><CandlestickChart/></button><button><Activity/></button><button><FileText/></button><div className="spacer"/><button><CircleHelp/></button><button><Settings2/></button></nav>
   {watchOpen&&<aside className="watchlist"><div className="section-head">WATCHLIST <MoreHorizontal size={15}/></div><button className="watch-picker">Main watchlist <ChevronDown size={13}/></button><div className="searchbox"><Search size={13}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find symbol"/></div><div className="list-label"><span>SYMBOL</span><span>LAST / CHANGE</span></div><div className="symbols">{visible.map(x=><button key={x.symbol} onClick={()=>setSymbol(x.symbol)} className={'symbol '+(symbol===x.symbol?'chosen':'')}><span><b>{x.symbol}</b><small>{x.name}</small></span><span className="quote"><b>{x.price}</b><small className={x.up?'up':'down'}>{x.change}</small></span></button>)}</div><button className="add"><Plus size={14}/> Add symbol</button></aside>}
   <section className="main-stage"><div className="chart-tabs"><button className="active-tab">Chart 1 <X size={11}/></button><button className="icon"><Plus/></button><div className="spacer"/><button className="subtle"><Grid2X2/> Layout</button><button className="subtle"><SlidersHorizontal/> Indicators</button><button className="subtle"><Eye/> Templates</button><button className="subtle" onClick={()=>setInspector(!inspector)}>{inspector?<PanelRightClose/>:<PanelRightOpen/>} Inspector</button></div>
    <div className="toolbar"><div className="timeframes">{['1m','3m','5m','15m','30m','1h','4h','1D','1W'].map(x=><button className={tf===x?'tf-active':''} onClick={()=>setTf(x)} key={x}>{x}</button>)}</div><i className="divider"/><button className="subtle"><CandlestickChart/> <ChevronDown/></button><button className="subtle"><Plus/> Indicator</button><div className="spacer"/><button className="subtle" onClick={()=>setVolume(!volume)}><Activity/> Volume {volume?'On':'Off'}</button><button className="subtle"><ZoomOut/></button><button className="subtle"><ZoomIn/></button><button className="subtle"><Maximize2/></button></div>
    <div className="chart-layout"><div className="drawing-rail">{drawingTools.map(([Icon,name])=><button title={name} className={tool===name?'draw-active':''} onClick={()=>setTool(name)} key={name}><Icon/></button>)}<i/><button title="Favorites"><Star/></button></div><div className="chart-column"><div className="instrument-line"><b>{symbol}</b><span> · Perpetual · Binance</span><small>SIMULATED MARKET DATA</small></div><Chart volume={volume} tool={tool}/><div className="chart-footer"><span>Range: <b>1D</b>⌄</span><span>Timezone: UTC</span><div className="spacer"/><span className="sim-dot"/> Simulated data</div></div></div>
    <footer className="status"><span>MONO WORKSPACE</span><span className="spacer"/><span className="saved"><Check size={11}/> Session state</span></footer>
   </section>
   {inspector&&<aside className={'inspector '+(floating?'floating':'')}><div className="section-head">INSPECTOR <span><button onClick={()=>setFloating(!floating)}><Maximize2 size={14}/></button><button onClick={()=>{setInspector(false);setFloating(false)}}><X size={14}/></button></span></div><div className="inspector-tabs">{['Object tree','Properties','Alerts'].map(x=><button className={tab===x?'selected-tab':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>{tab==='Object tree'?<div className="tree"><p>⌄　<CandlestickChart size={13}/> {symbol} · {tf}</p><p className="child"><Eye/> Candles</p><p className="child"><Eye/> Volume</p><p className="child muted"><Eye/> Drawings　0</p></div>:tab==='Properties'?<div className="properties"><label>CHART APPEARANCE</label><p>Background <b>#08131F</b></p><p>Grid opacity <b>18%</b></p><p>Crosshair <b>Cross</b></p><label>SELECTED OBJECT</label><small>Select a drawing on the chart to edit its properties.</small></div>:<p className="empty">No alerts configured.</p>}</aside>}
  </div>
 </main>;
}