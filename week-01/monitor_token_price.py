import requests
from typing import Optional, Tuple
import time


def check_token_exists(token_id: str) -> Tuple[bool, str]:
    """
    Check if a token exists on Binance.

    Args:
        token_id (str): The token symbol (e.g., 'BTC', 'ETH')

    Returns:
        Tuple[bool, str]: (exists, message)
    """
    try:
        # Get all trading pairs from Binance
        url = "https://api.binance.com/api/v3/exchangeInfo"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        symbol = f"{token_id.upper()}USDT"

        # Check if the symbol exists in the trading pairs
        for pair in data['symbols']:
            if pair['symbol'] == symbol and pair['status'] == 'TRADING':
                return True, f"Token {token_id} is available for trading"

        return False, f"Token {token_id} is not exist or not available for trading"

    except Exception as e:
        return False, f"Error checking token: {str(e)}"


def get_token_price(token_id: str) -> Optional[float]:
    """
    Get the current price of a token using Binance API.

    Args:
        token_id (str): The token symbol (e.g., 'BTC', 'ETH')

    Returns:
        Optional[float]: The current price in USD, or None if the token is not found
    """
    try:
        # Convert token_id to uppercase for Binance API
        symbol = f"{token_id.upper()}USDT"

        # Binance API endpoint for ticker price
        url = f"https://api.binance.com/api/v3/ticker/price"

        # Parameters for the API request
        params = {
            "symbol": symbol
        }

        # Make the API request
        response = requests.get(url, params=params)
        response.raise_for_status()

        # Parse the response
        data = response.json()

        # Extract the price
        if "price" in data:
            return float(data["price"])
        else:
            print(f"Token '{token_id}' not found")
            return None

    except requests.exceptions.RequestException as e:
        print(f"Error fetching price: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None


def monitor_price_changes(token_id: str):
    """
    Continuously monitor token price changes and print updates.

    Args:
        token_id (str): The token symbol to monitor (e.g., 'BTC', 'ETH')
    """
    print(f"Starting to monitor {token_id} price...")
    last_price = None

    try:
        while True:
            current_price = get_token_price(token_id)

            if current_price is not None:
                if last_price is None:
                    print(f"Initial {token_id} price: ${current_price:,.2f}")
                elif current_price != last_price:
                    change = current_price - last_price
                    change_percent = (change / last_price) * 100
                    direction = "↑" if change > 0 else "↓"
                    print(
                        f"Price changed: ${current_price:,.2f} ({direction} {abs(change_percent):.2f}%)")

                last_price = current_price

            time.sleep(1)  # Wait for 1 second before next check

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")


def main():
    # Get token id from user
    token_id = input("Enter token symbol (e.g., BTC, ETH): ").upper()

    # Check if token exists before monitoring
    exists, message = check_token_exists(token_id)
    if not exists:
        print(message)
        return

    # Start monitoring price changes
    monitor_price_changes(token_id)


if __name__ == "__main__":
    main()
