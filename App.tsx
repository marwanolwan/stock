import React, { useState, useEffect } from 'react';
import { MarketType, AppState } from './types';
import { fetchAndAnalyzeAsset, scanMarket } from './services/geminiService';
import AssetChart from './components/AssetChart';
import IndicatorPanel from './components/IndicatorPanel';
import AnalysisReport from './components/AnalysisReport';
import MarketScanner from './components/MarketScanner';
import SettingsModal from './components/SettingsModal';
import OpportunitySniper from './components/OpportunitySniper';
import { Search, Activity, Lock, ArrowLeft, Radar, Play, AlertCircle, TrendingUp, DollarSign, Globe, Key, Settings, Target } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'SCANNER',
    marketType: 'US_STOCK',
    selectedAsset: null,
    scannerResults: [],
    loading: false,
    loadingMessage: '',
    error: null,
    data: null
  });

  const [searchInput, setSearchInput] = useState('');
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(!!process.env.API_KEY || !!localStorage.getItem('GEMINI_API_KEY'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSniper, setShowSniper] = useState(false);

  // Initial Security Check
  useEffect(() => {
    const checkKey = async () => {
      // Check if environment key or local key exists
      if (process.env.API_KEY || localStorage.getItem('GEMINI_API_KEY')) {
        setApiKeyReady(true);
        return;
      }

      // Check via AI Studio Secure Platform
      // Cast to any to avoid type conflict with global definition
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (hasKey) {
          setApiKeyReady(true);
        } else {
          setState(prev => ({
            ...prev,
            error: "Security Alert: No API Key detected."
          }));
        }
      } else {
        // Fallback for non-AI Studio environments
        setState(prev => ({
          ...prev,
          error: "CRITICAL: API Key missing in environment variables (Tier-1 Security Violation)."
        }));
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      try {
        await aiStudio.openSelectKey();
        // Assume success to avoid race conditions as per protocol
        setApiKeyReady(true);
        setState(prev => ({ ...prev, error: null }));
        // Force refresh might be needed in some contexts, but usually env updates reactive
      } catch (e) {
        console.error("Key selection failed", e);
      }
    }
  };

  const handleScan = async () => {
    if (!apiKeyReady) {
      handleConnectKey();
      return;
    }
    setState(prev => ({ ...prev, loading: true, loadingMessage: 'جاري تنفيذ خوارزميات التدقيق والمسح الضوئي...', error: null, view: 'SCANNER' }));
    try {
      const results = await scanMarket(state.marketType);
      setState(prev => ({ ...prev, loading: false, scannerResults: results }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "فشل عملية الفحص."
      }));
    }
  };

  const handleDeepAnalysis = async (symbol: string) => {
    if (!apiKeyReady) {
      handleConnectKey();
      return;
    }
    setState(prev => ({ ...prev, loading: true, loadingMessage: `التدقيق الكمي وتحليل البيانات الحقيقية لـ ${symbol}...`, error: null, selectedAsset: symbol }));
    try {
      const result = await fetchAndAnalyzeAsset(symbol, state.marketType);
      setState(prev => ({ ...prev, loading: false, data: result, view: 'ANALYSIS' }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "فشل التحليل. تأكد من صحة الرمز."
      }));
    }
  };

  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleDeepAnalysis(searchInput.trim());
    } else {
      handleScan();
    }
  };

  const goBackToScanner = () => {
    setState(prev => ({ ...prev, view: 'SCANNER', data: null, selectedAsset: null }));
  };

  return (
    <div className="min-h-screen bg-market-bg text-market-text font-sans pb-10">
      {/* Header */}
      <header className="border-b border-market-border bg-market-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={goBackToScanner}>
            <div className="w-8 h-8 bg-market-accent rounded-lg flex items-center justify-center">
              <Activity className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight font-sans leading-none">QuantFlow</span>
              <span className="text-[10px] text-market-muted tracking-widest">INSTITUTIONAL AUDIT</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-market-muted">
            {apiKeyReady ? (
              <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                <Lock size={10} /> SECURE LINK
              </span>
            ) : (
              <button
                onClick={handleConnectKey}
                className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors"
              >
                <Key size={10} /> CONNECT KEY
              </button>
            )}

            <button
              onClick={() => setShowSniper(true)}
              className="flex items-center gap-1 text-market-accent bg-market-accent/10 px-2 py-1 rounded border border-market-accent/20 hover:bg-market-accent/20 transition-colors"
            >
              <Target size={12} />
              <span className="hidden sm:inline">SNIPER</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-market-muted hover:text-white transition-colors"
              title="إعدادات النظام"
            >
              <Settings size={16} />
            </button>

            <div className="h-4 w-[1px] bg-market-border"></div>
            <span>v2.3 (Audit Mode)</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">

        {/* API Key Blocker / Banner */}
        {!apiKeyReady && (
          <div className="mb-8 bg-blue-500/10 border border-blue-500/30 p-6 rounded-lg flex flex-col items-center text-center">
            <Key className="text-blue-400 mb-2" size={32} />
            <h3 className="text-lg font-bold text-white mb-1">المصادقة الأمنية مطلوبة</h3>
            <p className="text-sm text-market-muted mb-4 max-w-lg">
              لضمان أمان البيانات المؤسسية، يرجى ربط مفتاح API الخاص بك عبر بروتوكول المصادقة الآمن.
              يمكنك استخدام المفتاح المجاني (Free Tier) لهذه النسخة.
            </p>
            <button
              onClick={handleConnectKey}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors flex items-center gap-2"
            >
              <Lock size={16} /> ربط المفتاح الآمن
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="mt-3 text-xs text-market-muted hover:text-white underline"
            >
              أو أدخل المفتاح يدوياً
            </button>
          </div>
        )}

        {/* Market Selector */}
        <div className={`mb-8 transition-opacity ${!apiKeyReady ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="text-xs text-market-muted uppercase font-bold mb-3 block text-right">اختيار السوق المستهدف</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {[
              { id: 'US_STOCK', label: 'أمريكا', icon: TrendingUp },
              { id: 'SAUDI_STOCK', label: 'السعودية', icon: TrendingUp },
              { id: 'UAE_STOCK', label: 'الإمارات', icon: TrendingUp },
              { id: 'CRYPTO', label: 'كريبتو', icon: Activity },
              { id: 'FOREX', label: 'فوركس', icon: DollarSign },
              { id: 'COMMODITY', label: 'سلع', icon: Globe },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setState(prev => ({ ...prev, marketType: m.id as MarketType, scannerResults: [] }))}
                className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${state.marketType === m.id
                  ? 'bg-market-accent text-white border-market-accent shadow-lg shadow-blue-900/20'
                  : 'bg-market-card text-market-muted border-market-border hover:border-gray-500'
                  }`}
              >
                <m.icon size={18} className="mb-1" />
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <form onSubmit={handleDirectSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 text-market-muted" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    state.marketType.includes('STOCK') ? "أدخل رمز السهم (مثال: 1120.SR أو TSLA)" :
                      state.marketType === 'CRYPTO' ? "أدخل العملة (مثال: BTC)" : "أدخل الزوج/السلعة"
                  }
                  className="w-full bg-market-card border border-market-border rounded pr-10 pl-4 py-3 focus:outline-none focus:border-market-accent transition-colors text-right"
                  dir="ltr"
                />
              </div>
              {searchInput.trim() ? (
                <button
                  type="submit"
                  disabled={state.loading}
                  className="bg-market-accent hover:bg-blue-600 text-white font-bold px-6 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Play size={16} /> تدقيق
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={state.loading}
                  className="bg-market-card border border-market-accent text-market-accent hover:bg-market-accent hover:text-white font-bold px-6 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Radar size={16} /> فحص
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Error */}
        {state.error && !state.error.includes("Security Alert") && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded mb-6 text-sm flex items-center gap-2 text-right" dir="rtl">
            <AlertCircle size={16} />
            {state.error}
          </div>
        )}

        {/* Loading */}
        {state.loading && (
          <div className="h-64 flex flex-col items-center justify-center text-market-muted space-y-4">
            <div className="w-12 h-12 border-4 border-market-border border-t-market-accent rounded-full animate-spin"></div>
            <p className="font-mono text-sm animate-pulse">{state.loadingMessage}</p>
          </div>
        )}

        {/* VIEW: ANALYSIS */}
        {!state.loading && state.view === 'ANALYSIS' && state.data && (
          <div className="animate-fade-in">
            <button
              onClick={goBackToScanner}
              className="mb-4 text-xs font-mono text-market-muted hover:text-market-accent flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={12} className="rotate-180" /> العودة للقائمة
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 pb-6 border-b border-market-border">
              <div className="text-right">
                <h1 className="text-4xl font-bold text-white mb-1 flex items-center gap-3 justify-end">
                  {state.data.symbol}
                  <span className="text-lg font-mono font-normal text-market-muted px-2 py-0.5 rounded border border-market-border bg-market-card">
                    {state.marketType.replace('_', ' ')}
                  </span>
                </h1>
                <p className="text-sm text-market-muted">
                  {new Date(state.data.dataTimestamp).toLocaleString('ar-EG')} • بيانات مدققة
                </p>
              </div>
              <div className="text-left" dir="ltr">
                <div className="text-4xl font-mono font-bold text-white">
                  {state.data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-lg text-market-muted">{state.data.currency}</span>
                </div>
                <div className={`text-sm font-mono font-medium flex items-center justify-start gap-1 ${state.data.priceChange >= 0 ? 'text-market-up' : 'text-market-down'}`}>
                  {state.data.priceChange >= 0 ? '+' : ''}{state.data.priceChange.toFixed(2)} ({state.data.priceChangePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Charts & Tech */}
              <div className="lg:col-span-2 space-y-6">
                {state.data.candles && state.data.candles.length > 2 ? (
                  <AssetChart data={state.data.candles} indicators={state.data.technicalIndicators} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-market-card/20 border border-market-border border-dashed rounded text-market-muted text-sm">
                    لا توجد بيانات شموع تاريخية كافية للعرض (التركيز على التحليل اللحظي)
                  </div>
                )}
                <IndicatorPanel indicators={state.data.technicalIndicators} />
              </div>

              {/* Right Col: Quant Analysis */}
              <div className="lg:col-span-1">
                <AnalysisReport analysis={state.data} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SCANNER */}
        {!state.loading && state.view === 'SCANNER' && (
          <>
            {state.scannerResults.length > 0 ? (
              <MarketScanner
                assets={state.scannerResults}
                marketType={state.marketType}
                onSelectAsset={handleDeepAnalysis}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-market-muted/50 border border-dashed border-market-border rounded-lg bg-market-card/20">
                <Radar size={48} className="mb-4 opacity-20" />
                <p className="mb-4 text-center">لا توجد نتائج. اضغط "فحص" لبدء البحث الخوارزمي.</p>
              </div>
            )}
          </>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {
          setApiKeyReady(!!localStorage.getItem('GEMINI_API_KEY'));
          setIsSettingsOpen(false);
          setState(prev => ({ ...prev, error: null }));
        }}
      />

      {showSniper && (
        <OpportunitySniper
          onClose={() => setShowSniper(false)}
          onAnalyze={(symbol, market) => {
            setShowSniper(false);
            setState(prev => ({ ...prev, marketType: market }));
            handleDeepAnalysis(symbol);
          }}
        />
      )}
    </div>
  );
};

export default App;