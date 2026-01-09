export type MarketType = 'US_STOCK' | 'SAUDI_STOCK' | 'UAE_STOCK' | 'FOREX' | 'CRYPTO' | 'COMMODITY';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isReal: boolean;
}

export interface HistoricalIndicators {
  ema50: (number | null)[];
  sma200: (number | null)[];
  bollinger: {
    upper: (number | null)[];
    lower: (number | null)[];
    middle: (number | null)[];
  };
  rsi: (number | null)[];
  macd: {
    macdLine: (number | null)[];
    signalLine: (number | null)[];
    histogram: (number | null)[];
  };
  adx: (number | null)[];
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: {
    macdLine: number | null;
    signalLine: number | null;
    histogram: number | null;
  };
  bollingerBands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    bandwidth: number | null;
  };
  ema20: number | null;
  ema50: number | null;
  sma200: number | null;
  adx: number | null;
  atr: number | null;
  pivots: {
    r1: number; r2: number; r3: number;
    s1: number; s2: number; s3: number;
    p: number;
  } | null;
  history?: HistoricalIndicators; // Full arrays for charting
}

export interface MarketRegime {
  type: 'TRENDING' | 'RANGING' | 'VOLATILITY_EXPANSION' | 'VOLATILITY_COMPRESSION' | 'UNSTABLE';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: 'STRONG' | 'WEAK' | 'NORMAL';
  reason: string;
}

export interface Scenario {
  type: 'PRIMARY' | 'ALTERNATIVE' | 'FAILURE';
  probability: number; // 0-100
  condition: string;
  description: string;
}

export interface AuditMetrics {
  dataQualityScore: number;
  dataGapDetected: boolean;
  candleCount: number;
  sourceReliability: 'HIGH' | 'MEDIUM' | 'LOW';
  biasCheck: string;
}

export interface RiskMetrics {
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  suggestedPositionSize: number; // In units/shares for a mock $10k portfolio
  riskPerTrade: number; // Dollar amount risked
}

export interface AnalysisResult {
  symbol: string;
  marketType: MarketType;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataTimestamp: string;
  currency: string;

  technicalIndicators: TechnicalIndicators;
  candles: Candle[];
  audit: AuditMetrics;
  riskMetrics: RiskMetrics;

  quantAnalysis: {
    marketRegime: MarketRegime;
    signalStrength: number;
    decisionSupport: string;
    scenarios: Scenario[];
    keyLevels: {
      support: number[];
      resistance: number[];
      pivot: number;
    };
  };
}

export interface ScannedAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  market: MarketType;
  signalType: 'BREAKOUT' | 'VOLUME_SPIKE' | 'TREND_REVERSAL' | 'SUPPORT_BOUNCE';
  auditStatus: 'VERIFIED';
}

export interface AppState {
  view: 'SCANNER' | 'ANALYSIS';
  marketType: MarketType;
  selectedAsset: string | null;
  scannerResults: ScannedAsset[];
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  data: AnalysisResult | null;
}