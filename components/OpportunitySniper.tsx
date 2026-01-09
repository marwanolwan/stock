import React, { useState } from 'react';
import { MarketType } from '../types';
import { runSniperScan, SniperResult, SniperMode } from '../services/sniperService';
import { Target, Search, BarChart3, TrendingUp, Zap, ArrowLeft, Loader2, Info, Shield, Clock } from 'lucide-react';

interface OpportunitySniperProps {
    onAnalyze: (symbol: string, market: MarketType) => void;
    onClose: () => void;
}

const OpportunitySniper: React.FC<OpportunitySniperProps> = ({ onAnalyze, onClose }) => {
    const [activeMarket, setActiveMarket] = useState<MarketType>('US_STOCK');
    const [activeMode, setActiveMode] = useState<SniperMode>('INTRADAY');
    const [results, setResults] = useState<SniperResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleScan = async (market: MarketType, mode: SniperMode) => {
        setLoading(true);
        // Keep market same if switching mode, keep mode same if switching market
        // But scan button passes specific args
        setActiveMarket(market);
        setActiveMode(mode);
        setScanned(false);

        try {
            const data = await runSniperScan(market, mode);
            setResults(data);
            setScanned(true);
        } catch (error) {
            console.error("Sniper error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 border-green-400';
        if (score >= 60) return 'text-yellow-400 border-yellow-400';
        return 'text-red-400 border-red-400';
    };

    const getContextIcon = (ctx: string) => {
        if (ctx === 'BULLISH') return <TrendingUp className="text-green-500" />;
        if (ctx === 'BEARISH') return <TrendingUp className="text-red-500 rotate-180" />;
        return <div className="w-4 h-1 bg-gray-500 rounded" />;
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-6 overflow-hidden">
            <div className="bg-market-card w-full max-w-7xl h-[95vh] rounded-2xl border border-market-border flex flex-col overflow-hidden shadow-3xl">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-market-border flex justify-between items-center bg-market-bg/80 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <div className="bg-market-accent/20 p-3 rounded-xl border border-market-accent/30 shadow-lg shadow-market-accent/10">
                            <Target className="text-market-accent" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SNIPER <span className="text-market-accent">PRO</span></h2>
                            <div className="flex items-center gap-2 text-xs text-market-muted font-mono">
                                <span className="flex items-center gap-1"><Shield size={10} /> INSTITUTIONAL GRADE</span>
                                <span>|</span>
                                <span className="flex items-center gap-1"><Zap size={10} /> LIVE MARKET DATA</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="text-white" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Controls Sidebar */}
                    <div className="w-full lg:w-80 bg-market-bg/50 p-6 border-l border-market-border space-y-8 overflow-y-auto">

                        {/* Mode Selector */}
                        <div>
                            <h3 className="text-xs text-market-muted uppercase font-bold mb-4 flex items-center gap-2">
                                <Clock size={12} /> استراتيجية القنص (Mode)
                            </h3>
                            <div className="grid grid-cols-3 gap-2 p-1 bg-market-card rounded-lg border border-market-border">
                                {(['SCALP', 'INTRADAY', 'SWING'] as SniperMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setActiveMode(mode)}
                                        className={`py-2 px-1 text-[10px] md:text-xs font-bold rounded transition-all ${activeMode === mode
                                            ? 'bg-market-accent text-black shadow-md'
                                            : 'text-market-muted hover:text-white'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Market Selector */}
                        <div>
                            <h3 className="text-xs text-market-muted uppercase font-bold mb-3 flex items-center gap-2">
                                <Search size={12} /> السوق المستهدف
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { id: 'US_STOCK', label: 'الأسهم الأمريكية' },
                                    { id: 'CRYPTO', label: 'العملات الرقمية' },
                                    { id: 'SAUDI_STOCK', label: 'تداول (السعودية)' },
                                    { id: 'FOREX', label: 'Forex' },
                                    { id: 'UAE_STOCK', label: 'سوق دبي/أبوظبي' },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleScan(m.id as MarketType, activeMode)}
                                        className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all flex justify-between items-center ${activeMarket === m.id
                                            ? 'bg-market-card border border-market-accent text-white shadow-lg shadow-market-accent/10'
                                            : 'bg-market-card/50 border border-transparent hover:border-market-border text-gray-400'
                                            }`}
                                    >
                                        {m.label}
                                        {activeMarket === m.id && loading && <Loader2 size={16} className="animate-spin text-market-accent" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scan Button (Mobile/Desktop Action) */}
                        <button
                            onClick={() => handleScan(activeMarket, activeMode)}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-market-accent hover:bg-white text-black font-bold text-lg shadow-xl shadow-market-accent/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Target />}
                            ابدأ المسح
                        </button>
                    </div>

                    {/* Main Results Area */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-gray-900 to-black relative">

                        {!scanned && !loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-market-muted opacity-30 select-none pointer-events-none">
                                <Target size={120} strokeWidth={0.5} />
                                <p className="mt-4 text-xl font-light">Select Market & Mode to Snipe</p>
                            </div>
                        )}

                        {loading && !scanned && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-market-accent/30 border-t-market-accent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap className="text-market-accent animate-pulse" size={32} />
                                    </div>
                                </div>
                                <p className="mt-6 text-market-accent font-mono animate-pulse">Running Institutional Algorithm...</p>
                            </div>
                        )}

                        {scanned && (
                            <div className="space-y-6 max-w-5xl mx-auto">
                                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm border border-green-500/30 font-mono">
                                                {results.length} Matches
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-mono text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span>Market Context:</span>
                                            {results.length > 0 && getContextIcon(results[0].marketContext)}
                                            <span className="text-white font-bold">{results.length > 0 ? results[0].marketContext : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {results.map((item) => (
                                        <div
                                            key={item.symbol}
                                            className="bg-market-card border border-market-border rounded-xl p-5 hover:border-market-accent/50 transition-all group relative overflow-hidden"
                                        >
                                            {/* Confidence Score Bar (Left) */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.score >= 80 ? 'bg-market-accent' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />

                                            <div className="flex flex-col md:flex-row gap-6">

                                                {/* 1. Score & Symbol */}
                                                <div className="w-full md:w-1/4 flex items-center gap-4">
                                                    <div className="relative w-16 h-16 flex-shrink-0">
                                                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                                                            <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                                            <path className={item.score >= 80 ? "text-market-accent" : item.score >= 60 ? "text-yellow-500" : "text-red-500"} strokeDasharray={`${item.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-sm font-bold text-white font-mono leading-none">{item.score}</span>
                                                            <span className="text-[8px] text-gray-500 uppercase">Conf.</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-2xl font-bold text-white tracking-tight">{item.symbol}</h4>
                                                        <div className={`text-sm font-mono font-bold ${item.change >= 0 ? "text-market-up" : "text-market-down"}`} dir="ltr">
                                                            {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Risk Box (Center) */}
                                                <div className="flex-1 grid grid-cols-3 gap-2 bg-black/20 p-3 rounded-lg border border-white/5 font-mono text-center">
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 uppercase mb-1">STOP LOSS</div>
                                                        <div className="text-red-400 font-bold text-sm lg:text-base">${item.riskBox.stopLoss.toFixed(2)}</div>
                                                    </div>
                                                    <div className="border-x border-white/10">
                                                        <div className="text-[10px] text-market-accent uppercase mb-1">ENTRY ZONE</div>
                                                        <div className="text-white font-bold text-sm lg:text-base">${item.riskBox.entryZone[0].toFixed(2)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-green-500 uppercase mb-1">TARGET</div>
                                                        <div className="text-green-400 font-bold text-sm lg:text-base">${item.riskBox.target.toFixed(2)}</div>
                                                    </div>
                                                </div>

                                                {/* 3. Actions & Why */}
                                                <div className="w-full md:w-auto flex flex-col gap-2 justify-center min-w-[140px]">
                                                    <button
                                                        onClick={() => onAnalyze(item.symbol, activeMarket)}
                                                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Search size={16} /> تحليل عميق
                                                    </button>
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === item.symbol ? null : item.symbol)}
                                                        className="w-full py-2 bg-transparent border border-gray-600 text-gray-400 font-bold rounded hover:border-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs"
                                                    >
                                                        <Info size={14} /> {expandedId === item.symbol ? 'HIDE LOGIC' : 'WHY?'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 4. Expanded Logic Panel */}
                                            {expandedId === item.symbol && (
                                                <div className="mt-4 pt-4 border-t border-market-border/50 animate-fade-in">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <h5 className="text-market-muted uppercase font-bold mb-2">Confidence Factors:</h5>
                                                            <ul className="space-y-1">
                                                                {item.reasons.filter(r => r.type === 'POSITIVE').map((r, i) => (
                                                                    <li key={i} className="flex justify-between text-gray-300">
                                                                        <span>• {r.label}</span>
                                                                        <span className="text-green-400 font-mono">+{r.points}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h5 className="text-market-muted uppercase font-bold mb-2">Penalties & Risks:</h5>
                                                            <ul className="space-y-1">
                                                                {item.reasons.filter(r => r.type === 'NEGATIVE').map((r, i) => (
                                                                    <li key={i} className="flex justify-between text-gray-300">
                                                                        <span>• {r.label}</span>
                                                                        <span className="text-red-400 font-mono">{r.points}</span>
                                                                    </li>
                                                                ))}
                                                                {item.reasons.filter(r => r.type === 'NEGATIVE').length === 0 && (
                                                                    <li className="text-gray-500 italic">No significant risks detected.</li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpportunitySniper;
