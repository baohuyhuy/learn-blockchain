from typing import Optional, Dict, List, Any
from datetime import datetime
from solders.signature import Signature
from solana.rpc.async_api import AsyncClient
from CONSTANTS import RPC_ENDPOINT
from dataclasses import dataclass
from solana.rpc.async_api import GetTransactionResp


@dataclass
class TransactionDetails:
    """
    Structured data class to hold parsed transaction information
    """

    signature: Signature  # signature of the transaction from logs
    timestamp: str  # transaction time (UTC)
    slot: int  # transaction slot
    fee_sol: float  # transaction fee in SOL
    status: str  # "SUCCESS" or "FAILED" to indicate transaction status

    # account information related to the transaction
    account_keys: List[str]

    # list of balance changes for the related accounts
    balance_changes: List[Dict[str, Any]]

    def __init__(self, tx: GetTransactionResp) -> None:
        self.signature = tx.value.transaction.transaction.signatures[0]
        self.timestamp = datetime.fromtimestamp(
            tx.value.block_time).strftime('%Y-%m-%d %H:%M:%S')
        self.slot = tx.value.slot
        self.fee_sol = tx.value.transaction.meta.fee / 1e9
        self.status = "SUCCESS" if tx.value.transaction.meta.err is None else "FAILED"
        self.account_keys = [account_key.__str__(
        ) for account_key in tx.value.transaction.transaction.message.account_keys]

        # Calculate balance changes
        pre_balances = tx.value.transaction.meta.pre_balances
        post_balances = tx.value.transaction.meta.post_balances
        self.balance_changes = []

        for i, account_key in enumerate(self.account_keys):
            if i < len(pre_balances) and i < len(post_balances):
                pre_balance = pre_balances[i] / 1e9
                post_balance = post_balances[i] / 1e9
                change = post_balance - pre_balance

                self.balance_changes.append({
                    "account": account_key,
                    "pre_balance": pre_balance,
                    "post_balance": post_balance,
                    "change": change
                })


class SolanaTransactionDetailsFetcher:
    """
    HTTP client to fetch transaction details from signature
    """

    def __init__(self, network="devnet"):
        self.network = network
        self.rpc_endpoint = RPC_ENDPOINT[network]

    async def connect(self):
        """
        Connect to RPC endpoint
        """
        print(f"\nCONNECT TO RPC ENDPOINT")
        print("-" * 30)
        print(f"URL: {self.rpc_endpoint}")

        try:
            self.client = AsyncClient(self.rpc_endpoint)
            print("Connected to RPC endpoint successfully!")
            return True
        except Exception as e:
            print(f"Failed to connect to RPC endpoint: {e}")
            return False

    async def get_transaction_details(self, signature: Signature) -> Optional[TransactionDetails]:
        """
        Get and parse transaction details from signature
        """
        print(f"\nRECEIVED SIGNATURE, PARSING TRANSACTION DETAILS")
        print("-" * 50)

        try:
            tx = await self.client.get_transaction(tx_sig=signature, max_supported_transaction_version=0)
            if tx is None:
                raise Exception("Failed to fetch transaction data")

            print("Transaction raw data retrieved successfully!")
            return tx
        except Exception as e:
            print(f"Error fetching transaction: {e}\n")
            return None
