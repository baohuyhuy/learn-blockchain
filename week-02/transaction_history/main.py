from CONSTANTS import *
import json
from solana_wallet import SolanaWallet

def main():
    # Devnet example
    # wallet_address = "4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK"
    # endpoint = DEVNET_ENDPOINT

    # Mainnet example
    wallet_address = "ALBzE7T2wwaTA8ngCww2R5EzD5C1HjpwHDru2UN6YSeb"
    endpoint = MAINNET_ENDPOINT
    limit = 5

    wallet = SolanaWallet(wallet_address, endpoint)
    transactions = wallet.get_recent_transactions(limit=limit)
    other_info = wallet.get_account_other_info(show_zero_balance_accounts=True) # Slower if we get token names

    # Save transactions and other info to JSON files
    with open("transactions.json", "w") as f:
        json.dump(transactions, f, indent=4)
    
    with open("other_info.json", "w") as f:
        json.dump(other_info, f, indent=4)

if __name__ == "__main__":
    main()