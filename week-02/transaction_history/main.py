from CONSTANTS import *
import json
from solana_wallet import SolanaWallet

def main():
    # Devnet example
    # wallet_address = "4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK"
    # endpoint = DEVNET_ENDPOINT

    # Mainnet example
    # wallet_address = "ALBzE7T2wwaTA8ngCww2R5EzD5C1HjpwHDru2UN6YSeb"
    # endpoint = MAINNET_ENDPOINT
    # limit = 50

    wallet_address = input("Enter the Solana wallet address: ")
    endpoint_input = input("Enter the endpoint (mainnet, devnet, testnet): ").strip().lower()
    endpoint = None
    if endpoint_input == "mainnet":
        endpoint = MAINNET_ENDPOINT
    elif endpoint_input == "devnet":
        endpoint = DEVNET_ENDPOINT
    elif endpoint_input == "testnet":
        endpoint = TESTNET_ENDPOINT
    else:
        print("Invalid endpoint. Defaulting to mainnet.")
        endpoint = MAINNET_ENDPOINT
    
    limit = input("Enter the number of transactions to retrieve (default is 50): ")
    if not limit.isdigit():
        print("Invalid input for limit. Defaulting to 50.")
        limit = 50
    else:
        limit = int(limit)

    wallet = SolanaWallet(wallet_address, endpoint)
    transactions = wallet.get_recent_transactions(limit=limit)
    other_info = wallet.get_account_other_info(show_zero_balance_accounts=True) # Slower if we get token names

    # Save transactions and other info to JSON files
    with open("transactions.json", "w") as f:
        json.dump(transactions, f, indent=4)
        print(f"Saved {len(transactions)} transactions to transactions.json")
    
    with open("other_info.json", "w") as f:
        json.dump(other_info, f, indent=4)
        print(f"Saved other account info to other_info.json")

if __name__ == "__main__":
    main()