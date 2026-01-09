import React from 'react';
import { AnalysisResult } from '../types';
import RiskPanel from './RiskPanel';
import { ShieldCheck, Target, BrainCircuit, Activity, Scale, AlertOctagon, BarChart3, Waves } from 'lucide-react';

interface AnalysisReportProps {
  analysis: AnalysisResult;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis }) => {
  const { quantAnalysis, audit, technicalIndicators } = analysis;

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'PRIMARY': return 'bg-market-accent';
      case 'ALTERNATIVE': return 'bg-purple-500';
      case 'FAILURE': return 'bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const translateRegime = (type: string) => {
    const map: Record<string, string> = {
      'TRENDING': 'اتجاه صاعد/هابط (Trending)',
      'RANGING': 'نطاق عرضي (Ranging)',
      'VOLATILITY_EXPANSION': 'انفجار سعري (Expansion)',
      'VOLATILITY_COMPRESSION': 'انضغاط سعري (Squeeze)',
      'UNSTABLE': 'غير مستقر (Unstable)'
    };
    return map[type] || type;
  };

  return (
    <div className="bg-market-card border border-market-border rounded-lg p-6 space-y-6 text-right">
      {/* Header: Integrity & Regime */}
      <div className="flex flex-col gap-4 border-b border-market-border pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={audit.dataQualityScore >= 90 ? "text-green-500" : "text-yellow-500"} size={20} />
            <span className="text-xs font-mono text-market-muted">Samples: {audit.candleCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="text-market-accent" size={18} />
            <span className="text-sm font-bold text-white">{translateRegime(quantAnalysis.marketRegime.type)}</span>
          </div>
        </div>
        <p className="text-xs text-market-muted leading-relaxed font-mono bg-market-bg p-2 rounded border border-market-border/50">
          {quantAnalysis.marketRegime.reason}
        </p>

        {/* Quant Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-2 bg-market-bg px-2 py-1 rounded">
            <Waves size={12} />
            ADX: <span className="text-white">{technicalIndicators.adx?.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 bg-market-bg px-2 py-1 rounded">
            <BarChart3 size={12} />
            ATR: <span className="text-white">{technicalIndicators.atr?.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Risk Management Engine - ADDED */}
      <RiskPanel
        metrics={analysis.riskMetrics}
        currentPrice={analysis.currentPrice}
        direction={quantAnalysis.marketRegime.direction}
      />

      {/* Probabilistic Scenario Engine */}
      <div className="space-y-4">
        <h3 className="text-sm text-market-muted uppercase font-medium flex items-center gap-2 justify-end">
          محرك السيناريوهات الاحتمالية
          <BrainCircuit size={16} />
        </h3>

        <div className="space-y-3">
          {quantAnalysis.scenarios.map((scenario, idx) => (
            <div key={idx} className={`p-3 rounded border border-market-border relative overflow-hidden bg-market-bg`}>
              <div className="flex justify-between items-center mb-2 relative z-10">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${getScenarioColor(scenario.type)}`}>
                  {scenario.type}
                </span>
                <span className="text-sm font-mono font-bold">{scenario.probability}%</span>
              </div>
              <div className="w-full bg-gray-700 h-1 rounded-full mb-3 relative z-10">
                <div
                  className={`h-full rounded-full ${getScenarioColor(scenario.type)}`}
                  style={{ width: `${scenario.probability}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-300 mb-1 relative z-10 font-bold">الشرط: {scenario.condition}</p>
              <p className="text-[10px] text-gray-400 relative z-10">{scenario.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decision & Levels */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-market-bg p-4 rounded border border-market-border">
          <h3 className="text-xs text-market-muted uppercase mb-2 flex items-center gap-2 justify-end text-market-accent">
            دعم القرار
            <Activity size={14} />
          </h3>
          <p className="text-sm text-white leading-relaxed font-medium">
            {quantAnalysis.decisionSupport}
          </p>
        </div>

        <div className="bg-market-bg p-4 rounded border border-market-border">
          <h3 className="text-xs text-market-muted uppercase mb-3 flex items-center gap-2 justify-end">
            نقاط الارتكاز (Pivots)
            <Target size={12} />
          </h3>
          <div className="space-y-2 text-xs font-mono" dir="ltr">
            {quantAnalysis.keyLevels.resistance.map((r, i) => (
              <div key={`res-${i}`} className="flex justify-between border-b border-market-border/50 pb-1">
                <span className="text-red-400">R{i + 1}</span>
                <span>{r.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-market-border/50 pb-1 bg-market-accent/10">
              <span className="text-market-accent font-bold">PIVOT</span>
              <span className="text-market-accent font-bold">{quantAnalysis.keyLevels.pivot.toFixed(2)}</span>
            </div>
            {quantAnalysis.keyLevels.support.map((s, i) => (
              <div key={`sup-${i}`} className="flex justify-between border-b border-market-border/50 pb-1">
                <span className="text-green-400">S{i + 1}</span>
                <span>{s.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-market-border/30">
        <span>Bias Check: {audit.biasCheck}</span>
        <div className="flex items-center gap-1 text-yellow-500/70">
          <AlertOctagon size={10} />
          <span>Deterministic Math Kernel</span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;