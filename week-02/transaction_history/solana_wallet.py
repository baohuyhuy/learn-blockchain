import requests
import json
from datetime import datetime
import time
from CONSTANTS import *

class SolanaWallet:
    def __init__(self, wallet_address, endpoint=MAINNET_ENDPOINT):
        self.wallet_address = wallet_address
        self.endpoint = endpoint

    def __get_sol_balance(self):
        headers = {"Content-Type": "application/json"}
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [self.wallet_address, {"commitment": "finalized"}]
        }
        
        response = requests.post(self.endpoint, headers=headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            raise Exception(f"Error fetching balance: {response.status_code}")
        
        return response.json()["result"]["value"] / 1_000_000_000  # Convert lamports to SOL

    def __get_token_name(self, mint_address, url=TOKEN_LIST_URL):
        headers = {"Content-Type": "application/json"}
        response = requests.get(url + mint_address)
        
        if response.status_code != 200:
            raise Exception(f"Error fetching token name: {response.status_code}")
        
        start = response.text.find("<title>") + len("<title>")
        end = response.text.find("</title>", start)
        token_name = response.text[start:end].strip().replace("Transaction History | ", "").replace("Token | ", "")
        print(f"Token Name: {token_name}")
        
        return token_name if token_name else "Unknown Token"

    def __get_token_accounts_info(self, show_zero_balance_accounts, show_token_names):
        headers = {"Content-Type": "application/json"}
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [self.wallet_address, {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}, {"encoding": "jsonParsed", "commitment": "finalized"}]
        }
        
        response = requests.post(self.endpoint, headers=headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            raise Exception(f"Error fetching token accounts: {response.status_code}")
        
        data = response.json()["result"]["value"]
        token_acounts_info = []
        for account in data:
            account_info = {   
                "pubkey": account["pubkey"],
                "mint": account["account"]["data"]["parsed"]["info"]["mint"],
                "owner": account["account"]["data"]["parsed"]["info"]["owner"],
                "token_balance": account["account"]["data"]["parsed"]["info"]["tokenAmount"]["uiAmount"],
            }

            # Skip accounts with zero balance if show_zero_balance_accounts is False
            if not show_zero_balance_accounts and account_info["token_balance"] <= 0:
                continue

            token_acounts_info.append(account_info)

            if show_token_names:
                # Fetch token names for each mint address
                token_name = self.__get_token_name(account_info["mint"])
                account_info["token_name"] = token_name if token_name else "Unknown Token"
        
        # Sort by token balance in descending order
        token_acounts_info.sort(key=lambda x: x["token_balance"], reverse=True)
        return token_acounts_info

    def __get_signatures_for_address(self, limit, before, until):
        headers = {"Content-Type": "application/json"}
        
        params = {
            "limit": limit,
            "commitment": "finalized"
        }
        
        if before:
            params["before"] = before
        if until:
            params["until"] = until
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [self.wallet_address, params]
        }
        
        response = requests.post(self.endpoint, headers=headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            raise Exception(f"Error fetching signatures: {response.status_code}")
        
        return response.json()["result"]

    def __get_transaction_info(self, signature):
        headers = {"Content-Type": "application/json"}
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTransaction",
            "params": [signature, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}]
        }
        
        response = requests.post(self.endpoint, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 429:  # Too Many Requests
            raise Exception("Rate limit exceeded. Please try again later.")
        elif response.status_code != 200:
            raise Exception(f"Error fetching transaction: {response.status_code}.")
        
        return response.json()

    def __display_transaction_info(self, transaction):
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
    
    def get_recent_transactions(self, limit=10, before=None, until=None):
        signatures = self.__get_signatures_for_address(limit, before, until)
        print(f"Fetched {len(signatures)} signatures for address {self.wallet_address}")
        transactions = []
        
        for sig in signatures:
            try:
                tx_info = self.__get_transaction_info(sig["signature"])
                transaction_info = self.__display_transaction_info(tx_info)
                transactions.append(transaction_info)
                print(f"Fetched transaction for signature: {sig['signature']}")
                print(f"Sleeping for {REST_TIME} seconds to respect rate limits...")
                time.sleep(REST_TIME)  # Respect rate limits

            except Exception as e:
                print(f"Error processing transaction {sig['signature']}: {e}")
        
        return transactions
    
    def get_account_other_info(self, show_zero_balance_accounts=False, show_token_names=False):
        print("Fetching SOL balance and token accounts info...")

        sol_balance = self.__get_sol_balance()
        print(f"SOL Balance: {sol_balance} SOL")

        token_accounts_info = self.__get_token_accounts_info(show_zero_balance_accounts, show_token_names)
        print(f"Total Token Accounts: {len(token_accounts_info)}")
        
        return {
            "sol_balance": sol_balance,
            "token_accounts_info": token_accounts_info
        }
    
