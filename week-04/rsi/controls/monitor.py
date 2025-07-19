
from PySide6.QtCore import QThread, Signal, QObject
from .indicator import RSIIndicator
import time

class RSIMonitorWorker(QObject):
    rsi_updated = Signal(dict)  # {interval: value}
    error = Signal(str)

    def __init__(self, ws, symbol, interval):
        super().__init__()
        self.ws = ws
        self.symbol = symbol
        self.interval = interval
        self._running = True

    def stop(self):
        self._running = False

    def run(self):
        print(f"[RSIMonitor] Bắt đầu monitor (QThread): {self.symbol} | Interval: {self.interval}")
        ws = self.ws
        symbol = self.symbol
        interval = self.interval
        import time
        closes = []
        last_update = {"1s": 0, "15s": 0, "30s": 0, "1m": 0}
        while self._running:
            try:
                candles = ws.fetch_ohlcv(symbol, timeframe=interval, limit=100)
                closes = [c[4] for c in candles]
                now = int(time.time())
                rsi_dict = {}
                # RSI 1s: update mỗi lần polling
                if len(closes) > 14:
                    rsi_dict["1s"] = RSIIndicator(14).calculate(closes)
                # RSI 15s: update mỗi 15s
                if now - last_update["15s"] >= 15:
                    if len(closes) > 14:
                        rsi_dict["15s"] = RSIIndicator(14).calculate(closes)
                    last_update["15s"] = now
                # RSI 30s: update mỗi 30s
                if now - last_update["30s"] >= 30:
                    if len(closes) > 14:
                        rsi_dict["30s"] = RSIIndicator(14).calculate(closes)
                    last_update["30s"] = now
                # RSI 1m: update mỗi 60s
                if now - last_update["1m"] >= 60:
                    if len(closes) > 14:
                        rsi_dict["1m"] = RSIIndicator(14).calculate(closes)
                    last_update["1m"] = now
                if rsi_dict:
                    self.rsi_updated.emit(rsi_dict)
                time.sleep(1)
            except Exception as e:
                print(f"[RSIMonitor] Lỗi fetch_ohlcv {symbol} {interval}: {e}")
                self.error.emit(str(e))
                time.sleep(5)

class RSIMonitor:
    def __init__(self, ws, symbol, interval, on_rsi_update=None):
        self.worker = RSIMonitorWorker(ws, symbol, interval)
        self.thread = QThread()
        self.worker.moveToThread(self.thread)
        self.on_rsi_update = on_rsi_update
        self.worker.rsi_updated.connect(self._on_rsi_update)
        self.worker.error.connect(self.handle_error)
        self.thread.started.connect(self.worker.run)

    def _on_rsi_update(self, rsi_dict):
        if self.on_rsi_update:
            self.on_rsi_update(rsi_dict)

    def start(self):
        self.thread.start()

    def stop(self):
        self.worker.stop()
        self.thread.quit()
        self.thread.wait()

    def handle_error(self, msg):
        print(f"[RSIMonitor] Error: {msg}")
        if self.on_rsi_update:
            self.on_rsi_update('--')
