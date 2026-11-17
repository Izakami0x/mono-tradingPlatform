import React,{useEffect,useMemo,useState} from 'react';
import {generateDemoBars as barsFor} from './core/marketData.js';
import {readLocalRecord,writeLocalRecord} from './core/persistence.js';
import {Activity,AlignLeft,Bell,Bookmark,CandlestickChart,Check,ChevronDown,ChevronLeft,ChevronRight,CircleHelp,Crosshair,Download,Eye,FileText,Grid2X2,Layers,Maximize2,Minus,MoreHorizontal,PanelRightClose,PanelRightOpen,Plus,Search,Settings2,SlidersHorizontal,Square,Star,TrendingUp,Trash2,Undo2,Waves,X,ZoomIn,ZoomOut,Play,Pause,RotateCcw,Clock3,LayoutDashboard,MousePointer2,Pencil} from 'lucide-react';
const SYMBOLS=[['BTCUSDT','Bitcoin / Tether',96482.4,2.41,2],['ETHUSDT','Ethereum / Tether',3284.16,1.08,2],['SOLUSDT','Solana / Tether',184.72,-.64,2],['BNBUSDT','BNB / Tether',642.8,.32,2],['XRPUSDT','XRP / Tether',2.1846,-1.24,4],['DOGEUSDT','Dogecoin / Tether',.2468,3.82,4],['AVAXUSDT','Avalanche / Tether',36.92,-.18,2],['LINKUSDT','Chainlink / Tether',18.43,.76,2],['ADAUSDT','Cardano / Tether',.7124,1.62,4],['SUIUSDT','Sui / Tether',3.482,-2.03,3]].map(([symbol,name,price,change,precision])=>({symbol,name,price,change,precision}));
const TOOLS=[['cursor',MousePointer2,'Cursor'],['crosshair',Crosshair,'Crosshair'],['trend',TrendingUp,'Trend line'],['horizontal',Minus,'Horizontal line'],['channel',Waves,'Channel'],['rectangle',Square,'Rectangle'],['text',AlignLeft,'Text note'],['brush',Pencil,'Brush']];
const TFS=['1m','3m','5m','15m','30m','1h','2h','4h','1D','1W','1M'], STORE='mono.workspace.v1';
const fmt=(v,p=2)=>v.toLocaleString('en-US',{minimumFractionDigits:p,maximumFractionDigits:p});
function load(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}

import {createChart,CandlestickSeries,HistogramSeries,LineSeries,CrosshairMode,ColorType} from 'lightweight-charts';
function Chart({symbol,basePrice,tf,tool,drawings,onDraw,volume,ma,count,selected,onSelect,onMove}){
  const host=React.useRef(null), chartRef=React.useRef(null), candleRef=React.useRef(null), volumeRef=React.useRef(null), maRef=React.useRef(null);
  const [draft,D]=useState(null),[tick,Tick]=useState(0),[drag,Drag]=useState(null);
  const bars=useMemo(()=>barsFor(symbol,150,basePrice).slice(0,count),[symbol,basePrice,count]);
  const interval=({'1m':60,'3m':180,'5m':300,'15m':900,'30m':1800,'1h':3600,'2h':7200,'4h':14400,'1D':86400,'1W':604800,'1M':2592000}[tf]||900);
  const times=useMemo(()=>bars.map((bar,index)=>({...bar,time:1700000000+index*interval})),[bars,interval]);
  useEffect(()=>{
    if(!host.current)return;
    const chart=createChart(host.current,{
      width:host.current.clientWidth,height:host.current.clientHeight,
      layout:{background:{type:ColorType.Solid,color:'#08131f'},textColor:'#7890a5',fontFamily:'Inter, sans-serif',fontSize:11},
      grid:{vertLines:{color:'rgba(54,82,105,.28)'},horzLines:{color:'rgba(54,82,105,.28)'}},
      rightPriceScale:{borderColor:'#1d3448',scaleMargins:{top:.08,bottom:volume?.22:.08}},
      timeScale:{borderColor:'#1d3448',timeVisible:true,secondsVisible:false},
      crosshair:{mode:CrosshairMode.Normal,vertLine:{color:'#7890a5',style:2},horzLine:{color:'#7890a5',style:2}}
    });
    const candles=chart.addSeries(CandlestickSeries,{upColor:'#16c7a0',downColor:'#f05b78',borderUpColor:'#16c7a0',borderDownColor:'#f05b78',wickUpColor:'#16c7a0',wickDownColor:'#f05b78'});
    const vols=chart.addSeries(HistogramSeries,{priceScaleId:'volume',priceFormat:{type:'volume'},lastValueVisible:false,priceLineVisible:false});
    chart.priceScale('volume').applyOptions({scaleMargins:{top:.82,bottom:0},borderVisible:false});
    const average=chart.addSeries(LineSeries,{color:'#d9b36c',lineWidth:2,priceLineVisible:false,lastValueVisible:false});
    candleRef.current=candles;volumeRef.current=vols;maRef.current=average;chartRef.current=chart;
    const observer=new ResizeObserver(entries=>{const box=entries[0]?.contentRect;if(box)chart.applyOptions({width:Math.max(320,Math.floor(box.width)),height:Math.max(220,Math.floor(box.height))})});
    observer.observe(host.current);
    const redraw=()=>Tick(v=>v+1);
    chart.timeScale().subscribeVisibleLogicalRangeChange(redraw);
    return()=>{observer.disconnect();chart.timeScale().unsubscribeVisibleLogicalRangeChange(redraw);chart.remove();chartRef.current=null};
  },[]);
  useEffect(()=>{
    if(!candleRef.current)return;
    candleRef.current.setData(times.map(b=>({time:b.time,open:b.open,high:b.high,low:b.low,close:b.close})));
    volumeRef.current.setData(volume?times.map(b=>({time:b.time,value:b.volume,color:b.close>=b.open?'rgba(22,199,160,.38)':'rgba(240,91,120,.38)'})):[]);
    const points=times.map((b,i)=>i>=8?({time:b.time,value:times.slice(i-8,i+1).reduce((sum,v)=>sum+v.close,0)/9}):null).filter(Boolean);
    maRef.current.setData(ma?points:[]);
    chartRef.current?.timeScale().fitContent();
  },[times,volume,ma]);
  const pointFromEvent=e=>{
    const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
    const chart=chartRef.current,series=candleRef.current;
    if(!chart||!series)return null;
    const time=chart.timeScale().coordinateToTime(x),price=series.coordinateToPrice(y);
    if(time==null||!Number.isFinite(price))return null;
    return {time:typeof time==='number'?time:Math.floor(Date.UTC(time.year,time.month-1,time.day)/1000),price};
  };
  const xyFor=p=>{
    const chart=chartRef.current,series=candleRef.current;if(!chart||!series)return null;
    const x=chart.timeScale().timeToCoordinate(p.time),y=series.priceToCoordinate(p.price);
    return x==null||y==null?null:{x,y};
  };
  const begin=e=>{
    const p=pointFromEvent(e);if(!p)return;
    if(tool==='cursor'){
      const hit=[...drawings].reverse().find(d=>{const a=xyFor({time:d.t1,price:d.p1}),b=xyFor({time:d.t2,price:d.p2});if(!a||!b)return false;const x=e.clientX-e.currentTarget.getBoundingClientRect().left,y=e.clientY-e.currentTarget.getBoundingClientRect().top;const minX=Math.min(a.x,b.x)-9,maxX=Math.max(a.x,b.x)+9,minY=Math.min(a.y,b.y)-9,maxY=Math.max(a.y,b.y)+9;return x>=minX&&x<=maxX&&y>=minY&&y<=maxY});
      if(hit){onSelect(hit.id);Drag({id:hit.id,start:p,original:hit});e.currentTarget.setPointerCapture(e.pointerId)}else onSelect(null);
      return;
    }
    if(tool==='crosshair')return;
    D({a:p,b:p,points:[p]});e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move=e=>{
    const p=pointFromEvent(e);if(!p)return;
    if(draft)D(v=>({...v,b:p,points:tool==='brush'?[...v.points,p]:v.points}));
    if(drag){const dt=p.time-drag.start.time,dp=p.price-drag.start.price;onMove(drag.id,{...drag.original,t1:drag.original.t1+dt,t2:drag.original.t2+dt,p1:drag.original.p1+dp,p2:drag.original.p2+dp,points:drag.original.points?.map(q=>({time:q.time+dt,price:q.price+dp}))})}
  };
  const finish=e=>{
    if(draft){const p=pointFromEvent(e)||draft.b;const tiny=Math.abs(p.time-draft.a.time)<interval/3&&Math.abs(p.price-draft.a.price)<basePrice*.00001;
      const end=tool==='horizontal'?{...draft.a,time:p.time}:p;
      if(tool==='text'){const text=window.prompt('Enter chart note:','Note');if(text?.trim())onDraw({id:Date.now()+Math.random(),type:tool,t1:draft.a.time,t2:end.time,p1:draft.a.price,p2:end.price,color:'#35c9dc',text:text.trim()})}
      else if(!tiny||tool==='horizontal')onDraw({id:Date.now()+Math.random(),type:tool,t1:draft.a.time,t2:end.time,p1:draft.a.price,p2:end.price,points:tool==='brush'?draft.points:undefined,color:'#35c9dc',text:''});
      D(null);
    }
    if(drag){Drag(null)}
  };
  const renderShape=d=>{
    const a=xyFor({time:d.t1,price:d.p1}),b=xyFor({time:d.t2,price:d.p2});if(!a||!b)return null;
    const props={stroke:d.color||'#35c9dc',strokeWidth:d.width||(selected===d.id?2.5:1.5),strokeOpacity:d.opacity??1,vectorEffect:'non-scaling-stroke'};
    if(d.type==='horizontal')return <line key={d.id} {...props} x1="0" x2="100%" y1={a.y} y2={a.y}/>;
    if(d.type==='rectangle')return <rect key={d.id} {...props} x={Math.min(a.x,b.x)} y={Math.min(a.y,b.y)} width={Math.max(2,Math.abs(b.x-a.x))} height={Math.max(2,Math.abs(b.y-a.y))} fill={d.color} fillOpacity=".08"/>;
    if(d.type==='text')return <g key={d.id}><circle cx={a.x} cy={a.y} r="3" fill={d.color}/><text x={a.x+7} y={a.y-7} fill={d.color} fontSize="12">{d.text}</text></g>;
    if(d.type==='brush'&&d.points?.length>1){const pts=d.points.map(q=>xyFor(q)).filter(Boolean);return <polyline key={d.id} {...props} fill="none" strokeLinecap="round" strokeLinejoin="round" points={pts.map(q=>q.x+','+q.y).join(' ')}/>;}
    if(d.type==='channel'){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,offset=Math.max(12,Math.min(90,Math.abs(dx)*.12)),ox=-dy/len*offset,oy=dx/len*offset;return <g key={d.id}><line {...props} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/><line {...props} x1={a.x+ox} y1={a.y+oy} x2={b.x+ox} y2={b.y+oy}/><line {...props} x1={a.x} y1={a.y} x2={a.x+ox} y2={a.y+oy}/></g>}
    return <line key={d.id} {...props} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>;
  };
  const plotWidth=chartRef.current?.timeScale().width?.()||host.current?.clientWidth||0;
  return <div className="chart-canvas"><div ref={host} className="chart-engine"/><svg className={'drawing-overlay '+(tool==='cursor'?'selection-tool':tool==='crosshair'?'cursor-tool':'drawing-tool')} style={{width:plotWidth||'100%'}} onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
    {drawings.map(renderShape)}
    {draft&&(()=>{const a=xyFor(draft.a),b=xyFor(draft.b);return a&&b?<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#35c9dc" strokeDasharray="4 3"/>:null})()}
  </svg><div className="chart-watermark">{symbol}<span> · </span>{tf}</div><div className="chart-ohlc">Professional chart engine · {count} bars</div></div>
}
export default function App(){
const prefs=load(STORE,{}),[symbol,S]=useState(prefs.symbol||'BTCUSDT'),[tf,T]=useState(prefs.tf||'15m'),[tool,Tool]=useState('cursor'),[watch,W]=useState(prefs.watch??true),[watchHidden,WH]=useState(false),[inspector,I]=useState(prefs.inspector??true),[floating,F]=useState(false),[search,Q]=useState(''),[volume,V]=useState(prefs.volume??true),[ma,MA]=useState(false),[tab,Tab]=useState('Object tree'),[layout,Layout]=useState(1),[count,C]=useState(150),[replay,R]=useState(false),[playing,P]=useState(false),[selected,Select]=useState(null),[notice,N]=useState('Workspace ready'),[drawings,D]=useState(()=>load('mono.drawings.'+(prefs.symbol||'BTCUSDT'),[])),[undoStack,UndoStack]=useState([]),[redoStack,RedoStack]=useState([]);
const instrument=SYMBOLS.find(s=>s.symbol===symbol)||SYMBOLS[0],filtered=SYMBOLS.filter(s=>(s.symbol+s.name).toLowerCase().includes(search.toLowerCase()));
useEffect(()=>{const workspace={symbol,tf,watch,inspector,volume};localStorage.setItem(STORE,JSON.stringify(workspace));writeLocalRecord('workspace',workspace).catch(()=>N('Workspace saved to browser fallback'));},[symbol,tf,watch,inspector,volume]);useEffect(()=>{const key='mono.drawings.'+symbol;localStorage.setItem(key,JSON.stringify(drawings));writeLocalRecord('drawings:'+symbol,drawings).catch(()=>N('Drawings saved to browser fallback'));},[symbol,drawings]);useEffect(()=>{let active=true;const key='mono.drawings.'+symbol;if(localStorage.getItem(key)===null)readLocalRecord('drawings:'+symbol).then(value=>{if(active&&Array.isArray(value))D(value)}).catch(()=>N('Local drawing database unavailable; browser storage remains active'));return()=>{active=false}},[symbol]);useEffect(()=>{if(!playing)return;let id=setInterval(()=>C(n=>n>=150?(P(false),150):n+1),400);return()=>clearInterval(id)},[playing]);
const commitDrawings=next=>{UndoStack(h=>[...h,drawings].slice(-100));RedoStack([]);D(next)},changeSymbol=s=>{S(s);D(load('mono.drawings.'+s,[]));UndoStack([]);RedoStack([]);Select(null);N(s+' loaded')},addDrawing=d=>{commitDrawings([...drawings,d]);Select(d.id);N('Drawing saved locally')},moveDrawing=(id,d)=>{const next=drawings.map(x=>x.id===id?d:x);if(JSON.stringify(next)!==JSON.stringify(drawings))commitDrawings(next)},updateDrawing=(id,patch)=>commitDrawings(drawings.map(x=>x.id===id?{...x,...patch}:x)),del=()=>{if(selected!=null)commitDrawings(drawings.filter(d=>d.id!==selected));Select(null);N('Drawing deleted')},undo=()=>{if(!undoStack.length)return;RedoStack(h=>[...h,drawings]);D(undoStack.at(-1));UndoStack(h=>h.slice(0,-1));N('Undo')},redo=()=>{if(!redoStack.length)return;UndoStack(h=>[...h,drawings]);D(redoStack.at(-1));RedoStack(h=>h.slice(0,-1));N('Redo')};
const exportData=()=>{let b=new Blob([JSON.stringify({version:1,symbol,tf,drawings,volume,ma},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='mono-workspace.json';a.click();URL.revokeObjectURL(u)};
return <main className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark">M</span> MONO <small>BETA</small></div><i className="divider"/><button className="symbol-select">◈ <b>{symbol}</b><ChevronDown/></button><div className="market-meta"><b>{fmt(instrument.price,instrument.precision)}</b><span className={instrument.change>=0?'positive':'negative'}>{instrument.change>0?'+':''}{instrument.change.toFixed(2)}%</span></div><div className="spacer"/><button className="icon-button" onClick={exportData} title="Export workspace"><Download/></button><button className="icon-button"><Bell/></button><button className="icon-button" onClick={()=>N('Workspace saved locally')}><Bookmark/></button><div className="avatar">M</div></header>
<div className="workspace"><nav className="icon-rail"><button className="rail-active" onClick={()=>W(!watch)} title="Watchlist"><Layers/></button><button title="Charts"><CandlestickChart/></button><button title="Toggle moving average" onClick={()=>MA(!ma)}><Activity/></button><button title="Workspace"><LayoutDashboard/></button><div className="spacer"/><button><CircleHelp/></button><button onClick={()=>I(!inspector)}><Settings2/></button></nav>
{watch&&!watchHidden&&<aside className="watchlist-panel"><div className="panel-heading">WATCHLIST <span><button className="tiny-icon" onClick={()=>WH(true)} title="Hide watchlist"><ChevronLeft/></button><MoreHorizontal/></span></div><button className="watchlist-picker">Main watchlist <ChevronDown/></button><div className="search-box"><Search/><input value={search} onChange={e=>Q(e.target.value)} placeholder="Search instruments"/></div><div className="watchlist-label">SYMBOL <span>LAST / CHANGE</span></div><div className="symbol-list">{filtered.map(s=><button key={s.symbol} className={'symbol-row '+(s.symbol===symbol?'active':'')} onClick={()=>changeSymbol(s.symbol)}><span><b>{s.symbol}</b><small>{s.name}</small></span><span className="symbol-values"><b>{fmt(s.price,s.precision)}</b><small className={s.change>=0?'positive':'negative'}>{s.change>0?'+':''}{s.change.toFixed(2)}%</small></span></button>)}</div><button className="add-symbol"><Plus/> Add symbol</button></aside>}
{(!watch||watchHidden)&&<button className="restore-watch" onClick={()=>{W(true);WH(false)}} title="Show watchlist"><ChevronRight/></button>}
<section className="center-stage"><div className="chart-topline"><div className="chart-tabs"><button className="chart-tab active">Workspace 1 <X/></button><button className="tiny-icon"><Plus/></button></div><div className="chart-actions"><button className="subtle-button" onClick={()=>Layout(layout===1?2:layout===2?4:1)}><Grid2X2/> Layout {layout}×</button><button className="subtle-button" onClick={()=>MA(!ma)}><Activity/> Indicators</button><button className="subtle-button" onClick={()=>I(!inspector)}>{inspector?<PanelRightClose/>:<PanelRightOpen/>} Inspector</button></div></div>
<div className="controlbar"><div className="timeframes">{TFS.map(t=><button key={t} className={tf===t?'time-active':''} onClick={()=>T(t)}>{t}</button>)}</div><i className="divider"/><button className="control-item"><CandlestickChart/><ChevronDown/></button><button className="control-item" onClick={()=>MA(!ma)}><Plus/> Indicator</button><div className="spacer"/><button className={'control-item '+(volume?'control-selected':'')} onClick={()=>V(!volume)}><Activity/> Volume</button><button className="control-item"><ZoomOut/></button><button className="control-item"><ZoomIn/></button><button className="control-item"><Maximize2/></button></div>
<div className={'chart-layout layout-'+layout}><div className="drawing-rail">{TOOLS.map(([id,Icon,label])=><button key={id} title={label} className={tool===id?'drawing-active':''} onClick={()=>Tool(id)}><Icon/></button>)}<i/><button title="Undo" disabled={!undoStack.length} onClick={undo}><Undo2/></button><button title="Redo" disabled={!redoStack.length} onClick={redo}><RotateCcw/></button><button title="Delete selected drawing" onClick={del}><Trash2/></button><button title="Clear selection" onClick={()=>Select(null)}><MousePointer2/></button></div><div className="chart-column"><div className="instrument-line"><b>{symbol}</b><span> · Perpetual · Simulated feed</span><small>{ma?'MA 9 ON':''}</small></div><Chart symbol={symbol} basePrice={instrument.price} tf={tf} tool={tool} drawings={drawings} onDraw={addDrawing} onMove={moveDrawing} volume={volume} ma={ma} count={count} selected={selected} onSelect={Select}/><div className="chart-footer"><span>Range: <b>All</b></span><span>Timezone: UTC</span><div className="spacer"/><span className="feed-status">● Simulated data</span></div></div>{layout>1&&<div className="layout-placeholder"><CandlestickChart/><b>{layout===2?'Second chart workspace':'Additional chart workspaces'}</b><span>Choose a symbol to configure this chart in the next workspace update.</span></div>}</div>
<div className="replay-bar"><button className={replay?'replay-active':''} onClick={()=>{R(!replay);P(false);C(replay?150:20)}}><Clock3/> Bar replay</button>{replay&&<><button onClick={()=>P(!playing)}>{playing?<Pause/>:<Play/>}</button><button onClick={()=>{C(20);P(false)}}><RotateCcw/></button><input type="range" min="20" max="150" value={count} onChange={e=>C(+e.target.value)}/><span>{count}/150 bars</span></>}</div>
<footer className="bottom-status"><span>MONO WORKSPACE</span><div className="spacer"/><span className="saved"><Check/> {notice}</span><span>· Local session</span></footer></section>
{inspector&&<aside className={'inspector-panel '+(floating?'floating-inspector':'')}><div className="inspector-heading">INSPECTOR <span><button className="tiny-icon" onClick={()=>F(!floating)} title="Float panel"><Maximize2/></button><button className="tiny-icon" onClick={()=>I(false)} title="Hide panel"><X/></button></span></div><div className="inspector-tabs">{['Object tree','Properties','Alerts'].map(t=><button key={t} className={tab===t?'inspector-tab-active':''} onClick={()=>Tab(t)}>{t}</button>)}</div>{tab==='Object tree'?<div className="object-tree"><p><ChevronDown/> <CandlestickChart/> {symbol} · {tf}</p><p className="tree-child"><Eye/> Candles</p>{volume&&<p className="tree-child"><Eye/> Volume</p>}{ma&&<p className="tree-child"><Eye/> Moving average 9</p>}<p className="tree-child"><Eye/> Drawings <span>{drawings.length}</span></p>{drawings.map(d=><button className="tree-child" key={d.id} onClick={()=>Select(d.id)}>{d.type} {selected===d.id?'•':''}</button>)}</div>:tab==='Properties'?<div className="properties"><label>CHART APPEARANCE</label><p>Background <b>#08131F</b></p><p>Grid opacity <b>18%</b></p><p>Crosshair <b>Cross</b></p><label>SELECTED DRAWING</label>{selected&&drawings.some(d=>d.id===selected)?<><label>COLOR</label><input type="color" value={drawings.find(d=>d.id===selected)?.color||"#35c9dc"} onChange={e=>updateDrawing(selected,{color:e.target.value})}/><label>LINE WIDTH</label><select value={drawings.find(d=>d.id===selected)?.width||1.5} onChange={e=>updateDrawing(selected,{width:Number(e.target.value)})}><option value="1">1 px</option><option value="1.5">1.5 px</option><option value="2">2 px</option><option value="3">3 px</option><option value="4">4 px</option></select><label>OPACITY</label><input type="range" min="0.1" max="1" step="0.05" value={drawings.find(d=>d.id===selected)?.opacity??1} onChange={e=>updateDrawing(selected,{opacity:Number(e.target.value)})}/><button className="delete-object" onClick={del}><Trash2/> Delete drawing</button></>:<small>Select a drawing in the object tree to inspect its properties.</small>}</div>:<p className="empty-state">No alerts configured. Alerts require a live market-data source.</p>}<div className="inspector-bottom"><button onClick={()=>I(false)}><PanelRightClose/> Collapse panel</button></div></aside>}
{!inspector&&<button className="restore-inspector" onClick={()=>I(true)} title="Show inspector"><PanelRightOpen/></button>}</div></main>}
