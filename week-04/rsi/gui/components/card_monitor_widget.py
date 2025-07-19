from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont

class CardMonitorWidget(QFrame):
    closeRequested = Signal(str)  # emit token_id or unique key when close is clicked

    def __init__(self, token_name, exchange, rsi_dict, unique_key=None, parent=None, interval='1m'):
        super().__init__(parent)
        self.token_name = token_name
        self.exchange = exchange
        self.rsi_dict = rsi_dict  # dict: {interval: value}
        self.unique_key = unique_key or f"{token_name}({exchange})"
        self.interval = interval if interval else '1m'
        self.setObjectName("CardMonitorWidget")
        self.setStyleSheet("""
            QFrame#CardMonitorWidget {
                border: 2px solid white;
                border-radius: 6px;
                background: transparent;
            }
        """)
        self.setMinimumWidth(120)
        self.setMaximumWidth(150)
        self.setFixedHeight(160)
        from PySide6.QtWidgets import QSizePolicy
        self.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Fixed)
        self.rsi_value_labels = {}  # Store QLabel for each interval
        self.init_ui()
        self.rsi_monitor = None
        self._is_running = True  # Flag to control polling thread
        self._start_worker_and_monitor()

    def _start_worker_and_monitor(self):
        # Cheat: chỉ polling nến 1m, emit RSI cho các interval 1s, 15s, 30s, 1m với tần suất khác nhau
        from rsi.controls.manager import ExchangeManager
        from rsi.appmanager.worker.qthreads import FastWorker
        import time
        import math
        manager = ExchangeManager()
        symbol = self.token_name
        exchange_name = self.exchange
        interval = self.interval
        exchange = manager.get_ccxt_instance(exchange_name)

        def is_valid_closes(closes):
            if len(closes) < 14:
                return False
            first = closes[0]
            for v in closes:
                if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
                    return False
            return not all(x == first for x in closes)

        def is_valid_rsi(rsi):
            return rsi is not None and isinstance(rsi, (int, float)) and not math.isnan(rsi) and not math.isinf(rsi)

        def fetch_and_cheat_emit(setdata=None):
            closes = []
            first_fetch = True
            period = 14
            closes_max = period * 5
            t0 = time.time()
            last_values = {'1s': '--', '15s': '--', '30s': '--', '1m': '--'}
            first_rsi_emitted = False
            last_candle_closed_ts = None
            try:
                while self._is_running:
                    try:
                        candles = exchange.fetch_ohlcv(symbol, timeframe='1m', limit=2)
                        if not candles or len(candles) < 2:
                            time.sleep(1)
                            continue
                        if first_fetch:
                            candles_hist = exchange.fetch_ohlcv(symbol, timeframe='1m', limit=150)
                            closes = [c[4] for c in candles_hist]
                            first_fetch = False
                        prev_candle, last_candle = candles[-2], candles[-1]
                        # Nếu có nến mới đã đóng
                        new_candle_closed = (last_candle_closed_ts is None) or (prev_candle[0] != last_candle_closed_ts)
                        if new_candle_closed:
                            last_candle_closed_ts = prev_candle[0]
                            closes.append(prev_candle[4])
                            if len(closes) > closes_max:
                                closes = closes[-closes_max:]
                        # Luôn update close cuối cùng bằng close của nến hiện tại (realtime)
                        if closes:
                            closes[-1] = last_candle[4]
                        # Tính RSI
                        from rsi.controls.indicator import RSIIndicator
                        if is_valid_closes(closes):
                            rsi = RSIIndicator(period).calculate(closes)
                        else:
                            rsi = '--'
                        now = time.time()
                        elapsed = int(now - t0)
                        emit_dict = {}
                        # Lần đầu tiên: emit cho cả 4 dòng
                        if not first_rsi_emitted and rsi != '--':
                            for k in ['1s', '15s', '30s', '1m']:
                                emit_dict[k] = rsi
                                last_values[k] = rsi
                            first_rsi_emitted = True
                        else:
                            # 1s, 15s, 30s: realtime
                            emit_dict['1s'] = rsi
                            last_values['1s'] = rsi
                            if elapsed % 15 == 0:
                                emit_dict['15s'] = rsi
                                last_values['15s'] = rsi
                            else:
                                emit_dict['15s'] = last_values['15s']
                            if elapsed % 30 == 0:
                                emit_dict['30s'] = rsi
                                last_values['30s'] = rsi
                            else:
                                emit_dict['30s'] = last_values['30s']
                            # 1m: chỉ cập nhật khi nến đã đóng
                            if new_candle_closed:
                                emit_dict['1m'] = rsi
                                last_values['1m'] = rsi
                            else:
                                emit_dict['1m'] = last_values['1m']
                        if setdata:
                            setdata.emit(emit_dict)
                        time.sleep(1)
                    except Exception as e:
                        print(f"[Card] Lỗi fetch_ohlcv {exchange_name} {symbol}: {e}")
                        if setdata:
                            setdata.emit({'1s': '--', '15s': '--', '30s': '--', '1m': '--'})
                        time.sleep(2)
            except Exception as e:
                print(f"[Card] Lỗi polling thread: {e}")

        self.rsi_worker = FastWorker(self, fetch_and_cheat_emit)
        self.rsi_worker.signals.setdata.connect(self.update_rsi)
        self.rsi_worker.start_thread()

    def _on_rsi_update(self, value):
        self.update_rsi({'1m': value})

    def init_ui(self):
        # Only create the layout and widgets once
        layout = QVBoxLayout(self)
        layout.setContentsMargins(5, 5, 5, 5)
        layout.setSpacing(3)

        # Header: Token (to, đậm), Exchange (nhỏ, dưới), Close button
        header = QHBoxLayout()
        header.setContentsMargins(0, 0, 0, 0)
        header.setSpacing(2)
        title_box = QVBoxLayout()
        title_box.setContentsMargins(0, 0, 0, 0)
        title_box.setSpacing(0)
        lbl_token = QLabel(str(self.token_name))
        lbl_token.setStyleSheet("color: white; font-size: 15px; font-weight: bold; margin-bottom: 2px;")
        lbl_exchange = QLabel(str(self.exchange))
        lbl_exchange.setStyleSheet("color: #bbbbbb; font-size: 10px;")
        title_box.addWidget(lbl_token)
        title_box.addSpacing(2)
        title_box.addWidget(lbl_exchange)
        header.addLayout(title_box)
        header.addStretch()
        btn_close = QPushButton("✕")
        btn_close.setFixedSize(16, 16)
        btn_close.setStyleSheet("color: white; background: transparent; border: none; font-size: 12px;")
        btn_close.clicked.connect(self._on_close)
        header.addWidget(btn_close)
        layout.addLayout(header)

        # Separator
        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("color: white;")
        layout.addWidget(sep)

        # RSI values: luôn hiển thị đủ 4 mốc
        intervals = ["1s", "15s", "30s", "1m"]
        self.rsi_value_labels = {}  # interval: QLabel
        for interval in intervals:
            value = self.rsi_dict.get(interval, "--")
            row = QHBoxLayout()
            lbl_interval = QLabel(str(interval))
            lbl_interval.setStyleSheet("color: white; font-size: 13px;")
            # Format value nếu là số, nếu không thì hiển thị nguyên văn
            try:
                val = float(value)
                value_str = f"{val:.2f}"
            except Exception:
                value_str = str(value)
            lbl_value = QLabel(value_str)
            lbl_value.setStyleSheet("color: white; font-size: 16px;")
            self.rsi_value_labels[interval] = lbl_value
            row.addWidget(lbl_interval)
            row.addStretch()
            row.addWidget(lbl_value)
            layout.addLayout(row)
        layout.addStretch()

    def _on_close(self):
        # Dừng polling thread khi đóng card
        self._is_running = False
        if hasattr(self, 'rsi_monitor') and self.rsi_monitor:
            self.rsi_monitor.stop()
        if hasattr(self, 'rsi_worker') and self.rsi_worker:
            self.rsi_worker.quit()
        self.closeRequested.emit(self.unique_key)
        self.setParent(None)
        self.deleteLater()

    def update_rsi(self, rsi_dict):
        # Đảm bảo luôn là dict (nếu worker emit 1 giá trị thì wrap lại)
        if not isinstance(rsi_dict, dict):
            rsi_dict = {'1m': rsi_dict}
        # Cập nhật giá trị RSI cho card, chỉ update các mốc có trong dict
        for k, v in rsi_dict.items():
            self.rsi_dict[k] = v
            if k in self.rsi_value_labels:
                try:
                    val = float(v)
                    value_str = f"{val:.2f}"
                except Exception:
                    value_str = str(v)
                self.rsi_value_labels[k].setText(value_str)
