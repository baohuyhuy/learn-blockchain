import requests
import json
import time
from datetime import datetime

# endpoint = "https://api.mainnet-beta.solana.com"
# wallet_address = "ALBzE7T2wwaTA8ngCww2R5EzD5C1HjpwHDru2UN6YSeb"
# limit = 50

# headers = {"Content-Type": "application/json"}

# # Prepare the JSON-RPC request
# payload = {
#     "jsonrpc": "2.0",
#     "id": 1,
#     "method": "getSignaturesForAddress",
#     "params": [wallet_address, {"limit": limit}]
# }

# # Make the API request
# response = requests.post(endpoint, headers=headers, data=json.dumps(payload))

# if response.status_code != 200:
#     print(f"Error fetching signatures: {response.status_code}")

# data = response.json()
# print(len(data["result"]))
# print(data["result"][0])

# signature = "a9o1XMF5qWCdAMq4EbiyQXRjZHffY2jw6fpRVDQGEkAXwUBHaHCtZAg283r5CskAPT2GJbZRbDFxSfvUEvwAJJf"
# payload = {
#     "jsonrpc": "2.0",
#     "id": 1,
#     "method": "getTransaction",
#     "params": [signature, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]
# }

# response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
# print(response.json())

MAINNET_ENDPOINT = "https://api.mainnet-beta.solana.com"
DEVNET_ENDPOINT = "https://api.devnet.solana.com"
TESTNET_ENDPOINT = "https://api.testnet.solana.com"
REST_TIME = 1  # seconds to wait between requests

def get_signatures_for_address(wallet_address, endpoint=MAINNET_ENDPOINT, limit=10, before=None, until=None):
    headers = {"Content-Type": "application/json"}
    
    # Create params object with commitment set to "finalized"
    params = {
        "limit": limit,
        "commitment": "finalized"
    }
    
    # Add optional parameters if provided
    if before:
        params["before"] = before
    if until:
        params["until"] = until
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getSignaturesForAddress",
        "params": [wallet_address, params]
    }
    
    response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
    
    if response.status_code != 200:
        raise Exception(f"Error fetching signatures: {response.status_code}")
    
    return response.json()["result"]

def get_transaction(signature, endpoint=MAINNET_ENDPOINT):
    headers = {"Content-Type": "application/json"}
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTransaction",
        "params": [signature, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]
    }
    
    response = requests.post(endpoint, headers=headers, data=json.dumps(payload))
    
    if response.status_code == 429:  # Too Many Requests
        raise Exception("Rate limit exceeded. Please try again later.")
    elif response.status_code != 200:
        raise Exception(f"Error fetching transaction: {response.status_code}.")
    
    return response.json()

def display_transaction_info(transaction):
    if "result" not in transaction or transaction["result"] is None:
        print("Transaction not found or invalid signature.")
        return
    
    tx = transaction["result"]
    lamports_per_sol = 1000000000
    
    # Create a JSON object with all the transaction details
    transaction_info = {
        "signature": tx['transaction']['signatures'][0],
        "block": tx['slot'],
        "timestamp": datetime.fromtimestamp(tx['blockTime']).strftime('%Y-%m-%d %H:%M:%S'),
        "version": tx.get('version', 'legacy'),
        "fee_in_sol": tx["meta"]["fee"] / lamports_per_sol,
    }
    
    # Add compute units if available
    if "computeUnitsConsumed" in tx["meta"]:
        transaction_info["compute_units_consumed"] = tx['meta']['computeUnitsConsumed']
    
    # Add block hash if available
    if "recentBlockhash" in tx["transaction"]["message"]:
        transaction_info["previous_block_hash"] = tx['transaction']['message']['recentBlockhash']
    
    # Add lookup table accounts if available
    if "addressTableLookups" in tx["transaction"]["message"] and tx["transaction"]["message"]["addressTableLookups"]:
        transaction_info["lookup_table_accounts"] = []
        for lookup in tx["transaction"]["message"]["addressTableLookups"]:
            transaction_info["lookup_table_accounts"].append(lookup['accountKey'])
    
    # Add signers
    transaction_info["signers"] = []
    account_keys = tx["transaction"]["message"]["accountKeys"]
    num_signers = tx["transaction"]["message"].get("header", {}).get("numRequiredSignatures", 0)
    for i in range(min(num_signers, len(account_keys))):
        transaction_info["signers"].append(account_keys[i])
    
    # Add from/to if we can determine them
    if len(account_keys) >= 2:
        balance_change = (tx["meta"]["postBalances"][0] - tx["meta"]["preBalances"][0]) / lamports_per_sol
        transaction_info["from"] = {
            "address": account_keys[0]['pubkey'],
            "balance_before": tx["meta"]["preBalances"][0] / lamports_per_sol,
            "balance_after": tx["meta"]["postBalances"][0] / lamports_per_sol,
            "balance_change": balance_change
        }
        
        # Look for SOL balance changes to identify potential recipients
        recipients = []
        if "postBalances" in tx["meta"] and "preBalances" in tx["meta"]:
            for i, (pre, post) in enumerate(zip(tx["meta"]["preBalances"], tx["meta"]["postBalances"])):
                if i < len(account_keys) and i > 0:  # Skip first account (potential sender)
                    change = (post - pre) / lamports_per_sol
                    if change > 0:
                        recipients.append(account_keys[i]['pubkey'])
        
        if recipients:
            transaction_info["to"] = [
                {
                    "address": recipient,
                    "balance_before": tx["meta"]["preBalances"][i] / lamports_per_sol,
                    "balance_after": tx["meta"]["postBalances"][i] / lamports_per_sol,
                    "balance_change": -balance_change
                } for i, recipient in enumerate(recipients) if i < len(account_keys)
            ]
    
    # Add instructions
    transaction_info["instructions"] = []
    instructions = tx["transaction"]["message"]["instructions"]
    for i, instruction in enumerate(instructions):
        instruction_info = {
            "program_id": instruction.get("programId", "Unknown"),
        }
        
        # If instruction is parsed, add details
        if "parsed" in instruction:
            instruction_info["type"] = instruction['parsed'].get('type', 'Unknown')
            if "info" in instruction["parsed"]:
                instruction_info["info"] = instruction["parsed"]["info"]
        
        # Add accounts involved in this instruction
        if "accounts" in instruction:
            instruction_info["accounts"] = []
            for idx, acc_idx in enumerate(instruction["accounts"]):
                if idx < len(account_keys):
                    instruction_info["accounts"].append(account_keys[idx]['pubkey'])
        
        transaction_info["instructions"].append(instruction_info)
    
    return transaction_info
    
def main():
    # wallet_address = "ALBzE7T2wwaTA8ngCww2R5EzD5C1HjpwHDru2UN6YSeb" # Mainnet example
    wallet_address = "4PkiqJkUvxr9P8C1UsMqGN8NJsUcep9GahDRLfmeu8UK" # Devnet example
    limit = 5
    
    # Fetch signatures
    signatures = get_signatures_for_address(wallet_address, endpoint=DEVNET_ENDPOINT, limit=limit)
    
    print(f"Found {len(signatures)} signatures for address {wallet_address}")
    
    # Fetch details for each signature
    for sig in signatures:
        transaction = get_transaction(sig["signature"], endpoint=DEVNET_ENDPOINT)
        transaction_info = display_transaction_info(transaction)
        print(json.dumps(transaction_info, indent=4))
        print("-" * 40)
        time.sleep(REST_TIME)

# def main():
#     signature = "4mMNrQLT4zbgjVKv7aQhns7ryALzBHNxU2o4TdSwXfsHv4SEvnBdTDPXGLBdtzZYmfpmR4FMLFLfLEnvSn9Srv3a"  # Example address

#     transaction = get_transaction(signature, endpoint=MAINNET_ENDPOINT)
#     transaction_info = display_transaction_info(transaction)
#     print(json.dumps(transaction_info, indent=4))

if __name__ == "__main__":
    main()