
import ccxt as Exchange


class ExchangeManager:
    def __init__(self):
        self._ccxt_instances = {}  # cache for ccxt (REST)

    def get_ccxt_instance(self, exchange_name, apikey="", secretkey=""):
        # exchange_name: e.g. 'binance', 'bybit', ...
        if exchange_name not in self._ccxt_instances:
            try:
                exchange_class = getattr(Exchange, exchange_name)
                inst = exchange_class({
                    "apiKey": apikey,
                    "secret": secretkey
                })
                inst.load_markets()
                self._ccxt_instances[exchange_name] = inst
            except Exception as e:
                print(f"[ExchangeManager] Lỗi tạo/lấy markets {exchange_name}: {e}")
                return None
        return self._ccxt_instances[exchange_name]