import requests
from typing import Optional, Tuple


def get_all_tokens() -> set:
    """
    Fetch all trading pairs from Binance and return a set of unique token symbols.

    Returns:
        set: A set of unique token symbols available for trading on Binance.
    """
    try:
        print("Fetching all tokens from Binance (one-time operation)...")

        # Binance API endpoint for exchange information
        url = "https://api.binance.com/api/v3/exchangeInfo"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        tokens = set()

        # Extract all token symbols from trading pairs
        for symbol in data['symbols']:
            # Only include USDT trading pairs to get base tokens
            if symbol['symbol'].endswith('USDT'):
                base_token = symbol['baseAsset']
                tokens.add(base_token)

        return tokens

    except Exception as e:
        print(f"Error fetching tokens: {str(e)}")
        return set()


def check_token_exists(token_id: str, allTokens: set) -> Tuple[bool, str]:
    """
    Check if a token exists on Binance.

    Args:
        token_id (str): The token symbol (e.g., 'BTC', 'ETH')
        allTokens (set): A set of all tokens available for trading on Binance

    Returns:
        Tuple[bool, str]: (exists, message)
    """
    if token_id in allTokens:
        return True, f"Token '{token_id}' found."
    else:
        return False, f"Token '{token_id}' not exists or not available for trading."


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
            print(f"Price not found for {token_id}")
            return None

    except requests.exceptions.RequestException as e:
        print(f"Error fetching price: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None
