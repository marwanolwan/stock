import { MarketType } from "../types";
import { fetchGlobalCryptoTicker, fetchBatchStockQuotes, fetchYahooScreener } from "./dataService";

// Expanded Universes: Top ~100-150 Liquid Assets per Market
// Saudi Symbols are Numeric (e.g. 1120.SR = Al Rajhi Bank).
// This simulates a "Whole Market" scan for regions without public screeners.
const STOCK_UNIVERSE_FALLBACK: Record<string, string[]> = {
    'US_STOCK': [
        // MAG 7 & Big Tech
        'SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'INTC', 'CRM', 'ORCL', 'ADBE', 'IBM', 'CSCO', 'TXN', 'QCOM', 'AVGO', 'MU', 'NOW', 'UBER', 'ABNB', 'PLTR', 'SNOW', 'COIN', 'SHOP', 'SQ', 'ROKU', 'DKNG',
        // Finance
        'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'V', 'MA', 'AXP', 'PYPL', 'HOOD', 'SOFI', 'AFRM',
        // Crypto Proxies
        'MSTR', 'MARA', 'RIOT', 'CLSK', 'HUT', 'BITF',
        // Consumer / Retail
        'WMT', 'TGT', 'COST', 'HD', 'LOW', 'MCD', 'SBUX', 'NKE', 'KO', 'PEP', 'PG', 'PM', 'MO', 'DIS', 'CMG', 'LUL',
        // Industrial / Auto / Energy
        'CAT', 'DE', 'GE', 'HON', 'UNP', 'UPS', 'F', 'GM', 'RIVN', 'LCID', 'XOM', 'CVX', 'OXY', 'MRO', 'DVN', 'SLB', 'HAL', 'COP', 'EOG',
        // Healthcare
        'LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'PFE', 'TMO', 'DHR', 'BMY', 'AMGN', 'GILD', 'VRTX', 'REGN', 'ISRG',
        // High Growth / Momentum
        'SMCI', 'ARM', 'CART', 'RDDT', 'KVUE', 'PANW', 'CRWD', 'ZS', 'NET', 'DDOG', 'TTD', 'MDB', 'TEAM', 'HUBS', 'PATH', 'U', 'RBLX',
        // China ADRs
        'BABA', 'PDD', 'JD', 'NIO', 'XPEV', 'LI', 'BIDU', 'TCEHY'
    ],
    'SAUDI_STOCK': [
        // Banks (Financials)
        '1120.SR', '1180.SR', '1010.SR', '1080.SR', '1020.SR', '1030.SR', '1050.SR', '1060.SR', '1140.SR', '1150.SR', '1111.SR',
        // Energy & Petrochemicals (Materials)
        '2222.SR', '2010.SR', '2020.SR', '2310.SR', '2290.SR', '2060.SR', '2350.SR', '2380.SR', '2001.SR', '2170.SR', '2330.SR', '2090.SR', '2250.SR', '2240.SR', '2210.SR', '2200.SR',
        // Telecom & Utilities
        '7010.SR', '7020.SR', '7030.SR', '7202.SR', '7203.SR', '5110.SR', '2080.SR', '2081.SR', '2082.SR',
        // Cement
        '3010.SR', '3020.SR', '3030.SR', '3040.SR', '3050.SR', '3060.SR', '3080.SR', '3090.SR', '3091.SR', '3001.SR', '3002.SR', '3003.SR', '3004.SR', '3005.SR',
        // Retail, Food & Consumer
        '4190.SR', '4001.SR', '4002.SR', '4004.SR', '4007.SR', '4003.SR', '4008.SR', '4030.SR', '4031.SR', '4164.SR', '4050.SR', '4051.SR', '4100.SR', '4080.SR', '4070.SR', '2280.SR', '2270.SR', '2190.SR', '1810.SR', '1830.SR',
        // Insurance (Hot Movers)
        '8010.SR', '8020.SR', '8030.SR', '8040.SR', '8050.SR', '8060.SR', '8070.SR', '8100.SR', '8120.SR', '8150.SR', '8160.SR', '8170.SR', '8180.SR', '8190.SR', '8200.SR', '8210.SR', '8230.SR', '8240.SR', '8250.SR',
        // Real Estate & REITs
        '4300.SR', '4310.SR', '4320.SR', '4321.SR', '4322.SR', '4090.SR', '4040.SR', '4150.SR', '4250.SR', '4230.SR'
    ],
    'UAE_STOCK': [
        // Abu Dhabi (ADX)
        'FAB.AE', 'ETISALAT.AE', 'ALDAR.AE', 'ADNOCDIST.AE', 'ADNOCGAS.AE', 'ADNOCLS.AE', 'TAQA.AE', 'IHC.AE', 'MULTIPLY.AE', 'BURJEEL.AE', 'ADCB.AE', 'ADIB.AE', 'AGRITY.AE', 'ALPHA.AE', 'AMER.AE', 'BAYANAT.AE', 'BOROUGE.AE', 'DANA.AE', 'EAND.AE', 'ESHRAQ.AE', 'FERTIGLB.AE', 'GULFNAV.AE', 'MANAZEL.AE', 'NMDC.AE', 'PRESIGHT.AE', 'QHOLDING.AE', 'RAKPROP.AE', 'RAKBANK.AE', 'SHARJAH.AE', 'WAHA.AE',
        // Dubai (DFM)
        'EMAAR.AE', 'EMR.AE', 'DEWA.AE', 'DIB.AE', 'ENBD.AE', 'DU.AE', 'AIRARABIA.AE', 'DFM.AE', 'SALIK.AE', 'EMPOWER.AE', 'TECOM.AE', 'TABREED.AE', 'UPP.AE', 'DEYAR.AE', 'ARAME.AE', 'DIC.AE', 'GFH.AE', 'ITHMAAR.AE', 'SHUAA.AE', 'AMANAT.AE', 'AJMANBANK.AE', 'AMLAK.AE', 'CBD.AE', 'DRIVE.AE', 'GULFA.AE', 'MARKA.AE', 'MAZAYA.AE', 'SALAM.AE', 'TAKAFUL-EM.AE'
    ],
    'FOREX': [
        // Majors
        'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
        // Crosses
        'EURJPY=X', 'GBPJPY=X', 'EURGBP=X', 'AUDJPY=X', 'CADJPY=X', 'CHFJPY=X', 'EURCHF=X', 'EURAUD=X', 'GBPAUD=X',
        // Commodities (Spot/Futures Proxies)
        'XAUUSD=X', // Gold
        'XAGUSD=X', // Silver
        'CL=F',   // Crude Oil WTI
        'BZ=F',   // Brent Crude
        'NG=F'    // Natural Gas
    ]
};

export const getDynamicWatchlist = async (market: MarketType): Promise<string[]> => {
    try {
        if (market === 'CRYPTO') {
            return await getCryptoDynamicList();
        }
        else if (market === 'US_STOCK') {
            return await getUSDynamicList();
        }
        else {
            return await getRegionalDynamicList(market);
        }
    } catch (e) {
        console.error("Watchlist Build Failed", e);
        // Fallback to static universe if dynamic scan fails
        return STOCK_UNIVERSE_FALLBACK[market]?.slice(0, 20) || [];
    }
};

const getCryptoDynamicList = async (): Promise<string[]> => {
    const ticker = await fetchGlobalCryptoTicker();

    // Filter for High Liquidity & Activity
    const candidates = ticker.filter((t: any) =>
        t.symbol.endsWith('USDT') &&
        parseFloat(t.quoteVolume) > 10_000_000 &&
        parseFloat(t.lastPrice) > 0.05
    );

    // Sort by "Hotness"
    candidates.sort((a: any, b: any) => {
        const scoreA = Math.abs(parseFloat(a.priceChangePercent)) * Math.log10(parseFloat(a.quoteVolume));
        const scoreB = Math.abs(parseFloat(b.priceChangePercent)) * Math.log10(parseFloat(b.quoteVolume));
        return scoreB - scoreA;
    });

    return candidates.slice(0, 40).map((t: any) => t.symbol.replace('USDT', ''));
};

const getUSDynamicList = async (): Promise<string[]> => {
    try {
        // TRUE DYNAMIC: Ask Yahoo Finance for "Day Gainers"
        const gainers = await fetchYahooScreener('day_gainers');
        if (gainers.length > 0) {
            console.log("Yahoo Screener Results:", gainers);
            return gainers;
        }

        // If Screener fails/returns empty, fallback to batch
        throw new Error("Screener returned empty");
    } catch (e) {
        // Fallback to our internal universe
        console.warn("Using Fallback US Universe");
        const universe = STOCK_UNIVERSE_FALLBACK['US_STOCK'];
        const quotes = await fetchBatchStockQuotes(universe);
        quotes.sort((a: any, b: any) => Math.abs(b.regularMarketChangePercent) - Math.abs(a.regularMarketChangePercent));
        return quotes.slice(0, 30).map((q: any) => q.symbol);
    }
};

const getRegionalDynamicList = async (market: MarketType): Promise<string[]> => {
    const universe = STOCK_UNIVERSE_FALLBACK[market];
    if (!universe) return [];

    // Mass Batch Scan (Simulating "Whole Market" for smaller exchanges)
    const quotes = await fetchBatchStockQuotes(universe);

    if (quotes.length === 0) {
        return universe.slice(0, 20); // Absolute fallback
    }

    quotes.sort((a: any, b: any) => {
        const changeA = Math.abs(a.regularMarketChangePercent || 0);
        const changeB = Math.abs(b.regularMarketChangePercent || 0);
        return changeB - changeA;
    });

    return quotes.slice(0, 30).map((q: any) => q.symbol);
};
