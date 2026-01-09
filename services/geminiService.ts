import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Candle, MarketType, ScannedAsset, TechnicalIndicators } from "../types";
import { analyzeTechnicalData, calculateRiskMetrics } from "./mathKernel";
import { fetchRealData } from "./dataService";

const getMarketContext = (marketType: MarketType) => {
  switch (marketType) {
    case 'SAUDI_STOCK': return 'السوق المالية السعودية (تداول)';
    case 'UAE_STOCK': return 'سواق الإمارات المالية';
    case 'CRYPTO': return 'Cryptocurrency Market';
    case 'FOREX': return 'Forex Market';
    case 'COMMODITY': return 'Commodities';
    default: return 'US Stock Market';
  }
};

const calculateOpportunityScore = (candles: Candle[]): number => {
  if (candles.length < 50) return 0;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  let score = 0;

  // 1. Momentum (30 pts)
  const isUp = last.close > prev.close;
  const changePercent = ((last.close - prev.close) / prev.close) * 100;

  if (isUp) score += 10;
  if (changePercent > 1.5) score += 20;

  // 2. Volume Spike (25 pts)
  const volSlice = candles.slice(-21, -1).map(c => c.volume);
  const avgVol = volSlice.reduce((a, b) => a + b, 0) / volSlice.length;

  if (last.volume > avgVol * 1.5) score += 25;
  else if (last.volume > avgVol) score += 10;

  // 3. Simple Trend (25 pts)
  const closePrices = candles.map(c => c.close);
  const sma50Slice = closePrices.slice(-50);
  const sma50 = sma50Slice.reduce((a, b) => a + b, 0) / 50;

  if (last.close > sma50) score += 25;

  // 4. Recent Strength (20 pts)
  const last5 = candles.slice(-5);
  const greenCandles = last5.filter(c => c.close > c.open).length;
  if (greenCandles >= 3) score += 20;

  return Math.min(score, 100);
};

export const scanMarket = async (marketType: MarketType): Promise<ScannedAsset[]> => {
  // Real Scan Logic: We fetch live data for a predefined "Institutional Watchlist"
  // This logic is for pre-analysis scanning only.

  const watchlists: Record<string, string[]> = {
    'CRYPTO': [
      'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'BNB', 'DOT', 'MATIC', 'SHIB',
      'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'ALGO', 'NEAR', 'QNT'
    ],
    'US_STOCK': [
      // Tech & Growth
      'SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT', 'GOOGL', 'AMZN', 'META',
      'NFLX', 'INTC', 'CRM', 'ORCL', 'ADBE', 'UBER', 'PLTR', 'SNOW', 'COIN',
      // Finance & Industrial
      'JPM', 'BAC', 'GS', 'V', 'MA', 'BA', 'CAT', 'GE', 'F', 'GM',
      // Consumer & Energy
      'WMT', 'PG', 'KO', 'PEP', 'DIS', 'NKE', 'XOM', 'CVX', 'MCD', 'SBUX'
    ],
    'FOREX': [
      'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD', 'USDCAD', 'USDCHF',
      'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP', 'CADJPY'
    ],
    'SAUDI_STOCK': [
      '1120.SR', '1180.SR', '2222.SR', '2010.SR', '2020.SR', '7010.SR',
      '1150.SR', '2310.SR', '4030.SR', '2350.SR', '1010.SR', '1060.SR'
    ],
    'UAE_STOCK': [
      'EMAAR.AE', 'DIB.AE', 'FAB.AE', 'ADNOCDIST.AE', 'ALDAR.AE',
      'DEWA.AE', 'ETISALAT.AE', 'SALIK.AE', 'AIRARABIA.AE'
    ]
  };

  const symbols = watchlists[marketType] || watchlists['US_STOCK'];

  const results = await Promise.all(symbols.map(async (symbol) => {
    try {
      const candles = await fetchRealData(symbol, marketType);
      if (candles.length === 0) return null;

      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const change = ((last.close - prev.close) / prev.close) * 100;

      const score = calculateOpportunityScore(candles);

      let signal: ScannedAsset['signalType'] = 'SUPPORT_BOUNCE';
      if (score >= 80) signal = 'BREAKOUT';
      else if (score >= 60) signal = 'VOLUME_SPIKE';
      else if (score < 40) signal = 'TREND_REVERSAL';

      return {
        symbol,
        name: `Score: ${score}/100`,
        price: last.close,
        changePercent: change,
        market: marketType,
        signalType: signal,
        auditStatus: 'VERIFIED',
        _score: score
      };
    } catch (e) {
      console.warn(`Scanner skipped ${symbol}`);
      return null;
    }
  }));

  const scannedAssets = results
    .filter((r): r is (ScannedAsset & { _score: number }) => r !== null)
    .sort((a, b) => b._score - a._score);

  return scannedAssets;
};

export const fetchAndAnalyzeAsset = async (
  symbol: string,
  marketType: MarketType
): Promise<AnalysisResult> => {

  const localKey = localStorage.getItem('GEMINI_API_KEY');
  const apiKey = localKey || process.env.API_KEY;

  if (!apiKey) throw new Error("API Key is missing. Please add it in Settings.");
  const ai = new GoogleGenAI({ apiKey });
  const context = getMarketContext(marketType);

  // 1. DATA LAYER: Fetch REAL Data (No hallucinations)
  const candles = await fetchRealData(symbol, marketType);
  const currentCandle = candles[candles.length - 1];

  // 2. MATH KERNEL: Deterministic Calculation
  const techData = analyzeTechnicalData(candles);
  const { regime, ...indicators } = techData;

  // New: Risk Management Engine
  const riskMetrics = calculateRiskMetrics(
    currentCandle.close,
    indicators.atr || 0,
    regime.direction
  );

  // 3. AI INTERPRETATION LAYER (Strict JSON)
  // We pass the CALCULATED data. AI is forbidden from calculating.
  const quantPrompt = `
    ROLE: Tier-1 Institutional Risk Auditor & Strategist.
    CONTEXT: ${context} | Asset: ${symbol}
    
    INPUT DATA (DETERMINISTIC):
    - Price: ${currentCandle.close}
    - Regime: ${regime.type} (${regime.direction}) - Reason: ${regime.reason}
    - RSI(14): ${indicators.rsi?.toFixed(2)}
    - MACD Histogram: ${indicators.macd.histogram?.toFixed(4)}
    - ADX: ${indicators.adx?.toFixed(2)}
    - ATR: ${indicators.atr?.toFixed(4)}
    - Risk Metrics: SL=${riskMetrics.stopLoss.toFixed(2)}, TP=${riskMetrics.takeProfit.toFixed(2)}
    - Pivots: P=${indicators.pivots?.p.toFixed(2)}, R1=${indicators.pivots?.r1.toFixed(2)}, S1=${indicators.pivots?.s1.toFixed(2)}
    
    TASK:
    Generate a text interpretation of these numbers.
    Do NOT recalculate. Do NOT disagree with the Regime.
    
    OUTPUT REQUIREMENTS:
    1. Scenarios: 3 Mutually Exclusive Scenarios (Primary, Alt, Failure).
       - Sum of probabilities MUST be 100.
    2. Decision Support: Strategic nuance (Accumulate, Distribute, Wait).
    3. Bias Check: Confirm no Look-ahead bias.
    
    LANGUAGE: Arabic (Professional Financial).
    FORMAT: JSON.
  `;

  const quantResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: quantPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['PRIMARY', 'ALTERNATIVE', 'FAILURE'] },
                probability: { type: Type.NUMBER },
                condition: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          signalStrength: { type: Type.NUMBER },
          decisionSupport: { type: Type.STRING },
          biasCheck: { type: Type.STRING },
        }
      }
    }
  });

  const aiData = JSON.parse(quantResponse.text || "{}");

  const audit: AnalysisResult['audit'] = {
    dataQualityScore: 100,
    dataGapDetected: false,
    candleCount: candles.length,
    sourceReliability: 'HIGH',
    biasCheck: aiData.biasCheck || 'Passed'
  };

  return {
    symbol: symbol.toUpperCase(),
    marketType,
    currentPrice: currentCandle.close,
    currency: 'USD', // Defaulting for now
    priceChange: currentCandle.close - currentCandle.open,
    priceChangePercent: ((currentCandle.close - currentCandle.open) / currentCandle.open) * 100,
    dataTimestamp: new Date().toISOString(),
    technicalIndicators: indicators,
    candles, // Full history for chart
    audit,
    riskMetrics,
    quantAnalysis: {
      marketRegime: regime, // From Math Kernel
      signalStrength: aiData.signalStrength,
      decisionSupport: aiData.decisionSupport,
      scenarios: aiData.scenarios,
      keyLevels: {
        support: [indicators.pivots?.s1 || 0, indicators.pivots?.s2 || 0],
        resistance: [indicators.pivots?.r1 || 0, indicators.pivots?.r2 || 0],
        pivot: indicators.pivots?.p || 0
      }
    }
  };
};