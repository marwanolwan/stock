import { Candle, MarketType } from "../types";

// Public Binance API (CORS friendly)
const BINANCE_API = "https://api.binance.com/api/v3/klines";
const BINANCE_TICKER_API = "https://api.binance.com/api/v3/ticker/24hr";
// Public Proxy to Yahoo Finance (For demo purposes to get real stock data without paid key)
// In production, this would be replaced by FMP or Polygon.io
const YAHOO_PROXY = "https://query1.finance.yahoo.com/v8/finance/chart/";
const YAHOO_QUOTE_PROXY = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";
const YAHOO_SCREENER_PROXY = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=";

export const fetchRealData = async (symbol: string, marketType: MarketType): Promise<Candle[]> => {
  let candles: Candle[] = [];

  if (marketType === 'CRYPTO') {
    candles = await fetchCryptoData(symbol);
  } else {
    // For stocks/forex in this demo environment, we try to fetch from Yahoo.
    // If it fails (due to CORS), we will throw a strict error demanding a proxy/key.
    // NOTE: To make this work in a purely frontend CodeSandbox-like environment, 
    // we often need a CORS proxy. For now, we will try a direct fetch which might work
    // if the origin allows, otherwise we handle the failure gracefully.
    try {
      candles = await fetchStockData(symbol);
    } catch (e) {
      console.warn("Direct fetch failed, falling back or throwing.");
      throw new Error("Institutional Data Connection Failed. API Key required for Stock Markets.");
    }
  }

  // TIER-1 VALIDATION
  validateData(candles);

  return candles;
};

const fetchCryptoData = async (symbol: string): Promise<Candle[]> => {
  // Binance format: [time, open, high, low, close, volume, ...]
  // Symbol needs to be uppercase, e.g., BTCUSDT
  const pair = symbol.toUpperCase().includes('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`;

  const response = await fetch(`${BINANCE_API}?symbol=${pair}&interval=1d&limit=500`);
  if (!response.ok) throw new Error(`Binance API Error: ${response.statusText}`);

  const data = await response.json();

  return data.map((d: any[]) => ({
    date: new Date(d[0]).toISOString().split('T')[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
    isReal: true
  }));
};

const fetchStockData = async (symbol: string): Promise<Candle[]> => {
  // Using a CORS proxy to access Yahoo Finance is standard for frontend-only demos.
  // Using 'corsproxy.io' or similar is common practice for hackathons/demos.
  // We will try to fetch directly first.
  const corsProxy = "https://corsproxy.io/?";
  const url = `${corsProxy}${encodeURIComponent(`${YAHOO_PROXY}${symbol}?interval=1d&range=2y`)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Stock Data Provider Unreachable");

  const json = await response.json();
  const result = json.chart.result[0];

  if (!result || !result.timestamp) throw new Error("Symbol not found or no data");

  const quote = result.indicators.quote[0];
  const timestamps = result.timestamp;

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (quote.close[i] === null) continue; // Skip gaps
    candles.push({
      date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume[i],
      isReal: true
    });
  }
  return candles;
};

const validateData = (candles: Candle[]) => {
  // Institutional Grade requirement: Sufficient depth for EMA200 + Warmup
  const MIN_SAMPLES = 300;

  if (candles.length < MIN_SAMPLES) {
    throw new Error(`Data Integrity Fail: Received ${candles.length} samples. Institutional standard requires minimum ${MIN_SAMPLES} for reliable long-term analysis.`);
  }

  // Check for freshness
  const lastDate = new Date(candles[candles.length - 1].date);
  const today = new Date();
  const diffDays = Math.ceil(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 5) {
    // Allow weekend gaps, but warn if > 5 days old
    throw new Error(`Stale Data Detected: Last data point is ${diffDays} days old.`);
  }

  // Check for internal nulls or zeros (Flash Crash detection)
  const hasBadData = candles.some(c => c.close === 0 || isNaN(c.close));
  if (hasBadData) throw new Error("Corrupt Data Detected: Zero or NaN values found in time series.");
};

export const fetchGlobalCryptoTicker = async (): Promise<any[]> => {
  try {
    const response = await fetch(BINANCE_TICKER_API);
    if (!response.ok) return [];
    const data = await response.json();
    return data; // Returns array of { symbol, priceChangePercent, volume, lastPrice, ... }
  } catch (e) {
    console.warn("Crypto Ticker Fetch Failed", e);
    return [];
  }
};

export const fetchBatchStockQuotes = async (symbols: string[]): Promise<any[]> => {
  if (symbols.length === 0) return [];
  try {
    const corsProxy = "https://corsproxy.io/?";
    // Chunking if necessary, but Yahoo handles ~50-100 fine
    const symbolString = symbols.join(',');
    const url = `${corsProxy}${encodeURIComponent(`${YAHOO_QUOTE_PROXY}${symbolString}`)}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const json = await response.json();
    return json.quoteResponse?.result || [];
  } catch (e) {
    console.warn("Batch Stock Quote Failed", e);
    return [];
  }
};

export const fetchYahooScreener = async (screenerId: string = 'day_gainers'): Promise<string[]> => {
  try {
    const corsProxy = "https://corsproxy.io/?";
    const count = 50;
    const url = `${corsProxy}${encodeURIComponent(`${YAHOO_SCREENER_PROXY}${screenerId}&count=${count}`)}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const json = await response.json();
    // Extract symbols from the screener result
    const quotes = json.finance?.result?.[0]?.quotes || [];
    return quotes.map((q: any) => q.symbol);
  } catch (e) {
    console.warn("Yahoo Screener Fetch Failed", e);
    return [];
  }
};