import { Candle, TechnicalIndicators, MarketRegime } from '../types';

/**
 * TIER-1 INSTITUTIONAL MATH KERNEL
 * --------------------------------
 * Rules:
 * 1. No approximations. Use exact formulas.
 * 2. Handle data sufficiency checks.
 * 3. Zero hallucination.
 */

// --- Helper Functions ---

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const stdDev = (arr: number[]) => {
  const mean = sum(arr) / arr.length;
  const variance = sum(arr.map(x => Math.pow(x - mean, 2))) / arr.length;
  return Math.sqrt(variance);
};

// --- Core Indicators ---

export const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    const slice = data.slice(i - period + 1, i + 1);
    sma.push(sum(slice) / period);
  }
  return sma;
};

export const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const k = 2 / (period + 1);

  // Initial SMA
  if (data.length < period) return Array(data.length).fill(NaN);

  let initialSum = 0;
  for (let i = 0; i < period; i++) initialSum += data[i];
  let prevEma = initialSum / period;

  // Fill initial NaNs
  for (let i = 0; i < period - 1; i++) ema.push(NaN);
  ema.push(prevEma);

  // Calculate Recursive EMA
  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i] * k) + (prevEma * (1 - k));
    ema.push(currentEma);
    prevEma = currentEma;
  }
  return ema;
};

// True Wilder's RSI
export const calculateRSI = (close: number[], period = 14): number[] => {
  const rsi: number[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 1; i < close.length; i++) {
    const diff = close[i] - close[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = sum(gains.slice(0, period)) / period;
  let avgLoss = sum(losses.slice(0, period)) / period;

  // Fill initial
  for (let i = 0; i < period; i++) rsi.push(NaN);

  // First Point
  rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));

  // Smoothed
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
};

// Correct MACD with History - Returns ARRAYS now
export const calculateMACD = (close: number[]) => {
  const ema12 = calculateEMA(close, 12);
  const ema26 = calculateEMA(close, 26);

  const macdLine: number[] = [];
  for (let i = 0; i < close.length; i++) {
    if (isNaN(ema12[i]) || isNaN(ema26[i])) macdLine.push(NaN);
    else macdLine.push(ema12[i] - ema26[i]);
  }

  // Signal Line is EMA9 of MACD Line
  const validMacdStartIndex = macdLine.findIndex(x => !isNaN(x));

  // If insufficient data, return arrays of NaNs
  if (validMacdStartIndex === -1) {
    return {
      macdLine: Array(close.length).fill(NaN),
      signalLine: Array(close.length).fill(NaN),
      histogram: Array(close.length).fill(NaN)
    };
  }

  const validMacdValues = macdLine.slice(validMacdStartIndex);
  const validSignalValues = calculateEMA(validMacdValues, 9);

  // Reconstruct full array padding
  const signalLine: number[] = Array(validMacdStartIndex).fill(NaN).concat(validSignalValues);

  const histogram: number[] = [];
  for (let i = 0; i < close.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) histogram.push(NaN);
    else histogram.push(macdLine[i] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
};

// True ATR
export const calculateATR = (high: number[], low: number[], close: number[], period = 14): number => {
  const tr: number[] = [];

  // TR calculation
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      tr.push(high[i] - low[i]);
    } else {
      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  // Wilder's Smoothing for ATR
  let atr = sum(tr.slice(0, period)) / period;
  for (let i = period; i < tr.length; i++) {
    atr = ((atr * (period - 1)) + tr[i]) / period;
  }

  return atr;
};

// True Wilder's ADX - Returns ARRAY and Scalar
export const calculateADX = (high: number[], low: number[], close: number[], period = 14): { adxArr: number[], adx: number } => {
  if (high.length < period * 2) return { adxArr: Array(high.length).fill(0), adx: 0 };

  const tr: number[] = [];
  const dmPlus: number[] = [];
  const dmMinus: number[] = [];

  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      tr.push(0); dmPlus.push(0); dmMinus.push(0);
      continue;
    }

    // TR
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr.push(Math.max(hl, hc, lc));

    // DM
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];

    if (upMove > downMove && upMove > 0) dmPlus.push(upMove);
    else dmPlus.push(0);

    if (downMove > upMove && downMove > 0) dmMinus.push(downMove);
    else dmMinus.push(0);
  }

  // Initial Smoothed Values
  let str = sum(tr.slice(1, period + 1));
  let sdmPlus = sum(dmPlus.slice(1, period + 1));
  let sdmMinus = sum(dmMinus.slice(1, period + 1));

  const dxList: number[] = [];

  // Wilder's Smoothing Loop
  // Note: ADX needs 2 * period to start producing valid numbers
  for (let i = period + 1; i < high.length; i++) {
    str = str - (str / period) + tr[i];
    sdmPlus = sdmPlus - (sdmPlus / period) + dmPlus[i];
    sdmMinus = sdmMinus - (sdmMinus / period) + dmMinus[i];

    const diPlus = (sdmPlus / str) * 100;
    const diMinus = (sdmMinus / str) * 100;

    const divisor = diPlus + diMinus;
    const dx = divisor === 0 ? 0 : (Math.abs(diPlus - diMinus) / divisor) * 100;
    dxList.push(isNaN(dx) ? 0 : dx);
  }

  // ADX is SMA of DX.
  // We need to align the resulting ADX array with the input arrays length (pad with NaNs)
  const padLength = (period * 2) - 1;
  const adxArr: number[] = Array(padLength).fill(NaN);

  // Calculate ADX from DX stream
  const smaOfDx = calculateSMA(dxList, period);

  // Combine
  smaOfDx.forEach(val => adxArr.push(val));

  // Ensure lengths match (if logic mismatch due to SMA trimming)
  while (adxArr.length < high.length) adxArr.unshift(NaN);
  while (adxArr.length > high.length) adxArr.shift();

  return {
    adxArr,
    adx: adxArr[adxArr.length - 1] || 0
  };
};

// Market Regime Detection (The Quantitative Logic)
export const determineRegime = (
  price: number,
  ema50: number,
  ema200: number,
  adx: number,
  bbWidth: number,
  atr: number
): MarketRegime => {

  const isTrending = adx > 25;
  const isStrongTrend = adx > 40;

  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (price > ema50 && ema50 > ema200) direction = 'BULLISH';
  else if (price < ema50 && ema50 < ema200) direction = 'BEARISH';

  const isSqueeze = bbWidth < 0.05;
  const isExpansion = bbWidth > 0.30;

  let type: MarketRegime['type'] = 'UNSTABLE';
  let reason = "";

  if (isSqueeze) {
    type = 'VOLATILITY_COMPRESSION';
    reason = "Bollinger Bandwidth indicates a Squeeze. Expect breakout.";
  } else if (isTrending) {
    type = 'TRENDING';
    reason = `ADX is ${adx.toFixed(1)} (>25). Price is ${direction === 'BULLISH' ? 'Above' : 'Below'} EMA cloud.`;
  } else if (!isTrending && !isSqueeze) {
    type = 'RANGING';
    reason = "ADX < 25 indicates weak trend. Price likely chopping.";
  }

  return {
    type,
    direction,
    strength: isStrongTrend ? 'STRONG' : 'NORMAL',
    reason
  };
};

export const analyzeTechnicalData = (candles: Candle[]): TechnicalIndicators & { regime: MarketRegime } => {
  const close = candles.map(c => c.close);
  const high = candles.map(c => c.high);
  const low = candles.map(c => c.low);

  const rsiArr = calculateRSI(close);
  const macdData = calculateMACD(close); // Returns arrays
  const ema20Arr = calculateEMA(close, 20);
  const ema50Arr = calculateEMA(close, 50);
  const sma200Arr = calculateSMA(close, 200);
  const adxData = calculateADX(high, low, close);
  const atr = calculateATR(high, low, close);

  // Bollinger
  const period = 20;
  const sma20 = calculateSMA(close, period);
  const lastSma = sma20[sma20.length - 1];
  const bollingerUpperArr: number[] = [];
  const bollingerLowerArr: number[] = [];
  const bollingerMiddleArr: number[] = [];

  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      bollingerUpperArr.push(NaN); bollingerLowerArr.push(NaN); bollingerMiddleArr.push(NaN);
    } else {
      const sl = close.slice(i - period + 1, i + 1);
      const m = sum(sl) / period;
      const v = sum(sl.map(x => Math.pow(x - m, 2))) / period;
      const s = Math.sqrt(v);
      bollingerMiddleArr.push(m);
      bollingerUpperArr.push(m + s * 2);
      bollingerLowerArr.push(m - s * 2);
    }
  }

  const lastUpper = bollingerUpperArr[bollingerUpperArr.length - 1];
  const lastLower = bollingerLowerArr[bollingerLowerArr.length - 1];
  const bandwidth = (lastUpper - lastLower) / lastSma;

  const currentPrice = close[close.length - 1];
  const lastEma50 = ema50Arr[ema50Arr.length - 1];
  const lastEma200 = sma200Arr[sma200Arr.length - 1];

  const regime = determineRegime(
    currentPrice,
    lastEma50,
    lastEma200,
    adxData.adx,
    bandwidth,
    atr
  );

  // Pivots
  const lastHigh = high[high.length - 2];
  const lastLow = low[low.length - 2];
  const lastClose = close[close.length - 2];
  const pp = (lastHigh + lastLow + lastClose) / 3;
  const r1 = 2 * pp - lastLow;
  const s1 = 2 * pp - lastHigh;
  const r2 = pp + (lastHigh - lastLow);
  const s2 = pp - (lastHigh - lastLow);
  const r3 = lastHigh + 2 * (pp - lastLow);
  const s3 = lastLow - 2 * (lastHigh - pp);

  const lastIdx = close.length - 1;

  return {
    rsi: rsiArr[lastIdx],
    macd: {
      macdLine: macdData.macdLine[lastIdx],
      signalLine: macdData.signalLine[lastIdx],
      histogram: macdData.histogram[lastIdx]
    },
    bollingerBands: { upper: lastUpper, middle: lastSma, lower: lastLower, bandwidth },
    ema20: ema20Arr[lastIdx],
    ema50: lastEma50,
    sma200: lastEma200,
    adx: adxData.adx,
    atr,
    pivots: { p: pp, r1, r2, r3, s1, s2, s3 },
    regime,
    history: {
      ema50: ema50Arr,
      sma200: sma200Arr,
      bollinger: {
        upper: bollingerUpperArr,
        lower: bollingerLowerArr,
        middle: bollingerMiddleArr
      },
      rsi: rsiArr,
      macd: macdData,
      adx: adxData.adxArr
    }
  };
};

export const calculateRiskMetrics = (
  price: number,
  atr: number,
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
) => {
  // Institutional Risk Management Rules
  // 1. Volatility Based Stops (ATR)
  // 2. Risk/Reward Ratio >= 1:2
  // 3. 1% Risk Rule per trade (Mock Portfolio $10,000)

  const ATR_MULTIPLIER_SL = 2.0; // Wide enough to avoid noise
  const ATR_MULTIPLIER_TP = 4.0; // 1:2 Ratio

  let stopLoss = 0;
  let takeProfit = 0;

  if (direction === 'BEARISH') {
    stopLoss = price + (atr * ATR_MULTIPLIER_SL);
    takeProfit = price - (atr * ATR_MULTIPLIER_TP);
  } else {
    // Default for Bullish & Neutral (Accumulation)
    stopLoss = price - (atr * ATR_MULTIPLIER_SL);
    takeProfit = price + (atr * ATR_MULTIPLIER_TP);
  }

  // Position Sizing
  // Risk Per Share = |Entry - StopLoss|
  // Total Risk Allowed = $100 (1% of 10k)
  // Position Size = Total Risk / Risk Per Share

  const riskPerShare = Math.abs(price - stopLoss);
  const totalRiskAllowed = 100; // $100 fixed risk
  const suggestedPositionSize = riskPerShare > 0 ? Math.floor(totalRiskAllowed / riskPerShare) : 0;

  // Calculate R/R Ratio
  const reward = Math.abs(takeProfit - price);
  const risk = Math.abs(price - stopLoss);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;

  return {
    stopLoss,
    takeProfit,
    riskRewardRatio,
    suggestedPositionSize,
    riskPerTrade: totalRiskAllowed
  };
};