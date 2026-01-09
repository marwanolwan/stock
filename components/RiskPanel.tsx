import React from 'react';
import { RiskMetrics } from '../types';
import { Shield, Target, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RiskPanelProps {
    metrics: RiskMetrics;
    currentPrice: number;
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

const RiskPanel: React.FC<RiskPanelProps> = ({ metrics, currentPrice, direction }) => {
    const isSetupValid = metrics.stopLoss > 0 && metrics.takeProfit > 0;

    if (!isSetupValid) return null;

    return (
        <div className="bg-market-card border border-market-border rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 border-b border-market-border pb-3">
                <Shield className="text-market-accent" size={20} />
                <h3 className="text-lg font-bold text-white">إدارة المخاطر المؤسسية</h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                    ATR-Based
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Stop Loss */}
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1 text-red-400 text-xs font-bold uppercase">
                        <AlertTriangle size={14} /> وقف الخسارة
                    </div>
                    <div className="text-xl font-mono text-white" dir="ltr">
                        {metrics.stopLoss.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-red-300 mt-1" dir="ltr">
                        {(currentPrice - metrics.stopLoss).toFixed(2)} ({((Math.abs(currentPrice - metrics.stopLoss) / currentPrice) * 100).toFixed(2)}%) Risk
                    </div>
                </div>

                {/* Take Profit */}
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1 text-green-400 text-xs font-bold uppercase">
                        <Target size={14} /> جني الأرباح (الهدف)
                    </div>
                    <div className="text-xl font-mono text-white" dir="ltr">
                        {metrics.takeProfit.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-green-300 mt-1 font-mono">
                        Target Ratio: 1:{metrics.riskRewardRatio.toFixed(1)}
                    </div>
                </div>

                {/* Position Sizing */}
                <div className="col-span-2 p-3 bg-market-card/50 border border-market-border rounded-lg flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-market-muted text-xs font-bold uppercase">
                            <DollarSign size={14} /> حجم الصفقة المقترح
                        </div>
                        <div className="text-sm text-market-muted leading-tight">
                            بناءً على مخاطرة ثابتة 100$ (1% من 10k)
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono text-white font-bold" dir="ltr">
                            {metrics.suggestedPositionSize} Units
                        </div>
                        <div className="text-[10px] text-market-accent font-mono mt-1">
                            Total Value: ${(metrics.suggestedPositionSize * currentPrice).toFixed(0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Bar */}
            <div className="relative h-2 bg-gray-700 rounded-full mt-2 mb-1 overflow-hidden">
                {/* Simple visualization of Entry vs SL vs TP */}
                <div
                    className="absolute h-full bg-red-500"
                    style={{ width: '33%', left: '0%' }}
                    title="Risk Zone"
                />
                <div
                    className="absolute h-full bg-green-500"
                    style={{ width: '66%', left: '33%' }}
                    title="Profit Zone"
                />
                <div
                    className="absolute h-4 w-1 bg-white -top-1"
                    style={{ left: '33%' }}
                    title="Entry Point"
                />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-market-muted px-1">
                <span>SL: {metrics.stopLoss.toFixed(2)}</span>
                <span className="text-white font-bold">ENTRY</span>
                <span>TP: {metrics.takeProfit.toFixed(2)}</span>
            </div>

        </div>
    );
};

export default RiskPanel;
