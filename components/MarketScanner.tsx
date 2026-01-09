import React from 'react';
import { ScannedAsset } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface MarketScannerProps {
  assets: ScannedAsset[];
  onSelectAsset: (symbol: string) => void;
  marketType: string;
}

const MarketScanner: React.FC<MarketScannerProps> = ({ assets, onSelectAsset, marketType }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="text-yellow-400" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">نتائج الماسح الخوارزمي</h2>
          <p className="text-sm text-market-muted">
            أفضل {marketType === 'STOCK' ? 'الأسهم' : 'الأزواج'} التي تظهر زخمًا قويًا. اختر أصلًا لإجراء التحليل العميق.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div 
            key={asset.symbol}
            className="bg-market-card border border-market-border rounded-lg p-5 hover:border-market-accent transition-all cursor-pointer group"
            onClick={() => onSelectAsset(asset.symbol)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-market-accent transition-colors">{asset.symbol}</h3>
                <p className="text-xs text-market-muted truncate max-w-[150px]">{asset.name}</p>
              </div>
              <div dir="ltr" className={`flex items-center gap-1 text-sm font-mono font-bold ${asset.changePercent >= 0 ? 'text-market-up' : 'text-market-down'}`}>
                {asset.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {asset.changePercent > 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-market-muted uppercase block mb-1">الإشارة</span>
                <span className="inline-block bg-market-bg px-2 py-1 rounded text-xs text-gray-200 border border-market-border">
                  {asset.signal}
                </span>
              </div>
              <div className="text-left" dir="ltr">
                <span className="text-2xl font-mono text-white block">${asset.price.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-market-border/50 flex justify-between items-center text-xs text-market-muted group-hover:text-white transition-colors">
              <span>تشغيل التحليل العميق</span>
              <ArrowLeft size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketScanner;