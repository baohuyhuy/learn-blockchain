import requests
from typing import Optional


def get_all_currencies():
    """
    Fetch all currencies from the latest exchange rates.

    Returns:
        set: A set of all currencies available for trading on Binance.
    """
    try:
        print("Fetching all currencies (one-time operation)...")
        url = "https://open.er-api.com/v6/latest/USD"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        return set(data['rates'].keys())

    except Exception as e:
        print(f"Error fetching currencies: {str(e)}")
        return set()


def convert_currency(amount, from_currency, to_currency) -> Optional[float]:
    """
    Convert an amount from one currency to another using the latest exchange rates.

    Args:
        amount (float): The amount to convert.
        from_currency (str): The currency code to convert from (e.g., 'USD').
        to_currency (str): The currency code to convert to (e.g., 'EUR').

    Returns:
        Optional[float]: The converted amount, or None if conversion fails.
    """
    try:
        # Fetch the latest exchange rates
        url = f"https://open.er-api.com/v6/latest/{from_currency}"
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        # Check if the target currency exists in the rates
        if to_currency in data['rates']:
            rate = data['rates'][to_currency]
            return amount * rate
        else:
            print(f"Currency '{to_currency}' not found in exchange rates.")
            return None

    except requests.exceptions.RequestException as e:
        print(f"Error fetching exchange rates: {e}")
        return None
