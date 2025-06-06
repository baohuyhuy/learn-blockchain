import requests
import json
from datetime import datetime
import time
from CONSTANTS import *

# Libraries for Solana interaction
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.signature import Signature
from solana.rpc.types import TokenAccountOpts

# Libraries for HTTP error handling
from httpx import HTTPStatusError
from solana.exceptions import SolanaRpcException

# Libraries for binary data handling
import struct

class SolanaWallet:
    def __init__(self, wallet_address, endpoint=MAINNET_ENDPOINT):
        if not wallet_address or not endpoint:
            raise ValueError("Wallet address and endpoint must be provided.")
        
        self.client = Client(endpoint)
        self.wallet_address = Pubkey.from_string(wallet_address)

    def __get_sol_balance(self) -> float:
        lamports = 0
        try:
            lamports = self.client.get_balance(self.wallet_address).value
        except SolanaRpcException as e:
            if hasattr(e, "__cause__") and isinstance(e.__cause__, HTTPStatusError):
                raise Exception(f"Error fetching SOL balance: {e.__cause__.response.status_code} - {e.__cause__.response.text}")
            
            raise Exception(f"Error fetching SOL balance: {str(e)}")

        sol_balance = lamports / 1_000_000_000  # Convert lamports to SOL
        return sol_balance

    def __get_token_name(self, mint_address, url=TOKEN_LIST_URL) -> str:
        headers = {"Content-Type": "application/json"}
        response = requests.get(url + mint_address)
        
        if response.status_code != 200:
            raise Exception(f"Error fetching token name: {response.status_code}")
        
        start = response.text.find("<title>") + len("<title>")
        end = response.text.find("</title>", start)
        token_name = response.text[start:end].strip().replace("Transaction History | ", "").replace("Token | ", "")
        print(f"Token Name: {token_name}")
        
        return token_name if token_name else "Unknown Token"

    def __get_token_accounts_info(self, show_zero_balance_accounts, show_token_names) -> list:
        data = []
        try:
            data = self.client.get_token_accounts_by_owner(
                self.wallet_address,
                opts=TokenAccountOpts(
                    program_id=Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                ),
                commitment="finalized",
            ).value
        except SolanaRpcException as e:
            if hasattr(e, "__cause__") and isinstance(e.__cause__, HTTPStatusError):
                raise Exception(f"Error fetching token accounts: {e.__cause__.response.status_code} - {e.__cause__.response.text}")

            raise Exception(f"Error fetching token accounts: {str(e)}")

        token_acounts_info = []
        for account in data:
            account_info = {   
                "pubkey": str(account.pubkey),
                "mint": str(Pubkey.from_bytes(account.account.data[0:32])), # Extract mint address from the first 32 bytes
                "owner": str(Pubkey.from_bytes(account.account.data[32:64])), # Extract owner address from the next 32 bytes
                "token_balance": struct.unpack("<Q", account.account.data[64:72])[0], # Extract token balance from bytes 64 to 72
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

    def __get_signatures_for_address(self, limit, before, until) -> list:
        params = {
            "limit": limit,
            "before": before,
            "until": until,
            "commitment": "finalized"
        }

        response = None
        try:
            response = self.client.get_signatures_for_address(self.wallet_address, **params)
        except SolanaRpcException as e:
            if hasattr(e, "__cause__") and isinstance(e.__cause__, HTTPStatusError):
                raise Exception(f"Error fetching signatures: {e.__cause__.response.status_code} - {e.__cause__.response.text}")

            raise Exception(f"Error fetching signatures: {str(e)}")
        
        signatures = [str(sig.signature) for sig in response.value]

        return signatures
    
    def __get_transaction_info(self, signature) -> dict:
        sig = Signature.from_string(signature)
        transaction = None
        try:
            transaction = self.client.get_transaction(sig, encoding="jsonParsed", commitment="finalized", max_supported_transaction_version=0)
        except SolanaRpcException as e:
            if hasattr(e, "__cause__") and isinstance(e.__cause__, HTTPStatusError):
                cause = e.__cause__
                if (cause.response.status_code == 429):
                    raise Exception(f"Rate limit exceeded: {cause.response.status_code} - {cause.response.text}")
            
            raise Exception(f"Error fetching transaction info: {str(e)}")
        
        return transaction.value

    def __display_transaction_info(self, tx_obj) -> dict:
        if tx_obj is None or tx_obj.transaction is None:
            print("Transaction not found or invalid signature.")
            return

        lamports_per_sol = 1_000_000_000

        # Extract transaction details
        tx = tx_obj.transaction
        meta = tx.meta
        message = tx.transaction.message
        account_keys = message.account_keys
        pre_balances = meta.pre_balances if meta else []
        post_balances = meta.post_balances if meta else []

        # Extract signer public keys
        signers = [str(ak.pubkey) for ak in account_keys if getattr(ak, "signer", False)]

        # Basic transaction info
        transaction_info = {
            "signature": str(tx.transaction.signatures[0]) if tx.transaction.signatures else "Unknown",
            "block": tx_obj.slot,
            "timestamp": datetime.fromtimestamp(tx_obj.block_time).strftime('%Y-%m-%d %H:%M:%S') if tx_obj.block_time else "Unknown",
            "version": str(tx.version) if hasattr(tx, 'version') else "legacy",
            "fee_in_sol": (meta.fee / lamports_per_sol) if meta else 0,
            "signers": signers,
        }

        # Compute units consumed
        if meta and meta.compute_units_consumed is not None:
            transaction_info["compute_units_consumed"] = meta.compute_units_consumed

        # Recent blockhash
        if hasattr(message, "recent_blockhash"):
            transaction_info["previous_block_hash"] = str(message.recent_blockhash)

        # Lookup table accounts
        if getattr(message, "address_table_lookups", None):
            transaction_info["lookup_table_accounts"] = [
                lookup.account_key for lookup in message.address_table_lookups
            ]

        # From / To address analysis (only if balances available)
        if len(account_keys) >= 2 and pre_balances and post_balances:
            sender = account_keys[0]
            balance_change = (post_balances[0] - pre_balances[0]) / lamports_per_sol
            transaction_info["from"] = {
                "address": str(sender.pubkey),
                "balance_before": pre_balances[0] / lamports_per_sol,
                "balance_after": post_balances[0] / lamports_per_sol,
                "balance_change": balance_change
            }

            recipients = []
            for i in range(1, len(account_keys)):
                change = post_balances[i] - pre_balances[i]
                if change > 0:
                    recipients.append({
                        "address": str(account_keys[i].pubkey),
                        "balance_before": pre_balances[i] / lamports_per_sol,
                        "balance_after": post_balances[i] / lamports_per_sol,
                        "balance_change": change / lamports_per_sol
                    })

            if recipients:
                transaction_info["to"] = recipients

        # Instructions
        transaction_info["instructions"] = []
        for instr in message.instructions:
            instr_info = {
                "program_id": str(getattr(instr, "program_id", "Unknown")),
            }

            if hasattr(instr, "parsed") and instr.parsed:
                instr_info["type"] = instr.parsed.get("type", "Unknown")
                instr_info["info"] = instr.parsed.get("info", {})

            if hasattr(instr, "accounts"):
                instr_info["accounts"] = [
                    str(account_keys[i].pubkey) for i,_ in enumerate(instr.accounts) if i < len(account_keys)
                ]

            transaction_info["instructions"].append(instr_info)

        return transaction_info

    def get_recent_transactions(self, limit=10, before=None, until=None) -> list:
        signatures = self.__get_signatures_for_address(limit, before, until)
        print(f"Fetched {len(signatures)} signatures for address {self.wallet_address}")
        transactions = []
        
        for sig in signatures:
            # try:
            tx_info = self.__get_transaction_info(sig)
            transaction_info = self.__display_transaction_info(tx_info)
            transactions.append(transaction_info)
            print(f"Fetched transaction for signature: {sig}")
            print(f"Sleeping for {REST_TIME} seconds to respect rate limits...")
            time.sleep(REST_TIME)  # Respect rate limits

            # except Exception as e:
            #     print(f"Error processing transaction {sig}: {e}")
        
        return transactions
    
    def get_account_other_info(self, show_zero_balance_accounts=False, show_token_names=False) -> dict:
        print("Fetching SOL balance and token accounts info...")

        sol_balance = self.__get_sol_balance()
        print(f"SOL Balance: {sol_balance} SOL")

        token_accounts_info = self.__get_token_accounts_info(show_zero_balance_accounts, show_token_names)
        print(f"Total Token Accounts: {len(token_accounts_info)}")
        
        return {
            "sol_balance": sol_balance,
            "token_accounts_info": token_accounts_info
        }
    