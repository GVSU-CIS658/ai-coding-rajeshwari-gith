(function () {
  function seededRNG(seed) {
    let s = Math.abs(seed) % 2147483647 || 1;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function genHistory(symbol, basePrice, days) {
    days = days || 252;
    const seed = symbol.split('').reduce(function (a, c) { return a * 31 + c.charCodeAt(0); }, 7);
    const rng = seededRNG(seed);
    const data = [basePrice * 0.82];
    for (let i = 1; i < days; i++) {
      const drift = (rng() - 0.487) * data[i - 1] * 0.022;
      data.push(+(Math.max(data[i - 1] + drift, 0.5)).toFixed(2));
    }
    // Scale end to match basePrice
    const scale = basePrice / data[data.length - 1];
    return data.map(function (v) { return +(v * scale).toFixed(2); });
  }

  window.APP_DATA = {
    indices: [
      { symbol: 'SPX',  name: 'S&P 500',   price: 5254.35,  change:  23.45,  pct:  0.45 },
      { symbol: 'NDX',  name: 'NASDAQ',     price: 18342.12, change: -45.23,  pct: -0.25 },
      { symbol: 'DJI',  name: 'DOW JONES',  price: 39512.84, change:  112.67, pct:  0.29 },
      { symbol: 'VIX',  name: 'VIX',        price: 14.23,    change:  -0.45,  pct: -3.07 },
    ],

    stocks: [
      { symbol:'AAPL', name:'Apple Inc.',            price:171.25, change: 2.34, pct: 1.38, sector:'Technology',     cap:'$2.63T', pe:'28.4', volume:'62.3M', open:169.84, high:172.12, low:169.22, wkHigh:199.62, wkLow:164.08 },
      { symbol:'MSFT', name:'Microsoft Corp.',        price:414.67, change:-1.23, pct:-0.30, sector:'Technology',     cap:'$3.08T', pe:'35.2', volume:'18.2M', open:415.90, high:417.23, low:413.44, wkHigh:468.35, wkLow:362.90 },
      { symbol:'GOOGL',name:'Alphabet Inc.',          price:175.42, change: 3.21, pct: 1.87, sector:'Technology',     cap:'$2.20T', pe:'25.1', volume:'21.4M', open:172.21, high:176.08, low:171.98, wkHigh:193.31, wkLow:130.67 },
      { symbol:'AMZN', name:'Amazon.com Inc.',        price:184.32, change: 4.56, pct: 2.54, sector:'Consumer',       cap:'$1.93T', pe:'42.8', volume:'34.7M', open:179.76, high:185.21, low:179.45, wkHigh:201.20, wkLow:151.61 },
      { symbol:'META', name:'Meta Platforms',         price:489.23, change: 8.92, pct: 1.86, sector:'Technology',     cap:'$1.25T', pe:'26.3', volume:'15.8M', open:480.31, high:491.44, low:479.87, wkHigh:531.49, wkLow:374.94 },
      { symbol:'NVDA', name:'NVIDIA Corp.',           price:847.35, change:23.45, pct: 2.85, sector:'Semiconductors', cap:'$2.09T', pe:'65.2', volume:'41.2M', open:823.90, high:851.22, low:820.33, wkHigh:974.00, wkLow:455.72 },
      { symbol:'TSLA', name:'Tesla Inc.',             price:172.63, change:-5.23, pct:-2.94, sector:'Automotive',     cap:'$552B',  pe:'48.7', volume:'89.3M', open:177.86, high:178.42, low:171.18, wkHigh:299.29, wkLow:138.80 },
      { symbol:'AMD',  name:'Advanced Micro Devices', price:174.52, change: 3.67, pct: 2.15, sector:'Semiconductors', cap:'$282B',  pe:'38.4', volume:'52.6M', open:170.85, high:175.44, low:170.22, wkHigh:227.30, wkLow:134.26 },
      { symbol:'JPM',  name:'JPMorgan Chase',         price:209.34, change: 1.12, pct: 0.54, sector:'Finance',        cap:'$599B',  pe:'12.1', volume:'8.9M',  open:208.22, high:210.45, low:207.89, wkHigh:220.82, wkLow:135.19 },
      { symbol:'V',    name:'Visa Inc.',              price:278.54, change: 0.87, pct: 0.31, sector:'Finance',        cap:'$566B',  pe:'30.2', volume:'6.4M',  open:277.67, high:279.33, low:277.12, wkHigh:290.96, wkLow:227.82 },
      { symbol:'NFLX', name:'Netflix Inc.',           price:623.45, change:12.34, pct: 2.02, sector:'Entertainment',  cap:'$268B',  pe:'45.1', volume:'4.2M',  open:611.11, high:625.78, low:610.23, wkHigh:700.99, wkLow:344.73 },
      { symbol:'COIN', name:'Coinbase Global',        price:218.67, change:-8.34, pct:-3.67, sector:'Finance',        cap:'$55B',   pe:'—',   volume:'12.3M', open:227.01, high:228.45, low:216.34, wkHigh:283.84, wkLow:119.35 },
      { symbol:'PLTR', name:'Palantir Technologies',  price:24.87,  change: 0.43, pct: 1.76, sector:'Technology',     cap:'$54B',   pe:'78.4', volume:'45.2M', open:24.44,  high:25.12,  low:24.33,  wkHigh:27.50,  wkLow:13.52 },
      { symbol:'INTC', name:'Intel Corp.',            price:31.24,  change:-0.67, pct:-2.10, sector:'Semiconductors', cap:'$132B',  pe:'—',   volume:'38.7M', open:31.91,  high:32.14,  low:31.02,  wkHigh:51.28,  wkLow:18.84 },
      { symbol:'WMT',  name:'Walmart Inc.',           price:64.78,  change: 0.23, pct: 0.36, sector:'Retail',         cap:'$519B',  pe:'28.7', volume:'7.8M',  open:64.55,  high:65.12,  low:64.34,  wkHigh:73.79,  wkLow:51.74 },
      { symbol:'DIS',  name:'The Walt Disney Co.',    price:115.43, change:-1.08, pct:-0.93, sector:'Entertainment',  cap:'$212B',  pe:'72.1', volume:'9.3M',  open:116.51, high:117.22, low:114.89, wkHigh:123.74, wkLow:78.73 },
      { symbol:'PYPL', name:'PayPal Holdings',        price:64.23,  change: 1.45, pct: 2.31, sector:'Finance',        cap:'$70B',   pe:'15.2', volume:'11.8M', open:62.78,  high:64.89,  low:62.45,  wkHigh:77.44,  wkLow:50.25 },
      { symbol:'BAC',  name:'Bank of America',        price:40.12,  change: 0.34, pct: 0.85, sector:'Finance',        cap:'$313B',  pe:'13.4', volume:'32.4M', open:39.78,  high:40.45,  low:39.67,  wkHigh:44.44,  wkLow:24.96 },
    ],

    portfolio: [
      { symbol:'AAPL', shares:50,  avgCost:152.30 },
      { symbol:'NVDA', shares:15,  avgCost:612.44 },
      { symbol:'MSFT', shares:20,  avgCost:378.50 },
      { symbol:'TSLA', shares:30,  avgCost:195.80 },
      { symbol:'META', shares:12,  avgCost:445.20 },
      { symbol:'AMZN', shares:25,  avgCost:168.90 },
    ],

    watchlist: ['AAPL','MSFT','NVDA','TSLA','GOOGL','META','NFLX','COIN'],

    alerts: [
      { id:1, symbol:'AAPL', type:'above', price:180.00, active:true  },
      { id:2, symbol:'TSLA', type:'below', price:160.00, active:true  },
      { id:3, symbol:'NVDA', type:'above', price:900.00, active:false },
    ],

    news: [
      { id:1, headline:'Fed signals potential rate cuts as inflation cools to 2.8%',          source:'Reuters',     time:'2h ago',  symbol:null,   sentiment:'positive' },
      { id:2, headline:'NVIDIA reports record Q1 revenue driven by AI chip demand surge',     source:'Bloomberg',   time:'3h ago',  symbol:'NVDA', sentiment:'positive' },
      { id:3, headline:'Apple unveils new iPhone AI features at WWDC developer preview',      source:'WSJ',         time:'4h ago',  symbol:'AAPL', sentiment:'positive' },
      { id:4, headline:'Tesla deliveries miss estimates for second consecutive quarter',       source:'CNBC',        time:'5h ago',  symbol:'TSLA', sentiment:'negative' },
      { id:5, headline:'Amazon expands AWS infrastructure with $15B data center investment',  source:'FT',          time:'6h ago',  symbol:'AMZN', sentiment:'positive' },
      { id:6, headline:'Coinbase faces renewed regulatory pressure from SEC probe',           source:'Reuters',     time:'8h ago',  symbol:'COIN', sentiment:'negative' },
      { id:7, headline:'Microsoft Azure growth accelerates on enterprise AI adoption surge',  source:'Bloomberg',   time:'10h ago', symbol:'MSFT', sentiment:'positive' },
      { id:8, headline:'Market volatility expected as Q1 earnings season begins this week',   source:'MarketWatch', time:'12h ago', symbol:null,   sentiment:'neutral'  },
    ],

    genHistory: genHistory,
  };
})();
