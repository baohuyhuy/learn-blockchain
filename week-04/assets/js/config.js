// Configuration constants
export const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api', // Backend API base URL
    TRADINGVIEW_BASE_URL: 'https://s3.tradingview.com/external-embedding',
    DEFAULT_SYMBOL: 'BINANCE:BTCUSDT',
    WIDGET_LOAD_DELAY: 100
};

// Symbol mappings for crypto (simplified for 2-route structure)
export const CRYPTO_MAPPINGS = {
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'SOL': 'BINANCE:SOLUSDT',
    'XRP': 'BINANCE:XRPUSDT',
    'ADA': 'BINANCE:ADAUSDT'
};

// Widget configurations
export const WIDGET_CONFIGS = {
    TICKER_TAPE: {
        symbols: [
            {
                "proName": "BITSTAMP:BTCUSD",
                "title": "Bitcoin to USD"
            },
            {
                "proName": "BITSTAMP:ETHUSD",
                "title": "Ethereum to USD"
            },
            {
                "proName": "BINANCE:SOLUSDT",
                "title": "Solana to USDT"
            },
            {
                "proName": "BITSTAMP:XRPUSD",
                "title": "XRP to USD"
            },
            {
                "proName": "BINANCE:ADAUSDT",
                "title": "Cardano to USDT"
            }
        ],
        colorTheme: "light",
        locale: "en",
        largeChartUrl: "",
        isTransparent: false,
        showSymbolLogo: true,
        displayMode: "adaptive"
    },
    
    SYMBOL_INFO: {
        width: "100%",
        locale: "en",
        colorTheme: "light",
        isTransparent: true
    },
    
    ADVANCED_CHART: {
        allow_symbol_change: true,
        calendar: false,
        details: false,
        hide_side_toolbar: true,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_volume: false,
        hotlist: false,
        interval: "D",
        locale: "en",
        save_image: true,
        style: "1",
        theme: "light",
        timezone: "Etc/UTC",
        backgroundColor: "#ffffff",
        gridColor: "rgba(46, 46, 46, 0.06)",
        watchlist: [],
        withdateranges: false,
        compareSymbols: [],
        studies: [],
        autosize: true
    }
};
