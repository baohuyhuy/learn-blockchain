from solana.rpc.websocket_api import connect, RpcTransactionLogsFilterMentions, Pubkey
from CONSTANTS import WS_ENDPOINT
import asyncio


class SolanaLogsSubscriber:
    """
    WebSocket client to subscribe to Solana real-time logs
    """

    def __init__(self, network="devnet"):
        self.ws_endpoint = WS_ENDPOINT[network]

        self.websocket = None
        self.subscription_id = None

    async def connect(self):
        """
        Connect to WebSocket
        """
        print("\nCONNECT TO WEBSOCKET")
        print("-" * 30)
        print(f"URL: {self.ws_endpoint}")

        try:
            self.websocket = await connect(self.ws_endpoint)
            print("Connected to WebSocket successfully!")
            return True
        except Exception as e:
            print(f"Failed to connect to WebSocket: {e}")
            return False

    async def subscribe_wallet_logs(self, wallet_address):
        """
        Subscribe to wallet logs
        """
        print(f"\nSUBSCRIBE TO WALLET LOGS")
        print("-" * 40)
        print(f"Wallet: {wallet_address}")

        try:
            await self.websocket.logs_subscribe(
                filter_=RpcTransactionLogsFilterMentions(
                    Pubkey.from_string(wallet_address)
                ),
                commitment="finalized"
            )
            print("Subscribed to wallet logs successfully!")
            first_resp = await self.websocket.recv()
            self.subscription_id = first_resp[0].result
            print(f"Subscription ID: {self.subscription_id}")
            return True
        except Exception as e:
            print(f"Failed to subscribe to wallet logs: {e}")
            return False

    async def get_latest_signature(self):
        """
        Get latest signature from WebSocket
        """
        try:
            msg = await self.websocket.recv()
            if msg is None:
                return None
            return msg[0].result.value.signature
        except (asyncio.CancelledError, KeyboardInterrupt):
            raise asyncio.CancelledError
        except Exception as e:
            print(f"Failed to get latest signature: {e}")
            return None

    async def close(self):
        """
        Close WebSocket
        """
        try:
            await self.websocket.logs_unsubscribe(self.subscription_id)
            print(f"Unsubscribed from subscription ID: {self.subscription_id}")
            await self.websocket.close()
            print("Closed WebSocket connection")
        except Exception as e:
            print(f"Failed to close WebSocket connection: {e}")
