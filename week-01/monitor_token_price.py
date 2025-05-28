import requests
from typing import Optional, Tuple
import time
import msvcrt  # For Windows keyboard input detection

# List of tokens to check against Binance API
TOKENS = ['1000CAT', '1000CHEEMS', '1000SATS', '1INCH', '1INCHDOWN', '1INCHUP', '1MBABYDOGE', 'AAVE', 'AAVEDOWN', 'AAVEUP', 'ACA', 'ACE', 'ACH', 'ACM', 'ACT', 'ACX', 'ADA', 'ADADOWN', 'ADAUP', 'ADX', 'AE', 'AERGO', 'AEUR', 'AEVO', 'AGI', 'AGIX', 'AGLD', 'AI', 'AION', 'AIXBT', 'AKRO', 'ALCX', 'ALGO', 'ALICE', 'ALPACA', 'ALPHA', 'ALPINE', 'ALT', 'AMB', 'AMP', 'ANC', 'ANIME', 'ANKR', 'ANT', 'ANY', 'APE', 'API3', 'APPC', 'APT', 'AR', 'ARB', 'ARDR', 'ARK', 'ARKM', 'ARN', 'ARPA', 'ARS', 'ASR', 'AST', 'ASTR', 'ATA', 'ATM', 'ATOM', 'AUCTION', 'AUD', 'AUDIO', 'AUTO', 'AVA', 'AVAX', 'AWE', 'AXL', 'AXS', 'BABY', 'BADGER', 'BAKE', 'BAL', 'BANANA', 'BANANAS31', 'BAND', 'BAR', 'BAT', 'BB', 'BCC', 'BCD', 'BCH', 'BCHA', 'BCHABC', 'BCHDOWN', 'BCHSV', 'BCHUP', 'BCN', 'BCPT', 'BDOT', 'BEAM', 'BEAMX', 'BEAR', 'BEL', 'BERA', 'BETA', 'BETH', 'BGBP', 'BICO', 'BIDR', 'BIFI', 'BIGTIME', 'BIO', 'BKRW', 'BLUR', 'BLZ', 'BMT', 'BNB', 'BNBBEAR', 'BNBBULL', 'BNBDOWN', 'BNBUP', 'BNSOL', 'BNT', 'BNX', 'BOME', 'BOND', 'BONK', 'BOT', 'BQX', 'BRD', 'BRL', 'BROCCOLI714', 'BSW', 'BTC', 'BTCB', 'BTCDOWN', 'BTCST', 'BTCUP', 'BTG', 'BTS', 'BTT', 'BTTC', 'BULL', 'BURGER', 'BUSD', 'BVND', 'BZRX', 'C98', 'CAKE', 'CATI', 'CDT', 'CELO', 'CELR', 'CETUS', 'CFX', 'CGPT', 'CHAT', 'CHESS', 'CHR', 'CHZ', 'CITY', 'CKB', 'CLOAK', 'CLV', 'CMT', 'CND', 'COCOS', 'COMBO', 'COMP', 'COOKIE', 'COP', 'COS', 'COTI', 'COVER', 'COW', 'CREAM', 'CRV', 'CTK', 'CTSI', 'CTXC', 'CVC', 'CVP', 'CVX', 'CYBER', 'CZK', 'D', 'DAI', 'DAR', 'DASH', 'DATA', 'DCR', 'DEGO', 'DENT', 'DEXE', 'DF', 'DGB', 'DGD', 'DIA', 'DLT', 'DNT', 'DOCK', 'DODO', 'DOGE', 'DOGS', 'DOT', 'DOTDOWN', 'DOTUP', 'DREP', 'DUSK', 'DYDX', 'DYM', 'EASY', 'EDO', 'EDU', 'EGLD', 'EIGEN', 'ELF', 'ENA', 'ENG', 'ENJ', 'ENS', 'EOS', 'EOSBEAR', 'EOSBULL', 'EOSDOWN', 'EOSUP', 'EPIC', 'EPS', 'EPX', 'ERD', 'ERN', 'ETC', 'ETH', 'ETHBEAR', 'ETHBULL', 'ETHDOWN', 'ETHFI', 'ETHUP', 'EUR', 'EURI', 'EVX', 'EZ', 'FARM', 'FDUSD', 'FET', 'FIDA', 'FIL', 'FILDOWN', 'FILUP', 'FIO', 'FIRO', 'FIS', 'FLM', 'FLOKI', 'FLOW', 'FLUX', 'FOR', 'FORM', 'FORTH', 'FRONT', 'FTM', 'FTT', 'FUEL', 'FUN', 'FXS', 'G', 'GAL', 'GALA', 'GAS', 'GBP', 'GFT', 'GHST', 'GLM', 'GLMR', 'GMT', 'GMX', 'GNO', 'GNS', 'GNT', 'GO', 'GPS', 'GRS', 'GRT', 'GTC', 'GTO', 'GUN', 'GVT', 'GXS', 'HAEDAL', 'HARD', 'HBAR', 'HC', 'HEGIC', 'HEI', 'HFT', 'HIFI', 'HIGH', 'HIVE', 'HMSTR', 'HNT', 'HOOK', 'HOT', 'HSR', 'HUMA', 'HYPER', 'ICN', 'ICP', 'ICX', 'ID', 'IDEX', 'IDRT', 'ILV', 'IMX', 'INIT', 'INJ', 'INS', 'IO', 'IOST', 'IOTA', 'IOTX', 'IQ', 'IRIS', 'JASMY', 'JOE', 'JPY', 'JST', 'JTO', 'JUP', 'JUV', 'KAIA', 'KAITO', 'KAVA', 'KDA', 'KEEP', 'KERNEL', 'KEY', 'KLAY', 'KMD', 'KMNO', 'KNC', 'KP3R', 'KSM', 'LAYER', 'LAZIO', 'LDO', 'LEND', 'LEVER', 'LINA', 'LINK', 'LINKDOWN', 'LINKUP', 'LISTA', 'LIT', 'LOKA', 'LOOM', 'LPT', 'LQTY', 'LRC', 'LSK', 'LTC', 'LTCDOWN', 'LTCUP', 'LTO', 'LUMIA', 'LUN', 'LUNA', 'LUNC', 'MAGIC', 'MANA', 'MANTA', 'MASK', 'MATIC', 'MAV', 'MBL', 'MBOX', 'MC', 'MCO', 'MDA', 'MDT', 'MDX', 'ME', 'MEME', 'METIS', 'MFT', 'MINA', 'MIR', 'MITH', 'MKR', 'MLN', 'MOB', 'MOD', 'MOVE', 'MOVR', 'MTH', 'MTL', 'MUBARAK', 'MULTI', 'MXN', 'NANO', 'NAS', 'NAV', 'NBS', 'NCASH', 'NEAR', 'NEBL', 'NEIRO', 'NEO', 'NEXO', 'NFP', 'NGN', 'NIL', 'NKN', 'NMR', 'NOT', 'NPXS', 'NTRN', 'NU', 'NULS', 'NXPC', 'NXS', 'OAX', 'OCEAN', 'OG', 'OGN', 'OM', 'OMG', 'OMNI', 'ONDO', 'ONE', 'ONG', 'ONT', 'OOKI', 'OP', 'ORCA', 'ORDI', 'ORN', 'OSMO', 'OST', 'OXT', 'PARTI', 'PAX', 'PAXG', 'PDA', 'PENDLE', 'PENGU', 'PEOPLE', 'PEPE', 'PERL', 'PERP', 'PHA', 'PHB', 'PHX', 'PIVX', 'PIXEL', 'PLA', 'PLN', 'PNT', 'PNUT', 'POA', 'POE', 'POL', 'POLS', 'POLY', 'POLYX', 'POND', 'PORTAL', 'PORTO', 'POWR', 'PPT', 'PROM', 'PROS', 'PSG', 'PUNDIX', 'PYR', 'PYTH', 'QI', 'QKC', 'QLC', 'QNT', 'QSP', 'QTUM', 'QUICK', 'RAD', 'RAMP', 'RARE', 'RAY', 'RCN', 'RDN', 'RDNT', 'RED', 'REEF', 'REI', 'REN', 'RENBTC', 'RENDER', 'REP', 'REQ', 'REZ', 'RGT', 'RIF', 'RLC', 'RNDR', 'RON', 'RONIN', 'ROSE', 'RPL', 'RPX', 'RSR', 'RUB', 'RUNE', 'RVN', 'S', 'SAGA', 'SALT', 'SAND', 'SANTOS', 'SC', 'SCR', 'SCRT', 'SEI', 'SFP', 'SHELL', 'SHIB', 'SIGN', 'SKL', 'SKY', 'SLF', 'SLP', 'SNGLS', 'SNM', 'SNT', 'SNX', 'SOL', 'SOLV', 'SPARTA', 'SPELL', 'SRM', 'SSV', 'STEEM', 'STG', 'STMX', 'STO', 'STORJ', 'STORM', 'STPT', 'STRAT', 'STRAX', 'STRK', 'STX', 'SUB', 'SUI', 'SUN', 'SUPER', 'SUSD', 'SUSHI', 'SUSHIDOWN', 'SUSHIUP', 'SWRV', 'SXP', 'SXPDOWN', 'SXPUP', 'SXT', 'SYN', 'SYRUP', 'SYS', 'T', 'TAO', 'TCT', 'TFUEL', 'THE', 'THETA', 'TIA', 'TKO', 'TLM', 'TNB', 'TNSR', 'TNT', 'TOMO', 'TON', 'TORN', 'TRB', 'TRIBE', 'TRIG', 'TROY', 'TRU', 'TRUMP', 'TRX', 'TRXDOWN', 'TRXUP', 'TRY', 'TST', 'TURBO', 'TUSD', 'TUSDB', 'TUT', 'TVK', 'TWT', 'UAH', 'UFT', 'UMA', 'UNFI', 'UNI', 'UNIDOWN', 'UNIUP', 'USD1', 'USDC', 'USDP', 'USDS', 'USDSB', 'USDT', 'UST', 'USTC', 'USUAL', 'UTK', 'VAI', 'VANA', 'VANRY', 'VELODROME', 'VEN', 'VET', 'VGX', 'VIA', 'VIB', 'VIBE', 'VIC', 'VIDT', 'VIRTUAL', 'VITE', 'VOXEL', 'VTHO', 'W', 'WABI', 'WAN', 'WAVES', 'WAXP', 'WBETH', 'WBTC', 'WCT', 'WIF', 'WIN', 'WING', 'WINGS', 'WLD', 'WNXM', 'WOO', 'WPR', 'WRX', 'WTC', 'XAI', 'XEC', 'XEM', 'XLM', 'XLMDOWN', 'XLMUP', 'XMR', 'XNO', 'XRP', 'XRPBEAR', 'XRPBULL', 'XRPDOWN', 'XRPUP', 'XTZ', 'XTZDOWN', 'XTZUP', 'XUSD', 'XVG', 'XVS', 'XZC', 'YFI', 'YFIDOWN', 'YFII', 'YFIUP', 'YGG', 'YOYO', 'ZAR', 'ZEC', 'ZEN', 'ZIL', 'ZK', 'ZRO', 'ZRX']

# List of currency codes
CURRENCY_CODES = ['USD', 'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'FOK', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KID', 'KMF', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XCG', 'XDR', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL']

# Optional: Fetch all tokens from Binance once and store them in a set
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

        # Extract all trading symbols
        for symbol_info in data['symbols']:
            tokens.add(symbol_info['baseAsset'])
            tokens.add(symbol_info['quoteAsset'])

        return tokens

    except Exception as e:
        print(f"Error fetching tokens: {str(e)}")
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
            current_price = convert_currency(get_token_price(token_id), 'USD', currency)

            if current_price is not None:
                if last_price is None:
                    print(f"Initial {token_id} price: {current_price:,.2f} {currency}")
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
                        print("\nStopping current monitoring, returning to token selection...")
                        return True
                except UnicodeDecodeError as e:
                    print(f"Error decoding key input.")

            time.sleep(1)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
        return True


def main():
    currency = 'USD'  # Default currency

    while True:
        # Clear the console screen
        print("\033c", end="")

        print("=================== Crypto Token Monitoring Program ===================\n")
        print("1. View all available tokens - Press '1'")
        print(f"2. Change currency (current: {currency}) - Press '2'")
        print("3. Monitor token price - Press '3'")
        print("4. Exit - Press '4'")

        mode_choice = input("Select an option (1/2/3/4): ").strip()

        if mode_choice == '1':
            print("\033c", end="")
            print("Available tokens:")
            print(", ".join(sorted(TOKENS)))
            input("Press Enter to continue...")

        elif mode_choice == '2':
            print("\033c", end="")
            print("Available currencies:")
            print(", ".join(sorted(CURRENCY_CODES)))

            currency = input("Enter the currency code you want to use (default: USD): ").strip().upper() or 'USD'
            if currency not in CURRENCY_CODES:
                print(f"Invalid currency code '{currency}'. Defaulting to USD.")
                input("Press Enter to continue...")

        elif mode_choice == '3':
            print("\033c", end="")

            token_id = input("Enter token symbol (e.g., BTC, ETH): ").strip().upper()
            if not token_id:
                print("Token symbol cannot be empty. Please try again.")
                continue

            exists, message = check_token_exists(token_id)
            if not exists:
                print(message)
                input("Press Enter to continue...")
                continue

            while True:
                stop_monitoring = monitor_price_changes(token_id, currency)
                if stop_monitoring:
                    break
        
        elif mode_choice == '4':
            print("Exiting the program. Goodbye!")
            break

        else:
            print("Invalid option. Please try again.")
            
if __name__ == "__main__":
    main()