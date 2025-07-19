import asyncio
from .manager import ExchangeManager
from .indicator import RSIIndicator
from .crypto import CryptoExchange_WS
import pandas as pd

async def calculate_rsi_wilder(closes, period=14):
    rsi_indicator = RSIIndicator(period)
    return rsi_indicator.calculate(closes)

async def monitor_token_rsi(ws, symbol, timeframe="1m"):
    print(f"Bắt đầu theo dõi {symbol} trên khung {timeframe}...")
    try:
        all_candles = await ws.fetch_ohlcv(symbol, timeframe=timeframe, limit=1000)
        if not all_candles:
            print(f"Không có dữ liệu lịch sử cho {symbol}, không thể bắt đầu.")
            return
        closes = [candle[4] for candle in all_candles]
        print(f"Đã lấy {len(closes)} nến lịch sử cho {symbol}. Bắt đầu theo dõi real-time.")
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu lịch sử cho {symbol}: {e}")
        return
    while True:
        try:
            new_candles = await ws.watch_ohlcv(symbol, timeframe=timeframe)
            for candle in new_candles:
                is_new_candle_formed = candle[0] > all_candles[-1][0]
                if is_new_candle_formed:
                    if len(closes) > 14:
                        rsi = await calculate_rsi_wilder(closes)
                        print(f"--- NẾN {timeframe} ĐÃ ĐÓNG ---")
                        print(f"{symbol}: RSI-14 = {rsi:.2f} | Thời gian: {pd.to_datetime(all_candles[-1][0], unit='ms')}")
                    all_candles.append(candle)
                    closes.append(candle[4])
                    if len(closes) > 500:
                        closes.pop(0)
                        all_candles.pop(0)
                elif candle[0] == all_candles[-1][0]:
                    all_candles[-1] = candle
                    closes[-1] = candle[4]
        except Exception as e:
            print(f"Lỗi theo dõi {symbol}: {str(e)}")
            await asyncio.sleep(5)

async def main():
    # Thiết lập mặc định để debug nhanh
    tokens_input = input("Nhập danh sách token (Enter để mặc định BTC/USDT): ").strip()
    if not tokens_input:
        tokens = ["BTC/USDT"]
        print("Sử dụng token mặc định: BTC/USDT")
    else:
        tokens = [t.strip() for t in tokens_input.split(",")]
    
    exchange_name = input("Nhập tên sàn (Enter để mặc định binanceusdm): ").strip()
    if not exchange_name:
        exchange_name = "binanceusdm"
        print("Sử dụng sàn mặc định: binanceusdm")
    
    timeframe = input("Khung thời gian (Enter để mặc định 1m): ").strip() or "1m"
    print(f"Khung thời gian: {timeframe}")
    
    print(f"Đang kết nối websocket đến {exchange_name}...")
    ws = CryptoExchange_WS()
    ws.setupEchange(exchange_name=exchange_name)
    print("Đang tải danh sách markets...")
    markets = await ws.load_markets()
    print(f"Đã tải {len(markets)} markets từ {exchange_name}")
    
    valid_tokens = []
    for token in tokens:
        if token in markets:
            valid_tokens.append(token)
            print(f"✓ Token {token} hợp lệ trên {exchange_name}")
        else:
            print(f"✗ Token {token} không tìm thấy trên sàn {exchange_name}")
    
    if not valid_tokens:
        print("Không có token hợp lệ nào để theo dõi!")
        return
    
    print(f"Bắt đầu theo dõi {len(valid_tokens)} token: {valid_tokens}")
    tasks = [monitor_token_rsi(ws, token, timeframe) for token in valid_tokens]
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        print("Đang dừng chương trình...")
    finally:
        if ws.exchange:
            await ws.close()

if __name__ == "__main__":
    try:
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    except ImportError:
        if asyncio.get_event_loop_policy().__class__.__name__ == 'WindowsSelectorEventLoopPolicy':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())