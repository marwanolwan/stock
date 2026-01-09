import React from 'react';
import { TechnicalIndicators } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface IndicatorPanelProps {
  indicators: TechnicalIndicators;
}

const Gauge = ({ value, label, min = 0, max = 100, thresholds }: any) => {
  if (value === null) return (
      <div className="bg-market-bg p-4 rounded border border-market-border flex flex-col items-center justify-center opacity-50">
          <span className="text-xs text-market-muted uppercase mb-1">{label}</span>
          <span className="text-xs text-gray-500">غير متوفر</span>
      </div>
  );

  const percent = ((value - min) / (max - min)) * 100;
  
  let statusColor = 'bg-gray-500';
  let statusText = 'محايد';

  if (value > thresholds.high) {
    statusColor = 'bg-red-500';
    statusText = 'تشبع شرائي';
  } else if (value < thresholds.low) {
    statusColor = 'bg-green-500';
    statusText = 'تشبع بيعي';
  }

  return (
    <div className="bg-market-bg p-4 rounded border border-market-border">
      <div className="flex justify-between mb-2">
        <span className="text-xs text-market-muted uppercase">{label}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${statusColor} text-white`}>{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${statusColor}`} 
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-market-muted">
        <span>{min}</span>
        <span>{statusText}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sublabel, trend }: any) => {
  if (value === null) return (
    <div className="bg-market-bg p-4 rounded border border-market-border flex flex-col justify-between opacity-50">
       <span className="text-xs text-market-muted uppercase">{label}</span>
       <span className="text-sm text-gray-500 mt-2">N/A</span>
    </div>
  );

  return (
    <div className="bg-market-bg p-4 rounded border border-market-border flex flex-col justify-between">
      <span className="text-xs text-market-muted uppercase">{label}</span>
      <div className="flex items-end gap-2 mt-2" dir="ltr">
        <span className="text-xl font-mono text-market-text">{value}</span>
        {trend === 'up' && <TrendingUp size={16} className="text-market-up mb-1" />}
        {trend === 'down' && <TrendingDown size={16} className="text-market-down mb-1" />}
        {trend === 'flat' && <Minus size={16} className="text-market-muted mb-1" />}
      </div>
      <span className="text-[10px] text-market-muted mt-1">{sublabel}</span>
    </div>
  );
};

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ indicators }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-right">
      <Gauge 
        value={indicators.rsi} 
        label="مؤشر القوة النسبية (RSI)" 
        thresholds={{ low: 30, high: 70 }} 
      />
      
      <MetricCard 
        label="الماكد (MACD)"
        value={indicators.macd.macdLine?.toFixed(3) ?? null}
        sublabel={indicators.macd.signalLine ? `الإشارة: ${indicators.macd.signalLine.toFixed(3)}` : 'N/A'}
        trend={indicators.macd.macdLine && indicators.macd.signalLine ? (indicators.macd.macdLine > indicators.macd.signalLine ? 'up' : 'down') : 'flat'}
      />

      <MetricCard 
        label="المتوسط الأسي 50"
        value={indicators.ema50?.toFixed(2) ?? null}
        sublabel="EMA 50"
        trend={'flat'} 
      />

      <div className="bg-market-bg p-4 rounded border border-market-border">
        <span className="text-xs text-market-muted uppercase mb-2 block">بيانات إضافية</span>
        <div className="space-y-1 font-mono text-xs" dir="ltr">
           <div className="flex justify-between">
             <span className="text-market-muted">EMA 200</span>
             <span className="text-white">{indicators.sma200?.toFixed(2) || '---'}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorPanel;