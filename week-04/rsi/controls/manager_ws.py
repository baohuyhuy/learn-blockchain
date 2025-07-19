# Helper to get websocket client and check if exchange supports websocket trades


from indicator import CryptoExchange_WS

class ExchangeManagerWS:
    def __init__(self):
        self.map_chart_exchange = {}

    def get_ws_instance(self, exchange_name, apikey="", secretkey="", chart_id="main", symbol="", interval="1m"):
        # Tạo hoặc lấy websocket client cho chart/token/interval
        ws = CryptoExchange_WS().setupEchange(
            apikey=apikey, secretkey=secretkey, exchange_name=exchange_name
        )
        key = f"ws-{chart_id}-{symbol}-{interval}"
        if key not in self.map_chart_exchange:
            self.map_chart_exchange[key] = {f"ws-{exchange_name}": ws}
        else:
            self.map_chart_exchange[key][f"ws-{exchange_name}"] = ws
        return ws

    def supports_ws_trades(self, exchange_name):
        ws_supported = ["binance", "binanceusdm", "bybit", "okx"]
        return exchange_name.lower() in ws_supported
