"""
Combined wallet monitor: Kết hợp Step 1 (WebSocket) + Step 2 (HTTP details)
"""
import asyncio
import json
from datetime import datetime

from data_structures import TransactionDetails
from step1_websocket_logs import SolanaLogsSubscriber
from step2_transaction_details import SolanaTransactionDetailsFetcher

class SolanaWalletMonitor:
    """
    Complete wallet monitor: Kết hợp Step 1 (WebSocket) + Step 2 (HTTP details)
    """
    
    # Initializer: Khởi tạo các thành phần cần thiết
    def __init__(self, network="devnet"):
        self.network = network
        
        # Initialize components
        self.logs_subscriber = SolanaLogsSubscriber(network)
        self.details_fetcher = SolanaTransactionDetailsFetcher(network)
        
        # Add duplicate tracking - tự động clear
        self.processed_signatures = set()
        self.duplicate_count = 0
        
        print(f"\nSOLANA WALLET MONITOR INITIALIZED")
        print("=" * 50)
        print(f"→ Network: {network}")
        print(f"→ Duplicate prevention: Active")
    
    # Phương thức để kết nối WebSocket (HTTP không cần kết nối)
    async def connect(self):
        """
        Connect WebSocket (HTTP không cần connect)
        """
        return await self.logs_subscriber.connect()
    
    # Phương thức chính để monitor wallet
    async def monitor_wallet(self, wallet_address: str, max_transactions: int = 10):
        """
        Main method: Monitor wallet với real-time analysis
        """
        print(f"\n{'='*60}")
        print(f"BẮT ĐẦU MONITOR WALLET")
        print(f"{'='*60}")
        print(f"Target wallet: {wallet_address}")
        print(f"Max transactions: {max_transactions}")
        print(f"Network: {self.network}")
        print(f"{'='*60}")
        
        # Step 1: Subscribe to wallet logs
        if not await self.logs_subscriber.subscribe_wallet_logs(wallet_address):
            print("Failed to subscribe to wallet logs")
            return

        print("Subscribed to wallet logs")
        print("Waiting for transactions...")
        print("-" * 60)
        
        transaction_count = 0
        
        # Main monitoring loop
        while transaction_count < max_transactions:
            try:
                # Step 1: Wait for WebSocket notification
                message = await asyncio.wait_for(self.logs_subscriber.websocket.recv(), timeout=1000)
                data = json.loads(message)
                
                if "method" in data and data["method"] == "logsNotification":
                    # Extract signature from logs
                    result = data["params"]["result"]
                    signature = result["value"]["signature"]
                    
                    # Âm thầm check và skip duplicate
                    if signature in self.processed_signatures:
                        self.duplicate_count += 1
                        continue
                    
                    # Add to processed set
                    self.processed_signatures.add(signature)
                    transaction_count += 1
                    
                    print(f"\n{'='*60}")
                    print(f"NEW TRANSACTION #{transaction_count}")
                    print(f"{'='*60}")
                    print(f"Signature: {signature[:30]}...")
                    
                    # Step 2: Get detailed transaction info
                    details = await self.details_fetcher.get_transaction_details(signature)
                    
                    if details:
                        print(f"Transaction details retrieved!")
                        self._display_transaction_summary(details, transaction_count)
                    else:
                        print(f"Failed to get transaction details")
                    
                    print(f"{'='*60}")
                    
            except asyncio.TimeoutError:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Timeout")
                break
            except Exception as e:
                print(f"Error during monitoring: {e}")
                break
        
        print(f"\nMONITORING COMPLETE!")
        print(f"Unique transactions processed: {transaction_count}")
        if self.duplicate_count > 0:
            print(f"Duplicate transactions skipped: {self.duplicate_count}")
        
        # Print statistics
        self.details_fetcher.print_statistics()
    
    def _print_monitoring_statistics(self):
        """
        In thống kê monitoring bao gồm duplicate tracking
        """
        total_received = len(self.processed_signatures) + self.duplicate_count
        duplicate_rate = (self.duplicate_count / total_received * 100) if total_received > 0 else 0
        
        print(f"\nMONITORING STATISTICS")
        print("=" * 25)
        print(f"Total notifications: {total_received}")
        print(f"Unique transactions: {len(self.processed_signatures)}")
        print(f"Duplicates skipped: {self.duplicate_count}")
        print(f"Duplicate rate: {duplicate_rate:.1f}%")
        print(f"Memory usage: {len(self.processed_signatures)} signatures stored")
    
    def _display_transaction_summary(self, details: TransactionDetails, count: int):
        """
        Hiển thị tóm tắt transaction đẹp mắt
        """
        print(f"\nTRANSACTION SUMMARY #{count}")
        print("─" * 40)
        print(f"Signature: {details.signature[:30]}...")
        print(f"Time: {details.timestamp}")
        print(f"Slot: {details.slot:,}")
        print(f"Fee: {details.fee_sol:.9f} SOL")
        print(f"Type: {details.transaction_type}")
        print(f"Status: {details.status}")
        
        if details.from_account and details.to_account and details.sol_transfer_amount > 0:
            print(f"\nTRANSFER DETAILS:")
            print(f"From: {details.from_account[:30]}...")
            print(f"To: {details.to_account[:30]}...")
            print(f"Amount: {details.sol_transfer_amount:.9f} SOL")
        
        if details.balance_changes:
            print(f"\nBALANCE CHANGES:")
            for change in details.balance_changes:
                if abs(change['change']) > 0.000001:
                    change_str = f"+{change['change']:.9f}" if change['change'] > 0 else f"{change['change']:.9f}"
                    print(f"   {change['account'][:25]}...: {change_str} SOL")
    
    async def close(self):
        """
        Đóng connections
        """
        await self.logs_subscriber.close()
