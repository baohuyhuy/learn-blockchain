import asyncio
from datetime import datetime
from transaction_details import TransactionDetails, SolanaTransactionDetailsFetcher
from logs_subscriber import SolanaLogsSubscriber


class SolanaWalletMonitor:
    """
    Wallet's real-time transaction monitor
    """

    def __init__(self, network="devnet"):
        self.network = network

        # Initialize components
        self.logs_subscriber = SolanaLogsSubscriber(network)
        self.details_fetcher = SolanaTransactionDetailsFetcher(network)

        self.processed_signatures = set()

        print(f"→ Network: {network}")

    # Connect WebSocket and RPC endpoint
    async def connect(self):
        """
        Connect WebSocket and RPC endpoint
        """
        return await self.logs_subscriber.connect() and await self.details_fetcher.connect()

    # Monitor incoming transactions of a wallet
    async def monitor_wallet(self, wallet_address: str, max_transactions: int = None):
        """
        Monitor wallet with real-time analysis
        """
        print(f"\n{'='*60}")
        print(f"START MONITORING WALLET")
        print(f"{'='*60}")
        print(f"Target wallet: {wallet_address}")
        print(f"Number of transactions: {max_transactions if max_transactions is not None else 'infinite'}")
        print(f"{'='*60}")

        # Subscribe to wallet logs
        if not await self.logs_subscriber.subscribe_wallet_logs(wallet_address):
            return

        print("Waiting for transactions...")
        print("-" * 60)

        transaction_count = 0

        # Receive new transactions
        while max_transactions is None or transaction_count < max_transactions:
            try:
                # Wait for new transaction
                signature = await self.logs_subscriber.get_latest_signature()
                if signature is None:
                    continue

                # Check if the signature is already processed
                if signature in self.processed_signatures:
                    continue

                # Add to processed set
                self.processed_signatures.add(signature)
                transaction_count += 1

                # Get transaction details with retry logic
                max_retries = 3
                retry_count = 0
                tx_response = None # Initialize tx_response

                print(f"\nRECEIVED SIGNATURE, PARSING TRANSACTION DETAILS")
                print("-" * 50)
                while retry_count < max_retries:
                    tx_response = await self.details_fetcher.get_transaction_details(signature)
                    
                    if tx_response and tx_response.value: # Successfully fetched with details
                        break 
                    
                    # If tx_response is None (fetch error) or tx_response.value is None (no details)
                    retry_count += 1
                    print(f"Transaction details not yet available or fetch error.")
                    if retry_count < max_retries:
                        print(
                            f"Retrying to get transaction details (attempt {retry_count + 1}/{max_retries})...")
                        await asyncio.sleep(1) # Wait 1 second before retrying
                    else:
                        print(f"Max retries reached.")


                if tx_response and tx_response.value:
                    print(f"Transaction details parsed successfully!")
                    self.__display_transaction_details(
                        TransactionDetails(tx_response), transaction_count)
                    # Add delay only for mainnet
                    if self.network == "mainnet" and (max_transactions is None or transaction_count < max_transactions):
                        print("Waiting before processing next transaction...")
                        await asyncio.sleep(5)
                else:
                    # This 'else' covers cases where tx_response is None OR tx_response.value is None after retries
                    print(
                        f"Failed to get transaction details after {max_retries} attempts. Skipping this transaction.")

                print(f"{'='*60}")

            except KeyboardInterrupt:
                print("\nMonitoring stopped by user")
                break
            except asyncio.TimeoutError:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Monitoring timeout")
                break
            except Exception as e:
                print(f"Error during monitoring: {e}")
                break

        print(f"\nMONITORING COMPLETE!")
        print(f"Unique transactions processed: {transaction_count}")

    def __display_transaction_details(self, details: TransactionDetails, count: int):
        """
        Display transaction details
        """
        print(f"TRANSACTION SUMMARY #{count}")
        print("─" * 40)
        print(f"Signature: {details.signature}")
        print(f"Time: {details.timestamp}")
        print(f"Slot: {details.slot:,}")
        print(f"Fee: {details.fee_sol:.9f} SOL")
        print(f"Status: {details.status}")

        # Check if this is a SOL transfer transaction
        senders = []
        receivers = []

        # Identify senders and receivers from balance changes
        for change in details.balance_changes:
            if change['change'] < -0.000001:
                # Account with negative change is a sender
                # The actual transfer amount is the change plus any fees paid
                transfer_amount = abs(change['change'])
                if change['account'] == details.account_keys[0]:  # Fee payer
                    transfer_amount += details.fee_sol
                senders.append({
                    'account': change['account'],
                    'amount': transfer_amount
                })
            elif change['change'] > 0.000001:
                # Account with positive change is a receiver
                receivers.append({
                    'account': change['account'],
                    'amount': change['change']
                })

        # Display transfer details if we found any transfers
        if senders and receivers:
            print(f"\nTRANSFER DETAILS:")
            if len(senders) == 1 and len(receivers) == 1:
                print(f"From: {senders[0]['account']}")
                print(f"To: {receivers[0]['account']}")
                print(f"Amount: {senders[0]['amount']:.9f} SOL")
            else:
                print("Senders:")
                for sender in senders:
                    print(
                        f"  {sender['account']} → {sender['amount']:.9f} SOL")
                print("Receivers:")
                for receiver in receivers:
                    print(
                        f"  {receiver['account']} ← {receiver['amount']:.9f} SOL")

        if details.balance_changes:
            print(f"\nBALANCE CHANGES:")
            for change in details.balance_changes:
                if abs(change['change']) > 0.000001:
                    change_str = f"+{change['change']:.9f}" if change['change'] > 0 else f"{change['change']:.9f}"
                    print(f"   {change['account']}: {change_str} SOL")

    async def close(self):
        """
        Close connection
        """
        await self.logs_subscriber.close()
