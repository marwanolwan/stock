import { Candle, MarketType } from "../types";
import { fetchRealData } from "./dataService";
import { analyzeTechnicalData } from "./mathKernel";
import { getDynamicWatchlist } from "./watchlistService"; // NEW

export type SniperMode = 'SCALP' | 'INTRADAY' | 'SWING';

export interface RiskBox {
    entryZone: [number, number]; // Low, High of entry zone
    stopLoss: number;
    target: number;
    riskRewardRatio: number;
}

export interface SniperResult {
    symbol: string;
    score: number; // Confidence Score 0-100
    price: number;
    change: number;
    mode: SniperMode;
    reasons: { points: number; label: string; type: 'POSITIVE' | 'NEGATIVE' }[];
    riskBox: RiskBox;
    marketContext: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    badges: string[];
}

// --- HELPER: Market Context ---
const getMarketLeader = (market: MarketType) => {
    if (market === 'CRYPTO') return 'BTC';
    if (market === 'SAUDI_STOCK') return '1120.SR'; // Al Rajhi as proxy
    return 'SPY'; // Default US
};

const getMarketContext = async (market: MarketType): Promise<'BULLISH' | 'BEARISH' | 'NEUTRAL'> => {
    const leader = getMarketLeader(market);
    try {
        const candles = await fetchRealData(leader, market);
        if (candles.length < 50) return 'NEUTRAL';

        const last = candles[candles.length - 1];
        const closes = candles.map(c => c.close);
        const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
        const sma200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;

        if (last.close < sma50 && sma50 < sma200) return 'BEARISH';
        if (last.close > sma50) return 'BULLISH';
        return 'NEUTRAL';
    } catch (e) {
        return 'NEUTRAL';
    }
};

export const runSniperScan = async (marketType: MarketType, mode: SniperMode = 'INTRADAY'): Promise<SniperResult[]> => {
    // 1. Stage 1: Get Dynamic Watchlist (Top 30-50 Active Assets)
    // Instead of static list, we ask the scanner for the hottest items right now.
    const symbols = await getDynamicWatchlist(marketType);

    // 2. Context Awareness
    const marketContext = await getMarketContext(marketType);

    const results = await Promise.all(symbols.map(async (symbol) => {
        try {
            const candles = await fetchRealData(symbol, marketType);
            // Relaxed from 200 for scalability, indicators handle short history gracefully
            if (candles.length < 50) return null;

            const techData = analyzeTechnicalData(candles);
            const last = candles[candles.length - 1];
            const prev = candles[candles.length - 2];
            const indicators = techData;

            let score = 0;
            const reasons: { points: number; label: string; type: 'POSITIVE' | 'NEGATIVE' }[] = [];
            const badges: string[] = [];

            // --- CONFIGURATION BASED ON MODE ---
            // Weights adjustments
            const W_MOMENTUM = mode === 'SCALP' ? 1.5 : (mode === 'SWING' ? 0.8 : 1.0);
            const W_TREND = mode === 'SWING' ? 1.5 : (mode === 'SCALP' ? 0.5 : 1.0);

            // 1. Trend Filter (Gatekeeper)
            const isAboveSMA200 = indicators.sma200 ? last.close > indicators.sma200 : false;
            const isAboveSMA50 = indicators.ema50 ? last.close > indicators.ema50 : false; // Using EMA50 as proxy for 50-day trend
            const isGoldenCross = indicators.ema50 && indicators.sma200 && indicators.ema50 > indicators.sma200;

            if (isAboveSMA50 && isAboveSMA200) {
                const pts = Math.round(25 * W_TREND);
                score += pts;
                reasons.push({ points: pts, label: "Trend Confirmed (>SMA50 & >SMA200)", type: 'POSITIVE' });
            } else if (marketContext === 'BULLISH' && mode === 'SWING') {
                // If swing trading against trend -> Penalty
                score -= 15;
                reasons.push({ points: -15, label: "Counter Trend (Below SMAs)", type: 'NEGATIVE' });
            }

            if (isGoldenCross) {
                score += 10;
                badges.push("Golden Cross");
            }

            // 2. Momentum (RSI)
            if (indicators.rsi) {
                // Scalp needs higher momentum, Swing needs stability
                const rsiLower = mode === 'SCALP' ? 60 : 50;
                const rsiUpper = mode === 'SCALP' ? 80 : 70;

                if (indicators.rsi >= rsiLower && indicators.rsi <= rsiUpper) {
                    const pts = Math.round(20 * W_MOMENTUM);
                    score += pts;
                    reasons.push({ points: pts, label: `RSI Bullish (${indicators.rsi.toFixed(0)})`, type: 'POSITIVE' });
                } else if (indicators.rsi > rsiUpper) {
                    if (mode === 'SCALP') {
                        score += 10; // Scalpers love overbought runs
                        reasons.push({ points: 10, label: "RSI High Momentum", type: 'POSITIVE' });
                    } else {
                        score -= 5; // Swing traders fear reversal
                        reasons.push({ points: -5, label: "RSI Overextend", type: 'NEGATIVE' });
                    }
                }
            }

            // 3. MACD
            if (indicators.macd.histogram && indicators.macd.histogram > 0) {
                const pts = Math.round(20 * W_MOMENTUM);
                score += pts;
                reasons.push({ points: pts, label: "MACD Positive", type: 'POSITIVE' });
            }


            // 4. Volume Spike
            const volSlice = candles.slice(-21, -1).map(c => c.volume);
            const avgVol = volSlice.reduce((a, b) => a + b, 0) / volSlice.length;
            if (last.volume > avgVol * 1.5) {
                const pts = Math.round(20 * W_MOMENTUM);
                score += pts;
                reasons.push({ points: pts, label: "Volume Spike (>1.5x)", type: 'POSITIVE' });
                badges.push("Big Volume");
            }

            // 5. Candle Shape (Simple Body Check)
            const bodySize = Math.abs(last.close - last.open);
            const totalSize = last.high - last.low;
            if (totalSize > 0 && (bodySize / totalSize) > 0.6 && last.close > last.open) {
                score += 15;
                reasons.push({ points: 15, label: "Strong Candle Body", type: 'POSITIVE' });
            }

            // 6. Context Penalty
            if (marketContext === 'BEARISH') {
                score -= 15;
                reasons.push({ points: -15, label: "Market Context Bearish", type: 'NEGATIVE' });
            }

            // --- RISK BOX CALCULATION ---
            const atr = indicators.atr || (last.high - last.low);
            const stopDistance = atr * (mode === 'SCALP' ? 1.5 : 2.5); // Tighter/Looser stops
            const stopLoss = last.close - stopDistance;
            const targetDistance = stopDistance * 2; // R:R 1:2
            const target = last.close + targetDistance;

            const riskBox: RiskBox = {
                entryZone: [last.close * 0.995, last.close * 1.005], // +/- 0.5%
                stopLoss,
                target,
                riskRewardRatio: 2.0
            };

            // Final Score Clamp
            const finalScore = Math.max(0, Math.min(100, Math.round(score)));

            return {
                symbol,
                score: finalScore,
                price: last.close,
                change: ((last.close - prev.close) / prev.close) * 100,
                mode,
                reasons,
                riskBox,
                marketContext,
                badges
            };

        } catch (e) {
            return null;
        }
    }));

    // Filter: Minimum Confidence Gate > 40 (Lower threshold to allow display but let UI fade them)
    return results
        .filter((r): r is SniperResult => r !== null && r.score >= 40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
};
