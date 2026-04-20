
const { useState, useMemo } = React;

/* ══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════════ */
function DashboardPage({ stocks, onSelectStock }) {
  const { indices, news } = window.APP_DATA;
  const sorted  = [...stocks].sort((a, b) => b.pct - a.pct);
  const gainers = sorted.slice(0, 5);
  const losers  = sorted.slice(-5).reverse();

  const IndexCard = ({ idx }) => {
    const isPos = idx.pct >= 0;
    const hist  = useMemo(() => {
      const full = window.APP_DATA.genHistory(idx.symbol, idx.price, 30);
      return full.slice(-20);
    }, [idx.symbol]);
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.4 }}>
          <Sparkline data={hist} positive={isPos} width={80} height={36} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{idx.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
          {idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: isPos ? 'var(--green)' : 'var(--red)' }}>
          {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{idx.change.toFixed(2)} ({isPos ? '+' : ''}{idx.pct.toFixed(2)}%)
        </div>
      </div>
    );
  };

  const MoverRow = ({ stock, rank }) => {
    const isPos = stock.pct >= 0;
    return (
      <div onClick={() => onSelectStock(stock.symbol)}
        style={{ display: 'grid', gridTemplateColumns: '20px 52px 1fr auto', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>{rank}</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{stock.symbol}</span>
        <span style={{ color: 'var(--muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: isPos ? 'var(--green)' : 'var(--red)', textAlign: 'right', fontWeight: 600 }}>
          {isPos ? '+' : ''}{stock.pct.toFixed(2)}%
        </span>
      </div>
    );
  };

  const sentimentDot = s => s === 'positive' ? 'var(--green)' : s === 'negative' ? 'var(--red)' : 'var(--muted)';

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 3 }}>Market Overview</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>April 20, 2026 · Simulated data · Alpha Vantage ready</div>
      </div>

      {/* Index cards with embedded sparklines */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {indices.map(idx => <IndexCard key={idx.symbol} idx={idx} />)}
      </div>

      {/* Gainers + Losers + News */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Gainers */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 12px 9px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green)', display: 'flex' }}><IconTrending /></span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Top Gainers</span>
            </div>
            <div style={{ padding: '5px 0' }}>{gainers.map((s, i) => <MoverRow key={s.symbol} stock={s} rank={`#${i+1}`} />)}</div>
          </div>
          {/* Losers */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 12px 9px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--red)', display: 'flex', transform: 'scaleY(-1)' }}><IconTrending /></span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Top Losers</span>
            </div>
            <div style={{ padding: '5px 0' }}>{losers.map((s, i) => <MoverRow key={s.symbol} stock={s} rank={`#${i+1}`} />)}</div>
          </div>
          {/* Sector perf */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Sector Performance</div>
            <SectorPerf stocks={stocks} />
          </div>
        </div>

        {/* News */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 9px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)', display: 'flex' }}><IconFire /></span>
            Market News
          </div>
          <div style={{ padding: '4px 0' }}>
            {news.map(item => (
              <div key={item.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'default', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: sentimentDot(item.sentiment), flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 5, textWrap: 'pretty' }}>{item.headline}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{item.source}</span>
                      {item.symbol && (
                        <span onClick={() => onSelectStock(item.symbol)}
                          style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}
                        >{item.symbol}</span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{item.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Heat Map — full width */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Market Heat Map</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#992838', display: 'inline-block' }} />Bearish
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#003322', display: 'inline-block' }} />Neutral
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#006644', display: 'inline-block' }} />Bullish
            </span>
          </div>
        </div>
        <HeatMap stocks={stocks} onSelectStock={onSelectStock} />
      </div>
    </div>
  );
}

function SectorPerf({ stocks }) {
  const sectors = {};
  stocks.forEach(s => { sectors[s.sector] = sectors[s.sector] || []; sectors[s.sector].push(s.pct); });
  const data = Object.entries(sectors).map(([name, pcts]) => ({
    name, avg: pcts.reduce((a, b) => a + b, 0) / pcts.length,
  })).sort((a, b) => b.avg - a.avg);
  const maxAbs = Math.max(...data.map(d => Math.abs(d.avg)));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px' }}>
      {data.map(d => (
        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', width: 96, flexShrink: 0 }}>{d.name}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${Math.abs(d.avg) / maxAbs * 100}%`, background: d.avg >= 0 ? 'var(--green)' : 'var(--red)' }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: d.avg >= 0 ? 'var(--green)' : 'var(--red)', width: 52, textAlign: 'right' }}>
            {d.avg >= 0 ? '+' : ''}{d.avg.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WATCHLIST PAGE
══════════════════════════════════════════════════════════════ */
function WatchlistPage({ stocks, watchlist, setWatchlist, onSelectStock }) {
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState('');
  const stockMap = useMemo(() => Object.fromEntries(stocks.map(s => [s.symbol, s])), [stocks]);

  const addStock = () => {
    const sym = query.trim().toUpperCase();
    if (!sym) return;
    if (watchlist.includes(sym)) { setMsg(`${sym} already on watchlist`); setTimeout(() => setMsg(''), 2000); return; }
    if (!stockMap[sym]) { setMsg(`Symbol "${sym}" not found`); setTimeout(() => setMsg(''), 2000); return; }
    setWatchlist([...watchlist, sym]);
    setQuery('');
  };

  const suggestions = query.length > 0
    ? stocks.filter(s => s.symbol.startsWith(query.toUpperCase()) || s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Watchlist</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{watchlist.length} stocks monitored</div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 10, color: 'var(--muted)', display: 'flex' }}><IconSearch /></span>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStock()}
                placeholder="Add ticker…"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '8px 12px 8px 30px', width: 160, outline: 'none' }}
              />
            </div>
            <button onClick={addStock} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconPlus /> Add
            </button>
          </div>
          {suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
              {suggestions.map(s => (
                <div key={s.symbol} onClick={() => setQuery(s.symbol)}
                  style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12 }}>{s.symbol}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {msg && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{msg}</div>}
      {watchlist.length === 0
        ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '80px 0', fontSize: 14 }}>No stocks on watchlist. Add a ticker above.</div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {watchlist.map(sym => stockMap[sym] ? (
              <StockCard key={sym} stock={stockMap[sym]} onClick={() => onSelectStock(sym)}
                onRemove={s => setWatchlist(watchlist.filter(x => x !== s))} />
            ) : null)}
          </div>
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PORTFOLIO PAGE
══════════════════════════════════════════════════════════════ */
function PortfolioPage({ stocks, portfolio, setPortfolio, onSelectStock }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: '', shares: '', avgCost: '' });
  const stockMap = useMemo(() => Object.fromEntries(stocks.map(s => [s.symbol, s])), [stocks]);

  const rows = portfolio.map(h => {
    const s = stockMap[h.symbol]; if (!s) return null;
    const value = s.price * h.shares, cost = h.avgCost * h.shares;
    const gain = value - cost, gainPct = (gain / cost) * 100;
    return { ...h, stock: s, value, cost, gain, gainPct };
  }).filter(Boolean);

  const totalValue = rows.reduce((a, r) => a + r.value, 0);
  const totalCost  = rows.reduce((a, r) => a + r.cost, 0);
  const totalGain  = totalValue - totalCost;
  const totalPct   = totalCost ? (totalGain / totalCost) * 100 : 0;
  const dayChange  = rows.reduce((a, r) => a + r.stock.change * r.shares, 0);

  const addHolding = () => {
    const sym = form.symbol.trim().toUpperCase();
    const sh = parseFloat(form.shares), ac = parseFloat(form.avgCost);
    if (!sym || !sh || !ac || !stockMap[sym]) return;
    const idx = portfolio.findIndex(h => h.symbol === sym);
    if (idx >= 0) {
      const u = [...portfolio]; u[idx] = { symbol: sym, shares: sh, avgCost: ac }; setPortfolio(u);
    } else {
      setPortfolio([...portfolio, { symbol: sym, shares: sh, avgCost: ac }]);
    }
    setForm({ symbol: '', shares: '', avgCost: '' }); setShowAdd(false);
  };

  // Portfolio equity curve
  const equityCurve = useMemo(() => {
    const DAYS = 60;
    const hists = rows.map(r => ({
      hist: window.APP_DATA.genHistory(r.symbol, r.stock.price).slice(-DAYS),
      shares: r.shares,
    }));
    return Array.from({ length: DAYS }, (_, i) =>
      hists.reduce((sum, { hist, shares }) => sum + (hist[i] || 0) * shares, 0)
    );
  }, [portfolio, stocks]);

  const curvePos = equityCurve[equityCurve.length - 1] >= equityCurve[0];
  const isPos = v => v >= 0;

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Portfolio</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlus /> Add Position
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {['Symbol', 'Shares', 'Avg Cost'].map((label, i) => {
            const keys = ['symbol', 'shares', 'avgCost'];
            return (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <input value={form[keys[i]]} onChange={e => setForm({ ...form, [keys[i]]: e.target.value })} placeholder={label}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontFamily: i > 0 ? 'var(--mono)' : 'inherit', fontSize: 13, padding: '7px 12px', width: 140, outline: 'none' }} />
              </div>
            );
          })}
          <button onClick={addHolding} style={{ background: 'var(--green)', border: 'none', color: '#000', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Save</button>
          <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total Value',     value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--text)' },
          { label: 'Total Gain/Loss', value: `${isPos(totalGain) ? '+' : ''}$${Math.abs(totalGain).toFixed(2)}`, color: isPos(totalGain) ? 'var(--green)' : 'var(--red)' },
          { label: 'Total Return',    value: `${isPos(totalPct) ? '+' : ''}${totalPct.toFixed(2)}%`, color: isPos(totalPct) ? 'var(--green)' : 'var(--red)' },
          { label: "Today's Change",  value: `${isPos(dayChange) ? '+' : ''}$${Math.abs(dayChange).toFixed(2)}`, color: isPos(dayChange) ? 'var(--green)' : 'var(--red)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 72px 88px 88px 100px 110px 80px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          {['Symbol','Company','Shares','Avg Cost','Price','Value','Gain/Loss',''].map((h, i) => (
            <span key={i} style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {rows.map(r => (
          <div key={r.symbol}
            style={{ display: 'grid', gridTemplateColumns: '100px 1fr 72px 88px 88px 100px 110px 80px', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s', alignItems: 'center' }}
            onClick={() => onSelectStock(r.symbol)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13 }}>{r.symbol}</div>
              <SectorBadge sector={r.stock.sector} small />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{r.stock.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{r.shares}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>${r.avgCost.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>${r.stock.price.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>${r.value.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: isPos(r.gain) ? 'var(--green)' : 'var(--red)' }}>
              {isPos(r.gain) ? '+' : ''}${Math.abs(r.gain).toFixed(2)}<br/>
              <span style={{ fontSize: 10 }}>({isPos(r.gainPct) ? '+' : ''}{r.gainPct.toFixed(1)}%)</span>
            </div>
            <button onClick={e => { e.stopPropagation(); setPortfolio(portfolio.filter(h => h.symbol !== r.symbol)); }}
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Remove</button>
          </div>
        ))}
      </div>

      {/* Donut + Equity Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, alignItems: 'stretch' }}>
        {/* Donut */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Allocation</div>
          <DonutChart rows={rows.sort((a, b) => b.value - a.value)} totalValue={totalValue} />
        </div>
        {/* Equity curve */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Portfolio Value — 60 Days</div>
          <div style={{ fontSize: 12, color: curvePos ? 'var(--green)' : 'var(--red)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            {curvePos ? '▲' : '▼'} {curvePos ? '+' : ''}${(equityCurve[equityCurve.length-1] - equityCurve[0]).toFixed(2)} overall
          </div>
          <FullChart data={equityCurve} positive={curvePos} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DETAIL PAGE
══════════════════════════════════════════════════════════════ */
function DetailPage({ symbol, stocks, liveHistory, alerts, setAlerts, watchlist, setWatchlist, onBack }) {
  const [range, setRange] = useState('1M');
  const [alertForm, setAlertForm] = useState({ type: 'above', price: '' });
  const stock = stocks.find(s => s.symbol === symbol);

  // Use real API history when available, fall back to generated
  const fullHist = useMemo(() => {
    if (liveHistory && liveHistory.length > 5) return liveHistory;
    return window.APP_DATA.genHistory(symbol, stock?.price || 100);
  }, [symbol, stock?.price, liveHistory]);

  const isLive = liveHistory && liveHistory.length > 5;
  const slices = { '1W': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252 };
  const hist = fullHist.slice(-Math.min(slices[range], fullHist.length));

  const isWatched = watchlist.includes(symbol);
  const stockAlerts = alerts.filter(a => a.symbol === symbol);
  const isPos = stock?.pct >= 0;

  const momentum = stock ? Math.round(((stock.price - stock.wkLow) / (stock.wkHigh - stock.wkLow)) * 100) : 50;

  if (!stock) return <div style={{ padding: 40, color: 'var(--muted)' }}>Stock not found.</div>;

  const addAlert = () => {
    const price = parseFloat(alertForm.price);
    if (!price) return;
    setAlerts([...alerts, { id: Date.now(), symbol, type: alertForm.type, price, active: true }]);
    setAlertForm({ type: 'above', price: '' });
  };

  const stats = [
    { label: 'Open',      value: `$${stock.open.toFixed(2)}` },
    { label: "Day's High", value: `$${stock.high.toFixed(2)}` },
    { label: "Day's Low",  value: `$${stock.low.toFixed(2)}` },
    { label: 'Volume',    value: stock.volume },
    { label: 'Mkt Cap',   value: stock.cap },
    { label: 'P/E Ratio', value: stock.pe },
  ];

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        ← Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 800 }}>{stock.symbol}</span>
            <SectorBadge sector={stock.sector} />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>{stock.name}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 700 }}>${stock.price.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: isPos ? 'var(--green)' : 'var(--red)' }}>
              {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{stock.change.toFixed(2)} ({isPos ? '+' : ''}{stock.pct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <button onClick={() => setWatchlist(isWatched ? watchlist.filter(s => s !== symbol) : [...watchlist, symbol])}
          style={{ background: isWatched ? 'var(--accent)20' : 'var(--accent)', border: `1px solid var(--accent)`, color: isWatched ? 'var(--accent)' : '#fff', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
        >{isWatched ? '★ Watching' : '☆ Add to Watchlist'}</button>
      </div>

      {/* Chart + Volume in one card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            Price History
            {isLive && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 100, background: 'var(--green)20', color: 'var(--green)', border: '1px solid var(--green)40' }}>LIVE</span>}
            {!isLive && <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>simulated</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['1W','1M','3M','6M','1Y'].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: range === r ? 'var(--accent)' : 'none',
                border: `1px solid ${range === r ? 'var(--accent)' : 'var(--border)'}`,
                color: range === r ? '#fff' : 'var(--muted)',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{r}</button>
            ))}
          </div>
        </div>
        <FullChart data={hist} positive={isPos} />
        <VolumeChart priceData={hist} symbol={symbol} />
      </div>

      {/* Stats + Alerts + Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Left: stats + 52w range */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Key Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', borderTop: '1px solid var(--border)' }}>
              {stats.map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
            <RangeBar52W low={stock.wkLow} high={stock.wkHigh} current={stock.price} />
          </div>

          {/* Momentum gauge */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
            <MomentumGauge value={momentum} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Technical Signal</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Based on 52-week position.<br/>
                Score: <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 600 }}>{momentum}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: alerts */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Price Alerts</div>
          {stockAlerts.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>No alerts set for {symbol}.</div>}
          {stockAlerts.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: a.type === 'above' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{a.type === 'above' ? '▲' : '▼'}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, flex: 1 }}>${a.price.toFixed(2)}</span>
              <button onClick={() => setAlerts(alerts.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}
                style={{ background: a.active ? 'var(--green)20' : 'var(--border)', border: 'none', borderRadius: 10, padding: '2px 8px', fontSize: 10, color: a.active ? 'var(--green)' : 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}
              >{a.active ? 'ON' : 'OFF'}</button>
              <button onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '0 2px' }}>✕</button>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['above','below'].map(t => (
                <button key={t} onClick={() => setAlertForm({ ...alertForm, type: t })} style={{
                  flex: 1, background: alertForm.type === t ? (t==='above' ? 'var(--green)20' : 'var(--red)20') : 'none',
                  border: `1px solid ${alertForm.type === t ? (t==='above' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                  color: alertForm.type === t ? (t==='above' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                  borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                }}>{t === 'above' ? '▲ Above' : '▼ Below'}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={alertForm.price} onChange={e => setAlertForm({ ...alertForm, price: e.target.value })} onKeyDown={e => e.key === 'Enter' && addAlert()}
                placeholder="Target price"
                style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 12, padding: '7px 10px', outline: 'none' }} />
              <button onClick={addAlert} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>Set</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALERTS PAGE
══════════════════════════════════════════════════════════════ */
function AlertsPage({ stocks, alerts, setAlerts }) {
  const [form, setForm] = useState({ symbol: '', type: 'above', price: '' });
  const stockMap = useMemo(() => Object.fromEntries(stocks.map(s => [s.symbol, s])), [stocks]);

  const addAlert = () => {
    const sym = form.symbol.trim().toUpperCase(), price = parseFloat(form.price);
    if (!sym || !price || !stockMap[sym]) return;
    setAlerts([...alerts, { id: Date.now(), symbol: sym, type: form.type, price, active: true }]);
    setForm({ symbol: '', type: 'above', price: '' });
  };

  const grouped = alerts.reduce((acc, a) => { acc[a.symbol] = acc[a.symbol] || []; acc[a.symbol].push(a); return acc; }, {});

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Price Alerts</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>{alerts.filter(a => a.active).length} active · {alerts.length} total</div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>New Alert</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ticker</div>
            <input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="AAPL"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, padding: '7px 12px', width: 100, outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Condition</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['above','below'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })} style={{
                  background: form.type === t ? (t==='above' ? 'var(--green)20' : 'var(--red)20') : 'var(--surface)',
                  border: `1px solid ${form.type === t ? (t==='above' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                  color: form.type === t ? (t==='above' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                  borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                }}>{t === 'above' ? '▲ Above' : '▼ Below'}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price ($)</div>
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '7px 12px', width: 120, outline: 'none' }} />
          </div>
          <button onClick={addAlert} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Add Alert</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0
        ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '60px 0', fontSize: 14 }}>No alerts set. Add one above.</div>
        : Object.entries(grouped).map(([sym, symAlerts]) => {
            const s = stockMap[sym];
            return (
              <div key={sym} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 14 }}>{sym}</span>
                  {s && <><span style={{ color: 'var(--muted)', fontSize: 12 }}>{s.name}</span><SectorBadge sector={s.sector} small /></>}
                  {s && <span style={{ fontFamily: 'var(--mono)', fontSize: 13, marginLeft: 'auto', color: s.pct >= 0 ? 'var(--green)' : 'var(--red)' }}>${s.price.toFixed(2)}</span>}
                </div>
                <div>
                  {symAlerts.map(a => (
                    <div key={a.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 16, color: a.type === 'above' ? 'var(--green)' : 'var(--red)' }}>{a.type === 'above' ? '▲' : '▼'}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, flex: 1 }}>
                        {a.type === 'above' ? 'Above' : 'Below'} ${a.price.toFixed(2)}
                      </span>
                      {s && <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {a.type === 'above'
                          ? `+${((a.price - s.price) / s.price * 100).toFixed(1)}% away`
                          : `-${((s.price - a.price) / s.price * 100).toFixed(1)}% away`}
                      </span>}
                      <button onClick={() => setAlerts(alerts.map(x => x.id === a.id ? { ...x, active: !x.active } : x))}
                        style={{ background: a.active ? 'var(--green)20' : 'var(--border)', border: 'none', borderRadius: 12, padding: '3px 10px', fontSize: 11, color: a.active ? 'var(--green)' : 'var(--muted)', cursor: 'pointer', fontWeight: 700 }}
                      >{a.active ? 'Active' : 'Paused'}</button>
                      <button onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))}
                        style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════════════════ */
function SettingsPage({ darkMode, setDarkMode, onApiKeySaved }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('sp_apikey') || '');
  const [saved, setSaved] = useState(false);
  const [refresh, setRefresh] = useState(localStorage.getItem('sp_refresh') || '30');
  const [currency, setCurrency] = useState(localStorage.getItem('sp_currency') || 'USD');

  const save = () => {
    localStorage.setItem('sp_apikey', apiKey);
    localStorage.setItem('sp_refresh', refresh);
    localStorage.setItem('sp_currency', currency);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    if (onApiKeySaved) onApiKeySaved();
  };

  const Row = ({ label, sub, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ on, onToggle }) => (
    <div onClick={onToggle} style={{ width: 42, height: 24, borderRadius: 12, background: on ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%', maxWidth: 640 }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>Configure your StockPulse experience</div>

      {[
        {
          title: 'Appearance',
          rows: [{ label: 'Dark Mode', sub: 'Use dark theme', ctrl: <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} /> }],
        },
        {
          title: 'Alpha Vantage API',
          rows: [
            { label: 'API Key', sub: 'Required for live stock data',
              ctrl: <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 12, padding: '7px 12px', width: 220, outline: 'none' }} /> },
            { label: 'Refresh Interval', sub: 'How often to fetch live prices',
              ctrl: <select value={refresh} onChange={e => setRefresh(e.target.value)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '7px 12px', outline: 'none' }}>
                {['15','30','60','300'].map(v => <option key={v} value={v}>{v === '300' ? '5 min' : `${v}s`}</option>)}
              </select> },
          ],
          extra: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', display: 'block', paddingTop: 12 }}>→ Get a free Alpha Vantage API key</a>,
        },
        {
          title: 'Display',
          rows: [{ label: 'Currency', sub: 'Display currency',
            ctrl: <select value={currency} onChange={e => setCurrency(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '7px 12px', outline: 'none' }}>
              {['USD','EUR','GBP','JPY'].map(c => <option key={c} value={c}>{c}</option>)}
            </select> }],
        },
      ].map(section => (
        <div key={section.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 20px', marginBottom: 16 }}>
          <div style={{ padding: '12px 0 8px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section.title}</div>
          {section.rows.map(r => <Row key={r.label} label={r.label} sub={r.sub}>{r.ctrl}</Row>)}
          {section.extra}
        </div>
      ))}

      <button onClick={save} style={{ background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 9, padding: '11px 28px', cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 32 }}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12 }}>
        <strong style={{ color: 'var(--text)' }}>StockPulse</strong> — CIS 371 Hackathon · GVSU · 2026<br/>
        Built with Vue + Vue Router + Pinia · Data via Alpha Vantage<br/>
        <span style={{ color: 'var(--accent)' }}>Prototype uses simulated data. Connect your API key above for live prices.</span>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage, WatchlistPage, PortfolioPage, DetailPage, AlertsPage, SettingsPage });
