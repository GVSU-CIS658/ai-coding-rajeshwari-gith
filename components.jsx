
const { useState, useEffect, useRef, useMemo } = React;

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ data, positive, width = 100, height = 36 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const color = positive ? '#00c896' : '#ff4560';
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  const gId = `sg${positive ? 'g' : 'r'}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'hidden', display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${gId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── FullChart ──────────────────────────────────────────────── */
function FullChart({ data, positive }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [svgW, setSvgW] = useState(700);
  const wrapRef = useRef(null);
  const color = positive ? '#00c896' : '#ff4560';

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setSvgW(Math.floor(entries[0].contentRect.width));
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  if (!data || data.length < 2) return null;
  const H_SVG = 240, PAD = { t: 12, r: 16, b: 32, l: 64 };
  const W = svgW - PAD.l - PAD.r, H = H_SVG - PAD.t - PAD.b;
  const min = Math.min(...data) * 0.997, max = Math.max(...data) * 1.003;
  const range = max - min || 1;
  const toX = i => (i / (data.length - 1)) * W;
  const toY = v => H - ((v - min) / range) * H;
  const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const fillPts = `0,${H} ${pts} ${W},${H}`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * range);
  const xIdxs  = [0, Math.floor(data.length * .25), Math.floor(data.length * .5), Math.floor(data.length * .75), data.length - 1];

  const onMove = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - PAD.l;
    setHoverIdx(Math.max(0, Math.min(data.length - 1, Math.round((x / W) * (data.length - 1)))));
  };

  const hx = hoverIdx !== null ? toX(hoverIdx) : null;
  const hy = hoverIdx !== null ? toY(data[hoverIdx]) : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {hoverIdx !== null && (
        <div style={{
          position: 'absolute', top: PAD.t + hy - 42,
          left: PAD.l + hx + (hoverIdx > data.length * .65 ? -116 : 10),
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '5px 12px', fontSize: 12,
          pointerEvents: 'none', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color }}>${data[hoverIdx]?.toFixed(2)}</div>
          <div style={{ color: 'var(--muted)', fontSize: 10 }}>Day {hoverIdx + 1}</div>
        </div>
      )}
      <svg width={svgW} height={H_SVG} viewBox={`0 0 ${svgW} ${H_SVG}`}
        onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)}
        style={{ cursor: 'crosshair', display: 'block' }}
      >
        <defs>
          <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${PAD.l},${PAD.t})`}>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke="var(--border)" strokeWidth="0.5" />
              <text x={-8} y={toY(v)+4} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--mono)">
                ${v >= 1000 ? v.toFixed(0) : v.toFixed(2)}
              </text>
            </g>
          ))}
          <polygon points={fillPts} fill="url(#fcGrad)" />
          <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {hoverIdx !== null && <>
            <line x1={hx} y1={0} x2={hx} y2={H} stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity={0.5} />
            <circle cx={hx} cy={hy} r={4} fill={color} stroke="var(--bg)" strokeWidth="2" />
          </>}
          {xIdxs.map((idx, i) => (
            <text key={i} x={toX(idx)} y={H+18} textAnchor="middle" fontSize={10} fill="var(--muted)">D{idx+1}</text>
          ))}
          <line x1={0} y1={H} x2={W} y2={H} stroke="var(--border)" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}

/* ── VolumeChart ────────────────────────────────────────────── */
function VolumeChart({ priceData, symbol }) {
  const wrapRef = useRef(null);
  const [svgW, setSvgW] = useState(600);
  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setSvgW(Math.floor(entries[0].contentRect.width));
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  let s = Math.abs(symbol.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 99)) % 2147483647 || 1;
  const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const vols = priceData.map((p, i) => {
    const chg = i > 0 ? Math.abs((p - priceData[i - 1]) / priceData[i - 1]) : 0.01;
    return 0.3 + chg * 35 + rng() * 0.7;
  });
  const maxV = Math.max(...vols);
  const H = 52, PL = 64, PR = 16, PT = 6;
  const W = svgW - PL - PR;
  const bw = Math.max(1.5, W / vols.length * 0.68);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <div style={{ fontSize: 9, color: 'var(--muted)', padding: '8px 0 2px 64px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Volume</div>
      <svg width={svgW} height={H + PT + 4} style={{ display: 'block' }}>
        <g transform={`translate(${PL},${PT})`}>
          {vols.map((v, i) => {
            const bh = (v / maxV) * H;
            const x = (i / (vols.length - 1)) * W;
            const isUp = i > 0 && priceData[i] >= priceData[i - 1];
            return <rect key={i} x={x - bw / 2} y={H - bh} width={bw} height={bh}
              fill={isUp ? 'var(--green)' : 'var(--red)'} opacity={0.4} rx={1} />;
          })}
          <line x1={0} y1={H} x2={W} y2={H} stroke="var(--border)" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}

/* ── TickerTape ─────────────────────────────────────────────── */
function TickerTape({ stocks }) {
  const triple = [...stocks, ...stocks, ...stocks];
  return (
    <div style={{
      overflow: 'hidden', background: 'var(--surface)',
      borderBottom: '1px solid var(--border)', height: 28,
      display: 'flex', alignItems: 'center', flexShrink: 0,
    }}>
      <div className="ticker-inner">
        {triple.map((s, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em' }}>{s.symbol}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', margin: '0 5px' }}>${s.price.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: s.pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {s.pct >= 0 ? '▲' : '▼'}{Math.abs(s.pct).toFixed(2)}%
            </span>
            <span style={{ color: 'var(--border)', margin: '0 14px', fontSize: 13 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── HeatMap ─────────────────────────────────────────────────── */
function HeatMap({ stocks, onSelectStock }) {
  const bg = pct => {
    if (pct >=  3.0) return '#006644';
    if (pct >=  1.5) return '#005538';
    if (pct >=  0.5) return '#00442c';
    if (pct >=  0.0) return '#003322';
    if (pct >= -0.5) return '#3d1020';
    if (pct >= -1.5) return '#5a1828';
    if (pct >= -3.0) return '#7a2030';
    return '#992838';
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 5 }}>
      {stocks.map(s => (
        <div key={s.symbol} className="heat-cell" onClick={() => onSelectStock(s.symbol)}
          style={{
            background: bg(s.pct), borderRadius: 8, padding: '10px 6px',
            cursor: 'pointer', textAlign: 'center', minHeight: 74,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3,
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: '0.04em' }}>{s.symbol}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>${s.price.toFixed(0)}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: s.pct >= 0 ? '#7dffc8' : '#ffb3b3' }}>
            {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
          </div>
          <SectorBadge sector={s.sector} small />
        </div>
      ))}
    </div>
  );
}

/* ── DonutChart ──────────────────────────────────────────────── */
function DonutChart({ rows, totalValue }) {
  const [hov, setHov] = useState(null);
  const CX = 88, CY = 88, RO = 74, RI = 48;
  const COLORS = ['#818cf8','#c084fc','#34d399','#fb923c','#f87171','#60a5fa','#fbbf24','#4ade80','#e879f9','#22d3ee'];
  const GAP = 0.032;

  let angle = -Math.PI / 2;
  const slices = rows.map((r, i) => {
    const pct = r.value / totalValue;
    const span = pct * 2 * Math.PI;
    const s = angle + GAP / 2;
    const e = angle + span - GAP / 2;
    angle += span;
    return { ...r, pct, s, e, color: COLORS[i % COLORS.length] };
  });

  const arc = (s, e, Ro, Ri) => {
    if (e <= s) return '';
    const C = Math.cos, S = Math.sin;
    const x1=CX+Ro*C(s),y1=CY+Ro*S(s),x2=CX+Ro*C(e),y2=CY+Ro*S(e);
    const x3=CX+Ri*C(e),y3=CY+Ri*S(e),x4=CX+Ri*C(s),y4=CY+Ri*S(s);
    const lg = e - s > Math.PI ? 1 : 0;
    return `M${x1} ${y1} A${Ro} ${Ro} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${Ri} ${Ri} 0 ${lg} 0 ${x4} ${y4}Z`;
  };

  const active = hov !== null ? slices[hov] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={176} height={176} viewBox="0 0 176 176" style={{ flexShrink: 0 }}>
        <defs>
          {slices.map((sl, i) => (
            <filter key={i} id={`glow-${i}`}>
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          ))}
        </defs>
        {slices.map((sl, i) => (
          <path key={i}
            d={arc(sl.s, sl.e, hov === i ? RO + 6 : RO, RI)}
            fill={sl.color}
            opacity={hov === null || hov === i ? 1 : 0.3}
            filter={hov === i ? `url(#glow-${i})` : 'none'}
            style={{ transition: 'all 0.15s', cursor: 'pointer' }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          />
        ))}
        {active ? (
          <>
            <text x={CX} y={CY-6} textAnchor="middle" fontSize={13} fontWeight={800} fill={active.color} fontFamily="var(--mono)">{active.symbol}</text>
            <text x={CX} y={CY+12} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)" fontFamily="var(--mono)">{(active.pct*100).toFixed(1)}%</text>
            <text x={CX} y={CY+26} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--mono)">${active.value?.toFixed(0)}</text>
          </>
        ) : (
          <>
            <text x={CX} y={CY-4} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--sans)">Portfolio</text>
            <text x={CX} y={CY+14} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--text)" fontFamily="var(--mono)">
              ${(totalValue/1000).toFixed(1)}K
            </text>
          </>
        )}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 22px' }}>
        {slices.map((sl, i) => (
          <div key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              opacity: hov === null || hov === i ? 1 : 0.35, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
          >
            <div style={{ width: 9, height: 9, borderRadius: 3, background: sl.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{sl.symbol}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{(sl.pct*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── RangeBar52W ─────────────────────────────────────────────── */
function RangeBar52W({ low, high, current }) {
  const pct = Math.max(0, Math.min(100, (current - low) / (high - low) * 100));
  return (
    <div style={{ padding: '12px 0 4px' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>52-Week Range</div>
      <div style={{ position: 'relative', height: 5, background: 'linear-gradient(90deg, var(--red) 0%, var(--border) 45%, var(--border) 55%, var(--green) 100%)', borderRadius: 3 }}>
        <div style={{
          position: 'absolute', top: '50%', left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: 13, height: 13, borderRadius: '50%',
          background: 'var(--accent)', border: '2.5px solid var(--bg)',
          boxShadow: '0 0 8px var(--accent)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontFamily: 'var(--mono)', fontSize: 11 }}>
        <span style={{ color: 'var(--red)' }}>${low.toFixed(2)}</span>
        <span style={{ color: 'var(--muted)', fontSize: 10 }}>{pct.toFixed(0)}th percentile</span>
        <span style={{ color: 'var(--green)' }}>${high.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ── MomentumGauge ───────────────────────────────────────────── */
function MomentumGauge({ value }) {
  // value 0–100; needle sweeps a 180° arc
  const RAD = (value / 100) * Math.PI; // 0 = left, π = right
  const R = 54, CX = 68, CY = 68;
  const nx = CX + R * Math.cos(Math.PI - RAD);
  const ny = CY - R * Math.sin(RAD);

  // Colored arc segments (left=red, mid=yellow, right=green)
  const arcSeg = (a1, a2, color) => {
    const x1=CX+R*Math.cos(Math.PI-a1*Math.PI),y1=CY-R*Math.sin(a1*Math.PI);
    const x2=CX+R*Math.cos(Math.PI-a2*Math.PI),y2=CY-R*Math.sin(a2*Math.PI);
    return <path key={color} d={`M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="butt" opacity="0.75"/>;
  };

  const label = value < 25 ? 'Strong Sell' : value < 45 ? 'Sell' : value < 55 ? 'Neutral' : value < 75 ? 'Buy' : 'Strong Buy';
  const lcolor = value < 25 ? 'var(--red)' : value < 45 ? '#fb923c' : 'var(--muted)' ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Momentum</div>
      <svg width={136} height={80} viewBox="0 0 136 80">
        {arcSeg(0, 0.33, '#992838')}
        {arcSeg(0.33, 0.66, '#c97c30')}
        {arcSeg(0.66, 1.0, '#006644')}
        {/* Tick marks */}
        {[0,0.25,0.5,0.75,1].map(t => {
          const a = Math.PI - t * Math.PI;
          return <line key={t} x1={CX+(R-7)*Math.cos(a)} y1={CY-(R-7)*Math.sin(a)} x2={CX+(R+3)*Math.cos(a)} y2={CY-(R+3)*Math.sin(a)} stroke="var(--bg)" strokeWidth="1.5"/>;
        })}
        {/* Needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={CX} cy={CY} r="5" fill="var(--text)"/>
        <circle cx={CX} cy={CY} r="2.5" fill="var(--bg)"/>
        <text x={CX} y={78} textAnchor="middle" fontSize={11} fontWeight={700} fill={value >= 55 ? 'var(--green)' : value <= 45 ? 'var(--red)' : 'var(--muted)'} fontFamily="var(--sans)">{label}</text>
      </svg>
    </div>
  );
}

/* ── SectorBadge ────────────────────────────────────────────── */
function SectorBadge({ sector, small }) {
  const palette = {
    Technology:'#818cf8', Semiconductors:'#c084fc', Finance:'#34d399',
    Consumer:'#fb923c', Automotive:'#f87171', Entertainment:'#60a5fa',
    Retail:'#fbbf24', Healthcare:'#4ade80',
  };
  const c = palette[sector] || '#8892a4';
  return (
    <span style={{
      fontSize: small ? 9 : 10, fontWeight: 600, letterSpacing: '0.06em',
      padding: small ? '1px 6px' : '2px 8px', borderRadius: 100,
      textTransform: 'uppercase', background: c + '20',
      color: c, border: `1px solid ${c}40`, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{sector}</span>
  );
}

/* ── StockCard ──────────────────────────────────────────────── */
function StockCard({ stock, onClick, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const hist = useMemo(() => {
    const full = window.APP_DATA.genHistory(stock.symbol, stock.price);
    return full.slice(-30);
  }, [stock.symbol, stock.price]);
  const isPos = stock.pct >= 0;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)', border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative',
        boxShadow: hovered ? '0 0 0 1px var(--accent)20, 0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(stock.symbol); }}
          style={{
            position: 'absolute', top: 8, right: 8, background: 'none',
            border: 'none', color: 'var(--muted)', cursor: 'pointer',
            fontSize: 13, lineHeight: 1, padding: '3px 5px', borderRadius: 4,
            opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
          }}
        >✕</button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>{stock.symbol}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{stock.name}</div>
        </div>
        <SectorBadge sector={stock.sector} small />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700 }}>${stock.price.toFixed(2)}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isPos ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
            {isPos ? '+' : ''}{stock.change.toFixed(2)} ({isPos ? '+' : ''}{stock.pct.toFixed(2)}%)
          </div>
        </div>
        <Sparkline data={hist} positive={isPos} width={88} height={34} />
      </div>
    </div>
  );
}

/* ── Nav icon SVGs ──────────────────────────────────────────── */
function IconDashboard() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7"/></svg>; }
function IconStar() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.8 3.6 4 .58-2.9 2.82.68 3.98L8 10.35l-3.58 1.88.68-3.98L2.2 5.68l4-.58L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function IconBriefcase() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 5V4a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.4"/><line x1="1" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.4"/></svg>; }
function IconBell() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5A4.5 4.5 0 003.5 6v4l-1 1.5h11L12.5 10V6A4.5 4.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/></svg>; }
function IconSettings() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function IconSearch() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function IconMoon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 8.5A5.5 5.5 0 015.5 2.5a5.5 5.5 0 100 9 5.5 5.5 0 006-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>; }
function IconSun() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function IconPlus() { return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function IconTrending() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 11L5.5 6l3 3L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 4H13v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconFire() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1c0 3-3 4-3 7a3 3 0 006 0c0-2-1-3-1-5-1 1-1 2-2 2 0-2 0-3 0-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>; }

Object.assign(window, {
  Sparkline, FullChart, VolumeChart, TickerTape, HeatMap,
  DonutChart, RangeBar52W, MomentumGauge,
  SectorBadge, StockCard,
  IconDashboard, IconStar, IconBriefcase, IconBell, IconSettings,
  IconSearch, IconMoon, IconSun, IconPlus, IconTrending, IconFire,
});
