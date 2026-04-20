
const { useState, useEffect, useMemo, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#818cf8",
  "greenColor": "#00c896",
  "redColor": "#ff4560",
  "compactNav": false
}/*EDITMODE-END*/;

function App() {
  const stored = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };

  const [page,       setPage]       = useState(stored('sp_page')      || 'dashboard');
  const [symbol,     setSymbol]     = useState(stored('sp_symbol')    || null);
  const [darkMode,   setDarkMode]   = useState(stored('sp_dark')      !== false);
  const [watchlist,  setWatchlist]  = useState(stored('sp_watchlist') || window.APP_DATA.watchlist);
  const [portfolio,  setPortfolio]  = useState(stored('sp_portfolio') || window.APP_DATA.portfolio);
  const [alerts,     setAlerts]     = useState(stored('sp_alerts')    || window.APP_DATA.alerts);
  const [search,     setSearch]     = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [tweaks,     setTweaks]     = useState(TWEAK_DEFAULTS);
  const [tweakOpen,  setTweakOpen]  = useState(false);

  // ── Live data state ────────────────────────────────────────
  const [liveQuotes,  setLiveQuotes]  = useState({});   // symbol → quote object
  const [liveHistory, setLiveHistory] = useState({});   // symbol → number[]
  const [apiStatus,   setApiStatus]   = useState('simulated'); // simulated|fetching|live|rate_limited|error

  // Persist state
  useEffect(() => { localStorage.setItem('sp_page',      JSON.stringify(page));      }, [page]);
  useEffect(() => { localStorage.setItem('sp_symbol',    JSON.stringify(symbol));    }, [symbol]);
  useEffect(() => { localStorage.setItem('sp_dark',      JSON.stringify(darkMode));  }, [darkMode]);
  useEffect(() => { localStorage.setItem('sp_watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('sp_portfolio', JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem('sp_alerts',    JSON.stringify(alerts));    }, [alerts]);

  // Apply theme + tweaks
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    const r = document.documentElement.style;
    r.setProperty('--accent', tweaks.accentColor);
    r.setProperty('--green',  tweaks.greenColor);
    r.setProperty('--red',    tweaks.redColor);
  }, [darkMode, tweaks]);

  // Tweaks bridge
  useEffect(() => {
    const h = e => {
      if (e.data?.type === '__activate_edit_mode')   setTweakOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweakOpen(false);
    };
    window.addEventListener('message', h);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  // ── Live data fetching ─────────────────────────────────────
  const apiKey = localStorage.getItem('sp_apikey') || '';

  const startFetch = useCallback(() => {
    if (!apiKey || !window.AlphaVantage) return;
    window.AlphaVantage.fetchWatchlist(
      watchlist,
      apiKey,
      (sym, quote) => setLiveQuotes(prev => ({ ...prev, [sym]: quote })),
      status => setApiStatus(status)
    );
  }, [apiKey, watchlist]);

  useEffect(() => {
    if (!apiKey) { setApiStatus('simulated'); return; }
    startFetch();
    const intervalSec = parseInt(localStorage.getItem('sp_refresh') || '60');
    // Min interval 60 s to respect rate limits
    const t = setInterval(startFetch, Math.max(intervalSec, 60) * 1000);
    return () => clearInterval(t);
  }, [apiKey, startFetch]);

  // Fetch real price history when opening detail page
  useEffect(() => {
    if (page !== 'detail' || !symbol || !apiKey || !window.AlphaVantage) return;
    if (liveHistory[symbol]) return; // already have it
    window.AlphaVantage.fetchHistory(symbol, apiKey)
      .then(hist => setLiveHistory(prev => ({ ...prev, [symbol]: hist })))
      .catch(e => console.warn('[AV history]', e.message));
  }, [page, symbol, apiKey]);

  // ── Merge live quotes over mock stocks ─────────────────────
  const baseStocks = window.APP_DATA.stocks;
  const stocks = useMemo(() =>
    baseStocks.map(s => liveQuotes[s.symbol] ? { ...s, ...liveQuotes[s.symbol] } : s),
    [liveQuotes]
  );
  const stockMap = useMemo(() => Object.fromEntries(stocks.map(s => [s.symbol, s])), [stocks]);

  const goToStock = sym => { setSymbol(sym); setPage('detail'); setSearch(''); setSearchOpen(false); };
  const goBack    = ()  => { setPage('dashboard'); setSymbol(null); };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
    { id: 'watchlist', label: 'Watchlist', Icon: IconStar },
    { id: 'portfolio', label: 'Portfolio', Icon: IconBriefcase },
    { id: 'alerts',    label: 'Alerts',    Icon: IconBell },
    { id: 'settings',  label: 'Settings',  Icon: IconSettings },
  ];

  const searchResults = search.length > 0
    ? stocks.filter(s =>
        s.symbol.startsWith(search.toUpperCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 7)
    : [];

  const activeAlerts = alerts.filter(a => a.active).length;
  const SW = tweaks.compactNav ? 60 : 208;

  // ── Status indicator ───────────────────────────────────────
  const StatusBadge = () => {
    const isLive = apiStatus.startsWith('live');
    const isFetching = apiStatus === 'fetching' || apiStatus.includes('/');
    const isError = apiStatus === 'error' || apiStatus === 'rate_limited';
    const isSimulated = apiStatus === 'simulated';

    const dotColor = isLive ? 'var(--green)' : isFetching ? '#fbbf24' : isError ? 'var(--red)' : 'var(--muted)';
    const label = isSimulated ? 'SIMULATED'
      : isFetching ? 'FETCHING…'
      : isError     ? (apiStatus === 'rate_limited' ? 'RATE LIMITED' : 'API ERROR')
      : apiStatus.startsWith('live:') ? `LIVE ${apiStatus.split(':')[1]}`
      : 'LIVE';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', cursor: isError ? 'help' : 'default' }}
        title={isError ? 'Check your API key in Settings' : isSimulated ? 'Add Alpha Vantage API key in Settings for live data' : 'Fetching from Alpha Vantage'}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: isLive ? `0 0 6px ${dotColor}` : 'none', animation: isFetching ? 'pulse 1s infinite' : isLive ? 'pulse 3s infinite' : 'none' }} />
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{ width: SW, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRight: '1px solid var(--border)', transition: 'width 0.2s', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: tweaks.compactNav ? '20px 0' : '22px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: tweaks.compactNav ? 'center' : 'flex-start' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 10L4.5 6l3 3L11 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11.5" cy="4" r="1.5" fill="#fff"/>
            </svg>
          </div>
          {!tweaks.compactNav && <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>StockPulse</span>}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(({ id, label, Icon }) => {
            const active = page === id || (page === 'detail' && id === 'watchlist');
            const badge  = id === 'alerts' && activeAlerts > 0;
            return (
              <button key={id}
                onClick={() => { setPage(id); if (id !== 'detail') setSymbol(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: tweaks.compactNav ? '10px 0' : '10px 16px', justifyContent: tweaks.compactNav ? 'center' : 'flex-start', background: active ? 'var(--accent)15' : 'none', border: 'none', borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`, color: active ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.12s', position: 'relative', fontFamily: 'var(--sans)' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--border)30'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'none'; }}}
              >
                <Icon />
                {!tweaks.compactNav && label}
                {badge && !tweaks.compactNav && <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{activeAlerts}</span>}
                {badge && tweaks.compactNav  && <span style={{ position: 'absolute', top: 7, right: 10, width: 7, height: 7, borderRadius: '50%', background: 'var(--red)' }} />}
              </button>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div style={{ padding: tweaks.compactNav ? '16px 0' : '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: tweaks.compactNav ? 'center' : 'flex-start' }}>
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            {darkMode ? <IconSun /> : <IconMoon />}
            {!tweaks.compactNav && (darkMode ? 'Light' : 'Dark')}
          </button>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
            {page === 'detail' && symbol
              ? <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>{symbol}</span>
              : navItems.find(n => n.id === page)?.label}
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', gap: 8 }}>
              <span style={{ color: 'var(--muted)', display: 'flex' }}><IconSearch /></span>
              <input value={search} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 150)} placeholder="Search stocks…"
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%', fontFamily: 'inherit' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>✕</button>}
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                {searchResults.map(s => (
                  <div key={s.symbol} onMouseDown={() => goToStock(s.symbol)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13, width: 56 }}>{s.symbol}</span>
                    <span style={{ flex: 1, color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <SectorBadge sector={s.sector} small />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: s.pct >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: 8 }}>
                      {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <StatusBadge />
        </header>

        {/* Ticker tape */}
        <TickerTape stocks={stocks} />

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          {page === 'dashboard' && <DashboardPage stocks={stocks} onSelectStock={goToStock} />}
          {page === 'watchlist' && <WatchlistPage stocks={stocks} watchlist={watchlist} setWatchlist={setWatchlist} onSelectStock={goToStock} />}
          {page === 'portfolio' && <PortfolioPage stocks={stocks} portfolio={portfolio} setPortfolio={setPortfolio} onSelectStock={goToStock} />}
          {page === 'detail'    && <DetailPage symbol={symbol} stocks={stocks} liveHistory={liveHistory[symbol] || null} alerts={alerts} setAlerts={setAlerts} watchlist={watchlist} setWatchlist={setWatchlist} onBack={goBack} />}
          {page === 'alerts'    && <AlertsPage stocks={stocks} alerts={alerts} setAlerts={setAlerts} />}
          {page === 'settings'  && <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} onApiKeySaved={startFetch} />}
        </main>
      </div>

      {/* ── Tweaks Panel ─────────────────────────────────────── */}
      {tweakOpen && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', zIndex: 9999, width: 240, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Tweaks
            <button onClick={() => setTweakOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {[
            { key: 'accentColor', label: 'Accent color' },
            { key: 'greenColor',  label: 'Gain color' },
            { key: 'redColor',    label: 'Loss color' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
              <input type="color" value={tweaks[key]}
                onChange={e => {
                  const next = { ...tweaks, [key]: e.target.value };
                  setTweaks(next);
                  window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
                }}
                style={{ width: 32, height: 24, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 2 }}
              />
            </div>
          ))}
          {[
            { key: 'compactNav', label: 'Compact sidebar' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
              <div onClick={() => {
                const next = { ...tweaks, [key]: !tweaks[key] };
                setTweaks(next);
                window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
              }} style={{ width: 36, height: 20, borderRadius: 10, background: tweaks[key] ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 2, left: tweaks[key] ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Dark mode</span>
            <div onClick={() => setDarkMode(!darkMode)} style={{ width: 36, height: 20, borderRadius: 10, background: darkMode ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: darkMode ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        button, select { font-family: var(--sans); }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
