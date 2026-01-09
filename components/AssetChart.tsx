import React from 'react';
import { 
  ComposedChart, 
  Area, 
  Line,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  Legend
} from 'recharts';
import { Candle, TechnicalIndicators } from '../types';

interface AssetChartProps {
  data: Candle[];
  indicators: TechnicalIndicators;
}

const AssetChart: React.FC<AssetChartProps> = ({ data, indicators }) => {
  // Format data for Recharts by merging historical indicators
  // We strictly check for array lengths to prevent indexing errors
  const chartData = data.map((d, i) => ({
    ...d,
    dateStr: d.date,
    ema50: indicators.history?.ema50[i] ?? null,
    sma200: indicators.history?.sma200[i] ?? null,
    bbUpper: indicators.history?.bollinger.upper[i] ?? null,
    bbLower: indicators.history?.bollinger.lower[i] ?? null,
    rsi: indicators.history?.rsi[i] ?? null,
    adx: indicators.history?.adx[i] ?? null,
    macdLine: indicators.history?.macd.macdLine[i] ?? null,
    macdSignal: indicators.history?.macd.signalLine[i] ?? null,
    macdHist: indicators.history?.macd.histogram[i] ?? null,
  }));

  const PriceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const price = payload.find((p: any) => p.dataKey === 'close');
      const ema = payload.find((p: any) => p.dataKey === 'ema50');
      
      return (
        <div className="bg-market-card border border-market-border p-3 rounded shadow-xl text-xs font-mono text-right z-50" dir="rtl">
          <p className="text-market-muted mb-2 font-bold">{label}</p>
          {price && <div className="flex justify-between gap-4"><span className="text-white">Price:</span> <span className="text-market-accent" dir="ltr">{price.value.toFixed(2)}</span></div>}
          {ema && <div className="flex justify-between gap-4"><span className="text-purple-400">EMA50:</span> <span dir="ltr">{ema.value?.toFixed(2)}</span></div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      
      {/* 1. MAIN PRICE CHART */}
      <div className="h-[400px] w-full bg-market-card/50 rounded-lg p-2 border border-market-border">
        <div className="flex justify-between items-center mb-1 px-2">
           <span className="text-[10px] font-bold text-market-muted uppercase">Price Action & Structure</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} syncId="marketFlowSync">
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis dataKey="dateStr" hide />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="left"
              tick={{fill: '#94a3b8', fontSize: 10}} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toFixed(0)}
              width={40}
            />
            <Tooltip content={<PriceTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1 }} />
            
            {/* Bollinger Bands */}
            <Line type="monotone" dataKey="bbUpper" stroke="#475569" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} activeDot={false} />
            <Line type="monotone" dataKey="bbLower" stroke="#475569" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} activeDot={false} />

            {/* Trends */}
            <Line type="monotone" dataKey="sma200" stroke="#f97316" dot={false} strokeWidth={1.5} activeDot={false} />
            <Line type="monotone" dataKey="ema50" stroke="#a855f7" dot={false} strokeWidth={1.5} activeDot={false} />
            
            {/* Price */}
            <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2. OSCILLATORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[180px]">
        
        {/* RSI & ADX CHART */}
        <div className="bg-market-card/50 rounded-lg p-2 border border-market-border w-full">
           <span className="text-[10px] font-bold text-market-muted uppercase px-2">RSI (14) & ADX (Trend Strength)</span>
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={chartData} syncId="marketFlowSync">
               <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
               <XAxis dataKey="dateStr" hide />
               <YAxis domain={[0, 100]} orientation="left" tick={{fill: '#94a3b8', fontSize: 9}} width={30} ticks={[25, 50, 70]} />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [value?.toFixed(1), name.toUpperCase()]}
               />
               <Legend verticalAlign="top" height={20} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
               
               <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
               <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
               <ReferenceLine y={25} stroke="#fbbf24" strokeDasharray="1 1" opacity={0.3} />

               {/* RSI */}
               <Line name="RSI" type="monotone" dataKey="rsi" stroke="#e2e8f0" dot={false} strokeWidth={1.5} />
               
               {/* ADX - Dotted Yellow */}
               <Line name="ADX" type="monotone" dataKey="adx" stroke="#fbbf24" strokeDasharray="2 2" dot={false} strokeWidth={1.5} opacity={0.8} />
             </ComposedChart>
           </ResponsiveContainer>
        </div>

        {/* MACD CHART */}
        <div className="bg-market-card/50 rounded-lg p-2 border border-market-border w-full">
           <span className="text-[10px] font-bold text-market-muted uppercase px-2">MACD (12, 26, 9)</span>
           <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={chartData} syncId="marketFlowSync">
               <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
               <XAxis dataKey="dateStr" hide />
               <YAxis orientation="left" tick={{fill: '#94a3b8', fontSize: 9}} width={30} />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: any, name) => [value?.toFixed(3), name]}
               />
               <ReferenceLine y={0} stroke="#64748b" />
               <Bar dataKey="macdHist" fill="#3b82f6" opacity={0.8} />
               <Line type="monotone" dataKey="macdLine" stroke="#f8fafc" dot={false} strokeWidth={1} />
               <Line type="monotone" dataKey="macdSignal" stroke="#f97316" dot={false} strokeWidth={1} />
             </ComposedChart>
           </ResponsiveContainer>
        </div>

      </div>

      {/* 3. NAVIGATOR (BRUSH) */}
      <div className="h-[60px] w-full bg-market-card/50 rounded-lg p-1 border border-market-border">
         <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} syncId="marketFlowSync">
               <Area type="monotone" dataKey="close" stroke="none" fill="#334155" fillOpacity={0.5} />
               <Brush 
                  dataKey="dateStr" 
                  height={30} 
                  stroke="#3b82f6" 
                  fill="#1e293b" 
                  tickFormatter={() => ''}
                  travellerWidth={10}
               />
            </ComposedChart>
         </ResponsiveContainer>
      </div>
      
    </div>
  );
};

export default AssetChart;