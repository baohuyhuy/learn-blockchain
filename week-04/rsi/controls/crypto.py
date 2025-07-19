import ccxt as Exchange
import ccxt.pro as Exchange_ws 

class CryptoExchange:
    def __init__(self):
        self.exchange = None
        self.name = ""

    def setupEchange(
        self, apikey: str = "", secretkey: str = "", exchange_name: str = "binanceusdm"
    ):
        self.apikey = apikey 
        self.secretkey = secretkey
        self.name = exchange_name.lower()
        self.exchange = None 

        if self.name == "binance":
            self.exchange = Exchange.binance({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "binancecoinm":
            self.exchange = Exchange.binancecoinm({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "binanceusdm":
            self.exchange = Exchange.binanceusdm({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "binanceus":
            self.exchange = Exchange.binanceus({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitmex":
            self.exchange = Exchange.bitmex({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bybit":
            self.exchange = Exchange.bybit({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "huobi":
            self.exchange = Exchange.huobi({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kraken":
            self.exchange = Exchange.kraken({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "krakenfutures":
            self.exchange = Exchange.krakenfutures({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kucoin":
            self.exchange = Exchange.kucoin({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kucoinfutures":
            self.exchange = Exchange.kucoinfutures({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bingx":
            self.exchange = Exchange.bingx({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitfinex2":
            self.exchange = Exchange.bitfinex2({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitget":
            self.exchange = Exchange.bitget({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitmart":
            self.exchange = Exchange.bitmart({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "coinex":
            self.exchange = Exchange.coinex({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "deribit":
            self.exchange = Exchange.deribit({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "coinbaseexchange":
            self.exchange = Exchange.coinbaseexchange({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })  
        elif self.name == "coinbase":
            self.exchange = Exchange.coinbase({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "hitbtc":
            self.exchange = Exchange.hitbtc({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "mexc":
            self.exchange = Exchange.mexc({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "okx":
            self.exchange = Exchange.okx({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        # and so on for other exchanges...
        else:
            self.exchange = None 
        return self.exchange
    
    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe = "1m",
        since = None,
        limit = None,
        params = {},
    ):
        return self.exchange.fetch_ohlcv(symbol, timeframe, since, limit, params)
    


class CryptoExchange_WS:
    def __init__(self):
        self.exchange = None
        self.name = ""

    def setupEchange(
        self, apikey: str = "", secretkey: str = "", exchange_name: str = "binanceusdm"
    ):
        self.apikey = apikey 
        self.secretkey = secretkey
        self.name = exchange_name.lower()
        self.exchange = None 

        if self.name == "binance":
            self.exchange = Exchange_ws.binance({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "binancecoinm":
            self.exchange = Exchange_ws.binancecoinm({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "binanceusdm":
            self.exchange = Exchange_ws.binanceusdm({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitmex":
            self.exchange = Exchange_ws.bitmex({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bybit":
            self.exchange = Exchange_ws.bybit({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "huobi":
            self.exchange = Exchange_ws.huobi({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kraken":
            self.exchange = Exchange_ws.kraken({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "krakenfutures":
            self.exchange = Exchange_ws.krakenfutures({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kucoin":
            self.exchange = Exchange_ws.kucoin({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "kucoinfutures": 
            self.exchange = Exchange_ws.kucoinfutures({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bingx":
            self.exchange = Exchange_ws.bingx({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitfinex2":
            self.exchange = Exchange_ws.bitfinex2({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitget":
            self.exchange = Exchange_ws.bitget({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "bitmart":
            self.exchange = Exchange_ws.bitmart({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "coinex":
            self.exchange = Exchange_ws.coinex({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "deribit":
            self.exchange = Exchange_ws.deribit({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "coinbaseexchange":
            self.exchange = Exchange_ws.coinbaseexchange({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "coinbase":
            self.exchange = Exchange_ws.coinbase({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "hitbtc":
            self.exchange = Exchange_ws.hitbtc({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "mexc":
            self.exchange = Exchange_ws.mexc({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        elif self.name == "okx":
            self.exchange = Exchange_ws.okx({
                'apiKey': self.apikey,
                'secret': self.secretkey,
            })
        else:
            print(f"Exchange {self.name} not supported for WebSocket.")
            self.exchange = None 
        return self.exchange
    
    async def load_markets(self, reload=False, params={}):
        return await self.exchange.load_markets(reload=reload, params=params)
    
    async def fetch_markets(self, params={}):
        return await self.exchange.fetch_markets(params={})

    async def fetchOHLCVC(
        self, symbol, timeframe="1m", since=None, limit=None, params={}
    ):
        return await self.exchange.fetchOHLCVC(
            symbol, timeframe="1m", since=None, limit=None, params={}
        )
    

    async def watch_ohlcv_for_symbols(
        self,
        symbolsAndTimeframes: list[list[str]],
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.watch_ohlcv_for_symbols(
            symbolsAndTimeframes, since, limit, params
        )
    
    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe="1m",
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.fetch_ohlcv(symbol, timeframe, since, limit, params)

    async def fetch_ohlcv_ws(
        self,
        symbol: str,
        timeframe="1m",
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.fetch_ohlcv_ws(
            symbol, timeframe, since, limit, params
        )

    async def watch_ohlcv(
        self,
        symbol: str,
        timeframe="1m",
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.watch_ohlcv(symbol, timeframe, since, limit, params)
    
    async def watch_trades(self, symbol: str, since: int = None, limit: int = None, params={}):
        return await self.exchange.watch_trades(symbol, since, limit, params)
    
    async def fetch_mark_ohlcv(
        self, symbol, timeframe="1m", since: int = None, limit: int = None, params={}
    ):
        return await self.exchange.fetch_mark_ohlcv(
            symbol, timeframe, since, limit, params
        )

    async def fetch_index_ohlcv(
        self,
        symbol: str,
        timeframe="1m",
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.fetch_index_ohlcv(
            symbol, timeframe, since, limit, params
        )

    async def fetch_premium_index_ohlcv(
        self,
        symbol: str,
        timeframe="1m",
        since: int = None,
        limit: int = None,
        params={},
    ):
        return await self.exchange.fetch_premium_index_ohlcv(
            symbol=symbol, timeframe=timeframe, since=since, limit=limit, params=params
        )
