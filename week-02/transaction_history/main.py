from CONSTANTS import *
import json
from solana_wallet import SolanaWallet
from balance_graph import BalanceGraph
from datetime import datetime
import os

def main():
    # Devnet example
    # wallet_address = "4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK"
    # spaKHLLWQEPtVFjoNeLjjyRWZ8sVu9DRiDAMUwb5CdW
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
    
    save_graph = input("Do you want to save the balance graph? (yes/no): ").strip().lower()
    if save_graph not in ["yes", "no"]:
        print("Invalid input. Defaulting to 'no'.")
        save_graph = "no"
    elif save_graph == "yes":
        save_graph = True
    else:
        save_graph = False

    # Create SolanaWallet instance and fetch transactions
    wallet = SolanaWallet(wallet_address, endpoint)
    transactions = wallet.get_recent_transactions(limit=limit)
    other_info = wallet.get_account_other_info(show_zero_balance_accounts=True) # Slower if we get token names

    # Get the current date and time for the filename
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Create json directory if it doesn't exist
    if not os.path.exists("json"):
        os.makedirs("json")

    # Save transactions and other info to JSON files
    with open(f"json/transactions_{wallet_address}_{current_time}.json", "w") as f:
        json.dump(transactions, f, indent=4)
        print(f"Saved {len(transactions)} transactions to transactions.json")
    
    with open(f"json/other_info_{wallet_address}_{current_time}.json", "w") as f:
        json.dump(other_info, f, indent=4)
        print(f"Saved other account info to other_info.json")
    
    # Create BalanceGraph instance and plot the balance graph
    if save_graph:
        balance_graph = BalanceGraph(wallet_address, transactions)
        plt = balance_graph.plot_balance_graph()

        # Create img directory if it doesn't exist
        if not os.path.exists("img"):
            os.makedirs("img")
            
        # Save the plot to a file
        plt.savefig(f"img/balance_graph_{wallet_address}_{current_time}.png")
        print(f"Balance graph saved as balance_graph_{wallet_address}.png")

if __name__ == "__main__":
    main()