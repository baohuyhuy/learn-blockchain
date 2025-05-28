import time
import msvcrt  # For Windows keyboard input detection
from currencies import convert_currency
from tokens import get_token_price


def monitor_price_changes(token_id: str, currency: str) -> bool:
    """
    Continuously monitor token price changes and print updates.

    Args:
        token_id (str): The token symbol to monitor (e.g., 'BTC', 'ETH')
        currency (str): The currency code to convert the price to (e.g., 'USD')

    Returns:
        bool: True if user wants to monitor another token, False to exit program
    """
    print(f"Starting to monitor {token_id} price...")
    print("Press 'x' to go back.")
    last_price = None

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

            # Check for keyboard input
            if msvcrt.kbhit():
                try:
                    key = msvcrt.getch().decode('utf-8').lower()
                    if key == 'x':
                        print(
                            "\nStopping current monitoring, returning to token selection...")
                        return True
                except UnicodeDecodeError as e:
                    pass

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
        return True
