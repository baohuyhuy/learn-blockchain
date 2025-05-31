import sys
import time
from getch import getch
from currencies import convert_currency
from tokens import get_token_price

if sys.platform == 'win32':
    import msvcrt
    def is_key_pressed():
        return msvcrt.kbhit()

    def get_key():
        return msvcrt.getch().decode('utf-8')
else:
    import select
    import tty
    import termios

    def is_key_pressed():
        dr, _, _ = select.select([sys.stdin], [], [], 0)
        return bool(dr)

    def get_key():
        return sys.stdin.read(1)

def monitor_price_changes(token_id: str, currency: str) -> bool:
    print(f"Starting to monitor {token_id} price...")
    print("Press 'x' to go back.")
    last_price = None

    if sys.platform != 'win32':
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        tty.setcbreak(fd)

    try:
        while True:
            current_price = convert_currency(
                get_token_price(token_id), 'USD', currency)

            if current_price is not None:
                if last_price is None:
                    print(
                        f"Initial {token_id} price: {current_price:,.2f} {currency}")
                elif current_price != last_price:
                    change = current_price - last_price
                    change_percent = (change / last_price) * 100
                    direction = "↑" if change > 0 else "↓"
                    print(
                        f"Price changed: {current_price:,.2f} {currency} ({direction} {abs(change_percent):.2f}%)")

                last_price = current_price

            start_time = time.time()
            while time.time() - start_time < 1:
                if is_key_pressed():
                    key = get_key()
                    if key.lower() == 'x':
                        print("\nStopping current monitoring, returning to token selection...")
                        return True
                time.sleep(0.05)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
        return True
    finally:
        if sys.platform != 'win32':
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)