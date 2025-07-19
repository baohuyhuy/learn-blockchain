from enum import Enum
from .crypto import CryptoExchange, CryptoExchange_WS
import pandas as pd


import pandas as pd

def rma(series, length):
    return series.ewm(alpha=1/length, min_periods=length, adjust=False).mean()

class RSIIndicator:
    def __init__(self, period=14, mamode='rma', drift=1, offset=0, scalar=100):
        self.period = period
        self.mamode = mamode
        self.drift = drift
        self.offset = offset
        self.scalar = scalar

    def calculate(self, closes):
        # Khi khởi tạo lần đầu: truyền toàn bộ closes (vd: 1500 nến)
        # Khi cập nhật realtime: chỉ cần truyền closes[-self.period*5:]
        if len(closes) < self.period:
            return None
        # Nếu dữ liệu quá dài (realtime update), chỉ lấy length*5 giá trị cuối
        closes = list(closes)
        if len(closes) > self.period * 5:
            closes = closes[-self.period*5:]
        close = pd.Series(closes)
        diff = close.diff(self.drift)
        positive = diff.copy()
        negative = diff.copy()
        positive[positive < 0] = 0
        negative[negative > 0] = 0

        if self.mamode == 'rma':
            pos_avg = rma(positive, self.period)
            neg_avg = rma(negative, self.period)
        elif self.mamode == 'ema':
            pos_avg = positive.ewm(span=self.period, min_periods=self.period, adjust=False).mean()
            neg_avg = negative.ewm(span=self.period, min_periods=self.period, adjust=False).mean()
        elif self.mamode == 'sma':
            pos_avg = positive.rolling(window=self.period, min_periods=self.period).mean()
            neg_avg = negative.rolling(window=self.period, min_periods=self.period).mean()
        else:
            pos_avg = rma(positive, self.period)
            neg_avg = rma(negative, self.period)

        pos = pos_avg.iloc[-1]
        neg = abs(neg_avg.iloc[-1])
        # Nếu pos hoặc neg là NaN (do dữ liệu không hợp lệ), trả về 50 (trung tính)
        if pd.isna(pos) or pd.isna(neg):
            return 50.0
        if pos + neg == 0:
            rsi_val = 50.0
        elif neg == 0:
            rsi_val = 100.0
        elif pos == 0:
            rsi_val = 0.0
        else:
            rsi_val = self.scalar * pos / (pos + neg)
        if self.offset != 0:
            pass
        return float(rsi_val)